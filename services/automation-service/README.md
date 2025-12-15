# Automation Service

The Automation Service provides AI-assisted matching, fraud detection, automation execution, and marketplace metrics for the Splits Network platform.

## Features

### 1. AI Candidate Matching
- Rule-based candidate-job matching with explainable scoring
- Human review workflow for all suggestions
- Match scoring (0-100) with detailed reasoning
- API endpoints for match generation and review

### 2. Fraud Detection
- Real-time fraud signal generation
- Detection patterns:
  - Duplicate candidate submissions
  - Submission velocity anomalies
  - Mass submission patterns
  - Automated behavior detection
- Severity levels: low, medium, high, critical
- Admin review and resolution workflow

### 3. Automation Framework
- Rule-based automation execution
- Human approval workflow for critical actions
- Rate limiting and safety guardrails
- Supported automation types:
  - Auto-stage-advance applications
  - Auto-notifications
  - Auto-payout scheduling
  - Fraud throttling
- Full audit trail of all executions

### 4. Marketplace Metrics
- Daily metrics aggregation
- Health score calculation
- Time-series data for analytics
- Metrics tracked:
  - Activity (recruiters, companies, jobs)
  - Performance (applications, placements, time-to-hire)
  - Quality (hire rate, completion rate)
  - Financial (fees, payouts)
  - Health (fraud signals, disputes)

## API Endpoints

### AI Matching
```
GET    /matches/pending                    # Get pending match suggestions
POST   /matches/:id/review                 # Accept/reject a match
POST   /matches/generate                   # Generate new suggestions
```

### Fraud Detection
```
GET    /fraud/signals                      # Get active fraud signals
POST   /fraud/signals/:id/resolve          # Resolve a fraud signal
```

### Automation Rules
```
GET    /rules                              # List active rules
POST   /rules                              # Create new rule
PATCH  /rules/:id                          # Update rule
```

### Automation Execution
```
GET    /executions/pending                 # Get pending executions
POST   /executions                         # Trigger execution
POST   /executions/:id/approve             # Approve execution
POST   /executions/:id/reject              # Reject execution
GET    /rules/:id/executions               # Execution history
```

### Metrics
```
POST   /metrics/aggregate                  # Trigger aggregation
GET    /metrics/daily/:date                # Get specific date
GET    /metrics/range                      # Get date range
GET    /metrics/recent?days=N              # Get last N days
GET    /metrics/health                     # Get health score
```

### Decision Audit
```
GET    /audit/decisions                    # Get decision audit logs
```

## Configuration

Environment variables:
```bash
SERVICE_NAME=automation-service
PORT=3007
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NODE_ENV=development|production
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run in production
pnpm start
```

## Daily Metrics Aggregation

Run the daily metrics cron job:

```bash
# Aggregate metrics for yesterday (default)
node src/daily-metrics-cron.ts

# Aggregate for specific date
node src/daily-metrics-cron.ts 2025-12-14
```

Set up a cron job to run daily:
```cron
# Run at midnight daily
0 0 * * * cd /path/to/project && node services/automation-service/src/daily-metrics-cron.ts
```

Or trigger via API:
```bash
curl -X POST http://localhost:3007/metrics/aggregate
```

## Admin Dashboards

Access admin interfaces at:
- `/admin/automation` - Rule and execution management
- `/admin/fraud` - Fraud signal review
- `/admin/metrics` - Marketplace health dashboard
- `/admin/ai-matches` - Match suggestion review

## Architecture

```
automation-service/
├── src/
│   ├── index.ts                    # Service entry point
│   ├── repository.ts               # Database operations
│   ├── routes.ts                   # API endpoints
│   ├── matching-service.ts         # AI matching logic
│   ├── fraud-service.ts            # Fraud detection
│   ├── automation-executor.ts      # Automation execution
│   ├── metrics-service.ts          # Metrics aggregation
│   └── daily-metrics-cron.ts       # Cron job
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Database Schema

### Tables
- `platform.candidate_role_matches` - AI match suggestions
- `platform.fraud_signals` - Fraud detection signals
- `platform.automation_rules` - Automation rule definitions
- `platform.automation_executions` - Execution history
- `platform.marketplace_metrics_daily` - Daily metrics
- `platform.decision_audit_log` - Decision audit trail

## Testing

```bash
# Run tests
pnpm test

# Check endpoints
curl http://localhost:3007/health
```

## Deployment

The service runs on port 3007 by default. Deploy via:

```bash
# Docker
docker build -t automation-service .
docker run -p 3007:3007 automation-service

# Docker Compose
docker-compose up automation-service

# Kubernetes
kubectl apply -f infra/k8s/automation-service/
```

## Documentation

- API documentation: `http://localhost:3007/docs` (Swagger UI)
- Phase 3 PRD: `docs/splits-network-phase3-prd.md`
- Architecture: `docs/splits-network-architecture.md`

## Support

For issues or questions, contact the platform team or create an issue in the repository.
