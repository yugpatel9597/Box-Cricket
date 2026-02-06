# Box Cricket Management Website (Node.js + Tailwind)

A modern, mobile-first box cricket booking system with Razorpay-ready payment flow.

## Features

- Public pages: Home, Grounds, Ground Details, Booking Summary, Payment Success/Failed, Contact
- Mandatory Razorpay policy pages: Privacy Policy, Terms & Conditions, Refund & Cancellation Policy
- Auth pages: Register, Login, My Bookings (cancel supported)
- Admin dashboard: Manage grounds, view bookings, view payment status
- Razorpay integration:
  - Server creates Razorpay orders
  - Server verifies payment signature
  - Webhook endpoint placeholder (signature verification ready)
  - **No Razorpay secret key in frontend**

## Folder structure

- `frontend/` — Static Tailwind pages + JS
- `backend/` — Express API + Razorpay integration + in‑memory store

## Quick start (local)

### 1) Backend

1. Copy env file:

   - Create `backend/.env` from `backend/.env.example`

2. Install dependencies:

   - Run `npm install` inside `box-cricket/backend`

3. Start server:

   - Dev: `npm run dev`
   - Prod: `npm start`

Backend runs on: `http://localhost:5000`

### 2) Frontend

Frontend is served by the backend automatically:

- Home: `http://localhost:5000/index.html`

## Razorpay configuration

Set these env vars in `backend/.env` (never commit them):

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET` (for webhook verification)

Notes:

- The frontend uses Razorpay Checkout JS (`https://checkout.razorpay.com/v1/checkout.js`).
- The backend exposes:
  - `POST /api/payments/create-order`
  - `POST /api/payments/verify`
  - `POST /api/webhooks/razorpay` (raw body signature verification)

## Data storage

The app uses an **in‑memory store** for users, grounds, bookings, and payments. Data resets when the server restarts. This is intentional for simplicity and demo purposes.

## Admin access

To create an admin account:

- Set `ADMIN_EMAIL` in `backend/.env`
- Register with that email on `/register.html`

Then open:

- `/admin.html`

---

Replace placeholder contact details + business address before Razorpay production approval.
