# MAISON FORMA — Luxury Fashion Storefront & Operations Platform

An editorial luxury fashion e-commerce platform combining tactile garment photography, warm ivory and deep charcoal contrast, medium-intensity Three.js 3D sculptural canvases, server-verified cart and checkout logic, Firebase Authentication + Firestore sync, and an atelier operations dashboard.

## Stack Overview

- **Frontend**: React 19, Vite 8, TypeScript, Tailwind CSS v4 (`Cormorant Garamond` display + `Manrope` body)
- **3D Editorial Scenes**: Three.js (`HeroSculptureCanvas`, `EditorialSculptureCanvas`) with studio `RoomEnvironment` PBR lighting and software-WebGL detection
- **Backend Server**: Express (`server.ts` via `tsx`) serving REST APIs, Vite middleware in development, static `dist/` in production, `/robots.txt`, and `/sitemap.xml`
- **Auth & Client Sync**: Firebase Authentication (Google Sign-In) + Cloud Firestore (`users/{uid}`, `users/{uid}/cart`, `users/{uid}/wishlist`, `orders`)
- **Server Store & Integrity**: Persistent JSON repository (`.data/store.json`) with server-side pricing validation, atomic stock decrements, idempotent order creation, and fulfillment state-machine transitions

## Environment Variables

Configure variables in your environment (see `.env.example`):

- `GEMINI_API_KEY`: Injected by AI Studio runtime if AI services are used
- `APP_URL`: Public application URL
- `ADMIN_STRICT_AUTH` *(optional)*: Set to `"true"` in strict production deployments to disable the development-only `x-demo-admin` preview header on `/admin`

## Local Development

```bash
npm install
npm run dev
```

The Express + Vite server listens on `http://localhost:3000`.

## Build & Verification

```bash
# Run pure commerce & pricing unit tests
npx --yes tsx --test src/lib/commerce.test.ts

# Type-check TypeScript
npm run lint

# Build client bundle for production
npm run build

# Start production server
NODE_ENV=production npm start
```

## Key Features & Test Credentials

- **Storefront & Discovery**: `/`, `/shop` (URL-synced category, gender, size, color, price, and sort filters), `/collections/:slug`, `/products/:slug` (gallery lightbox, color/size matrix, size guide, JSON-LD)
- **Server-Verified Bag & Coupons**: `/cart` and slide-over bag drawer validate pricing server-side via `/api/cart/validate`
  - Sample privilege codes: `ATELIER10` (10% off), `WELCOME150` ($150 off orders $1,000+)
- **Checkout & Order Tracking**: `/checkout` enforces idempotency keys and server stock checks across Cash on Delivery, Card Sandbox Adapter, and Private Invoice; orders are trackable at `/account` and `/account/orders/:id` (seed demo orders: `MF-2026-1041`, `MF-2026-1042`)
- **Atelier Operations (`/admin`)**: Overview KPIs, garment CRUD, inline variant stock adjustments, fulfillment state transitions (`pending -> confirmed -> processing -> shipped -> delivered`), coupon creation/toggles, newsletter subscribers, and storefront settings

## Known Limitations

- **Catalog & Order Storage**: Server catalog, inventory, coupons, subscribers, and orders persist locally in `.data/store.json` alongside Firebase Auth/Firestore client user sync. Deploying across ephemeral multi-instance hosts requires mounting a persistent volume or replacing `src/server/store.ts` with a shared hosted database.
- **Payment Gateway**: Checkout currently routes through the extensible `src/server/paymentAdapter.ts` development adapters (`cod`, `card_sandbox`, `invoice`). Real card clearing requires wiring a live Stripe/Adyen SDK secret key on the server.
- **Admin Preview Mode**: When `ADMIN_STRICT_AUTH` is not set to `"true"`, `/admin` offers a preview mode header (`x-demo-admin`) alongside full Firebase Admin ID token verification for `BRAND_CONFIG.adminEmails`.
