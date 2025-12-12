# Splits Network - Docker Compose Setup

This directory contains Docker configuration for running the entire Splits Network stack locally.

## Quick Start

1. **Copy environment variables:**
   ```bash
   cp .env.docker.example .env
   ```

2. **Fill in your credentials in `.env`:**
   - Supabase URL and keys
   - Clerk authentication keys
   - Stripe API keys (for billing service)
   - Resend API key (for notifications)

3. **Start all services:**
   ```bash
   docker compose up
   ```

   Or in detached mode:
   ```bash
   docker compose up -d
   ```

4. **Access the applications:**
   - **Portal (Frontend):** http://localhost:3100
   - **API Gateway:** http://localhost:3000
   - **RabbitMQ Management UI:** http://localhost:15672 (user: `splits`, pass: `splits_local_dev`)

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Portal | 3100 | Next.js frontend application |
| API Gateway | 3000 | Main API entry point |
| Identity Service | 3001 | User & org management |
| ATS Service | 3002 | Jobs, candidates, applications |
| Network Service | 3003 | Recruiter network & assignments |
| Billing Service | 3004 | Subscriptions & Stripe integration |
| Notification Service | 3005 | Email & event processing |
| Redis | 6379 | Cache & rate limiting |
| RabbitMQ | 5672 | Message queue |
| RabbitMQ Management | 15672 | Web UI for RabbitMQ |

## Commands

### Start everything
```bash
docker compose up
```

### Start specific services
```bash
docker compose up portal api-gateway identity-service
```

### Stop all services
```bash
docker compose down
```

### Stop and remove volumes (clean state)
```bash
docker compose down -v
```

### Rebuild services after code changes
```bash
docker compose up --build
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f portal
docker compose logs -f api-gateway
```

### Restart a service
```bash
docker compose restart portal
```

## Development Workflow

The docker-compose setup includes volume mounts for hot-reloading:

- Source code changes in `src/` directories are reflected immediately
- Shared packages are mounted and watched
- `node_modules` are preserved in anonymous volumes for performance

## Infrastructure Services

### Redis
- Used for rate limiting and caching
- Available at `localhost:6379`
- No authentication in local dev

### RabbitMQ
- Used for domain events between services
- AMQP: `localhost:5672`
- Management UI: http://localhost:15672
- Credentials: `splits` / `splits_local_dev`

## Troubleshooting

### Services won't start
1. Ensure `.env.docker` is properly configured
2. Check that ports aren't already in use
3. Try rebuilding: `docker compose up --build`

### Database connection issues
- Verify `SUPABASE_URL` and keys in `.env.docker`
- Ensure your Supabase project is accessible

### Hot reload not working
- Check that volume mounts are correct in `docker-compose.yml`
- On Windows, ensure Docker has access to your drive

### Out of disk space
```bash
# Clean up unused Docker resources
docker system prune -a --volumes
```

## Production Build

To build production images:

```bash
docker compose -f docker-compose.yml build --target production
```

Each Dockerfile has separate stages for development and production.
