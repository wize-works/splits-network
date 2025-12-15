
# Splits Network – Phase 2 PRD (Marketplace Expansion & Economic Depth)

Phase 2 is not an iteration on Phase 1 UX.
Phase 2 is the transition from a working split-first ATS into a durable recruiting marketplace with enforceable economics.

Phase 1 proved that:
- Recruiters will use the system
- Companies will hire through it
- Fees, splits, and pipelines can be tracked accurately

Phase 2 ensures:
- Ownership is unambiguous
- Collaboration is profitable
- Quality compounds naturally
- Scale does not break trust

---

## 0. Phase 2 Implementation Checklist

### Infrastructure & Platform
- [ ] Extend database schemas for ownership and sourcing
- [ ] Add new marketplace domain events
- [ ] Extend RabbitMQ exchanges
- [ ] Add Redis-backed counters for reputation signals
- [ ] Update shared-types with Phase 2 models
- [ ] Update shared-clients for new APIs

### Core Domain
- [ ] Candidate ownership model
- [ ] Sourcer attribution with protection windows
- [ ] CandidateRoleAssignment state machine
- [ ] Placement lifecycle and guarantees
- [ ] Multi-recruiter split math
- [ ] Reputation signal aggregation

### Services
- [ ] ATS service extensions
- [ ] Network service collaboration logic
- [ ] Notification extensions (ownership, guarantees)
- [ ] Billing extensions (tracking only)

### Frontend
- [ ] Recruiter collaboration UI
- [ ] Placement breakdown UI
- [ ] Ownership indicators
- [ ] Reputation badges
- [ ] Admin audit views

### Testing
- [ ] Ownership claim flows
- [ ] Multi-recruiter placement flows
- [ ] Failure and replacement flows

---

## 1. Phase 2 Goals

1. Enforce ownership and credit
2. Enable safe collaboration
3. Reward high-quality behavior
4. Reduce wasted recruiter effort
5. Prepare for AI assistance without automation risk

---

## 2. Candidate Ownership & Sourcing

Candidate ownership is a time-bound economic right, not UI metadata.

- First valid sourcer establishes ownership
- Ownership applies across roles
- Protection windows determine payout eligibility
- TSN may act as a first-class sourcer

---

## 3. CandidateRoleAssignment State Machine

Explicit states:
- Proposed
- Accepted
- Declined
- TimedOut
- Submitted
- Closed

Timeouts and declines affect reputation.

---

## 4. Recruiter Collaboration

- Multiple active recruiters per placement
- Explicit split percentages
- Sourcer share calculated first
- Math locked at hire

Referrals are economic edges, not ownership.

---

## 5. Placement Lifecycle & Guarantees

States:
- Hired
- Active
- Completed
- Failed

Failed placements within guarantee windows enable replacements.

---

## 6. Reputation System

Derived from outcomes:
- Submission quality
- Hire rate
- Completion rate
- Responsiveness

Reputation influences access, not authority.

---

## 7. Outreach & Sourcing Tools

- Outreach via Resend
- Outreach establishes ownership
- Unsubscribe and rate limits enforced

---

## 8. Analytics

- Recruiter funnels
- Collaboration vs solo placements
- Network health metrics

---

## 9. Non-Goals

- Automated payouts
- Public job boards
- Autonomous AI decisions

---

## 10. Success Metrics

- Reduced disputes
- Increased collaboration
- Faster hires
- Lower recruiter churn

---

## 11. Summary

Phase 2 makes Splits Network durable:
- Ownership is enforceable
- Collaboration is safe
- Quality compounds
