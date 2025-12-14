# Notification Service Testing

This directory contains test scripts for verifying the notification service end-to-end functionality.

## Prerequisites

1. **All services running**:
   ```bash
   docker-compose up -d
   ```

2. **Resend API key configured** in your environment:
   ```bash
   # In your .env file or docker-compose.yml
   RESEND_API_KEY=re_xxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

3. **Test email address** (optional, defaults to test@example.com):
   ```bash
   export TEST_EMAIL=your-test-email@example.com
   ```

## Test Scripts

### 1. Basic Event Publishing Test

Tests the RabbitMQ event publishing without full data flow:

```bash
cd scripts
pnpm tsx test-notifications.ts
```

This script:
- Publishes test events directly to RabbitMQ
- Verifies notification service receives and processes events
- Uses placeholder IDs (doesn't require real data)

**Check logs**:
```bash
docker logs splits-notification-service -f
```

---

### 2. End-to-End Flow Test

Tests the complete notification flow with real data:

```bash
cd scripts
pnpm tsx test-notification-e2e.ts
```

This script:
1. Creates a test user, recruiter profile, company, and job
2. Submits a candidate application (triggers `application.created` event)
3. Updates the application stage (triggers `application.stage_changed` event)
4. Creates a placement (triggers `placement.created` event)
5. Verifies emails are sent via Resend

**What it tests:**
- ✅ Event publishing from ATS service
- ✅ RabbitMQ routing to notification service
- ✅ HTTP calls to identity, ATS, and network services to fetch data
- ✅ Email template rendering with real data
- ✅ Email delivery via Resend
- ✅ Notification logging to database

---

## Verification Steps

### 1. Check Notification Service Logs

```bash
docker logs splits-notification-service -f
```

Look for:
- `Processing event` - Event received from RabbitMQ
- `Fetching data for...` - HTTP calls to other services
- `Email sent successfully` - Successful Resend delivery
- Any error messages

### 2. Check RabbitMQ Management UI

Open [http://localhost:15672](http://localhost:15672)
- Username: `splits`
- Password: `splits_local_dev`

**Verify:**
- Exchange `splits-network-events` exists
- Queue `notification-service-queue` exists
- Bindings are correct (`application_created`, `application_stage_changed`, `placement_created`)
- Messages are being consumed (not piling up)

### 3. Check Resend Dashboard

Open [https://resend.com/emails](https://resend.com/emails)

**Verify:**
- Emails appear in your dashboard
- Status is "Delivered" (not "Bounced" or "Failed")
- Content matches expected templates

### 4. Check Database Logs

Query the notification logs table:

```sql
SELECT 
    id,
    event_type,
    recipient_email,
    subject,
    status,
    resend_message_id,
    error_message,
    created_at
FROM notifications.notification_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Expected statuses:**
- `pending` - Email queued for sending
- `sent` - Successfully delivered via Resend
- `failed` - Delivery failed (check `error_message`)

---

## Troubleshooting

### Issue: Events not being consumed

**Check:**
1. RabbitMQ is running: `docker ps | grep rabbitmq`
2. Notification service is connected: Check service logs for "Connected to RabbitMQ"
3. Queue bindings are correct: Check RabbitMQ management UI

**Fix:**
```bash
docker-compose restart notification-service
```

### Issue: Email not being sent

**Check:**
1. Resend API key is valid (not expired or test-mode key)
2. Sender email domain is verified in Resend dashboard
3. Check notification service logs for Resend API errors

**Common errors:**
- `403 Forbidden` - Invalid API key or unverified domain
- `422 Unprocessable Entity` - Email validation failed (bad recipient address)

### Issue: Service-to-service HTTP calls failing

**Check:**
1. All services are running: `docker-compose ps`
2. Service URLs are configured correctly in `docker-compose.yml`:
   ```yaml
   IDENTITY_SERVICE_URL: http://identity-service:3001
   ATS_SERVICE_URL: http://ats-service:3002
   NETWORK_SERVICE_URL: http://network-service:3003
   ```
3. Services are on the same Docker network

**Test connectivity:**
```bash
docker exec splits-notification-service curl http://identity-service:3001/health
docker exec splits-notification-service curl http://ats-service:3002/health
docker exec splits-notification-service curl http://network-service:3003/health
```

### Issue: Missing data in emails

**Check:**
1. Job has company data populated: `SELECT * FROM ats.jobs WHERE id = 'job-id'`
2. Candidate profile exists: `SELECT * FROM ats.candidates WHERE id = 'candidate-id'`
3. Recruiter profile exists: `SELECT * FROM network.recruiters WHERE id = 'recruiter-id'`
4. User profile exists: `SELECT * FROM identity.users WHERE id = 'user-id'`

---

## Email Templates

Current templates (inline HTML):

### 1. Application Created
- **Subject**: `New Candidate Submitted: {candidate} for {job}`
- **Recipient**: Recruiter who submitted
- **Trigger**: `application.created` event

### 2. Application Stage Changed
- **Subject**: `Application Update: {candidate} - {new_stage}`
- **Recipient**: Recruiter who submitted
- **Trigger**: `application.stage_changed` event

### 3. Placement Created
- **Subject**: `Placement Confirmed: {candidate} - ${recruiter_share}`
- **Recipient**: Recruiter who submitted
- **Trigger**: `placement.created` event

---

## Next Steps

- [ ] Add company notification recipients (notify hiring managers)
- [ ] Add admin notification recipients (platform monitoring)
- [ ] Add email templates for more events (role assigned, subscription changed)
- [ ] Add email preferences (opt-out per event type)
- [ ] Add retry logic with exponential backoff for failed sends
- [ ] Add dead letter queue for persistently failing messages
