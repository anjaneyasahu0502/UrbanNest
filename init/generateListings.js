const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const DEFAULT_COUNT = 60;
const DEFAULT_FOCUS_COUNTRY = 'India';

const INDIAN_METRO_HINTS = {
    Delhi: ['Connaught Place', 'Hauz Khas', 'Dwarka', 'Karol Bagh', 'Saket', 'Defence Colony'],
    Mumbai: ['Bandra', 'Andheri', 'Powai', 'Colaba', 'Juhu', 'Lower Parel'],
    Kolkata: ['Park Street', 'Salt Lake', 'Ballygunge', 'New Town', 'Alipore', 'Dum Dum'],
    Chennai: ['Adyar', 'T Nagar', 'Velachery', 'Nungambakkam', 'Anna Nagar', 'OMR'],
    Bengaluru: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'Hebbal'],
    Hyderabad: ['Banjara Hills', 'Gachibowli', 'Madhapur', 'Jubilee Hills', 'Hitech City', 'Kondapur'],
    Pune: ['Koregaon Park', 'Hinjewadi', 'Viman Nagar', 'Baner', 'Kharadi', 'Aundh'],
};

const IMAGE_POOL = [
    'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8aG90ZWxzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aG90ZWxzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhvdGVsc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGhvdGVsc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1vdW50YWlufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2t5JTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHNreSUyMHZhY2F0aW9ufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fG1vdW50YWlufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FtcGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60',
    'https://images.unsplash.com/photo-1618140052121-39fc6db33972?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bG9kZ2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60',
];

const PLACE_BATCHES = [
    [
        { city: 'New York City', country: 'United States' },
        { city: 'Los Angeles', country: 'United States' },
        { city: 'Chicago', country: 'United States' },
        { city: 'Miami', country: 'United States' },
        { city: 'Seattle', country: 'United States' },
        { city: 'Boston', country: 'United States' },
        { city: 'Austin', country: 'United States' },
        { city: 'San Francisco', country: 'United States' },
    ],
    [
        { city: 'Toronto', country: 'Canada' },
        { city: 'Vancouver', country: 'Canada' },
        { city: 'Montreal', country: 'Canada' },
        { city: 'Banff', country: 'Canada' },
        { city: 'Quebec City', country: 'Canada' },
        { city: 'Calgary', country: 'Canada' },
        { city: 'Ottawa', country: 'Canada' },
        { city: 'Halifax', country: 'Canada' },
    ],
    [
        { city: 'London', country: 'United Kingdom' },
        { city: 'Paris', country: 'France' },
        { city: 'Rome', country: 'Italy' },
        { city: 'Barcelona', country: 'Spain' },
        { city: 'Amsterdam', country: 'Netherlands' },
        { city: 'Berlin', country: 'Germany' },
        { city: 'Prague', country: 'Czech Republic' },
        { city: 'Vienna', country: 'Austria' },
    ],
    [
        { city: 'Lisbon', country: 'Portugal' },
        { city: 'Athens', country: 'Greece' },
        { city: 'Dublin', country: 'Ireland' },
        { city: 'Stockholm', country: 'Sweden' },
        { city: 'Copenhagen', country: 'Denmark' },
        { city: 'Zurich', country: 'Switzerland' },
        { city: 'Edinburgh', country: 'United Kingdom' },
        { city: 'Istanbul', country: 'Turkey' },
    ],
    [
        { city: 'Tokyo', country: 'Japan' },
        { city: 'Kyoto', country: 'Japan' },
        { city: 'Seoul', country: 'South Korea' },
        { city: 'Bangkok', country: 'Thailand' },
        { city: 'Singapore', country: 'Singapore' },
        { city: 'Hong Kong', country: 'Hong Kong' },
        { city: 'Mumbai', country: 'India' },
        { city: 'New Delhi', country: 'India' },
    ],
    [
        { city: 'Jaipur', country: 'India' },
        { city: 'Goa', country: 'India' },
        { city: 'Bengaluru', country: 'India' },
        { city: 'Hyderabad', country: 'India' },
        { city: 'Kochi', country: 'India' },
        { city: 'Udaipur', country: 'India' },
        { city: 'Phuket', country: 'Thailand' },
        { city: 'Bali', country: 'Indonesia' },
    ],
    [
        { city: 'Dubai', country: 'United Arab Emirates' },
        { city: 'Abu Dhabi', country: 'United Arab Emirates' },
        { city: 'Doha', country: 'Qatar' },
        { city: 'Cairo', country: 'Egypt' },
        { city: 'Marrakech', country: 'Morocco' },
        { city: 'Cape Town', country: 'South Africa' },
        { city: 'Nairobi', country: 'Kenya' },
        { city: 'Zanzibar', country: 'Tanzania' },
    ],
    [
        { city: 'Sydney', country: 'Australia' },
        { city: 'Melbourne', country: 'Australia' },
        { city: 'Brisbane', country: 'Australia' },
        { city: 'Perth', country: 'Australia' },
        { city: 'Auckland', country: 'New Zealand' },
        { city: 'Queenstown', country: 'New Zealand' },
        { city: 'Wellington', country: 'New Zealand' },
        { city: 'Christchurch', country: 'New Zealand' },
    ],
    [
        { city: 'Rio de Janeiro', country: 'Brazil' },
        { city: 'São Paulo', country: 'Brazil' },
        { city: 'Buenos Aires', country: 'Argentina' },
        { city: 'Santiago', country: 'Chile' },
        { city: 'Lima', country: 'Peru' },
        { city: 'Cartagena', country: 'Colombia' },
        { city: 'Cusco', country: 'Peru' },
        { city: 'Bogotá', country: 'Colombia' },
    ],
];

