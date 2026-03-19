# Location-Aware Multi-Vendor Food Ordering Platform

Full-stack monorepo for a location-aware multi-vendor food ordering experience with secure JWT authentication, distance-based discovery, delivery fee calculation, payment simulation, order tracking, ratings, and an admin dashboard.

## Structure

- `backend/` Spring Boot API with JPA, Security, JWT scaffolding, demo Paystack integration, and seeded sample data
- `frontend/` Next.js App Router UI with TailwindCSS, Axios client helpers, restaurant discovery, checkout, tracking, and admin pages
- `docs/` architecture notes

## Planned Product Capabilities

- Multi-vendor restaurant onboarding and menu management
- Location-aware restaurant filtering using latitude and longitude
- Dynamic delivery fee calculation based on distance
- Secure simulated online payment flow with Paystack-ready integration points
- Order lifecycle tracking from `RECEIVED` to `DELIVERED`
- Ratings and reviews with average score aggregation
- Admin analytics for restaurants, orders, reviews, and revenue

## Running The Stack

This workspace currently does not have a working `npm` or Maven/Gradle executable available, so the codebase is scaffolded and documented but not executed here.

### Backend

1. Install Maven 3.9+ or Gradle and Java 17.
2. Create a PostgreSQL database named `foodhub`.
3. Copy `backend/.env.example` values into your environment.
4. Run:

```bash
cd backend
mvn spring-boot:run
```

### Frontend

1. Install a working `npm`, `pnpm`, or `yarn`.
2. Copy `frontend/.env.example` into `.env.local`.
3. Run:

```bash
cd frontend
npm install
npm run dev
```

## Default Demo Accounts

- Admin: `admin@foodhub.dev` / `Password123!`
- Restaurant owner: `vendor@foodhub.dev` / `Password123!`
- Customer: `user@foodhub.dev` / `Password123!`

## Notes

- Paystack is wired in demo-first mode. If `PAYSTACK_SECRET_KEY` is absent, the backend returns a safe simulated transaction reference.
- Seed data includes restaurants, menu items, reviews, and example coordinates to make the map/discovery UI immediately meaningful.
- Automated backend checks are available in `backend/tools/check-api.ps1` and `backend/tools/FoodHub Local.postman_collection.json`.
