# 🚗 ParkShare — Smart Community Parking Marketplace

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x%20%7C%202dsphere-47A248.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> A production-ready MERN-stack platform that transforms unused driveways, garages, and commercial spots into an on-demand, bookable parking marketplace.

ParkShare connects parking spot owners (**Hosts**) with drivers (**Drivers**) using interactive GPS map discovery, AI dynamic pricing, double-booking prevention, contactless QR check-in/out, KYC verification, reviews, and a full administrative dashboard.

---

## 🌟 Key Features

- **🗺️ Interactive Map & GPS Discovery**: OpenStreetMap & Leaflet with live GPS detection, proximity radius search (`/parking/nearby`), and 2dsphere indexing.
- **⚡ Instant Card Navigation**: Click spot names, images, or buttons to view details, pricing breakdowns, and host profiles.
- **🛡️ Overlap & Double-Booking Protection**: Real-time slot availability validation ensures unpaid holds never block slots, and paid slots cannot collide.
- **🎫 Contactless QR Entry Passes**: Instant QR pass generated upon payment confirmation; host camera scanner handles check-in & check-out.
- **🏠 "I'm Leaving Home" Mode**: Hosts can instantly publish impromptu availability when their residential spot is temporarily vacant.
- **💡 Smart Pricing Engine**: Dynamic pricing quotes based on baseline rates, local median demand, amenities, platform fee (10%), and GST (18%).
- **✅ Host KYC & Trust Badges**: Identity and document verification workflow with admin approval to award verified badges (`✓ Verified Host`).
- **🔒 Production-Hardened Security**: Helmet defensive headers, rate-limiting, NoSQL injection sanitization, bcrypt (12 rounds), and HTTP-only JWT cookies.
- **🛠️ Admin Command Center**: Manage users, approve KYC, moderate listings, resolve disputes, and monitor platform revenue analytics.

---

## 🏗 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 8, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet |
| **Backend** | Node.js 18+, Express 4, Mongoose 8, JWT, bcryptjs |
| **Database** | MongoDB 6+ (with `2dsphere` geospatial index) |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, CORS |

---

## 📁 Directory Structure

```text
ParkShare/
├── backend/
│   ├── src/
│   │   ├── config/              # Database & app configs
│   │   ├── controllers/         # Business logic handlers
│   │   ├── middleware/          # Auth guards, rate limiters, error handling
│   │   ├── models/              # Schemas (User, ParkingSpace, Booking, etc.)
│   │   ├── routes/              # Express API endpoints
│   │   ├── services/            # Pricing, QR generation, map utilities
│   │   └── server.js            # Server entrypoint
│   └── seed_smart_data.js       # Database seeder
├── frontend/
│   ├── src/
│   │   ├── components/          # ParkingCard, ParkingMap, Navbar, Modals
│   │   ├── pages/               # Driver, Host, Admin, Booking pages
│   │   ├── services/            # Axios API clients
│   │   └── App.jsx
│   └── vite.config.js
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** v18+ & **npm** v9+
- **MongoDB** running locally on port 27017 (or MongoDB Atlas URI)

### 2. Installation
```bash
# Backend setup
cd backend
npm install
cp .env.example .env

# Frontend setup
cd ../frontend
npm install
cp .env.example .env
```

### 3. Seed Sample Data
```bash
cd backend
npm run seed
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend (http://localhost:5002)
cd backend && npm run dev

# Terminal 2: Frontend (http://localhost:5173)
cd frontend && npm run dev
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5002
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/parkshare
JWT_SECRET=parkshare_dev_secret_key_change_in_production
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5002/api
```

---

## 📡 Key API Endpoints

| Category | Method & Path | Access | Description |
|---|---|---|---|
| **Auth** | `POST /api/auth/register` | Public | Register Driver, Host, or Admin |
| | `POST /api/auth/login` | Public | Authenticate user & issue JWT |
| | `GET /api/auth/me` | Private | Fetch active user session |
| **Parking** | `GET /api/parking` | Public | Search & filter parking spaces |
| | `GET /api/parking/nearby` | Public | Proximity query via MongoDB `2dsphere` index |
| | `POST /api/parking` | Host | List new space (requires verified host) |
| | `POST /api/parking/:id/leaving-home` | Host | Activate impromptu vacant schedule |
| **Bookings** | `POST /api/bookings/quote` | Public | Calculate instant pricing breakdown |
| | `POST /api/bookings` | Private | Reserve slot (creates PENDING booking) |
| | `POST /api/bookings/check-in` | Host | Scan driver QR pass to check in |
| | `POST /api/bookings/check-out` | Host | Scan QR pass to complete session |
| **Payments** | `POST /api/payments/process` | Private | Confirm payment & generate QR pass |
| **Admin** | `GET /api/admin/analytics` | Admin | Platform revenue and usage metrics |
| | `PUT /api/admin/disputes/:id/resolve`| Admin | Adjudicate driver-host disputes |

---

## 🚀 Deployment

- **Database (MongoDB Atlas)**: Provision free M0 cluster, whitelist `0.0.0.0/0`, and paste connection URI into `MONGO_URI`.
- **Backend (Render / Railway)**:
  - Root directory: `/backend`
  - Build command: `npm install` | Start command: `npm start`
  - Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, and `NODE_ENV=production`.
- **Frontend (Vercel / Netlify)**:
  - Root directory: `/frontend`
  - Framework: `Vite` | Build: `npm run build` | Output: `dist`
  - Set `VITE_API_URL` to your production backend URL.
  - Client routing is pre-configured via `vercel.json` and `_redirects`.

---

## 👥 Demo Credentials

Sample accounts generated by `npm run seed`:

| Role | Email | Password | Dashboard URL |
|---|---|---|---|
| **Driver** | `driver@test.com` | `password123` | [http://localhost:5173/driver/dashboard](http://localhost:5173/driver/dashboard) |
| **Host (Verified)** | `host@test.com` | `password123` | [http://localhost:5173/host/dashboard](http://localhost:5173/host/dashboard) |
| **Admin** | `admin@test.com` | `adminpassword` | [http://localhost:5173/admin/dashboard](http://localhost:5173/admin/dashboard) |

---

## 📄 License

Distributed under the [MIT License](LICENSE).
