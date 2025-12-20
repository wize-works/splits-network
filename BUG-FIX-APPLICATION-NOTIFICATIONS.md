# Bug Fix: Application Notifications Not Sending

**Date:** December 20, 2025  
**Reporter:** User (candidate submission in production)  
**Environment:** Production AKS  
**Severity:** Critical - Notifications not being sent

## Problem

When a candidate with an active recruiter submits an application:
1. ❌ No email notifications were sent to the company or recruiter
2. ❌ Application was created with `recruiter_id = NULL` instead of the correct recruiter ID
3. ❌ Notification service failed with 404 error trying to fetch recruiter details

## Root Cause

The production ATS service was sending the **wrong recruiter ID** in the `application.created` event:

- **Sent:** `recruiter_id: "41a7e453-e648-4368-aab0-1ee48eedf5b9"` (this is the user's ID from `identity.users`)
- **Should have sent:** `recruiter_id: "11ce3517-2925-4f62-8de2-3dceec3ec1f2"` (this is the recruiter's ID from `network.recruiters`)

### Why This Happened

In [services/ats-service/src/services/applications/service.ts](services/ats-service/src/services/applications/service.ts) line 459:

```typescript
// ❌ WRONG - this gets the identity user_id, not the network recruiter_id
recruiterId = recruiterRelationship.recruiter_user_id;
```

The notification service then tried to fetch recruiter details using this ID:
- Network service query: `GET /recruiters/41a7e453-e648-4368-aab0-1ee48eedf5b9`
- Result: 404 Not Found (because this ID doesn't exist in `network.recruiters`)

## The Fix

### 1. Fixed Repository Method

Added `findActiveRecruiterForCandidate()` to [services/ats-service/src/repository.ts](services/ats-service/src/repository.ts):

```typescript
async findActiveRecruiterForCandidate(candidateId: string): Promise<{
    recruiter_id: string;        // ✅ The correct ID from network.recruiters
    recruiter_user_id: string;   // The user_id from identity.users
    status: string;
    consent_given: boolean;
} | null> {
    const { data, error } = await this.supabase
        .schema('network')
        .from('recruiter_candidates')
        .select(`
            recruiter_id,
            status,
            consent_given,
            relationship_start_date,
            relationship_end_date,
            recruiters!inner (
                id,
                user_id
            )
        `)
        .eq('candidate_id', candidateId)
        .eq('status', 'active')
        .eq('consent_given', true)
        .gte('relationship_end_date', new Date().toISOString())
        .order('relationship_start_date', { ascending: false })
        .limit(1)
        .single();

    if (!data) return null;

    return {
        recruiter_id: data.recruiter_id,           // ✅ THIS is what we need
        recruiter_user_id: (data.recruiters as any).user_id,
        status: data.status,
        consent_given: data.consent_given,
    };
}
```

### 2. Fixed Service Logic

Updated [services/ats-service/src/services/applications/service.ts](services/ats-service/src/services/applications/service.ts) line 459:

```typescript
if (recruiterRelationship) {
    hasRecruiter = true;
    // ✅ CORRECT - Use recruiter_id from network.recruiters table
    recruiterId = recruiterRelationship.recruiter_id;
}
```

### 3. Enhanced Error Logging

Updated [services/ats-service/src/events.ts](services/ats-service/src/events.ts) to make RabbitMQ connection failures more visible:

```typescript
if (!this.channel) {
    this.logger.error(
        { event_type: eventType, payload },
        '❌ CRITICAL: RabbitMQ not connected - event will NOT be published!'
    );
    return;
}

this.logger.info(
    { event_type: eventType, event_id: event.event_id },
    '✅ Published event to RabbitMQ'
);
```

## Production Logs Evidence

From `kubectl logs notification-service-5c88cd4bd4-9mrjm`:

```json
{
  "level": 50,
  "msg": "Failed to fetch from service",
  "url": "http://network-service:3003/recruiters/41a7e453-e648-4368-aab0-1ee48eedf5b9",
  "service": "network-service"
}
{
  "level": 50,
  "msg": "Failed to send candidate application submission notifications",
  "error": {
    "message": "network-service request failed: 404 Not Found - {\"error\":{\"code\":\"NOT_FOUND\",\"message\":\"Recruiter with id 41a7e453-e648-4368-aab0-1ee48eedf5b9 not found\"}}"
  }
}
```

## Database Verification

Confirmed the correct recruiter relationship exists:

```sql
SELECT recruiter_id, user_id 
FROM network.recruiter_candidates rc
JOIN network.recruiters r ON r.id = rc.recruiter_id
WHERE rc.candidate_id = '9ffa6c79-8e8c-4206-a84a-579330af3e38';

-- Result:
-- recruiter_id: 11ce3517-2925-4f62-8de2-3dceec3ec1f2  ✅ This should be used
-- user_id:      41a7e453-e648-4368-aab0-1ee48eedf5b9  ❌ This was incorrectly used
```

## Deployment Steps

### Quick Deploy (Recommended)

From the root of the repository:

```bash
# 1. Build the ATS service Docker image
docker build -t ghcr.io/splits-network/ats-service:fix-recruiter-id -f services/ats-service/Dockerfile services/ats-service

# 2. Push to container registry
docker push ghcr.io/splits-network/ats-service:fix-recruiter-id

# 3. Update Kubernetes deployment
kubectl set image deployment/ats-service ats-service=ghcr.io/splits-network/ats-service:fix-recruiter-id -n splits-network

# 4. Watch rollout
kubectl rollout status deployment/ats-service -n splits-network

# 5. Verify pods are running
kubectl get pods -n splits-network -l app=ats-service

# 6. Check logs
kubectl logs -f deployment/ats-service -n splits-network --tail=50
```

### Verification Steps

After deployment, submit a test application as a candidate with an active recruiter and check:

1. **ATS Service logs** should show:
   ```
   ✅ Published event to RabbitMQ: application.created
   ```

2. **Notification Service logs** should show:
   ```
   Processing event: application.created
   Handling candidate application submission
   Candidate application with recruiter - notifying candidate and recruiter
   ```

3. **Database** should show correct recruiter_id:
   ```sql
   SELECT recruiter_id, stage 
   FROM ats.applications 
   WHERE candidate_id = '<test_candidate_id>' 
   ORDER BY created_at DESC LIMIT 1;
   -- recruiter_id should be 11ce3517-2925-4f62-8de2-3dceec3ec1f2
   -- stage should be 'screen'
   ```

4. **Emails** should be received by:
   - Company contact
   - Recruiter

---

## Files Changed

✅ **services/ats-service/src/services/applications/service.ts**
- Line 459: Changed from `recruiter_user_id` to `recruiter_id`

✅ **services/ats-service/src/events.ts**  
- Enhanced error logging for RabbitMQ connection failures

✅ **BUG-FIX-APPLICATION-NOTIFICATIONS.md**  
- This documentation file

**Note:** The `findActiveRecruiterForCandidate()` method already existed in production and is correct. No changes needed to repository.ts.

---

## Testing Checklist

- [ ] Candidate with active recruiter submits application
- [ ] Application created with correct `recruiter_id` in database
- [ ] Event published to RabbitMQ with correct `recruiter_id`
- [ ] Notification service successfully fetches recruiter details
- [ ] Company receives email notification
- [ ] Recruiter receives email notification
- [ ] In-app notifications created for both parties

## Related Files Changed

- `services/ats-service/src/repository.ts` - Added `findActiveRecruiterForCandidate()` method
- `services/ats-service/src/services/applications/service.ts` - Fixed to use `recruiter_id` instead of `recruiter_user_id`
- `services/ats-service/src/events.ts` - Enhanced error logging for RabbitMQ failures

## Impact

**Before Fix:**
- No notifications sent when candidates with recruiters submit applications
- Applications created with NULL recruiter_id
- Silent failures in notification service

**After Fix:**
- Correct recruiter_id stored in application records
- Events published with correct recruiter_id
- Notifications successfully sent to both company and recruiter
- Better observability for debugging

---

**Status:** ✅ Fixed locally, ready for deployment to production
