# Environment Variables Documentation

This document describes all environment variables required for the Splits Network platform across all services.

## Table of Contents

1. [Global Variables](#global-variables)
2. [Portal (Next.js App)](#portal-nextjs-app)
3. [API Gateway](#api-gateway)
4. [Identity Service](#identity-service)
5. [ATS Service](#ats-service)
6. [Network Service](#network-service)
7. [Billing Service](#billing-service)
8. [Notification Service](#notification-service)
9. [Local Development Setup](#local-development-setup)

---

## Global Variables

These are used across multiple services:

### Database

```env
# Supabase Postgres connection
SUPABASE_URL=https://einhgkqmxbkgdohwfayv.supabase.co
SUPABASE_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Direct Postgres connection (services use this)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.einhgkqmxbkgdohwfayv.supabase.co:5432/postgres
```

### Redis

```env
# Redis for rate limiting and caching
REDIS_URL=redis://localhost:6379
# OR for production
REDIS_URL=redis://:password@redis-host:6379
```

### RabbitMQ

```env
# RabbitMQ for event-driven communication
RABBITMQ_URL=amqp://guest:guest@localhost:5672
# OR for production
RABBITMQ_URL=amqp://user:password@rabbitmq-host:5672
```

---

## Portal (Next.js App)

Location: `apps/portal/.env.local`

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# API Gateway URLs
# Client-side (browser) - typically localhost:3000 in dev, public URL in prod
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Server-side (Docker) - internal service name
NEXT_PUBLIC_API_GATEWAY_URL=http://api-gateway:3000

# Node environment
NODE_ENV=development
```

**Required:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key for client-side auth
- `CLERK_SECRET_KEY` - Clerk secret for server-side verification
- `NEXT_PUBLIC_API_URL` - Public API endpoint (browser uses this)

**Optional:**
- `NEXT_PUBLIC_API_GATEWAY_URL` - Internal Docker URL for SSR calls (defaults to `http://api-gateway:3000`)

---

## API Gateway

Location: `services/api-gateway/.env`

```env
# Server
PORT=3000
NODE_ENV=development

# Clerk JWT verification
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Redis for rate limiting
REDIS_URL=redis://localhost:6379

# Service URLs (internal Docker network)
IDENTITY_SERVICE_URL=http://identity-service:3001
ATS_SERVICE_URL=http://ats-service:3002
NETWORK_SERVICE_URL=http://network-service:3003
BILLING_SERVICE_URL=http://billing-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005

# Logging
LOG_LEVEL=info
```

**Required:**
- `CLERK_SECRET_KEY` - For JWT verification
- `REDIS_URL` - For rate limiting
- All `*_SERVICE_URL` variables - For proxying requests to backend services

---

## Identity Service

Location: `services/identity-service/.env`

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.einhgkqmxbkgdohwfayv.supabase.co:5432/postgres

# Clerk webhook secret (for syncing users)
CLERK_WEBHOOK_SECRET=whsec_...

# Logging
LOG_LEVEL=info
```

**Required:**
- `DATABASE_URL` - Postgres connection for identity schema
- `CLERK_WEBHOOK_SECRET` - For verifying Clerk webhooks (user creation/updates)

---

## ATS Service

Location: `services/ats-service/.env`

```env
# Server
PORT=3002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.einhgkqmxbkgdohwfayv.supabase.co:5432/postgres

# RabbitMQ for events
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Supabase Storage (for resumes/documents)
SUPABASE_URL=https://einhgkqmxbkgdohwfayv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STORAGE_BUCKET_NAME=documents

# Logging
LOG_LEVEL=info
```

**Required:**
- `DATABASE_URL` - Postgres connection for ats schema
- `RABBITMQ_URL` - For publishing events (applications created, stage changed, etc.)
- `SUPABASE_SERVICE_ROLE_KEY` - For uploading documents to storage

---

## Network Service

Location: `services/network-service/.env`

```env
# Server
PORT=3003
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.einhgkqmxbkgdohwfayv.supabase.co:5432/postgres

# Service URLs (for calling other services)
ATS_SERVICE_URL=http://ats-service:3002

# Logging
LOG_LEVEL=info
```

**Required:**
- `DATABASE_URL` - Postgres connection for network schema
- `ATS_SERVICE_URL` - For fetching job/placement data when calculating recruiter stats

---

## Billing Service

Location: `services/billing-service/.env`

```env
# Server
PORT=3004
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.einhgkqmxbkgdohwfayv.supabase.co:5432/postgres

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Logging
LOG_LEVEL=info
```

**Required:**
- `DATABASE_URL` - Postgres connection for billing schema
- `STRIPE_SECRET_KEY` - For creating subscriptions, charges, etc.
- `STRIPE_WEBHOOK_SECRET` - For verifying Stripe webhooks (subscription events)

---

## Notification Service

Location: `services/notification-service/.env`

```env
# Server
PORT=3005
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.einhgkqmxbkgdohwfayv.supabase.co:5432/postgres

# RabbitMQ for consuming events
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Resend for transactional email
RESEND_API_KEY=re_...

# Email settings
FROM_EMAIL=noreply@updates.splits.network
FROM_NAME=Splits Network

# Logging
LOG_LEVEL=info
```

**Required:**
- `DATABASE_URL` - Postgres connection for notifications schema
- `RABBITMQ_URL` - For consuming events from other services
- `RESEND_API_KEY` - For sending transactional emails
- `FROM_EMAIL` - Sender email address (must be verified in Resend)

---

## Local Development Setup

### Quick Start: Copy Example Files

```bash
# Root .env (if needed for scripts)
cp .env.example .env

# Portal
cp apps/portal/.env.example apps/portal/.env.local

# Services
cp services/api-gateway/.env.example services/api-gateway/.env
cp services/identity-service/.env.example services/identity-service/.env
cp services/ats-service/.env.example services/ats-service/.env
cp services/network-service/.env.example services/network-service/.env
cp services/billing-service/.env.example services/billing-service/.env
cp services/notification-service/.env.example services/notification-service/.env
```

### Minimal Development Configuration

For local development with Docker Compose, you need at minimum:

1. **Clerk Keys** (get from https://clerk.com dashboard)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`

2. **Supabase** (get from https://supabase.com project settings)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`

3. **Stripe** (get from https://stripe.com dashboard, use test mode)
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

4. **Resend** (get from https://resend.com)
   - `RESEND_API_KEY`

5. **Redis & RabbitMQ** (provided by Docker Compose)
   - `REDIS_URL=redis://redis:6379`
   - `RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672`

### Docker Compose Override

For local development, Docker Compose automatically uses service names for URLs:

```yaml
# Services can reference each other by name
IDENTITY_SERVICE_URL=http://identity-service:3001
ATS_SERVICE_URL=http://ats-service:3002
# etc.
```

### Production Deployment

For production (Kubernetes), update URLs to use cluster DNS:

```env
IDENTITY_SERVICE_URL=http://identity-service.splits-network.svc.cluster.local:3001
REDIS_URL=redis://redis.splits-network.svc.cluster.local:6379
# etc.
```

---

## Security Best Practices

1. **Never commit `.env` files to version control**
   - Use `.env.example` as templates
   - Add `.env` and `.env.local` to `.gitignore`

2. **Use different keys for development and production**
   - Clerk: separate test/live keys
   - Stripe: separate test/live keys
   - Supabase: separate projects

3. **Rotate secrets regularly**
   - Webhook secrets
   - API keys
   - Service role keys

4. **Use secret management in production**
   - Kubernetes Secrets
   - AWS Secrets Manager
   - HashiCorp Vault

5. **Limit service-to-service communication**
   - Services should only have URLs for services they need to call
   - Use internal network for service URLs (not public IPs)

---

## Troubleshooting

### Service can't connect to database

- Check `DATABASE_URL` is correct
- Ensure database allows connections from your IP (Supabase > Settings > Database > Connection pooling)
- Verify password doesn't contain special characters that need escaping

### Portal can't reach API Gateway

- Check `NEXT_PUBLIC_API_URL` matches where gateway is running
- For Docker: Use `http://localhost:3000/api` (gateway is exposed on host)
- For production: Use public gateway URL

### Email notifications not sending

- Verify `RESEND_API_KEY` is valid
- Check `FROM_EMAIL` is verified in Resend
- Ensure notification service is consuming RabbitMQ events
- Check notification service logs for errors

### Stripe webhooks failing

- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3004/webhooks/stripe`
- Update `STRIPE_WEBHOOK_SECRET` with secret from CLI output
- For production: Set up webhook endpoint in Stripe dashboard

---

## Example .env.example Files

Create these in each service directory:

### `apps/portal/.env.example`

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_GATEWAY_URL=http://api-gateway:3000
NODE_ENV=development
```

### `services/api-gateway/.env.example`

```env
PORT=3000
NODE_ENV=development
CLERK_SECRET_KEY=sk_test_xxxxx
REDIS_URL=redis://redis:6379
IDENTITY_SERVICE_URL=http://identity-service:3001
ATS_SERVICE_URL=http://ats-service:3002
NETWORK_SERVICE_URL=http://network-service:3003
BILLING_SERVICE_URL=http://billing-service:3004
NOTIFICATION_SERVICE_URL=http://notification-service:3005
LOG_LEVEL=info
```

(Continue for other services...)

---

## Getting API Keys

### Clerk
1. Sign up at https://clerk.com
2. Create a new application
3. Go to "API Keys" section
4. Copy publishable and secret keys

### Supabase
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Settings > API
4. Copy project URL and service role key
5. Go to Settings > Database
6. Copy connection string for `DATABASE_URL`

### Stripe
1. Sign up at https://stripe.com
2. Go to Developers > API keys
3. Use test mode keys for development
4. For webhooks: Developers > Webhooks > Add endpoint

### Resend
1. Sign up at https://resend.com
2. Go to API Keys
3. Create a new API key
4. Verify your sending domain

---

**Last Updated:** December 14, 2025  
**Maintained By:** Platform Team