function chunkPlaces(count = DEFAULT_COUNT) {
    const places = PLACE_BATCHES.flat();
    return places.slice(0, Math.min(count, places.length));
}

function expandFocusedPlaces(count, focusCities, defaultCountry = DEFAULT_FOCUS_COUNTRY) {
    const places = [];

    if (!focusCities.length || count <= 0) {
        return places;
    }

    for (let index = 0; index < count; index += 1) {
        const city = focusCities[index % focusCities.length];
        const hints = INDIAN_METRO_HINTS[city] || ['Central District'];
        const hint = hints[Math.floor(index / focusCities.length) % hints.length];

        places.push({
            city,
            country: defaultCountry,
            hint,
        });
    }

    return places;
}

function chunkPlacesWithOptions(count = DEFAULT_COUNT, options = {}) {
    const focusCities = Array.isArray(options.focusCities)
        ? options.focusCities.map((city) => String(city).trim()).filter(Boolean)
        : [];

    if (focusCities.length) {
        return expandFocusedPlaces(count, focusCities, options.defaultCountry || DEFAULT_FOCUS_COUNTRY);
    }

    return chunkPlaces(count);
}

function chunkArray(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

function safeParseJson(content) {
    if (!content) {
        return null;
    }

    const text = String(content).trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonText = start >= 0 && end >= 0 ? text.slice(start, end + 1) : text;

    try {
        return JSON.parse(jsonText);
    } catch (_err) {
        return null;
    }
}

function pickImageUrl(index) {
    return IMAGE_POOL[index % IMAGE_POOL.length];
}

function makeFallbackTitle(city, country, index) {
    const themes = [
        'Modern Loft',
        'Boutique Stay',
        'Heritage Retreat',
        'City View Apartment',
        'Cozy Designer Home',
        'Luxury Hideaway',
        'Artisan Guest Suite',
        'Sunlit Corner Flat',
    ];

    return `${themes[index % themes.length]} in ${city}`;
}

function makeFallbackDescription(city, country) {
    return `Enjoy a comfortable stay in ${city}, ${country}. This thoughtfully styled property offers a welcoming base for exploring the local food, culture, and nearby attractions.`;
}

async function makeFallbackListing(place, index, pexels) {
    const priceBase = 120 + (index % 10) * 90;
    let url = pickImageUrl(index);
    try {
                if (pexels && typeof pexels.getImageForQuery === 'function') {
                    const q = `${place.city}, ${place.country}`;
                    const purl = await pexels.getImageForQuery(q, 1, { title: makeFallbackTitle(place.city, place.country, index) });
                    if (purl) url = purl;
                }
    } catch (_e) {
        // ignore pexels failures and fall back to pool
    }

    return {
        title: makeFallbackTitle(place.city, place.country, index),
        description: makeFallbackDescription(place.city, place.country),
        price: priceBase,
        location: place.city,
        country: place.country,
        image: {
            filename: 'listingimage',
            url,
        },
    };
}

async function requestBatchFromGroq(places) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return null;
    }

    const promptLines = places
        .map((place, index) => `${index + 1}. ${place.city}, ${place.country}${place.hint ? ` (${place.hint})` : ''}`)
        .join('\n');

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            temperature: 0.8,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'You generate realistic urban accommodation listings for India using only real places. Return only valid JSON.',
                },
                {
                    role: 'user',
                    content: [
                        'Create one listing for each place below.',
                        'Use the places in the exact same order as provided.',
                        'Return a JSON object with a listings array.',
                        'Each listing must have title, description, price, location, country.',
                        'Location and country must match the provided place exactly.',
                        'Use neighborhood hints only for flavor in title/description, never as location value.',
                        'Make the title varied and natural.',
                        'Descriptions should be 2 sentences and feel like a real short-stay listing.',
                        'Prices should be integers and realistic for the market.',
                        '',
                        promptLines,
                    ].join('\n'),
                },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`xAI seed request failed with ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = safeParseJson(content);

    return Array.isArray(parsed?.listings) ? parsed.listings : null;
}

async function normalizeApiListings(apiListings, places, startIndex = 0, pexels) {
    const results = await Promise.all(
        places.map(async (place, offset) => {
            const apiListing = apiListings?.[offset] || {};
            const title = String(apiListing.title || '').trim() || makeFallbackTitle(place.city, place.country, startIndex + offset);
            const description = String(apiListing.description || '').trim() || makeFallbackDescription(place.city, place.country);
            const priceValue = Number(apiListing.price);
            const price = Number.isFinite(priceValue) ? Math.max(50, Math.round(priceValue)) : 150 + ((startIndex + offset) % 10) * 85;

            let url = pickImageUrl(startIndex + offset);
            try {
                    if (pexels && typeof pexels.getImageForQuery === 'function') {
                    const q = `${place.city}, ${place.country}`;
                    const purl = await pexels.getImageForQuery(q, 1, { title });
                    if (purl) url = purl;
                }
            } catch (_e) {
                // ignore pexels failures
            }

            return {
                title,
                description,
                image: {
                    filename: 'listingimage',
                    url,
                },
                price,
                location: place.city,
                country: place.country,
            };
        })
    );

    return results;
}

async function generateListings(count = DEFAULT_COUNT, options = {}) {
    const places = chunkPlacesWithOptions(count, options);
    const batches = chunkArray(places, 8);
    const listings = [];

    const pexels = require('../utils/pexels');

    for (let index = 0; index < batches.length; index += 1) {
        const batch = batches[index];
        let apiListings = null;

        try {
            apiListings = await requestBatchFromGroq(batch);
        } catch (_err) {
            apiListings = null;
        }

        if (!apiListings || !apiListings.length) {
            const created = await Promise.all(batch.map((place, offset) => makeFallbackListing(place, index * 8 + offset, pexels)));
            listings.push(...created);
            continue;
        }

        const created = await normalizeApiListings(apiListings, batch, index * 8, pexels);
        listings.push(...created);
    }

    return listings;
}

module.exports = {
    generateListings,
    chunkPlaces,
    chunkPlacesWithOptions,
};
