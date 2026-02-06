(function () {
  const authWarning = document.getElementById('auth-warning');
  const loginLink = document.getElementById('login-link');

  const errorEl = document.getElementById('bookings-error');
  const viewEl = document.getElementById('bookings-view');

  const upcomingEl = document.getElementById('upcoming-list');
  const pastEl = document.getElementById('past-list');

  function showError(msg) {
    if (!errorEl) return;
    errorEl.classList.remove('hidden');
    errorEl.textContent = msg;
  }

  function hideError() {
    if (!errorEl) return;
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
  }

  function requireLogin() {
    const token = window.BoxCricket.getToken();
    if (token) return true;

    if (authWarning) authWarning.classList.remove('hidden');
    if (viewEl) viewEl.classList.add('hidden');

    if (loginLink) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      loginLink.href = `/login.html?redirect=${redirect}`;
    }

    return false;
  }

  function normalizeBooking(b) {
    return {
      ...b,
      amountLabel: window.BoxCricket.formatINRFromPaise(b.amountPaise),
      startDateTime: window.BoxCricket.toLocalDateTime(b.date, b.startTime)
    };
  }

  function bookingCard(b, ground) {
    const gName = ground ? ground.name : `Ground ${b.groundId}`;
    const gLoc = ground ? ground.location : '';

    const statusBadge =
      b.status === 'confirmed'
        ? '<span class="rounded-full bg-turf/15 px-2 py-1 text-xs text-turf2">Confirmed</span>'
        : b.status === 'pending_payment'
          ? '<span class="rounded-full bg-sand/15 px-2 py-1 text-xs text-sand">Pending payment</span>'
          : '<span class="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">Cancelled</span>';

    const actions = [];

    if (b.status === 'pending_payment') {
      actions.push(
        `<a class="inline-flex items-center justify-center rounded-xl bg-sand px-4 py-2 text-xs font-semibold text-black hover:opacity-90" href="/booking-summary.html?bookingId=${encodeURIComponent(
          b.id
        )}">Pay Now</a>`
      );
    } else {
      actions.push(
        `<a class="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10" href="/booking-summary.html?bookingId=${encodeURIComponent(
          b.id
        )}">Summary</a>`
      );
    }

    if (b.status !== 'cancelled') {
      actions.push(
        `<button data-cancel="${b.id}" class="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/15">Cancel</button>`
      );
    }

    const paymentRef = b.razorpayPaymentId
      ? `<p class="mt-2 text-xs text-white/50">Payment: ${b.razorpayPaymentId}</p>`
      : '';

    return `
      <div class="rounded-2xl border border-white/10 bg-pitch2/60 p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold">${gName}</p>
            <p class="mt-1 text-xs text-white/60">${gLoc}</p>
          </div>
          ${statusBadge}
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-white/60">Date</p>
            <p class="mt-1 font-semibold">${b.date}</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-white/60">Time</p>
            <p class="mt-1 font-semibold">${b.startTime} - ${b.endTime}</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-white/60">Amount</p>
            <p class="mt-1 font-semibold">${b.amountLabel}</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-white/60">Booking ID</p>
            <p class="mt-1 truncate font-semibold">${b.id}</p>
          </div>
        </div>

        ${paymentRef}

        <div class="mt-5 flex flex-wrap gap-2">
          ${actions.join('')}
        </div>
      </div>
    `;
  }

  async function cancelBooking(id) {
    try {
      await window.BoxCricket.apiFetch(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
      await load();
    } catch (err) {
      showError(err && err.message ? err.message : 'Failed to cancel booking');
    }
  }

  function bindCancelButtons() {
    const buttons = document.querySelectorAll('button[data-cancel]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-cancel');
        if (!id) return;
        btn.disabled = true;
        btn.textContent = 'Cancelling…';
        await cancelBooking(id);
      });
    });
  }

  async function load() {
    if (!requireLogin()) return;

    hideError();

    try {
      const [bookingsRes, groundsRes] = await Promise.all([
        window.BoxCricket.apiFetch('/bookings/mine'),
        window.BoxCricket.apiFetch('/grounds')
      ]);

      const rawBookings = (bookingsRes && bookingsRes.bookings) || [];
      const bookings = rawBookings.map(normalizeBooking);

      const grounds = (groundsRes && groundsRes.grounds) || [];
      const groundMap = new Map(grounds.map((g) => [g.id, g]));

      const now = new Date();

      const upcoming = [];
      const past = [];

      for (const b of bookings) {
        if (b.status === 'cancelled') {
          past.push(b);
          continue;
        }

        const start = b.startDateTime;
        if (start && start.getTime() > now.getTime()) {
          upcoming.push(b);
        } else {
          past.push(b);
        }
      }

      if (authWarning) authWarning.classList.add('hidden');
      if (viewEl) viewEl.classList.remove('hidden');

      if (upcomingEl) {
        upcomingEl.innerHTML = upcoming.length
          ? upcoming.map((b) => bookingCard(b, groundMap.get(b.groundId))).join('')
          : '<p class="text-sm text-white/60">No upcoming bookings.</p>';
      }

      if (pastEl) {
        pastEl.innerHTML = past.length
          ? past.map((b) => bookingCard(b, groundMap.get(b.groundId))).join('')
          : '<p class="text-sm text-white/60">No past bookings.</p>';
      }

      bindCancelButtons();
    } catch (err) {
      if (err && err.status === 401) {
        window.BoxCricket.clearAuth();
        requireLogin();
        return;
      }
      showError(err && err.message ? err.message : 'Failed to load bookings');
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
