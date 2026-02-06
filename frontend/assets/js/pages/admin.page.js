(function () {
  const warningEl = document.getElementById('admin-warning');
  const loginLink = document.getElementById('admin-login-link');
  const errorEl = document.getElementById('admin-error');
  const viewEl = document.getElementById('admin-view');

  const statsEl = document.getElementById('admin-stats');
  const groundsListEl = document.getElementById('grounds-admin-list');
  const bookingsEl = document.getElementById('admin-bookings');
  const paymentsEl = document.getElementById('admin-payments');

  const refreshGroundsBtn = document.getElementById('refresh-grounds');
  const refreshBookingsBtn = document.getElementById('refresh-bookings');
  const refreshPaymentsBtn = document.getElementById('refresh-payments');

  const groundForm = document.getElementById('ground-form');
  const groundFormMsg = document.getElementById('ground-form-msg');

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

  function showFormMsg(msg, isOk) {
    if (!groundFormMsg) return;
    groundFormMsg.classList.remove('hidden');
    groundFormMsg.textContent = msg;
    groundFormMsg.classList.toggle('border-red-500/30', !isOk);
    groundFormMsg.classList.toggle('bg-red-500/10', !isOk);
    groundFormMsg.classList.toggle('border-white/10', isOk);
    groundFormMsg.classList.toggle('bg-white/5', isOk);
  }

  function requireAdmin() {
    const token = window.BoxCricket.getToken();
    const user = window.BoxCricket.getUser();
    const payload = token ? window.BoxCricket.decodeJwt(token) : null;
    const role = (user && user.role) || (payload && payload.role) || 'user';

    if (!token || role !== 'admin') {
      if (warningEl) warningEl.classList.remove('hidden');
      if (viewEl) viewEl.classList.add('hidden');

      if (loginLink) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        loginLink.href = `/login.html?redirect=${redirect}`;
      }

      return false;
    }

    if (warningEl) warningEl.classList.add('hidden');
    if (viewEl) viewEl.classList.remove('hidden');
    return true;
  }

  function statCard(label, value) {
    return `
      <div class="rounded-2xl border border-white/10 bg-pitch2/60 p-5">
        <p class="text-xs text-white/60">${label}</p>
        <p class="mt-2 text-2xl font-bold">${value}</p>
      </div>
    `;
  }

  async function loadStats() {
    const res = await window.BoxCricket.apiFetch('/admin/stats');
    const stats = (res && res.stats) || {};
    if (statsEl) {
      statsEl.innerHTML = [
        statCard('Grounds', stats.grounds || 0),
        statCard('Bookings', stats.bookings || 0),
        statCard('Payments', stats.payments || 0)
      ].join('');
    }
  }

  function groundCard(g) {
    const isActive = g.isActive !== false;

    return `
      <div class="rounded-2xl border border-white/10 bg-pitch2/60 p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold">${g.name}</p>
            <p class="mt-1 text-xs text-white/60">${g.location}</p>
          </div>
          <span class="rounded-full ${isActive ? 'bg-turf/15 text-turf2' : 'bg-white/10 text-white/70'} px-2 py-1 text-xs">${isActive ? 'Active' : 'Inactive'}</span>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-white/60">Price/hr</p>
            <input data-price="${g.id}" value="${Math.round(Number(g.pricePerHour || 0))}" type="number" min="0" class="mt-2 w-full rounded-lg border border-white/10 bg-pitch2/50 px-3 py-2 text-sm outline-none focus:border-turf/60" />
          </div>
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-white/60">Slot mins</p>
            <input data-slot="${g.id}" value="${Number(g.slotMinutes || 60)}" type="number" min="15" class="mt-2 w-full rounded-lg border border-white/10 bg-pitch2/50 px-3 py-2 text-sm outline-none focus:border-turf/60" />
          </div>
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-white/60">Open</p>
            <input data-open="${g.id}" value="${g.openTime}" class="mt-2 w-full rounded-lg border border-white/10 bg-pitch2/50 px-3 py-2 text-sm outline-none focus:border-turf/60" />
          </div>
          <div class="rounded-xl border border-white/10 bg-white/5 p-3">
            <p class="text-xs text-white/60">Close</p>
            <input data-close="${g.id}" value="${g.closeTime}" class="mt-2 w-full rounded-lg border border-white/10 bg-pitch2/50 px-3 py-2 text-sm outline-none focus:border-turf/60" />
          </div>
        </div>

        <label class="mt-4 flex items-center gap-2 text-sm text-white/70">
          <input data-active="${g.id}" type="checkbox" ${isActive ? 'checked' : ''} class="h-4 w-4 accent-turf" />
          Active
        </label>

        <div class="mt-4 flex flex-wrap gap-2">
          <button data-save="${g.id}" class="rounded-xl bg-turf px-4 py-2 text-xs font-semibold text-black hover:bg-turf2">Save</button>
        </div>
      </div>
    `;
  }

  async function loadGrounds() {
    const res = await window.BoxCricket.apiFetch('/admin/grounds');
    const grounds = (res && res.grounds) || [];

    if (groundsListEl) {
      groundsListEl.innerHTML = grounds.length
        ? grounds.map(groundCard).join('')
        : '<p class="text-sm text-white/60">No grounds yet.</p>';
    }

    const saveButtons = document.querySelectorAll('button[data-save]');
    saveButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const groundId = btn.getAttribute('data-save');
        if (!groundId) return;

        const price = document.querySelector(`input[data-price="${groundId}"]`);
        const slot = document.querySelector(`input[data-slot="${groundId}"]`);
        const open = document.querySelector(`input[data-open="${groundId}"]`);
        const close = document.querySelector(`input[data-close="${groundId}"]`);
        const active = document.querySelector(`input[data-active="${groundId}"]`);

        btn.disabled = true;
        btn.textContent = 'Saving…';

        try {
          await window.BoxCricket.apiFetch(`/admin/grounds/${encodeURIComponent(groundId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pricePerHour: price ? Number(price.value) : undefined,
              slotMinutes: slot ? Number(slot.value) : undefined,
              openTime: open ? String(open.value) : undefined,
              closeTime: close ? String(close.value) : undefined,
              isActive: active ? Boolean(active.checked) : undefined
            })
          });

          await loadGrounds();
        } catch (err) {
          showError(err && err.message ? err.message : 'Failed to update ground');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Save';
        }
      });
    });
  }

  function table(headers, rows) {
    const head = headers.map((h) => `<th class="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold text-white/70">${h}</th>`).join('');
    const body = rows
      .map(
        (r) => `
        <tr class="border-t border-white/10">
          ${r.map((c) => `<td class="whitespace-nowrap px-3 py-3 text-xs text-white/70">${c}</td>`).join('')}
        </tr>
      `
      )
      .join('');

    return `
      <table class="min-w-full">
        <thead class="bg-pitch2/60">${head}</thead>
        <tbody>${body}</tbody>
      </table>
    `;
  }

  async function loadBookings() {
    const res = await window.BoxCricket.apiFetch('/admin/bookings');
    const bookings = (res && res.bookings) || [];

    if (!bookingsEl) return;

    if (bookings.length === 0) {
      bookingsEl.innerHTML = '<div class="p-4 text-sm text-white/60">No bookings yet.</div>';
      return;
    }

    bookingsEl.innerHTML = table(
      ['Booking ID', 'User', 'Ground', 'Date', 'Time', 'Amount', 'Status', 'Order', 'Payment'],
      bookings.map((b) => [
        b.id,
        b.userId,
        b.groundId,
        b.date,
        `${b.startTime}-${b.endTime}`,
        window.BoxCricket.formatINRFromPaise(b.amountPaise),
        b.status,
        b.razorpayOrderId || '-',
        b.razorpayPaymentId || '-'
      ])
    );
  }

  async function loadPayments() {
    const res = await window.BoxCricket.apiFetch('/admin/payments');
    const payments = (res && res.payments) || [];

    if (!paymentsEl) return;

    if (payments.length === 0) {
      paymentsEl.innerHTML = '<div class="p-4 text-sm text-white/60">No payments yet.</div>';
      return;
    }

    paymentsEl.innerHTML = table(
      ['Payment ID', 'Booking', 'Amount', 'Status', 'Order', 'Payment Ref'],
      payments.map((p) => [
        p.id,
        p.bookingId,
        window.BoxCricket.formatINRFromPaise(p.amountPaise),
        p.status,
        p.razorpayOrderId || '-',
        p.razorpayPaymentId || '-'
      ])
    );
  }

  async function onCreateGround(e) {
    e.preventDefault();

    hideError();

    const name = document.getElementById('g-name').value;
    const location = document.getElementById('g-location').value;
    const pricePerHour = Number(document.getElementById('g-price').value);
    const openTime = document.getElementById('g-open').value;
    const closeTime = document.getElementById('g-close').value;
    const slotMinutes = Number(document.getElementById('g-slot').value);
    const imagesRaw = document.getElementById('g-images').value;
    const amenitiesRaw = document.getElementById('g-amenities').value;
    const isActive = Boolean(document.getElementById('g-active').checked);

    const images = imagesRaw
      ? imagesRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const amenities = amenitiesRaw
      ? amenitiesRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const submitBtn = groundForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating…';

    try {
      await window.BoxCricket.apiFetch('/admin/grounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          location,
          pricePerHour,
          openTime,
          closeTime,
          slotMinutes,
          images,
          amenities,
          isActive
        })
      });

      showFormMsg('Ground created successfully.', true);
      groundForm.reset();
      document.getElementById('g-active').checked = true;
      document.getElementById('g-slot').value = '60';

      await loadStats();
      await loadGrounds();
    } catch (err) {
      showFormMsg(err && err.message ? err.message : 'Failed to create ground', false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Ground';
    }
  }

  async function init() {
    if (!requireAdmin()) return;

    try {
      hideError();
      await Promise.all([loadStats(), loadGrounds(), loadBookings(), loadPayments()]);
    } catch (err) {
      if (err && err.status === 401) {
        window.BoxCricket.clearAuth();
        requireAdmin();
        return;
      }
      showError(err && err.message ? err.message : 'Failed to load admin dashboard');
    }
  }

  if (refreshGroundsBtn) refreshGroundsBtn.addEventListener('click', loadGrounds);
  if (refreshBookingsBtn) refreshBookingsBtn.addEventListener('click', loadBookings);
  if (refreshPaymentsBtn) refreshPaymentsBtn.addEventListener('click', loadPayments);
  if (groundForm) groundForm.addEventListener('submit', onCreateGround);

  document.addEventListener('DOMContentLoaded', init);
})();
