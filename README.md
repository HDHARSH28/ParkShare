# 🚗 ParkShare — Smart Community Parking Marketplace

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x%20%7C%202dsphere-47A248.svg)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/tests-41%2F41%20passing-success.svg)](backend/test_production_readiness.js)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> A production-grade MERN-stack platform that transforms unused private driveways, residential garages, and commercial parking spaces into an on-demand, bookable parking marketplace.

ParkShare connects parking spot owners (**Hosts**) with drivers in need of safe, affordable parking (**Drivers**), complete with an interactive GPS-based map search, AI dynamic pricing recommendations, double-booking prevention, secure QR check-in passes, host KYC verification, rating & reliability tracking, dispute resolution, and an administrative control suite.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Database Models & Schemas](#-database-models--schemas)
- [Security Auditing & Hardening](#-security-auditing--hardening)
- [API Reference](#-api-reference)
- [Local Development Setup](#-local-development-setup)
- [Environment Variables](#-environment-variables)
- [Database Seeding](#-database-seeding)
- [Automated Integration Testing](#-automated-integration-testing)
- [Production Deployment Guide](#-production-deployment-guide)
  - [Frontend to Vercel / Netlify](#frontend-deployment-vercel--netlify)
  - [Backend to Render / Railway](#backend-deployment-render--railway)
  - [Database to MongoDB Atlas](#database-setup-mongodb-atlas)
- [Test Accounts](#-test-accounts)
- [Known Limitations](#-known-limitations)
- [License](#-license)

---

## 🌟 Key Features

### 1. Driver Experience
- **Interactive Map Search**: Leaflet-based interactive map with custom pins, radius search, real-time GPS location detection (`Detect My Location`), and distance badges (`📍 X.X km away`).
- **One-Click Card Navigation**: Click on parking titles, image previews, or "View Parking" to seamlessly open detailed spot specifications, pricing breakdown, and host profile.
- **Smart Recommendations**: Spots dynamically ranked using proximity, price score, verified security attributes, and host reliability scores.
- **Vehicle Profiles**: Register multiple vehicles (Bike, Scooter, Hatchback, Sedan, SUV, EV) with duplicate plate validation.
- **Real-Time Booking & Overlap Protection**: Slot availability calendar with real-time collision detection. Instant price quote breakdown (Base fee, 10% platform fee, 18% GST).
- **QR Entry Pass**: Instant digital pass generated upon payment confirmation for seamless contactless entry.
- **Ratings & Reviews**: Drivers with completed bookings can leave detailed 5-star ratings (safety, cleanliness, location) and written feedback.
- **Dispute Filing**: Submit dispute tickets with photo proofs for resolution by platform administrators.
- **Favorites & Notifications**: Save spots for rapid re-booking and receive notifications for booking lifecycle events.

### 2. Host Experience
- **Listing Management**: List open/covered parking spaces with granular amenities (CCTV, security guards, EV charging, access gates).
- **KYC Verification**: Identity document submission (Aadhaar, government ID, electricity bill, rental agreements) to earn the verified host badge (`✓ Verified Host`).
- **"I'm Leaving Home" Mode**: Host can toggle impromptu availability whenever they leave their personal residential parking space vacant.
- **AI Price Recommendation**: Rule-based pricing algorithm that analyzes local neighborhood median prices, spot attributes, day of week, and high-demand windows.
- **QR Scanner for Access Control**: Scan driver QR passes for real-time check-in (validates start window) and check-out (marks booking completed and triggers payout calculation).
- **Earnings & Analytics**: View total bookings, gross volume, net host earnings, and driver feedback.

### 3. Administrator Console
- **Platform Analytics**: Total users, verified hosts, active spaces, cumulative bookings, gross platform revenue, and dispute breakdown.
- **Host Verification Audit**: Review submitted documents, approve/reject KYC requests, and add review comments.
- **Parking Moderation**: Approve listings, review flagged spaces, and remove policy violations.
- **Dispute Resolution**: Review driver-host disputes, assign resolution statuses (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`), and submit official resolution notes.
- **User Management**: Search and filter users by role, view detailed transaction history, and suspend/unblock accounts with reason logs.

---

## 🏗 Architecture & Tech Stack

```
┌──────────────────────────────────────────────────────────┐
│                   ParkShare Web Client                   │
│         React 18 • Vite • Tailwind CSS • Leaflet         │
│          Axios (withCredentials) • Lucide Icons          │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS / JSON / Cookies
                             ▼
┌──────────────────────────────────────────────────────────┐
│                  Express.js RESTful API                  │
│       Helmet • CORS • express-rate-limit • MongoSanitize │
│             JWT in HTTP-Only Cookies • RBAC              │
└──────────────┬─────────────────────────────┬─────────────┘
               │ Mongoose ODM                │
               ▼                             ▼
┌───────────────────────────────┐ ┌─────────────────────────┐
│     MongoDB Atlas Database    │ │   QR & Smart Services   │
│   2dsphere Geospatial Index   │ │ QR Pass Generation      │
│ Compound Collision Prevention │ │ Smart Pricing Algorithm │
└───────────────────────────────┘ └─────────────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite 8, Tailwind CSS | High-performance SPA with modern glassmorphic UI |
| **Routing** | React Router v7 | Client-side routing with role-based `ProtectedRoute` |
| **Maps** | Leaflet, React-Leaflet | OpenStreetMap geospatial rendering and GPS centering |
| **Backend** | Node.js 18+, Express 4 | Modular RESTful API architecture |
| **Database** | MongoDB 6+, Mongoose 8 | Document database with `2dsphere` spatial indexing |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, bcryptjs | Defensive headers, rate limiting, and NoSQL injection mitigation |
| **Auth** | JSON Web Tokens (JWT) | Dual-mode token retrieval via HTTP-only cookie and Bearer header |

---

## 📁 Project Directory Structure

```text
ParkShare/
├── backend/
│   ├── src/
│   │   ├── config/              # MongoDB & application configs
│   │   ├── controllers/         # API business logic handlers
│   │   ├── middleware/          # Auth guards, role validation, rate-limiting, error handler
│   │   ├── models/              # Mongoose schemas (User, ParkingSpace, Booking, etc.)
│   │   ├── routes/              # Express route routers
│   │   ├── services/            # Pricing algorithms, QR pass generator, map utilities
│   │   ├── validators/          # Joi/custom request payload validators
│   │   └── server.js            # Express application bootstrap
│   ├── test_production_readiness.js # 41-step automated integration test suite
│   ├── package.json
│   └── Procfile                 # Deployment process command
├── frontend/
│   ├── public/                  # Static assets and _redirects
│   ├── src/
│   │   ├── components/          # Reusable UI (Navbar, ParkingCard, ParkingMap, Modals)
│   │   ├── context/             # AuthContext and global state providers
│   │   ├── hooks/               # Custom React hooks (useAuth, useGeolocation)
│   │   ├── pages/               # Persona-based pages (auth, booking, dashboards, host)
│   │   ├── routes/              # App routing configuration
│   │   ├── services/            # Axios API client services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json              # Vercel SPA rewrite configuration
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🗄 Database Models & Schemas

1. **`User`**:
   - `name`, `email` (unique), `phone`, `password` (bcrypt 12 rounds, `select: false`), `role` (`DRIVER`, `HOST`, `ADMIN`).
   - `isVerified`, `reliabilityScore` (0-100), `isBlocked`, `blockReason`.
2. **`ParkingSpace`**:
   - `host` (ref User), `title`, `description`, `address`, `city`.
   - `latitude`, `longitude`, `location` (GeoJSON `Point` with `2dsphere` index).
   - `parkingType` (`Driveway`, `Garage`, `Covered`, `Open Lot`, `Commercial`, `Apartment`), `vehicleTypes`.
   - `covered`, `security`, `cctv`, `evCharging`, `gateAccess`.
   - `pricePerHour`, `pricePerDay`, `pricePerMonth`, `photos`, `rules`.
   - `availability`, `leavingHomeSchedule`, `status` (`draft`, `active`, `inactive`, `rejected`, `flagged`).
   - `rating`, `totalReviews`.
3. **`Booking`**:
   - `user`, `host`, `parkingSpace`, `vehicle`.
   - `startTime`, `endTime`, `duration` (billed hours).
   - `basePrice`, `platformFee`, `tax`, `totalAmount`.
   - `status` (`PENDING`, `CONFIRMED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `EXPIRED`).
   - `paymentStatus` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`).
   - `qrToken` (unique pass string), `qrCode` (base64 image), `checkInTime`, `checkOutTime`.
   - Compound index: `{ parkingSpace: 1, status: 1, startTime: 1, endTime: 1 }`.
4. **`Vehicle`**:
   - `owner` (ref User), `vehicleNumber` (uppercase), `vehicleType`, `model`, `color`.
   - Compound unique index: `{ owner: 1, vehicleNumber: 1 }`.
5. **`Review`**:
   - `user`, `host`, `parkingSpace`, `booking` (unique).
   - `rating` (1-5), `safetyRating`, `cleanlinessRating`, `locationRating`, `comment`.
6. **`Verification`**:
   - `user` (unique), `documents` (`documentType`, `documentUrl`, `documentNumber`), `status` (`PENDING`, `APPROVED`, `REJECTED`), `adminComment`, `reviewedBy`.
7. **`Dispute`**:
   - `booking`, `user`, `host`, `parkingSpace`, `reason`, `description`, `status` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `REJECTED`), `resolutionNote`.
8. **`Favorite`**:
   - `user`, `parkingSpace` (compound unique `{ user: 1, parkingSpace: 1 }`).
9. **`Notification`**:
   - `user`, `title`, `message`, `type`, `link`, `isRead`.

---

## 🔒 Security Auditing & Hardening

- **JWT Security**: Signed tokens stored in `httpOnly: true`, `secure: production`, `sameSite: none/lax` cookies; bearer header supported for programmatic access.
- **Password Protection**: Salted and hashed using `bcryptjs` (12 work factor); passwords automatically stripped in `toJSON()` methods and excluded by default (`select: false`).
- **Role-Based Access Control (RBAC)**: Strict server-side route guards enforcing user permissions across public, authenticated, host, and administrative endpoints.
- **HTTP Headers (Helmet)**: Cross-Origin Resource Policy, HSTS, X-Content-Type-Options, Frame-Options, and Content-Security-Policy configured.
- **Rate Limiting**:
  - Global API: 600 requests per 15-minute window per IP.
  - Authentication: 60 login/register requests per 15-minute window per IP.
- **NoSQL Injection Mitigation**: `express-mongo-sanitize` strips unauthorized `$` and `.` operators from query and body payloads.
- **Payload Limits**: Strict 10MB body parser ceiling.
- **Double Booking Guarantee**: Strict atomic conflict verification requiring `status: { $in: ['CONFIRMED', 'ACTIVE'] }` and `paymentStatus: 'PAID'`. Unpaid reservations never block time slots.

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user (`DRIVER`, `HOST`, `ADMIN`) |
| `POST` | `/api/auth/login` | Public | Login with email and password |
| `POST` | `/api/auth/logout` | Private | Invalidate session and clear cookie |
| `GET` | `/api/auth/me` | Private | Get authenticated user profile |

### Parking Listings (`/api/parking`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/parking` | Public | Search & filter spaces (search, vehicleType, price, amenities, pagination) |
| `GET` | `/api/parking/nearby` | Public | Geospatial search via MongoDB `2dsphere` index (`lat`, `lng`, `maxDistanceKm`) |
| `GET` | `/api/parking/:id` | Public | Get single spot details, amenities, and host profile |
| `POST` | `/api/parking` | Host | Create new parking space (requires verified host status) |
| `PUT` | `/api/parking/:id` | Host (Owner) | Update parking space attributes |
| `DELETE` | `/api/parking/:id` | Host (Owner) | Soft/hard delete listing |
| `GET` | `/api/parking/my-listings` | Host | Retrieve host's own spaces |
| `POST` | `/api/parking/:id/leaving-home` | Host (Owner) | Activate "I'm Leaving Home" schedule |

### Bookings & Check-In (`/api/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/bookings/availability/:parkingId` | Public | Get booked intervals (`paymentStatus === 'PAID'`) for a given date |
| `POST` | `/api/bookings/quote` | Public | Calculate instant price breakdown |
| `POST` | `/api/bookings` | Private | Reserve slot (creates `PENDING` booking) |
| `GET` | `/api/bookings/my` | Private | Get driver's bookings (paginated) |
| `GET` | `/api/bookings/host` | Host | Get host's incoming reservations (paginated) |
| `GET` | `/api/bookings/:id` | Private | Get detailed booking receipt and QR token |
| `PUT` | `/api/bookings/:id/cancel` | Private | Cancel reservation |
| `POST` | `/api/bookings/check-in` | Host/Admin | Scan QR pass to check in driver (`ACTIVE`) |
| `POST` | `/api/bookings/check-out` | Host/Admin | Scan QR pass to complete reservation (`COMPLETED`) |

### Payments (`/api/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/payments/process` | Private | Finalize payment, confirm booking, and generate QR pass |
| `POST` | `/api/payments/fail` | Private | Mark payment failed and release any slot hold |

### Vehicles, Reviews, KYC & Disputes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` / `POST` | `/api/vehicles` | Private | Manage driver vehicles with duplicate plate prevention |
| `POST` | `/api/verifications` | Host | Submit KYC identity verification documents |
| `PUT` | `/api/verifications/:id/review`| Admin | Approve or reject host KYC |
| `POST` | `/api/reviews` | Private | Submit 5-star review for completed booking |
| `GET` | `/api/reviews/parking/:id` | Public | Paginated reviews for parking spot |
| `POST` / `GET` | `/api/disputes` | Private | File dispute / view user disputes |
| `PUT` | `/api/disputes/:id/resolve` | Admin | Resolve dispute ticket |
| `GET` / `POST` | `/api/favorites` | Private | Save and query favorite parking spots |
| `GET` | `/api/notifications` | Private | Paginated driver/host notifications |

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **MongoDB** running locally on port 27017 (or a MongoDB Atlas URI)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/parkshare.git
cd parkshare

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Files
In `backend/`:
```bash
cp .env.example .env
```
In `frontend/`:
```bash
cp .env.example .env
```

### 3. Seed Database
```bash
cd backend
npm run seed
```

### 4. Start Development Servers
**Backend:**
```bash
cd backend
npm run dev
# Running on http://localhost:5002
```

**Frontend:**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5002
NODE_ENV=development

# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/parkshare

# JWT authentication secret
JWT_SECRET=parkshare_dev_secret_key_change_in_production

# CORS allowed origins (comma-separated for multiple domains)
CLIENT_URL=http://localhost:5173,https://your-frontend.vercel.app
```

### Frontend (`frontend/.env`)
```env
# Backend API base URL
VITE_API_URL=http://localhost:5002/api
```

---

## 🧪 Automated Integration Testing

ParkShare includes an end-to-end integration test suite validating:
- API health and Helmet defensive headers
- Authentication, JWT, and password hashing security
- Role-based authorization barriers (DRIVER, HOST, ADMIN)
- Vehicle validation and duplicate plate prevention
- Host KYC submission and Admin approval
- Parking space creation and GeoJSON `2dsphere` spatial indexing
- Proximity search (`/parking/nearby`) and filter queries
- Dynamic pricing calculation and double-booking collision prevention
- Contactless QR pass check-in and check-out
- Review validation and host reliability score recalculation
- Dispute management and resolution
- Administrative metrics and paginated queries

**To run the test suite:**
```bash
cd backend
npm run test:prod
```

Expected output:
```text
======================================================================
TEST EXECUTION SUMMARY: 41 PASSED, 0 FAILED (TOTAL: 41)
======================================================================
```

---

## 🚀 Production Deployment Guide

### Database Setup (MongoDB Atlas)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and deploy a free M0 cluster.
2. In **Security** → **Database Access**, create a user (e.g. `parkshare_user`) and password.
3. In **Security** → **Network Access**, click **Add IP Address** → **Allow Access From Anywhere** (`0.0.0.0/0`).
4. In **Database** → click **Connect** → **Drivers** (Node.js) and copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/parkshare?retryWrites=true&w=majority
   ```

### Backend Deployment (Render / Railway)
1. Push repository to GitHub.
2. Create a new **Web Service** on Render or Railway pointing to the `/backend` directory.
3. Set build and start commands:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default on Render)
   - `MONGO_URI`: *Your MongoDB Atlas connection URI*
   - `JWT_SECRET`: *A secure random string (e.g. `openssl rand -base64 32`)*
   - `CLIENT_URL`: *Your deployed frontend URL (e.g. `https://parkshare.vercel.app`)*
5. Note your deployed API URL: `https://parkshare-api.onrender.com`.

### Frontend Deployment (Vercel / Netlify)
1. Create a new project on **Vercel** or **Netlify** pointing to the `/frontend` directory.
2. Set build and output settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Configure Environment Variables:
   - `VITE_API_URL`: `https://parkshare-api.onrender.com/api`
4. The included `frontend/vercel.json` and `frontend/public/_redirects` automatically handle client-side routing and prevent 404s on page refresh.

---

## 👥 Test Accounts

For manual testing across all 3 personas, use these credentials or run `npm run seed`:

| Role | Email | Password | Dashboard URL |
|---|---|---|---|
| **Driver** | `driver@test.com` | `password123` | [http://localhost:5173/driver/dashboard](http://localhost:5173/driver/dashboard) |
| **Host (Verified)** | `host@test.com` | `password123` | [http://localhost:5173/host/dashboard](http://localhost:5173/host/dashboard) |
| **Admin** | `admin@test.com` | `adminpassword` | [http://localhost:5173/admin/dashboard](http://localhost:5173/admin/dashboard) |

---

## 📌 Known Limitations

1. **Camera Stream Permissions**: The host QR scanner (`/host/scanner`) uses web camera APIs via browser MediaDevices. In local development or deployment, camera access requires an HTTPS connection or `localhost`.
2. **Mock Payment Gateways**: In production, integrate external webhooks (e.g. Stripe or Razorpay) by substituting the direct payment controller with cryptographic webhook signature verification.
3. **Map Tiles**: The default Leaflet map utilizes standard OpenStreetMap tiles. In high-traffic production environments, consider configuring a Mapbox or Stadia Maps API key.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
