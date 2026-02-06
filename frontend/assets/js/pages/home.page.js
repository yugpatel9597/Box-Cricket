(function () {
  async function loadHighlights() {
    const container = document.getElementById('ground-highlights');
    const errorEl = document.getElementById('home-error');

    if (!container) return;

    try {
      const data = await window.BoxCricket.apiFetch('/grounds');
      const grounds = (data && data.grounds) || [];

      const top = grounds.slice(0, 3);

      if (top.length === 0) {
        container.innerHTML = '<p class="text-sm text-white/60">No grounds found yet.</p>';
        return;
      }

      const today = window.BoxCricket.todayISO();

      const availability = await Promise.all(
        top.map(async (g) => {
          try {
            const a = await window.BoxCricket.apiFetch(`/grounds/${encodeURIComponent(g.id)}/availability?date=${encodeURIComponent(today)}`);
            const slots = (a && a.slots) || [];
            const availableCount = slots.filter((s) => s.available).length;
            return { groundId: g.id, availableCount };
          } catch {
            return { groundId: g.id, availableCount: null };
          }
        })
      );

      const map = new Map(availability.map((x) => [x.groundId, x.availableCount]));

      container.innerHTML = top
        .map((g) => {
          const count = map.get(g.id);
          const badge =
            typeof count === 'number'
              ? count > 0
                ? `<span class="inline-flex items-center gap-1 rounded-full bg-turf/15 px-2 py-1 text-xs text-turf2">${count} slots today</span>`
                : `<span class="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">Full today</span>`
              : `<span class="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">Check availability</span>`;

          return `
            <a href="/ground-details.html?id=${encodeURIComponent(g.id)}" class="group overflow-hidden rounded-2xl border border-white/10 bg-pitch2/70 p-4 transition hover:border-white/20">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-white group-hover:text-white">${g.name}</p>
                  <p class="mt-1 text-xs text-white/60">${g.location}</p>
                </div>
                ${badge}
              </div>

              <div class="mt-4 flex items-end justify-between">
                <div>
                  <p class="text-xs text-white/60">From</p>
                  <p class="text-lg font-bold">₹${Math.round(Number(g.pricePerHour || 0))}/hr</p>
                </div>
                <span class="text-sm font-semibold text-turf2 group-hover:text-turf">Book →</span>
              </div>
            </a>
          `;
        })
        .join('');
    } catch (err) {
      if (errorEl) {
        errorEl.classList.remove('hidden');
        errorEl.textContent = err && err.message ? err.message : 'Failed to load grounds.';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadHighlights();
  });
})();
