# Natours

A tour booking web app built with Node.js, Express, MongoDB and Pug.

## Features

- Browse tours and view details with a Mapbox map
- Sign up, log in, update account and password (JWT in an HTTP-only cookie)
- Book tours with Razorpay Checkout and server-side signature verification
- Security: Helmet, rate limiting, input sanitization, role-based access

## Tech Stack

Node.js, Express, MongoDB Atlas (Mongoose), Pug, Razorpay, Mapbox GL JS, esbuild

## Setup

```bash
git clone https://github.com/rohitmohite07/natours.git
cd natours
npm install
```

Create `config.env` in the project root (never commit it):

```env
NODE_ENV=development
PORT=3000
DATABASE=<your-mongodb-connection-string>
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=<your-secret>
```

Run in two terminals:

```bash
npm run watch:js   # bundle client JS with esbuild
npm run dev        # start the server with nodemon
```

Open <http://localhost:3000>.

## Payment Flow

1. `GET /api/v1/bookings/checkout-session/:tourId` creates a Razorpay order.
2. The browser opens Razorpay Checkout.
3. After payment, the browser sends the payment details to `POST /api/v1/bookings/verify-payment`.
4. The server verifies the HMAC-SHA256 signature, then creates the booking.

Use Razorpay test mode with test cards (for example `4100 2800 0000 1007`).

If the bank popup opens blank, set Helmet's `crossOriginOpenerPolicy` to `same-origin-allow-popups`.
