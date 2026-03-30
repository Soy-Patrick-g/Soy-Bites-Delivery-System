# SOY BITES Presentation Guide

## Project Title

SOY BITES: A Location-Aware Multi-Vendor Food Delivery Platform

## Short Project Description

SOY BITES is a full-stack web platform that allows customers to discover restaurants, place orders, track deliveries, review their experience, and interact with a modern digital food delivery ecosystem. It also supports restaurant owners, delivery personnel, and administrators through dedicated dashboards and operational workflows.

## Problem Statement

Many food ordering systems focus only on customer checkout and ignore the operational needs of restaurants, delivery riders, and platform administrators. This project was designed to provide a complete food delivery system with:

- customer ordering
- restaurant branch management
- rider dispatch and delivery tracking
- admin oversight
- payment and withdrawal support

## Objectives

### Main Objective

To build a robust multi-role food delivery platform that supports end-to-end order fulfillment.

### Specific Objectives

- Build secure account creation and authentication
- Support restaurant and branch management
- Enable location-aware restaurant discovery
- Allow grouped ordering across multiple restaurants
- Support delivery assignment and order completion
- Provide review and rating functionality
- Support image uploads and password recovery
- Create an admin panel for platform control and analytics

## Development Method Used

The project followed an iterative and incremental development method.

Why this method was suitable:

- features were added in manageable stages
- bugs could be identified and corrected quickly
- frontend and backend could evolve together
- integrations such as Paystack, Cloudinary, and Brevo could be added progressively

Typical iteration flow:

1. define a user or admin need
2. design the data flow and UI
3. implement backend logic
4. connect frontend interaction
5. test and refine

## Frameworks, Languages, and Tools Used

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
- Spring Data JPA
- Hibernate
- Bean Validation
- WebSocket support

### Database

- PostgreSQL

### External Integrations

- Paystack for payments and withdrawal flow integration
- Cloudinary for image storage and optimization
- Brevo for password reset email delivery

### Development Tools

- IntelliJ IDEA
- VS Code / Codex-assisted workflow
- Postman / script-based API checks
- Git-based version control workflow

## Styling and UI Approach

- Tailwind CSS was used for fast, consistent, utility-first styling.
- The application supports both light mode and dark luxury mode.
- SVG icons were used for scalability and consistent rendering.
- The UI was organized using reusable components to improve readability and maintainability.
- Responsive layout techniques were used so pages adapt to different screen sizes.

## System Roles

### Customer

- create account
- discover restaurants
- add items to cart
- place grouped orders
- track orders
- leave reviews

### Restaurant Owner

- register restaurant
- manage branches
- manage menu items
- update order progress
- withdraw earnings

### Delivery Personnel

- register rider account
- claim routes
- update live location
- complete deliveries
- view earnings and request withdrawals

### Admin

- manage users and restaurants
- verify restaurants
- oversee transactions and withdrawals
- configure delivery settings and commissions
- monitor realtime activity

## Core Features Implemented

- JWT-based authentication and role-based authorization
- strong password validation
- forgot password with reset code email delivery
- restaurant and branch management
- branch-wide menu sync
- location-aware restaurant discovery
- grouped checkout for multiple restaurants
- live rider location and routing support
- decimal review ratings
- Cloudinary image uploads
- Paystack integration path for payment and withdrawal features
- admin realtime dashboard updates

## High-Level Architecture

### Frontend Layer

The frontend handles presentation, page routing, stateful interaction, and API communication.

### Backend Layer

The backend handles authentication, business rules, validation, data persistence, integrations, and realtime updates.

### Database Layer

PostgreSQL stores users, restaurants, orders, reviews, commissions, withdrawals, sessions, and related business data.

## Security Measures

- hashed passwords
- JWT authentication
- role-based access control
- input validation on requests
- protected admin and operational endpoints
- reset token expiry for password recovery

## Notable Technical Decisions

### Why Next.js?

- strong routing model
- scalable component structure
- good developer productivity
- modern React support

### Why Spring Boot?

- mature backend ecosystem
- excellent support for REST APIs and security
- straightforward database integration with JPA
- good fit for role-based business logic

### Why Tailwind CSS?

- rapid UI development
- consistent spacing and styling tokens
- easy responsiveness
- maintainable component-level styling

### Why PostgreSQL?

- reliable relational database support
- strong fit for transactional systems
- good support for structured business entities

## Testing and Validation Talking Points

You can explain that validation was done through:

- frontend type-checking
- backend request validation
- manual API verification
- flow testing for login, ordering, delivery, and admin actions
- direct verification of branch sync, grouped ordering, and password reset

## Current Limitations

- some integrations still depend on local environment variables and provider setup
- production deployment hardening can be extended further
- automated test coverage can be expanded more formally

## Future Improvements

- push notifications
- more advanced analytics
- coupon and loyalty system
- stronger automated integration tests
- mobile app version
- advanced restaurant inventory management

## Likely Lecturer Questions and Suggested Answers

### 1. Why did you choose a monorepo structure?

It keeps frontend, backend, and documentation in one coordinated workspace, which makes integration work faster and reduces context switching.

### 2. Why did you use JWT instead of server-side sessions only?

JWT makes role-based API authentication straightforward for a frontend-backend split application. It also works well for protected dashboard requests and API integrations.

### 3. Why is PostgreSQL suitable for this system?

The platform has structured relationships such as users, restaurants, orders, reviews, withdrawals, and commissions. PostgreSQL is reliable for transactional relational data.

### 4. Why did you use Tailwind CSS instead of traditional CSS files only?

Tailwind improved consistency, speed, and maintainability. It also made responsive layout work easier across many dashboards and pages.

### 5. How does the platform support multiple restaurant branches?

Each branch is stored as its own restaurant record while brand-level logic allows menu synchronization and grouped operational management across branches.

### 6. How is security handled in the system?

Passwords are hashed, JWT is used for authentication, protected routes are role-checked, reset codes expire, and both frontend and backend validations are applied.

### 7. How are external services integrated?

Cloudinary handles image uploads, Brevo handles password reset emails, and Paystack supports payment and payout-related workflows.

### 8. What makes this project more than a basic food ordering site?

It supports multiple user roles, branch operations, grouped checkout, live delivery features, withdrawals, reviews, admin analytics, and realtime updates.

### 9. What development method did you follow?

I used an iterative and incremental approach, implementing features in stages and improving them through repeated testing and correction.

### 10. If you had more time, what would you improve first?

I would expand automated testing, strengthen production deployment automation, and improve operational monitoring and notifications.

## Presentation Tips

- Start with the problem the system solves.
- Explain the four user roles clearly.
- Show the stack and architecture briefly before demoing features.
- Demonstrate one flow end-to-end:
  customer order -> restaurant processing -> rider delivery -> admin visibility
- End with security, scalability, and future improvements.

## Suggested Demo Flow

1. customer registers or signs in
2. customer discovers restaurants and places an order
3. restaurant owner sees and advances the order
4. delivery rider claims and completes the route
5. admin sees the operational result

## Conclusion

SOY BITES is designed as a practical, scalable food delivery system that combines customer experience, restaurant operations, delivery logistics, and administrative control in one platform.
