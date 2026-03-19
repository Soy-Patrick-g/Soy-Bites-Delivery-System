# Architecture Overview

## Backend

- Spring Boot REST API
- JWT-based multi-role security for `USER`, `RESTAURANT`, and `ADMIN`
- JPA entities for restaurants, menu items, orders, reviews, and payment transactions
- Location services use Haversine distance for proximity search and delivery fee computation
- Paystack integration path supports demo fallback when secrets are unavailable

## Frontend

- Next.js App Router with server components where practical
- TailwindCSS design system with a warm food-delivery visual language
- Axios-powered API layer with mock-friendly fallbacks
- Dedicated flows for discovery, restaurant detail, checkout, order tracking, and admin analytics

## Extension Ideas

- WebSocket events for live order progress
- Restaurant self-service portal
- Promo code engine
- Scheduled orders
- Heatmap analytics using order density by location

