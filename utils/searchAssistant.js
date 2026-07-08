const Listing = require('../models/listing.js');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s,-]/g, ' ')
        .replace(/\s+/g, ' ');
}

function toTitleCase(value) {
    return String(value || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getCityAliases(value) {
    const raw = String(value || '').trim();
    if (!raw) {
        return [];
    }

    const aliasSet = new Set();
    const pushAlias = (candidate) => {
        const normalized = normalizeText(candidate);
        if (!normalized) {
            return;
        }
        aliasSet.add(toTitleCase(normalized));
    };

    pushAlias(raw);

    const withoutComma = raw.split(',')[0];
    pushAlias(withoutComma);

    const normalized = normalizeText(raw);
    const withoutNewPrefix = normalized.replace(/^new\s+/, '').trim();
    const withoutOldPrefix = normalized.replace(/^old\s+/, '').trim();

    if (withoutNewPrefix && withoutNewPrefix !== normalized) {
        pushAlias(withoutNewPrefix);
    }

    if (withoutOldPrefix && withoutOldPrefix !== normalized) {
        pushAlias(withoutOldPrefix);
    }

    return [...aliasSet];
}

function extractPlaceFromListings(query, listings) {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
        return null;
    }

    const exactMatch = listings.find((listing) => {
        const location = normalizeText(listing.location);
        const country = normalizeText(listing.country);
        return normalizedQuery === location || normalizedQuery === country || `${location} ${country}` === normalizedQuery;
    });

    if (exactMatch) {
        const locationMatches = listings.filter((listing) => normalizeText(listing.location) === normalizedQuery).length;
        const countryMatches = listings.filter((listing) => normalizeText(listing.country) === normalizedQuery).length;
        const intent = countryMatches > 0 && locationMatches === 0 ? 'country' : 'city';

        return {
            city: intent === 'city' ? exactMatch.location : '',
            country: intent === 'country' ? exactMatch.country : exactMatch.country,
            display: intent === 'country' ? exactMatch.country : `${exactMatch.location}, ${exactMatch.country}`,
            intent,
        };
    }

    const partialMatch = listings.find((listing) => {
        const location = normalizeText(listing.location);
        const country = normalizeText(listing.country);
        return location.includes(normalizedQuery) || normalizedQuery.includes(location) || country.includes(normalizedQuery);
    });

    if (partialMatch) {
        return {
            city: partialMatch.location,
            country: partialMatch.country,
            display: `${partialMatch.location}, ${partialMatch.country}`,
            intent: 'city',
        };
    }

    return {
        city: toTitleCase(query),
        country: '',
        display: toTitleCase(query),
        intent: 'general',
    };
}

async function resolvePlaceViaGeocoder(query) {
    const normalized = String(query || '').trim();
    if (!normalized) {
        return null;
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', normalized);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1');

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'UrbanNest/1.0 (India urban accommodation platform)',
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        return null;
    }

    const results = await response.json();
    const first = Array.isArray(results) ? results[0] : null;
    const address = first?.address || {};
    const city = address.city || address.town || address.village || address.municipality || address.county || '';
    const country = address.country || '';
    const addresstype = normalizeText(first?.addresstype || first?.type || '');
    const intent = (!city && country) || addresstype === 'country' ? 'country' : 'city';

    if (!city && !country && !first?.display_name) {
        return null;
    }

    return {
        city,
        country,
        display:
            intent === 'country'
                ? (country || toTitleCase(normalized))
                : ([city, country].filter(Boolean).join(', ') || first.display_name || toTitleCase(normalized)),
        intent,
    };
}

function buildLocalAnalysis(query) {
    const cleaned = normalizeText(query);
    const terms = cleaned
        .split(/[\s,/-]+/)
        .map((term) => term.trim())
        .filter((term) => term.length > 2);

    return {
        query: query.trim(),
        canonicalQuery: cleaned,
        keywords: terms,
        cities: [],
        countries: [],
        mode: 'local',
        intent: 'general',
    };
}

