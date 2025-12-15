
# Splits Network – Phase 3 PRD (Automation, Intelligence & Scale)

Phase 3 begins after Phase 2 economics are proven in production.

Phase 1 proved execution.
Phase 2 proved enforceable economics and trust.
Phase 3 is about leverage: doing more deals, faster, with fewer human bottlenecks — without breaking ownership, math, or trust.

---

## 0. Phase 3 Implementation Checklist

### Platform & Infrastructure
- [x] Async job processing for long-running workflows (✅ `shared-job-queue` package with RabbitMQ)
- [x] Expanded event consumers for automation (✅ Notification service + automation-service directory)
- [ ] Feature flags for phased rollout (⚠️ Planned but not implemented)
- [x] Decision audit logs (✅ `platform.decision_audit_log` table created)
- [x] Billing service expansion for payouts (✅ Payout routes + service implemented)
- [x] Document service for universal storage (✅ `document-service` with Supabase Storage)

### Core Domain
- [x] Payout execution engine (✅ `PayoutService` with Stripe Connect integration)
- [x] Escrow / holdback modeling (✅ `billing.escrow_holds` table + holdback logic)
- [x] Payout audit trail (✅ `billing.payout_audit_log` with immutable records)
- [x] Multi-recruiter split payouts (✅ `billing.payout_splits` table)
- [x] Payout scheduling (✅ `billing.payout_schedules` table)
- [ ] AI-assisted ranking (⚠️ Schema created but no implementation yet)
- [x] Automation guardrails (✅ `platform.automation_rules` + `automation_executions`)
- [x] Fraud detection signals (✅ `platform.fraud_signals` table with severity levels)
- [x] Marketplace health metrics (✅ `platform.marketplace_metrics_daily` aggregation)

### Infrastructure Complete
- [x] Migration 007: Payout system tables
- [x] Migration 008: Stripe Connect integration
- [x] Migration 009: Automation framework
- [x] Migration 007: Document storage schema

---

## 1. Phase 3 Goals

1. Reduce human coordination cost
2. Increase placement velocity
3. Increase platform capture safely
4. Maintain economic fairness at scale
5. Make the marketplace feel alive

---

## 2. Automated Payouts

**STATUS: ✅ IMPLEMENTED**

### Completed Features:
- ✅ Stripe Connect account management for recruiters
- ✅ Payout creation and scheduling system
- ✅ Multi-recruiter split payouts
- ✅ Escrow/holdback management during guarantee period
- ✅ Immutable payout audit trail
- ✅ Payout status tracking (pending → processing → completed/failed)
- ✅ Automated transfer execution via Stripe API

### Implementation Details:
- **Service**: `billing-service` with `payout-routes.ts` and `payout-service.ts`
- **Database Tables**: 
  - `billing.payouts` - Main payout records
  - `billing.payout_schedules` - Trigger scheduling
  - `billing.payout_splits` - Multi-recruiter distributions
  - `billing.escrow_holds` - Guarantee period holdbacks
  - `billing.payout_audit_log` - Immutable state history
- **Stripe Integration**: Connect accounts, transfers, and payout processing
- **API Endpoints**:
  - `POST /stripe/connect/onboard` - Recruiter onboarding
  - `GET /stripe/connect/status/:account_id` - Account verification
  - `POST /payouts` - Create payout
  - `POST /payouts/:id/process` - Execute transfer
  - `GET /payouts/:id/audit-log` - Audit trail

### Next Steps:
- Webhook handling for Stripe payout events
- Automated scheduling based on guarantee completion dates
- Dashboard for payout history and reconciliation

---

## 3. Intelligence Layer

**STATUS: ⚠️ PARTIALLY IMPLEMENTED (Schema Only)**

### Database Schema Created:
- ✅ `platform.candidate_role_matches` table with:
  - Match scoring (0-100)
  - Explainable reasoning (array of factors)
  - Human review workflow
  - Accept/reject tracking

