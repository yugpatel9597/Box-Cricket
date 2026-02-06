# Box Cricket Backend (Express)

## Endpoints

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Grounds

- `GET /api/grounds`
- `GET /api/grounds/:id`
- `GET /api/grounds/:id/availability?date=YYYY-MM-DD`

### Bookings

- `POST /api/bookings` (auth)
- `GET /api/bookings/mine` (auth)
- `GET /api/bookings/:id` (auth)
- `POST /api/bookings/:id/cancel` (auth)

### Payments (Razorpay)

- `GET /api/payments/config`
- `POST /api/payments/create-order` (auth)
- `POST /api/payments/verify` (auth)

### Webhooks

- `POST /api/webhooks/razorpay` (raw body, signature verification)

### Admin

- `GET /api/admin/stats` (admin)
- `GET /api/admin/grounds` (admin)
- `POST /api/admin/grounds` (admin)
- `PUT /api/admin/grounds/:id` (admin)
- `GET /api/admin/bookings` (admin)
- `GET /api/admin/payments` (admin)

## Notes

- The app uses an **in‑memory store**; data resets on server restart.
- Razorpay secret keys must stay in backend `.env`.
