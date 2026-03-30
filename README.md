# SOY BITES

SOY BITES is a full-stack, location-aware, multi-vendor food ordering platform built for customers, restaurant operators, delivery personnel, and administrators.

## Project Structure

- `backend/` Spring Boot API with JPA, Spring Security, JWT authentication, WebSocket support, Cloudinary uploads, Brevo email delivery, and Paystack-ready payment/withdrawal flows
- `frontend/` Next.js App Router application with Tailwind CSS, Axios API integration, role-based dashboards, maps, checkout, reviews, and real-time admin views
- `docs/` architecture and presentation documentation

## Core Features

- Multi-role authentication for customers, restaurants, delivery personnel, and administrators
- Multi-restaurant checkout and grouped delivery routing
- Restaurant and branch management with branch-wide menu sync
- Address-first location selection with map support
- Delivery dashboards with live route support
- Decimal ratings and review system
- Profile image uploads with Cloudinary
- Password reset via Brevo email
- Paystack integration paths for payments and withdrawals
- Admin analytics, moderation, and commission oversight

## Tech Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Axios
- Leaflet / React Leaflet

### Backend

- Java 17
- Spring Boot 3.3.5
- Spring Security
- Spring Data JPA / Hibernate
- PostgreSQL
- JWT
- WebSocket support

### External Services

- Paystack
- Cloudinary
- Brevo

## Running the Project

### Backend

1. Install Java 17 and Maven.
2. Configure your database and environment variables.
3. Run:

```bash
cd backend
mvn spring-boot:run
```

### Frontend

1. Install Node.js.
2. Configure `frontend/.env.local` if needed.
3. Run:

```bash
cd frontend
npm install
npm run dev
```

## Demo Accounts

- Admin: `admin@foodhub.dev` / `Password123!`
- Restaurant owner: `vendor@foodhub.dev` / `Password123!`
- Customer: `user@foodhub.dev` / `Password123!`

## Additional Documentation

- [Architecture Overview](C:\Users\ayamp\OneDrive\Documentos\New%20project\docs\architecture.md)
- [Presentation Guide](C:\Users\ayamp\OneDrive\Documentos\New%20project\docs\SOY_BITES_PRESENTATION_GUIDE.md)
