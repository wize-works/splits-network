
# Splits Network – Phase 2 Product Requirements Document (Refactored & Aligned)

This Phase 2 PRD refactors and extends the original Phase 2 plan to explicitly align with the TSN MASTER PRD.

Phase 1 proved the core execution loop:
- Roles enter the system
- Recruiters submit candidates
- Companies hire
- Placements and splits are tracked

Phase 2 compounds this system into a true recruiting marketplace, while strictly preserving the economic, ownership, and control models defined in the MASTER PRD.

Nothing in Phase 2 replaces or weakens the MASTER PRD.
All Phase 2 features consume, extend, or surface those mechanics.

---

## 0. Phase 2 Alignment Assumptions

Phase 2 explicitly assumes the following as immutable truths:

- Candidate ownership, sourcer attribution, protection windows, and payout eligibility are governed by the MASTER PRD.
- TSN may act as a first-class sourcer.
- Recruiter tiers, load limits, and RM authority remain primary control mechanisms.
- CandidateRoleAssignment is a state machine, not an ad-hoc workflow.
- All placement math is authoritative and locked at hire.

Phase 2 features must not introduce parallel ownership models or bypass paths.

---

## 1. Phase 2 Objectives

Primary goals:

1. Increase network leverage without increasing chaos.
2. Enable collaboration that respects sourcer economics.
3. Surface trust and quality signals derived from real behavior.
4. Expand placement logic to match real-world recruiting.
5. Prepare the platform for automation and AI without removing human authority.

---

## 2. Recruiter Collaboration (Aligned)

### 2.1 Multi-Recruiter Placements

- Allow multiple active recruiters per placement.
- Explicit split percentages.
- Original sourcer attribution preserved.
- Splits locked at hire.

---

### 2.2 Recruiter Referrals

- Referral defines receiving recruiter and split.
- Attached to CandidateRoleAssignment.
- Referral payout derived from recruiter share.

---

## 3. Reputation & Trust

### Recruiter Reputation

- Outcome-based metrics.
- Influences priority, not authority.

### Company Quality Signals

- Time-to-feedback.
- Time-to-hire.
- Offer acceptance rate.

---

## 4. Placement & Fee Logic

### Variable Fees

- Flat, tiered, or fixed fee models.
- Fee snapshot locked at hire.

### Lifecycle & Guarantees

- Active, completed, failed states.
- Replacement linkage supported.

---

## 5. Outreach & Sourcing

- Outreach assigns deterministic sourcer ownership.
- Sent via Resend.
- Protection windows enforced.

---

## 6. Analytics

- Recruiter funnels and earnings.
- Network health metrics.

---

## 7. Admin Controls

- Recruiter caps.
- Manual overrides with audit logs.
- Internal notes.

---

## 8. Notifications & Events

- Stalled candidate nudges.
- Expanded domain events.

---

## 9. Non-Goals

- Automated payouts.
- Public job boards.
- Autonomous AI assignment.

---

## 10. Success Metrics

- Increased placements per recruiter.
- Reduced churn.
- Faster time-to-hire.

---

## 11. Phase 3 Enablement

Phase 2 prepares:
- Reputation datasets.
- Clean ownership timelines.
- Event-driven automation.

---

## 12. Summary

Phase 2 compounds leverage without breaking trust.
