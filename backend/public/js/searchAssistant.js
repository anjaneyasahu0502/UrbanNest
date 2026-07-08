document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-search-assistant-form]');
  const input = document.querySelector('[data-search-assistant-input]');
  const results = document.querySelector('[data-search-assistant-results]');

  if (!form || !input || !results) {
    return;
  }

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
          <div class="small text-muted">${payload.analysis.city || ''}${payload.analysis.country ? `, ${payload.analysis.country}` : ''}</div>
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
      payload.suggestions.forEach((suggestion) => {
        items.push(`
          <button type="button" class="list-group-item list-group-item-action" data-search-suggestion="${suggestion.value}">
            <i class="bi bi-search me-2 text-danger"></i>${suggestion.label}
          </button>
        `);
      });
    }

    if (payload.matches?.length) {
      items.push('<div class="list-group-item small text-uppercase text-muted fw-semibold">Matches</div>');
      payload.matches.forEach((match) => {
        items.push(`
          <a href="${match.href}" class="list-group-item list-group-item-action">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <div class="fw-semibold">${match.title}</div>
                <div class="small text-muted">${match.location}, ${match.country}</div>
              </div>
              <span class="badge text-bg-light border">&#8377; ${Number(match.price).toLocaleString('en-IN')}</span>
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

    if (!value) {
      hideResults();
      return;
    }

    if (activeRequest) {
      activeRequest.abort();
    }

    activeRequest = new AbortController();

    try {
      const response = await fetch(`/listings/search/assistant?q=${encodeURIComponent(value)}`, {
        signal: activeRequest.signal,
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Search assistant returned ${response.status}`);
      }

      const payload = await response.json();
      renderResults(payload);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      hideResults();
    }
  };

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runSearch, 250);
  });

  form.addEventListener('submit', () => {
    hideResults();
  });

  document.addEventListener('click', (event) => {
    if (!form.contains(event.target)) {
      hideResults();
    }
  });

  results.addEventListener('click', (event) => {
    const target = event.target.closest('[data-search-suggestion]');
    if (!target) {
      return;
    }

    input.value = target.getAttribute('data-search-suggestion') || '';
    hideResults();
    form.requestSubmit();
  });
});
