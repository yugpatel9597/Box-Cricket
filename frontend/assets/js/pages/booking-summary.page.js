(function () {
  const bookingId = window.BoxCricket.qs('bookingId');

  const errorEl = document.getElementById('summary-error');
  const skeletonEl = document.getElementById('summary-skeleton');
  const viewEl = document.getElementById('summary-view');

  const groundEl = document.getElementById('sum-ground');
  const locationEl = document.getElementById('sum-location');
  const slotEl = document.getElementById('sum-slot');
  const statusEl = document.getElementById('sum-status');
  const totalEl = document.getElementById('sum-total');

  const payBtn = document.getElementById('pay-now-btn');

  let booking = null;
  let ground = null;

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

  function setLoading(isLoading) {
    if (skeletonEl) skeletonEl.classList.toggle('hidden', !isLoading);
    if (viewEl) viewEl.classList.toggle('hidden', isLoading);
  }

  function requireLogin() {
    if (window.BoxCricket.getToken()) return true;
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?redirect=${redirect}`;
    return false;
  }

  function render() {
    if (!booking || !ground) return;

    groundEl.textContent = ground.name;
    locationEl.textContent = ground.location;
    slotEl.textContent = `Slot: ${booking.date} · ${booking.startTime} - ${booking.endTime}`;

    const total = window.BoxCricket.formatINRFromPaise(booking.amountPaise);
    totalEl.textContent = total;

    statusEl.textContent = `Booking status: ${booking.status}`;

    if (!payBtn) return;

    if (booking.status === 'confirmed') {
      payBtn.disabled = true;
      payBtn.textContent = 'Already Paid';
      return;
    }

    if (booking.status === 'cancelled') {
      payBtn.disabled = true;
      payBtn.textContent = 'Cancelled';
      return;
    }

    payBtn.disabled = false;
    payBtn.textContent = 'Pay Now';
  }

  async function payNow() {
    if (!booking || !ground) return;

    hideError();

    if (booking.status !== 'pending_payment') {
      showError('This booking is not pending payment.');
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Opening checkout…';

    try {
      const customer = window.BoxCricket.getUser();
      await window.BoxCricketRazorpay.payForBooking({ bookingId: booking.id, booking, ground, customer });
    } catch (err) {
      showError(err && err.message ? err.message : 'Payment failed');
      payBtn.disabled = false;
      payBtn.textContent = 'Pay Now';
    }
  }

  async function init() {
    if (!bookingId) {
      setLoading(false);
      showError('Missing bookingId');
      return;
    }

    if (!requireLogin()) return;

    try {
      hideError();
      setLoading(true);

      const bookingRes = await window.BoxCricket.apiFetch(`/bookings/${encodeURIComponent(bookingId)}`);
      booking = bookingRes && bookingRes.booking;

      if (!booking) throw new Error('Booking not found');

      const groundRes = await window.BoxCricket.apiFetch(`/grounds/${encodeURIComponent(booking.groundId)}`);
      ground = groundRes && groundRes.ground;
      if (!ground) throw new Error('Ground not found');

      setLoading(false);
      render();
    } catch (err) {
      setLoading(false);
      if (err && err.status === 401) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login.html?redirect=${redirect}`;
        return;
      }
      showError(err && err.message ? err.message : 'Failed to load booking summary');
    }
  }

  if (payBtn) payBtn.addEventListener('click', payNow);
  document.addEventListener('DOMContentLoaded', init);
})();
