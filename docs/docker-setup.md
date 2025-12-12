# Docker Compose Local Development Setup

This guide explains how to set up the Splits Network development environment using Docker Compose.

## Prerequisites

- Docker Desktop installed
- Supabase account with project created
- Clerk account for authentication
- Stripe account (test mode) for billing
- Resend account for email

## Setup Steps

### 1. Configure Environment Variables

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and add your actual API keys:

#### Supabase

Get from: https://supabase.com/dashboard/project/einhgkqmxbkgdohwfayv/settings/api

- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key
- `DATABASE_URL`: Connection string from Database Settings

#### Clerk

Get from: https://dashboard.clerk.com/last-active?path=api-keys

- `CLERK_PUBLISHABLE_KEY`: Publishable key (starts with `pk_test_` or `pk_live_`)
- `CLERK_SECRET_KEY`: Secret key (starts with `sk_test_` or `sk_live_`)
- `CLERK_JWKS_URL`: JWKS URL from Advanced > JWT Templates

#### Stripe

Get from: https://dashboard.stripe.com/test/apikeys

- `STRIPE_SECRET_KEY`: Secret key (starts with `sk_test_`)
- `STRIPE_PUBLISHABLE_KEY`: Publishable key (starts with `pk_test_`)
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret (create webhook endpoint first)

#### Resend

Get from: https://resend.com/api-keys

- `RESEND_API_KEY`: API key (starts with `re_`)

### 2. Build All Services

```powershell
docker compose build
```

This will build Docker images for:
- 6 backend services (identity, ats, network, billing, notification, api-gateway)
- 1 frontend app (portal)
- Infrastructure (Redis, RabbitMQ)

### 3. Start Services

**Start all services:**
```powershell
docker compose up -d
```

**Start specific services:**
```powershell
# Backend only
docker compose up -d identity-service ats-service network-service billing-service notification-service api-gateway redis rabbitmq

# Backend + Portal
docker compose up -d
```

**View logs:**
```powershell
# All services
docker compose logs -f

# Specific service
docker compose logs -f portal
docker compose logs -f api-gateway
```

### 4. Access Services

- **Portal (Frontend)**: http://localhost:3100
- **API Gateway**: http://localhost:3000
- **Identity Service**: http://localhost:3001
- **ATS Service**: http://localhost:3002
- **Network Service**: http://localhost:3003
- **Billing Service**: http://localhost:3004
- **Notification Service**: http://localhost:3005
- **RabbitMQ Management**: http://localhost:15672 (user: `splits`, password: `splits_local_dev`)

### 5. Development Workflow

Services are configured with hot reload - edit source files and changes will be reflected automatically:

```
apps/portal/src/         → Portal frontend
services/*/src/          → Backend services
packages/shared-*/src/   → Shared packages
```

### 6. Stop Services

```powershell
# Stop all
docker compose down

# Stop and remove volumes (reset data)
docker compose down -v
```

## Troubleshooting

### Build Failures

If builds fail due to missing keys, ensure your `.env` file has valid API keys. The portal build requires `CLERK_PUBLISHABLE_KEY` to be a valid Clerk publishable key.

### Port Conflicts

If ports are already in use, edit `docker-compose.yml` to change the host port:

```yaml
ports:
  - "3100:3100"  # Change left side: "3101:3100"
```

### Database Connection Issues

Ensure your `DATABASE_URL` and Supabase keys are correct. Test connection:

```powershell
docker compose exec identity-service node -e "console.log(process.env.DATABASE_URL)"
```

### Hot Reload Not Working

If file changes aren't reflected:
1. Ensure volumes are mounted correctly in `docker-compose.yml`
2. Restart the specific service: `docker compose restart portal`
3. Check service logs: `docker compose logs -f portal`

## Architecture

```
┌─────────────────┐
│  Portal (3100)  │  Next.js 16 Frontend
└────────┬────────┘
         │
┌────────▼────────────┐
│  API Gateway (3000) │  Auth + Routing
└────────┬────────────┘
         │
    ┌────┴──────────────────────────────┐
    │                                    │
┌───▼──────────┐  ┌─────────────────┐  │
│  Identity    │  │  ATS Service    │  │
│  Service     │  │  (3002)         │  │
│  (3001)      │  └─────────────────┘  │
└──────────────┘                        │
┌──────────────┐  ┌─────────────────┐  │
│  Network     │  │  Billing        │  │
│  Service     │  │  Service        │  │
│  (3003)      │  │  (3004)         │  │
└──────────────┘  └─────────────────┘  │
┌──────────────────────────────────────▼──┐
│  Notification Service (3005)             │
│  (Listens to RabbitMQ events)            │
└──────────────────────────────────────────┘

Infrastructure:
- Redis (6379): Caching + Rate Limiting
- RabbitMQ (5672, 15672): Event Bus
```
