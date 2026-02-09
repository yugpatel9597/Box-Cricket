(function () {
  const id = window.BoxCricket.qs('id');

  const errorEl = document.getElementById('ground-error');
  const skeletonEl = document.getElementById('ground-skeleton');
  const viewEl = document.getElementById('ground-view');

  const nameEl = document.getElementById('ground-name');
  const locationEl = document.getElementById('ground-location');
  const priceEl = document.getElementById('ground-price');
  const mainImageEl = document.getElementById('ground-main-image');
  const thumbsEl = document.getElementById('ground-thumbs');
  const amenitiesEl = document.getElementById('ground-amenities');

  const dateEl = document.getElementById('booking-date');
  const hoursEl = document.getElementById('booking-hours');
  const slotsEl = document.getElementById('slots-list');
  const selectedEl = document.getElementById('selected-slot');
  const continueBtn = document.getElementById('continue-btn');
  const loginPromptEl = document.getElementById('login-prompt');

  let ground = null;
  let selectedStart = null;
  let selectedEnd = null;

  function showError(msg) {
    if (errorEl) {
      errorEl.classList.remove('hidden');
      errorEl.textContent = msg;
    }
  }

  function hideError() {
    if (errorEl) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
    }
  }

  function setLoading(isLoading) {
    if (skeletonEl) skeletonEl.classList.toggle('hidden', !isLoading);
    if (viewEl) viewEl.classList.toggle('hidden', isLoading);
  }

  function isLoggedIn() {
    return Boolean(window.BoxCricket.getToken());
  }

  function updateLoginPrompt() {
    if (!loginPromptEl) return;

    if (isLoggedIn()) {
      loginPromptEl.classList.add('hidden');
      loginPromptEl.innerHTML = '';
      return;
    }

    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    loginPromptEl.classList.remove('hidden');
    loginPromptEl.innerHTML = `
      <p class="text-sm font-semibold">Login required</p>
      <p class="mt-2 text-sm text-white/70">Please login to create a booking and pay via Razorpay.</p>
      <a class="mt-3 inline-flex items-center justify-center rounded-xl bg-sand px-4 py-2 text-sm font-semibold text-black hover:opacity-90" href="/login.html?redirect=${redirect}">
        Login
      </a>
    `;
  }

  function setSelectedSlot(slot) {
    if (!slot) {
      selectedStart = null;
      selectedEnd = null;
      if (selectedEl) selectedEl.textContent = 'No slot selected';
      if (continueBtn) continueBtn.disabled = true;
      return;
    }

    selectedStart = slot.startTime;
    selectedEnd = slot.endTime;

    if (selectedEl) {
      const hrs = Number(hoursEl && hoursEl.value ? hoursEl.value : 1) || 1;
      selectedEl.textContent = `${slot.startTime} - ${slot.endTime} (start) · ${hrs} hour${hrs > 1 ? 's' : ''}`;
    }

    if (continueBtn) {
      continueBtn.disabled = !selectedStart;
    }
  }

  function renderGround(g) {
    if (!g) return;

    nameEl.textContent = g.name;
    locationEl.textContent = g.location;
    priceEl.textContent = `₹${Math.round(Number(g.pricePerHour || 0))}/hr`;

    const images = Array.isArray(g.images) && g.images.length > 0 ? g.images : ['https://placehold.co/1200x700/0b1f14/22c55e?text=Box+Cricket'];

    if (mainImageEl) {
      mainImageEl.src = images[0];
    }

    if (thumbsEl) {
      thumbsEl.innerHTML = images
        .slice(0, 3)
        .map((src, idx) => {
          return `
            <button data-idx="${idx}" class="overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:border-white/20">
              <img src="${src}" alt="Thumbnail" class="h-20 w-full object-cover" loading="lazy" />
            </button>
          `;
        })
        .join('');

      const buttons = thumbsEl.querySelectorAll('button[data-idx]');
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-idx'));
          if (mainImageEl && images[idx]) mainImageEl.src = images[idx];
        });
      });
    }

    if (amenitiesEl) {
      const list = Array.isArray(g.amenities) ? g.amenities : [];
      amenitiesEl.innerHTML = (list.length ? list : ['Turf', 'Lights']).map((a) => {
        return `<span class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">${a}</span>`;
      }).join('');
    }

    if (dateEl) {
      const today = window.BoxCricket.todayISO();
      dateEl.value = dateEl.value || today;
      dateEl.min = today;
    }
  }

  function renderSlots(slots) {
    if (!slotsEl) return;

    if (!slots || slots.length === 0) {
      slotsEl.innerHTML = '<p class="col-span-2 text-xs text-white/60">No slots available for this date.</p>';
      return;
    }

    slotsEl.innerHTML = slots
      .map((s) => {
        const isSelected = selectedStart === s.startTime;
        const base = 'rounded-xl px-3 py-2 text-sm font-semibold transition border';
        const available = s.available;

        const cls = available
          ? isSelected
            ? `${base} border-turf bg-turf/15 text-white`
            : `${base} border-white/10 bg-white/5 text-white/90 hover:border-white/20`
          : `${base} cursor-not-allowed border-white/5 bg-white/5 text-white/30`;

        return `
          <button data-start="${s.startTime}" data-end="${s.endTime}" ${available ? '' : 'disabled'} class="${cls}">
            ${s.startTime}
          </button>
        `;
      })
      .join('');

    const buttons = slotsEl.querySelectorAll('button[data-start]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const startTime = btn.getAttribute('data-start');
        const endTime = btn.getAttribute('data-end');
        setSelectedSlot({ startTime, endTime });

        buttons.forEach((b) => b.classList.remove('border-turf', 'bg-turf/15'));
        btn.classList.add('border-turf', 'bg-turf/15');
      });
    });
  }

  async function loadAvailability() {
    if (!ground || !dateEl) return;

    const date = dateEl.value;
    if (!date) return;

    try {
      const a = await window.BoxCricket.apiFetch(
        `/grounds/${encodeURIComponent(ground.id)}/availability?date=${encodeURIComponent(date)}`
      );

      const slots = (a && a.slots) || [];

      // Reset selection if slot no longer available.
      if (selectedStart) {
        const still = slots.find((s) => s.startTime === selectedStart && s.available);
        if (!still) setSelectedSlot(null);
      }

      renderSlots(slots);
    } catch (err) {
      renderSlots([]);
      showError(err && err.message ? err.message : 'Failed to load availability');
    }
  }

  async function createBooking() {
    if (!ground) return;

    if (!isLoggedIn()) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?redirect=${redirect}`;
      return;
    }

    if (!dateEl || !selectedStart) {
      return;
    }

    const hrs = Math.max(1, Number(hoursEl && hoursEl.value ? hoursEl.value : 1) || 1);

    continueBtn.disabled = true;
    continueBtn.textContent = 'Creating booking…';

    try {
      const res = await window.BoxCricket.apiFetch('/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groundId: ground.id,
          date: dateEl.value,
          startTime: selectedStart,
          endTime: selectedEnd
        })
      });

      const booking = res && res.booking;
      if (!booking || !booking.id) {
        throw new Error('Booking creation failed');
      }

      window.location.href = `/booking-summary.html?bookingId=${encodeURIComponent(booking.id)}`;
    } catch (err) {
      const msg = err && err.message ? err.message : 'Failed to create booking';
      showError(msg);
      continueBtn.disabled = false;
      continueBtn.textContent = 'Continue to Summary';

      if (err && err.status === 401) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login.html?redirect=${redirect}`;
      }
    }
  }

  async function init() {
    if (!id) {
      setLoading(false);
      showError('Missing ground id');
      return;
    }

    try {
      hideError();
      setLoading(true);
      updateLoginPrompt();

      const res = await window.BoxCricket.apiFetch(`/grounds/${encodeURIComponent(id)}`);
      ground = res && res.ground;
      if (!ground) throw new Error('Ground not found');

      renderGround(ground);
      setLoading(false);

      await loadAvailability();
    } catch (err) {
      setLoading(false);
      showError(err && err.message ? err.message : 'Failed to load ground');
    }
  }

  if (dateEl) dateEl.addEventListener('change', loadAvailability);
  if (hoursEl) hoursEl.addEventListener('change', () => {
    // hours impacts price and booking duration; keep selected start.
    if (selectedStart && selectedEnd) setSelectedSlot({ startTime: selectedStart, endTime: selectedEnd });
  });
  if (continueBtn) continueBtn.addEventListener('click', createBooking);

  document.addEventListener('DOMContentLoaded', init);
})();
