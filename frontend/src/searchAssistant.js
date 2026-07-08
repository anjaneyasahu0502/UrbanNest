// UrbanNest – search assistant widget
// This file is the Vite-managed version of public/js/searchAssistant.js.
// The backend boilerplate.ejs loads /js/searchAssistant.js from public/;
// this entry produces a dist/searchAssistant.js that can replace it in prod.

const API_BASE = import.meta.env.VITE_API_URL || '';

document.addEventListener('DOMContentLoaded', () => {
  const form    = document.querySelector('[data-search-assistant-form]');
  const input   = document.querySelector('[data-search-assistant-input]');
  const results = document.querySelector('[data-search-assistant-results]');

  if (!form || !input || !results) return;

  let debounceTimer;
  let activeRequest;

  const hideResults = () => {
    results.classList.add('d-none');
    results.innerHTML = '';
  };

  const renderResults = (payload) => {
    const items = [];

    if (payload.analysis?.placeDisplay) {
      items.push(`
        <div class="list-group-item search-assistant-place">
          <div class="small text-uppercase text-muted fw-semibold mb-1">
            ${payload.analysis.mode === 'groq' ? 'AI place match' : 'Place match'}
          </div>
          <div class="fw-semibold">${payload.analysis.placeDisplay}</div>
          <div class="small text-muted">
            ${payload.analysis.city || ''}${payload.analysis.country ? `, ${payload.analysis.country}` : ''}
          </div>
        </div>
      `);
    }

    if (payload.analysis?.mode === 'groq' && payload.analysis?.notes) {
      items.push(`<div class="list-group-item small text-muted">${payload.analysis.notes}</div>`);
    } else if (payload.analysis?.mode === 'local') {
      items.push('<div class="list-group-item small text-muted">Search local listings by city, country, or keyword.</div>');
    }

    if (payload.suggestions?.length) {
      items.push('<div class="list-group-item small text-uppercase text-muted fw-semibold">Search ideas</div>');
      payload.suggestions.forEach((s) => {
        items.push(`
          <button type="button" class="list-group-item list-group-item-action"
            data-search-suggestion="${s.value}">
            <i class="bi bi-search me-2 text-danger"></i>${s.label}
          </button>
        `);
      });
    }

    if (payload.matches?.length) {
      items.push('<div class="list-group-item small text-uppercase text-muted fw-semibold">Matches</div>');
      payload.matches.forEach((m) => {
        items.push(`
          <a href="${m.href}" class="list-group-item list-group-item-action">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <div class="fw-semibold">${m.title}</div>
                <div class="small text-muted">${m.location}, ${m.country}</div>
              </div>
              <span class="badge text-bg-light border">&#8377; ${Number(m.price).toLocaleString('en-IN')}</span>
            </div>
          </a>
        `);
      });
    }

    if (!items.length) {
      items.push('<div class="list-group-item small text-muted">No live suggestions yet. Press Enter to search all listings.</div>');
    }

    results.innerHTML = items.join('');
    results.classList.remove('d-none');
  };

  const runSearch = async () => {
    const value = input.value.trim();
    if (!value) { hideResults(); return; }

    if (activeRequest) activeRequest.abort();
    activeRequest = new AbortController();

    try {
      const res = await fetch(
        `${API_BASE}/listings/search/assistant?q=${encodeURIComponent(value)}`,
        { signal: activeRequest.signal, headers: { Accept: 'application/json' } }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      renderResults(await res.json());
    } catch (err) {
      if (err.name !== 'AbortError') hideResults();
    }
  };

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, 250);
  });

  form.addEventListener('submit', hideResults);

  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) hideResults();
  });

  results.addEventListener('click', (e) => {
    const target = e.target.closest('[data-search-suggestion]');
    if (!target) return;
    input.value = target.getAttribute('data-search-suggestion') || '';
    hideResults();
    form.requestSubmit();
  });
});