### Not Yet Implemented:
- ❌ AI model integration for candidate-role matching
- ❌ Recruiter-role fit scoring algorithm
- ❌ Match suggestion API endpoints
- ❌ Frontend UI for reviewing suggestions

### Design Principles (Defined):
- Explainable AI only - every suggestion must include reasoning
- Humans approve all actions - no autonomous decisions
- Confidence scores tracked for all suggestions
- Full audit trail of AI decisions vs human overrides

### Next Steps:
- Integrate candidate profile parsing from resumes
- Implement matching algorithm (skill overlap, location, salary range)
- Build suggestion review UI
- Add API endpoints for match retrieval and updates

---

## 4. Automation Framework

**STATUS: ✅ INFRASTRUCTURE COMPLETE**

### Completed Infrastructure:
- ✅ Automation rules engine (`platform.automation_rules`)
  - Configurable trigger conditions (JSONB)
  - Flexible action definitions
  - Human approval guardrails
  - Rate limiting per rule
- ✅ Execution tracking (`platform.automation_executions`)
  - Audit trail of all automation runs
  - Approval workflow (pending → approved → executed)
  - Rejection tracking with reasons
  - Error logging and retry capability
- ✅ Async job processing (`shared-job-queue` package)
  - RabbitMQ-based reliable execution
  - Dead letter queues for failed jobs
  - Retry logic with exponential backoff
- ✅ Automation service directory created

### Not Yet Implemented:
- ❌ Specific automation rule implementations
- ❌ Rule builder UI
- ❌ Automation execution API endpoints
- ❌ Pre-built automation templates (e.g., auto-stage-advance, auto-notifications)

### Design Principles:
- Human approval required by default
- Full audit trail of trigger → approval → execution
- Reversible actions where possible
- Rate limiting to prevent runaway automations

### Next Steps:
- Build automation-service API layer
- Implement common automation patterns:
  - Auto-advance applications after X days
  - Auto-notify recruiters of stale candidates
  - Auto-schedule payout triggers post-guarantee
- Create admin UI for rule management

---

## 5. Marketplace Optimization

**STATUS: ✅ SCHEMA COMPLETE**

### Implemented:
- ✅ Daily marketplace metrics aggregation (`platform.marketplace_metrics_daily`)
  - Activity: Active recruiters, companies, jobs
  - Performance: Applications, placements, time-to-hire
  - Quality: Hire rate, completion rate, response times
  - Financial: Fees generated, payouts processed
  - Health: Fraud signals, disputes
- ✅ Unique constraint on metric_date for daily snapshots
- ✅ Indexed for fast time-series queries

### Not Yet Implemented:
- ❌ Automated metric calculation job
- ❌ Deal risk scoring algorithm
- ❌ Network health dashboard
- ❌ Early warning indicators/alerts
- ❌ Trend analysis and forecasting

### Next Steps:
- Build daily cron job to populate metrics
- Create analytics dashboard
- Define health score thresholds
- Implement alerting for anomalies

---

## 6. Fraud & Abuse Detection

**STATUS: ✅ INFRASTRUCTURE COMPLETE**

### Implemented:
- ✅ Fraud signals table (`platform.fraud_signals`)
  - Signal types: duplicate_submission, suspicious_pattern, velocity_anomaly, etc.
  - Severity levels: low, medium, high, critical
  - Confidence scoring (0-100)
  - Multi-entity tracking (recruiter, job, candidate, application, placement)
  - Resolution workflow (active → reviewed → resolved/false_positive)
- ✅ Comprehensive indexing for signal monitoring
- ✅ Action tracking and resolution notes

### Not Yet Implemented:
- ❌ Detection algorithms for common fraud patterns
- ❌ Real-time signal generation from events
- ❌ Admin review queue UI
- ❌ Automated throttling based on signals
- ❌ Machine learning for pattern detection

### Detection Opportunities:
- Duplicate candidate submissions
- Unusual application velocity
- Suspicious recruiter behavior patterns
- Candidate profile manipulation
- Fee negotiation anomalies

