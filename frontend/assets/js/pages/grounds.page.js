(function () {
  const listEl = document.getElementById('grounds-list');
  const errorEl = document.getElementById('grounds-error');
  const searchEl = document.getElementById('ground-search');

  let allGrounds = [];
  let availabilityMap = new Map();

  function showError(msg) {
    if (!errorEl) return;
    errorEl.classList.remove('hidden');
    errorEl.textContent = msg;
  }

  function clearError() {
    if (!errorEl) return;
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
  }

  function render(grounds) {
    if (!listEl) return;

    if (!grounds || grounds.length === 0) {
      listEl.innerHTML = '<p class="text-sm text-white/60">No grounds found.</p>';
      return;
    }

    listEl.innerHTML = grounds
      .map((g) => {
        const avail = availabilityMap.get(g.id);
        const badge =
          typeof avail === 'number'
            ? avail > 0
              ? `<span class="rounded-full bg-turf/15 px-2 py-1 text-xs text-turf2">${avail} slots today</span>`
              : `<span class="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">Full today</span>`
            : `<span class="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">Checking…</span>`;

        const image = Array.isArray(g.images) && g.images.length > 0 ? g.images[0] : 'https://placehold.co/1200x700/0b1f14/22c55e?text=Box+Cricket';

        return `
          <a href="/ground-details.html?id=${encodeURIComponent(g.id)}" class="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20">
            <div class="aspect-[16/10] overflow-hidden">
              <img src="${image}" alt="${g.name}" class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
            </div>
            <div class="p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-lg font-semibold">${g.name}</p>
                  <p class="mt-1 text-sm text-white/60">${g.location}</p>
                </div>
                ${badge}
              </div>

              <div class="mt-4 flex items-end justify-between">
                <div>
                  <p class="text-xs text-white/60">Price per hour</p>
                  <p class="text-xl font-bold">₹${Math.round(Number(g.pricePerHour || 0))}</p>
                </div>
                <span class="text-sm font-semibold text-turf2 group-hover:text-turf">Details →</span>
              </div>
            </div>
          </a>
        `;
      })
      .join('');
  }

  async function loadAvailability(grounds) {
    const today = window.BoxCricket.todayISO();

    await Promise.all(
      grounds.map(async (g) => {
        try {
          const a = await window.BoxCricket.apiFetch(`/grounds/${encodeURIComponent(g.id)}/availability?date=${encodeURIComponent(today)}`);
          const slots = (a && a.slots) || [];
          availabilityMap.set(g.id, slots.filter((s) => s.available).length);
        } catch {
          availabilityMap.set(g.id, null);
        }
      })
    );

    render(filterGrounds());
  }

  function filterGrounds() {
    const q = (searchEl && searchEl.value ? String(searchEl.value) : '').trim().toLowerCase();
    if (!q) return allGrounds;

    return allGrounds.filter((g) => {
      const hay = `${g.name} ${g.location}`.toLowerCase();
      return hay.includes(q);
    });
  }

  async function init() {
    if (!listEl) return;

    try {
      clearError();
      const data = await window.BoxCricket.apiFetch('/grounds');
      allGrounds = (data && data.grounds) || [];
      availabilityMap = new Map(allGrounds.map((g) => [g.id, undefined]));

      render(allGrounds);
      loadAvailability(allGrounds);
    } catch (err) {
      showError(err && err.message ? err.message : 'Failed to load grounds.');
    }
  }

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      render(filterGrounds());
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
