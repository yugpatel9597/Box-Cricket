(function () {
  const bookingId = window.BoxCricket.qs('bookingId');
  const orderId = window.BoxCricket.qs('orderId');

  const detailsEl = document.getElementById('failed-details');
  const retryEl = document.getElementById('retry-link');

  function row(label, value) {
    return `
      <div class="rounded-xl border border-white/10 bg-pitch2/60 p-4">
        <p class="text-xs text-white/60">${label}</p>
        <p class="mt-1 text-sm font-semibold">${value || '-'}</p>
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (detailsEl) {
      detailsEl.innerHTML = [row('Booking ID', bookingId), row('Order ID', orderId)].join('');
    }

    if (retryEl && bookingId) {
      retryEl.href = `/booking-summary.html?bookingId=${encodeURIComponent(bookingId)}`;
    }
  });
})();
