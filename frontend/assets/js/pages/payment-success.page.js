(function () {
  const bookingId = window.BoxCricket.qs('bookingId');
  const paymentId = window.BoxCricket.qs('paymentId');
  const orderId = window.BoxCricket.qs('orderId');

  const detailsEl = document.getElementById('success-details');

  function row(label, value) {
    return `
      <div class="rounded-xl border border-white/10 bg-pitch2/60 p-4">
        <p class="text-xs text-white/60">${label}</p>
        <p class="mt-1 text-sm font-semibold">${value || '-'}</p>
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!detailsEl) return;

    detailsEl.innerHTML = [
      row('Booking ID', bookingId),
      row('Payment ID', paymentId),
      row('Order ID', orderId)
    ].join('');
  });
})();
