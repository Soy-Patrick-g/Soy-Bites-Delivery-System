# SOY BITES Architecture Overview

## System Summary

SOY BITES is a multi-vendor food delivery platform with four primary roles:

- Customer
- Restaurant owner
- Delivery personnel
- Administrator

The system is split into a frontend application built with Next.js and a backend API built with Spring Boot.

## Frontend Architecture

- Framework: Next.js 15 with React 19
- Language: TypeScript
- Styling: Tailwind CSS with shared design tokens and theme support
- State and integration:
  - Axios for API communication
  - Local auth/session persistence for client navigation
  - Role-based page flows and dashboards
- Maps and location:
  - Leaflet / React Leaflet
  - Address search, map selection, and route visualization

## Backend Architecture

- Framework: Spring Boot 3.3.5
- Language: Java 17
- Security:
  - Spring Security
  - JWT-based authentication
  - Role-based authorization
- Data layer:
  - Spring Data JPA
  - Hibernate ORM
  - PostgreSQL
- Realtime:
  - WebSocket-based admin financial updates
- Validation:
  - Bean Validation for requests and DTOs

## Major Functional Modules

### Authentication and Accounts

- Registration for customer, restaurant, and delivery accounts
- Strong password validation
- Forgot password flow with email token delivery
- Profile image upload support

### Restaurant Operations

- Restaurant and branch registration
- Menu management
- Branch-wide menu propagation
- Order status progression

### Customer Ordering

- Restaurant discovery
- Full menu browsing
- Cart and grouped checkout
- Ratings and reviews
- Order tracking and reorder support

### Delivery Operations

- Route claim and completion
- Live rider location updates
- Earnings and withdrawal dashboard

### Administration

- Account management
- Restaurant verification
- Delivery commission settings
- Realtime dashboard updates through WebSockets

## External Services

- Paystack:
  - payment initialization
  - transfer and withdrawal integration paths
- Cloudinary:
  - menu and profile image storage
  - image optimization
- Brevo:
  - password reset email delivery

## Styling System

- Tailwind CSS utility-first styling
- Shared theme variables for dark and light mode
- SVG-first icon usage for scalable UI assets
- Reusable layout and UI components

## Data Flow

1. Frontend captures user action.
2. Axios sends request to Spring Boot API.
3. Spring Security authenticates and authorizes the request.
4. Service layer applies business logic.
5. JPA repositories read/write PostgreSQL.
6. Response returns to the frontend.
7. WebSocket events update admin clients when needed.

## Quality Considerations

- Input validation on both client and server
- User-friendly errors in frontend flows
- Role-specific route protection
- Responsive layouts across dashboards and public pages
- Production-oriented empty states and loading states
