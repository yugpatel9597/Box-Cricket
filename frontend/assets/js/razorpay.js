(function () {
  async function payForBooking({ bookingId, booking, ground, customer }) {
    if (!window.Razorpay) {
      throw new Error('Razorpay checkout script not loaded');
    }

    const { apiFetch } = window.BoxCricket;

    const orderRes = await apiFetch('/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    });

    const keyId = orderRes && orderRes.keyId;
    const order = orderRes && orderRes.order;

    if (!keyId) {
      throw new Error('Payment not configured on server (RAZORPAY_KEY_ID missing)');
    }

    if (!order || !order.id) {
      throw new Error('Failed to create Razorpay order');
    }

    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'BoxCricket',
      description: ground && ground.name ? `${ground.name} slot booking` : 'Box cricket slot booking',
      order_id: order.id,
      handler: async function (response) {
        try {
          await apiFetch('/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          window.location.href = `/payment-success.html?bookingId=${encodeURIComponent(
            bookingId
          )}&paymentId=${encodeURIComponent(response.razorpay_payment_id)}&orderId=${encodeURIComponent(
            response.razorpay_order_id
          )}`;
        } catch (err) {
          window.location.href = `/payment-failed.html?bookingId=${encodeURIComponent(
            bookingId
          )}&orderId=${encodeURIComponent(response.razorpay_order_id)}`;
        }
      },
      prefill: {
        name: customer && customer.name ? customer.name : undefined,
        email: customer && customer.email ? customer.email : undefined,
        contact: customer && customer.phone ? customer.phone : undefined
      },
      theme: {
        color: '#22c55e'
      },
      notes: {
        bookingId: bookingId,
        groundId: booking && booking.groundId ? booking.groundId : undefined
      }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', function () {
      window.location.href = `/payment-failed.html?bookingId=${encodeURIComponent(
        bookingId
      )}&orderId=${encodeURIComponent(order.id)}`;
    });

    rzp.open();
  }

  window.BoxCricketRazorpay = {
    payForBooking
  };
})();
