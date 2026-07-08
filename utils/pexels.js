const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

function buildQueriesForPlace(query, title) {
    const q = String(query || '').trim();
    const t = String(title || '').trim().toLowerCase();
    if (!q) return [];
    const parts = q.split(',').map((p) => p.trim()).filter(Boolean);
    const cityOnly = parts.length ? parts[0] : q;

    const variations = new Set();

    // Title-informed queries (try to match listing theme)
    if (t.includes('heritage') || t.includes('historic') || t.includes('old')) {
        variations.add(`${cityOnly} heritage building`);
        variations.add(`${cityOnly} historic architecture`);
    }
    if (t.includes('luxury') || t.includes('lux') || t.includes('hideaway')) {
        variations.add(`${cityOnly} luxury neighborhood`);
        variations.add(`${cityOnly} upscale hotels`);
    }
    if (t.includes('boutique') || t.includes('artisan')) {
        variations.add(`${cityOnly} boutique hotel`);
        variations.add(`${cityOnly} stylish hotel`);
    }
    if (t.includes('loft') || t.includes('modern') || t.includes('designer')) {
        variations.add(`${cityOnly} modern apartment building`);
        variations.add(`${cityOnly} contemporary architecture`);
    }
    if (t.includes('city view') || t.includes('cityview') || t.includes('view')) {
        variations.add(`${cityOnly} skyline`);
        variations.add(`${cityOnly} city skyline`);
    }

    // General urban-focused queries
    variations.add(`${cityOnly} skyline`);
    variations.add(`${cityOnly} downtown`);
    variations.add(`${cityOnly} business district`);
    variations.add(`${cityOnly} urban cityscape`);
    variations.add(`${cityOnly} aerial view`);
    variations.add(`${cityOnly} modern district`);
    variations.add(`${cityOnly} residential neighborhood`);
    variations.add(`${cityOnly} luxury neighborhood`);
    variations.add(`${cityOnly} street`);
    variations.add(q);

    // also try without country if provided
    if (parts.length > 1) {
        variations.add(parts[0]);
    }

    return Array.from(variations);
}

async function getImageForQuery(query, perPage = 1, opts = {}) {
    const key = process.env.PEXELS_API_KEY;
    if (!key || !query) return null;

    const title = opts.title || '';
    const queries = buildQueriesForPlace(query, title);

    // terms that indicate rural / unwanted content
    const excludeTerms = /village|countryside|farm|rural|barn|sheep|agriculture|field|pasture|fishing|beach|lake shore/i;

    for (const q of queries) {
        try {
            const url = new URL(PEXELS_SEARCH_URL);
            url.searchParams.set('query', q);
            url.searchParams.set('per_page', String(Math.max(1, perPage)));

            const res = await fetch(url.toString(), {
                headers: { Authorization: key, Accept: 'application/json' },
                method: 'GET',
            });

            if (!res.ok) continue;
            const data = await res.json();
            const photos = Array.isArray(data.photos) ? data.photos : [];
            if (!photos.length) continue;

            // prefer photos whose alt text does not contain rural terms
            const candidate = photos.find((p) => !(p.alt && excludeTerms.test(p.alt))) || photos[0];
            if (!candidate) continue;

            // Prefer large / medium / original sizes
            return (candidate.src && (candidate.src.large || candidate.src.medium || candidate.src.original)) || null;
        } catch (_err) {
            // try next variation
            continue;
        }
    }

    return null;
}

module.exports = { getImageForQuery };
