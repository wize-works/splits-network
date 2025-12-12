# Splits Network Services

This directory contains all backend microservices for the Splits Network platform.

## Services Overview

### 1. **api-gateway** (Port 3000)
Public API entrypoint that routes to all backend services. Handles authentication via Clerk JWT verification and rate limiting.

**Key Responsibilities:**
- JWT verification and user authentication
- Request routing to domain services
- Rate limiting (Redis-based)
- CORS handling

### 2. **identity-service** (Port 3001)
Manages users, organizations, and memberships. Synchronizes user data from Clerk.

**Key Responsibilities:**
- User profile management
- Organization management
- Membership and role management
- Clerk user synchronization

### 3. **ats-service** (Port 3002)
Core ATS functionality for jobs, candidates, applications, and placements.

**Key Responsibilities:**
- Company and job management
- Candidate tracking
- Application pipeline management
- Placement recording
- Domain event publishing (RabbitMQ)

### 4. **network-service** (Port 3003)
Manages recruiters and their assignments to jobs.

**Key Responsibilities:**
- Recruiter profiles and status
- Role assignments (which recruiters can work which jobs)
- Access control checks

### 5. **billing-service** (Port 3004)
Handles subscription plans and Stripe integration.

**Key Responsibilities:**
- Plan management
- Subscription lifecycle
- Stripe webhook handling
- Subscription status checks

### 6. **notification-service** (Port 3005)
Event-driven email notifications using Resend.

**Key Responsibilities:**
- RabbitMQ event consumption
- Email delivery via Resend
- Notification logging

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm 9+
- PostgreSQL (via Supabase)
- Redis (for rate limiting and caching)
- RabbitMQ (for event messaging)
- Clerk account (for authentication)
- Stripe account (for billing)
- Resend account (for emails)

### Installation

From the repository root:

```bash
# Install all dependencies
pnpm install

# Build shared packages first
pnpm --filter "./packages/**" build
```

### Configuration

Each service has an `.env.example` file. Copy it to `.env` and fill in your credentials:

```bash
# For each service
cd services/<service-name>
cp .env.example .env
# Edit .env with your values
```

### Running Services

#### Development Mode

Run all services in parallel:

```bash
# From repository root
pnpm --filter "./services/**" dev
```

Or run individual services:

```bash
# Identity service
pnpm --filter @splits-network/identity-service dev

# ATS service
pnpm --filter @splits-network/ats-service dev

# API Gateway
pnpm --filter @splits-network/api-gateway dev
```

#### Production Build

```bash
# Build all services
pnpm --filter "./services/**" build

# Start a service
cd services/<service-name>
pnpm start
```

## Service Dependencies

```
api-gateway
  ├── identity-service
  ├── ats-service
  ├── network-service
  └── billing-service

ats-service
  └── RabbitMQ (publishes events)

notification-service
  └── RabbitMQ (consumes events)
```

## Database Schemas

Each service owns its own schema in the Supabase Postgres database:

- **identity**: `identity.*`
- **ats-service**: `ats.*`
- **network-service**: `network.*`
- **billing-service**: `billing.*`
- **notification-service**: `notifications.*`

## API Endpoints

### Authentication

All `/api/*` endpoints require a valid Clerk JWT in the `Authorization` header:

```
Authorization: Bearer <clerk-jwt-token>
```

### Gateway Routes

The API Gateway exposes unified endpoints:

- `GET /api/me` - Get current user profile
- `GET /api/jobs` - List jobs
- `POST /api/jobs` - Create job
- `POST /api/applications` - Submit candidate
- `GET /api/recruiters` - List recruiters
- `POST /api/assignments` - Assign recruiter to job
- `GET /api/plans` - List subscription plans
- And more...

See each service's `routes.ts` for detailed endpoint documentation.

## Event Flow

1. **ats-service** publishes events to RabbitMQ:
   - `application.created`
   - `application.stage_changed`
   - `placement.created`

2. **notification-service** consumes these events and sends emails via Resend

## Monitoring & Health Checks

Each service exposes a health endpoint:

```bash
GET http://localhost:3000/health  # API Gateway
GET http://localhost:3001/health  # Identity Service
GET http://localhost:3002/health  # ATS Service
# etc.
```

## Development Tips

1. **Logs**: All services use structured logging via Pino. In development mode, logs are pretty-printed.

2. **Hot Reload**: Services use `tsx watch` for automatic reloading during development.

3. **Type Safety**: All services share types from `@splits-network/shared-types`.

4. **Database Migrations**: Run migrations via Supabase MCP tools or SQL migration files.

5. **Testing Services**: Use tools like curl, Postman, or the Next.js portal app to test endpoints.

## Troubleshooting

### Services won't start

- Check that all dependencies are installed: `pnpm install`
- Verify environment variables are set correctly
- Ensure PostgreSQL, Redis, and RabbitMQ are running
- Check port conflicts (3000-3005)

### Can't connect to database

- Verify Supabase credentials in `.env`
- Check that database schemas exist
- Ensure network connectivity to Supabase

### RabbitMQ connection errors

- Verify RabbitMQ is running: `docker ps` or check local service
- Check `RABBITMQ_URL` in `.env` files
- Ensure exchange and queues are created (done automatically on first connection)

### Clerk authentication fails

- Verify Clerk keys in api-gateway `.env`
- Check that JWT is valid and not expired
- Ensure Clerk project settings allow the domain

## Next Steps

- Set up the Next.js portal app in `apps/portal`
- Configure Kubernetes manifests for deployment
- Set up CI/CD pipelines
- Add monitoring and alerting
