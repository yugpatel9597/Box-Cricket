# Box Cricket Frontend (Static Tailwind)

Static pages served by the Express backend.

## Pages

- `/index.html`
- `/grounds.html`
- `/ground-details.html?id=...`
- `/booking-summary.html?bookingId=...`
- `/payment-success.html`
- `/payment-failed.html`
- `/login.html`
- `/register.html`
- `/my-bookings.html`
- `/contact.html`
- `/policies/privacy.html`
- `/policies/terms.html`
- `/policies/refund.html`
- `/admin.html`

## Notes

- UI uses Tailwind via CDN + `assets/js/tailwind-init.js` theme customization.
- Booking + payment flow is handled in JS and calls backend APIs.