### Next Steps:
- Implement basic fraud detection rules
- Build admin fraud review dashboard
- Create alerting system for high-severity signals
- Add automated throttling/review queues

---

## 7. Admin Tooling

**STATUS: ⚠️ BACKEND READY, FRONTEND NEEDED**

### Backend Infrastructure Complete:
- ✅ Payout audit logs and history
- ✅ Automation execution tracking
- ✅ Fraud signal management tables
- ✅ Decision audit logs
- ✅ Marketplace metrics aggregation

### Not Yet Implemented:
- ❌ Admin dashboard UI
- ❌ Automation rule management interface
- ❌ Financial reconciliation dashboard
- ❌ Dispute escalation workflow UI
- ❌ Fraud review queue interface
- ❌ Real-time metrics visualization

### Required Admin Views:
1. **Financial Dashboard**
   - Payout queue and history
   - Escrow holds tracking
   - Revenue/payout reconciliation
   
2. **Automation Controls**
   - Rule activation/deactivation
   - Execution approval queue
   - Performance metrics per rule
   
3. **Fraud Management**
   - Active signals by severity
   - Review and resolution workflow
   - Historical pattern analysis
   
4. **Marketplace Health**
   - Key metrics dashboard
   - Trend analysis
   - Early warning alerts

### Next Steps:
- Design admin portal layout
- Build payout reconciliation UI
- Create automation rule builder
- Implement fraud signal review queue

---

## 8. Non-Goals

- Fully autonomous hiring
- Black-box AI decisions
- Public free-for-all marketplaces

---

## 9. Success Metrics

- Faster hires
- Higher placements per recruiter
- Increased margin
- Low payout disputes

---

## 10. Summary

Phase 3 compounds leverage while preserving trust.

---

## 11. Additional Features Implemented

### Document Service (Bonus Feature)
**STATUS: ✅ FULLY IMPLEMENTED**

A universal document storage service was built to support the platform:

#### Features:
- ✅ Supabase Storage integration (S3-compatible)
- ✅ Multi-bucket organization (candidate-documents, company-documents, system-documents)
- ✅ Document metadata tracking (`documents.documents` table)
- ✅ File upload with validation (type, size limits)
- ✅ Signed URL generation for secure downloads
- ✅ Soft delete capability
- ✅ Entity-based document retrieval
- ✅ Processing status tracking
- ✅ Full API Gateway integration

#### API Endpoints:
- `POST /api/documents/upload` - Upload files with metadata
- `GET /api/documents/:id` - Retrieve with signed URL
- `GET /api/documents` - List with filters
- `GET /api/documents/entity/:entityType/:entityId` - Get entity documents
- `DELETE /api/documents/:id` - Soft delete

#### Service Location:
- `services/document-service/`
- Port: 3006
- Schema: `documents`
- Migration: `007_create_storage_schema.sql`

This service enables resume storage, job descriptions, contracts, and other document management across the platform.

---

## 12. Implementation Summary

### ✅ COMPLETED (Ready for Production)
1. **Payout System** - Full Stripe Connect integration with splits and escrow
2. **Document Service** - Universal document storage with Supabase
3. **Async Jobs** - RabbitMQ-based job queue for background processing
4. **Audit Infrastructure** - Decision logs, payout logs, execution tracking

### ⚠️ INFRASTRUCTURE READY (Needs Implementation)
1. **Automation Framework** - Tables + rules engine ready, needs API layer
2. **Fraud Detection** - Schema complete, needs detection algorithms
3. **Marketplace Metrics** - Tables ready, needs calculation jobs
4. **AI Matching** - Schema ready, needs ML integration

### ❌ NOT STARTED
1. **Feature Flags** - Planned but not implemented
2. **Admin Dashboards** - Backend ready, frontend not built
3. **AI Implementation** - Only database schema exists

### Next Priorities:
1. Build automation-service API and implement common rules
2. Create admin dashboard for payout reconciliation
3. Implement fraud detection algorithms
4. Build daily metrics aggregation job
5. Add AI candidate matching (or defer to Phase 4)