async function analyzeWithGroq(query) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return buildLocalAnalysis(query);
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'Return only valid JSON for a travel search assistant. Extract city, country, placeDisplay, and keyword filters from the user query.',
                },
                {
                    role: 'user',
                    content: `Interpret this travel search query: "${query}". Return JSON with keys canonicalQuery, placeDisplay, city, country, intent, keywords, cities, countries, and note. intent must be one of city, country, or general. keywords, cities, and countries must be arrays of strings. placeDisplay should be a user-friendly location label like "New Delhi, India" when possible.`,
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`Groq request failed with ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '{}';

    try {
        const parsed = JSON.parse(content);
        const city = Array.isArray(parsed.cities) && parsed.cities[0] ? parsed.cities[0] : parsed.city || '';
        const country = Array.isArray(parsed.countries) && parsed.countries[0] ? parsed.countries[0] : parsed.country || '';
        const placeDisplay = parsed.placeDisplay || [city, country].filter(Boolean).join(', ') || toTitleCase(query);

        return {
            query: query.trim(),
            canonicalQuery: normalizeText(parsed.canonicalQuery || query),
            placeDisplay,
            city,
            country,
            intent: ['city', 'country', 'general'].includes(parsed.intent) ? parsed.intent : 'general',
            keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean) : [],
            cities: Array.isArray(parsed.cities) ? parsed.cities.filter(Boolean) : [],
            countries: Array.isArray(parsed.countries) ? parsed.countries.filter(Boolean) : [],
            notes: parsed.note || 'Groq assisted search interpretation.',
            mode: 'groq',
        };
    } catch (_err) {
        return buildLocalAnalysis(query);
    }
}

function buildMongoSearchQuery(analysis) {
    if (analysis.intent === 'city' && analysis.city) {
        const cityAliases = getCityAliases(analysis.city);
        const cityMatch = cityAliases.length > 1
            ? {
                $or: cityAliases.map((city) => ({
                    location: { $regex: `^${escapeRegex(city)}$`, $options: 'i' },
                })),
            }
            : { location: { $regex: `^${escapeRegex(cityAliases[0] || analysis.city)}$`, $options: 'i' } };

        if (analysis.country) {
            return {
                $and: [
                    cityMatch,
                    { country: { $regex: `^${escapeRegex(analysis.country)}$`, $options: 'i' } },
                ],
            };
        }

        return cityMatch;
    }

    if (analysis.intent === 'country' && analysis.country) {
        return {
            country: { $regex: `^${escapeRegex(analysis.country)}$`, $options: 'i' },
        };
    }

    const searchTerms = [
        analysis.canonicalQuery,
        ...analysis.keywords,
        ...analysis.cities,
        ...analysis.countries,
    ]
        .map(normalizeText)
        .filter(Boolean);

    if (!searchTerms.length) {
        return {};
    }

    const uniqueTerms = [...new Set(searchTerms)];
    return {
        $or: uniqueTerms.flatMap((term) => {
            const regex = { $regex: escapeRegex(term), $options: 'i' };
            return [
                { title: regex },
                { location: regex },
                { country: regex },
            ];
        }),
    };
}

function rankListings(listings, analysis) {
    const searchTerms = [
        analysis.canonicalQuery,
        ...analysis.keywords,
        ...analysis.cities,
        ...analysis.countries,
    ]
        .map(normalizeText)
        .filter(Boolean);

    const scored = listings
        .map((listing) => {
            const haystack = normalizeText([listing.title, listing.location, listing.country].join(' '));
            const score = searchTerms.reduce((total, term) => total + (haystack.includes(term) ? 2 : 0), 0);
            return { listing, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || b.listing._id.toString().localeCompare(a.listing._id.toString()));

    return scored.map((entry) => entry.listing);
}

function buildSuggestions(listings, analysis) {
    const seen = new Set();
    const suggestions = [];

    const pushSuggestion = (label, value) => {
        const key = normalizeText(value);
        if (!key || seen.has(key)) {
            return;
        }
        seen.add(key);
        suggestions.push({ label, value });
    };

    analysis.cities.slice(0, 3).forEach((city) => pushSuggestion(`Search city: ${city}`, city));
    analysis.countries.slice(0, 3).forEach((country) => pushSuggestion(`Search country: ${country}`, country));

    if (analysis.mode === 'local' && analysis.query) {
        pushSuggestion(`Search city: ${toTitleCase(analysis.query)}`, analysis.query);
    }

    listings.slice(0, 5).forEach((listing) => {
        pushSuggestion(
            `${listing.location}, ${listing.country}`,
            `${listing.location} ${listing.country}`
        );
    });

    if (!suggestions.length && analysis.canonicalQuery) {
        pushSuggestion(`Search for ${analysis.canonicalQuery}`, analysis.canonicalQuery);
    }

    return suggestions.slice(0, 6);
}

async function getSearchAssistant(query) {
    const trimmed = String(query || '').trim();
    if (!trimmed) {
        return {
            analysis: buildLocalAnalysis(''),
            matches: [],
            suggestions: [],
        };
    }

    let analysis;
    try {
        analysis = await analyzeWithGroq(trimmed);
    } catch (_err) {
        analysis = buildLocalAnalysis(trimmed);
    }
    const listings = await Listing.find({})
        .select('title location country price image')
        .sort({ _id: -1 })
        .limit(100);
    const ranked = rankListings(listings, analysis);

    if (!analysis.placeDisplay || !analysis.country) {
        const geocodedPlace = await resolvePlaceViaGeocoder(trimmed).catch(() => null);
        if (geocodedPlace) {
            analysis.placeDisplay = analysis.placeDisplay || geocodedPlace.display;
            analysis.city = analysis.city || geocodedPlace.city;
            analysis.country = analysis.country || geocodedPlace.country;
            if (analysis.intent === 'general' || !analysis.intent) {
                analysis.intent = geocodedPlace.intent;
            }
        }
    }

    if (!analysis.placeDisplay) {
        const place = extractPlaceFromListings(trimmed, listings);
        analysis.placeDisplay = place.display;
        analysis.city = analysis.city || place.city;
        analysis.country = analysis.country || place.country;
        if (analysis.intent === 'general' || !analysis.intent) {
            analysis.intent = place.intent;
        }
    }

    const placeSuggestion = analysis.placeDisplay
        ? {
            label: analysis.mode === 'groq' ? `AI place match: ${analysis.placeDisplay}` : `Place match: ${analysis.placeDisplay}`,
            value: analysis.placeDisplay,
        }
        : null;

    return {
        analysis,
        matches: ranked.slice(0, 8).map((listing) => ({
            id: listing._id,
            title: listing.title,
            location: listing.location,
            country: listing.country,
            price: listing.price,
            image: listing.image?.url,
            href: `/listings/${listing._id}`,
        })),
        suggestions: [placeSuggestion, ...buildSuggestions(ranked, analysis)].filter(Boolean),
    };
}

module.exports = {
    analyzeWithGroq,
    buildMongoSearchQuery,
    getSearchAssistant,
};