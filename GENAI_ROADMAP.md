# GenAI Feature Roadmap for UrbanNest

A practical, step-by-step guide to implementing any AI-powered feature
using the Grok API (already wired in this project via `XAI_API_KEY`).

---

## How to Implement a GenAI Feature — The Pattern

Every GenAI feature in this project follows the same 6-step pattern.
Learn this once and you can ship any AI feature.

---

### Step 0 — Decide What the Feature Does

Write one sentence before touching any code:

> "The user does X, the AI does Y, and the result appears as Z."

Examples already in the project:
| Feature | User does | AI does | Result |
|---|---|---|---|
| Search Assistant | Types a query | Interprets intent, builds DB filter | Filtered listing results |
| Sahayata Chatbot | Asks a question | Answers about Indian cities/food/IT | Chat reply in browser |

New feature examples you could add:
| Feature | User does | AI does | Result |
|---|---|---|---|
| Listing Description Generator | Enters title + location | Writes a compelling description | Pre-filled textarea |
| Price Suggester | Enters city + property type | Suggests price range | Price hint on form |
| Review Summariser | Views a listing | Summarises all reviews | "Guests say…" blurb |
| Smart Booking Assistant | Asks "where to stay in Pune?" | Recommends matching listings | Filtered listing cards |
| Image Alt Text | Uploads a listing image | Describes the image | Auto-filled alt text |

---

## Step-by-Step Implementation

---

### Step 1 — Add the API Key to `.env`

The key is already there:

```env
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxx
XAI_MODEL=grok-beta
```

If you want a different model, change `XAI_MODEL`.  
No new packages needed — `fetch` is built into Node 18+.

---

### Step 2 — Create a Utility Function (`utils/`)

Create `utils/yourFeature.js`.
This is the only file that talks to the Grok API.

```js
// utils/listingDescriptionGenerator.js

async function generateListingDescription({ title, location, country, price }) {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;                  // graceful fallback

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || 'grok-beta',
      messages: [
        {
          role: 'system',
          content:
            'You write short, attractive property descriptions for an Indian accommodation platform. ' +
            '2–3 sentences. Warm, professional tone. Mention the city and a key highlight.',
        },
        {
          role: 'user',
          content: `Title: ${title}\nLocation: ${location}, ${country}\nPrice: ₹${price}/night`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

module.exports = { generateListingDescription };
```

**Rules for the utility file:**
- Always check `if (!key) return null` — never crash without a key
- Keep the system prompt specific and short
- Return `null` on any error so callers can fall back gracefully
- Never import Express or Mongoose here — pure logic only

---

### Step 3 — Add a Route Endpoint (`routes/`)

Add a new route or add to an existing route file.
For UI-driven features, use a `POST /api/...` endpoint that returns JSON.

```js
// In routes/listings.js  (or a new routes/ai.js)

const { generateListingDescription } = require('../utils/listingDescriptionGenerator');

// POST /listings/ai/description
// Body: { title, location, country, price }
// Returns: { description: "..." }
router.post('/ai/description', isAdmin, wrapAsync(async (req, res) => {
  const { title, location, country, price } = req.body;

  if (!title || !location) {
    return res.status(400).json({ error: 'title and location are required' });
  }

  const description = await generateListingDescription({ title, location, country, price });

  if (!description) {
    return res.status(503).json({ error: 'AI service unavailable' });
  }

  res.json({ description });
}));
```

**Rules for the route:**
- Protect it with `isLoggedIn` or `isAdmin` as appropriate
- Validate inputs — never pass raw user input directly to the AI without cleaning
- Always return a JSON `{ error }` on failure with the right HTTP status code
- Keep it thin — no business logic here, just call the utility and return

---

### Step 4 — Wire Up the Frontend (EJS + vanilla JS)

In the relevant EJS view, add a button and a small `<script>` block.
No build tools, no React — just a `fetch` call.

```html
<!-- In views/listings/new.ejs — inside the description field area -->

<div class="mb-3">
  <label class="form-label fw-semibold">Description</label>
  <div class="d-flex gap-2 mb-2">
    <button type="button" class="btn btn-sm btn-outline-urbannest" id="genDescBtn">
      <i class="fas fa-magic me-1"></i> Generate with AI
    </button>
    <span id="genDescSpinner" class="spinner-border spinner-border-sm text-muted d-none" role="status"></span>
  </div>
  <textarea class="form-control" name="listing[description]" id="descriptionField"
    rows="4" placeholder="Describe your property..."></textarea>
</div>

<script>
document.getElementById('genDescBtn').addEventListener('click', async () => {
  const title    = document.querySelector('[name="listing[title]"]')?.value?.trim();
  const location = document.querySelector('[name="listing[location]"]')?.value?.trim();
  const country  = document.querySelector('[name="listing[country]"]')?.value?.trim();
  const price    = document.querySelector('[name="listing[price]"]')?.value?.trim();

  if (!title || !location) {
    alert('Please fill in Title and Location first.');
    return;
  }

  const btn     = document.getElementById('genDescBtn');
  const spinner = document.getElementById('genDescSpinner');
  btn.disabled  = true;
  spinner.classList.remove('d-none');

  try {
    const res  = await fetch('/listings/ai/description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, location, country, price }),
    });
    const data = await res.json();

    if (data.description) {
      document.getElementById('descriptionField').value = data.description;
    } else {
      alert('AI could not generate a description. Please write it manually.');
    }
  } catch {
    alert('Network error. Please try again.');
  } finally {
    btn.disabled = false;
    spinner.classList.add('d-none');
  }
});
</script>
```

**Rules for the frontend:**
- Always disable the button while waiting to prevent double-clicks
- Show a spinner so the user knows the AI is working (responses take 1–3s)
- Never block form submission — the AI field is always optional
- Handle `data.error` and network failures gracefully

---

### Step 5 — Test It

**Manual test checklist:**
```
□ Feature works when XAI_API_KEY is set
□ Feature degrades gracefully when XAI_API_KEY is NOT set (returns null / shows fallback)
□ Empty / malicious inputs do not crash the server
□ Rate limiter (already on all routes at 100 req/min) prevents spam
□ Response appears correctly in the UI
□ Works on mobile viewport
```

**Quick API test without a browser:**

```bash
# With the server running:
curl -X POST http://localhost:8080/listings/ai/description \
  -H "Content-Type: application/json" \
  -d '{"title":"Cozy Studio","location":"Koramangala, Bengaluru","country":"India","price":2500}'
```

Expected response:
```json
{
  "description": "Discover this stylish studio in the heart of Koramangala, Bengaluru's vibrant tech hub..."
}
```

---

### Step 6 — Ship Considerations

Before deploying a GenAI feature to production:

| Concern | What to do |
|---|---|
| **Latency** | AI calls take 1–3s. Always make them async/on-demand, never block page load |
| **Cost** | Grok API is metered. Add a per-user or per-session rate limit if needed |
| **Hallucinations** | Never use AI output for financial calculations or critical data. Always let users edit AI-generated text |
| **Prompt injection** | Sanitise user inputs — never interpolate them directly without validation |
| **Fallback** | If `XAI_API_KEY` is missing or the API is down, the app must still work normally |
| **Logging** | Log AI calls (not the full response) so you can debug issues |
| **GDPR / Privacy** | Don't send personal user data (name, email, booking details) to the AI API without consent |

---

## Features Already Implemented in UrbanNest

### ✅ Sahayata Chatbot (`/sahayata`)
- **File**: `routes/chatbot.js`, `utils/` (inline), `views/chatbot/sahayata.ejs`
- **Pattern**: User message → system prompt + user message → AI reply → streamed to chat UI
- **Grok model**: `grok-beta`

### ✅ Search Assistant (`/listings?q=...`)
- **File**: `utils/searchAssistant.js`, `routes/listings.js`
- **Pattern**: Search query → AI parses intent → MongoDB filter built → results filtered
- **Grok model**: Same

---

## Next AI Features — Suggested Priority

| Priority | Feature | Complexity | Route to add |
|---|---|---|---|
| 🔥 High | **Listing Description Generator** | Low | `POST /listings/ai/description` |
| 🔥 High | **Price Suggester by City** | Low | `POST /listings/ai/price-suggest` |
| 🟡 Medium | **Review Summariser** | Medium | `GET /listings/:id/ai/review-summary` |
| 🟡 Medium | **Smart Booking Recommender** | Medium | `POST /sahayata/recommend` |
| 🟢 Low | **Auto Image Alt Text** | Medium | Called during listing save |
| 🟢 Low | **Personalised Home Feed** | High | `GET /` with user history |

Each one follows the same 6 steps above.

---

## File Structure for Any New GenAI Feature

```
utils/
  yourFeatureName.js      ← Step 2: pure AI call, no Express/Mongoose

routes/
  listings.js             ← Step 3: add POST /listings/ai/yourFeature
  (or a new routes/ai.js if many features)

views/listings/
  new.ejs / edit.ejs      ← Step 4: button + fetch script
  (or wherever the UI lives)
```

That's the full pattern. Every feature is 3 files, ~50 lines of new code.

---

## Quick Reference — Grok API Call Template

Copy-paste this whenever starting a new feature:

```js
async function callGrok(systemPrompt, userMessage) {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage   },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
```

Change `systemPrompt`, `userMessage`, `temperature`, and `max_tokens` per feature. Done.
