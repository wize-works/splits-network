# Notification Service - Testing Guide

The notification service is now fully functional and sends real emails via Resend when events occur.

## ✅ What's Implemented

1. **HTTP Client for Inter-Service Communication**
   - Fetches user data from identity-service
   - Fetches job/candidate/application data from ats-service
   - Fetches recruiter data from network-service

2. **Event Handlers**
   - `application.created` - Sends email when a candidate is submitted
   - `application.stage_changed` - Sends email when candidate moves through pipeline
   - `placement.created` - Sends congratulations email when candidate is hired

3. **Email Templates**
   - Professional HTML emails with all relevant details
   - Notification logging to database with status tracking

## 🧪 Testing Notifications

### Prerequisites

1. **Resend API Key**: Set `RESEND_API_KEY` in your environment or Supabase Vault
2. **From Email**: Configure `RESEND_FROM_EMAIL` (defaults to `noreply@updates.splits.network`)
3. **All services running**: `docker-compose up -d`

### Method 1: Submit a Candidate via API

```bash
# Submit a candidate to trigger notification
curl -X POST http://localhost:3002/applications \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "<your-job-id>",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "linkedin_url": "https://linkedin.com/in/janedoe",
    "notes": "Great candidate!",
    "recruiter_id": "<your-recruiter-id>"
  }'
```

### Method 2: Use the Test Script

```bash
# From repo root
cd G:\code\splits.network
pnpm tsx scripts/test-notification.ts
```

This script will:
1. Find an existing job and recruiter
2. Submit a test candidate
3. Show the notification log status

### Method 3: Via Portal UI

1. Navigate to http://localhost:3100
2. Sign in as a recruiter
3. Go to a role detail page
4. Click "Submit Candidate"
5. Fill out the form and submit
6. Check the recruiter's email address

## 📋 Checking Notification Status

### View Notification Logs in Database

```sql
SELECT 
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

### Check Docker Logs

```bash
# Watch notification service logs in real-time
docker-compose logs -f notification-service

# See last 50 lines
docker-compose logs --tail=50 notification-service
```

## 🔧 Configuration

### Environment Variables

The notification service uses these environment variables:

```env
# Service URLs (default to Docker network names)
IDENTITY_SERVICE_URL=http://identity-service:3001
ATS_SERVICE_URL=http://ats-service:3002
NETWORK_SERVICE_URL=http://network-service:3003

# Resend Configuration
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=noreply@updates.splits.network

# RabbitMQ
RABBITMQ_URL=amqp://splits:splits_local_dev@rabbitmq:5672

# Database
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Docker Compose

Service URLs are automatically configured in `docker-compose.yml`:

```yaml
notification-service:
  environment:
    IDENTITY_SERVICE_URL: http://identity-service:3001
    ATS_SERVICE_URL: http://ats-service:3002
    NETWORK_SERVICE_URL: http://network-service:3003
```

## 📧 Email Templates

### Application Created

Sent to: Recruiter who submitted the candidate

```
Subject: New Candidate Submitted: {candidate_name} for {job_title}

Body:
- Candidate name
- Job title
- Company name
- Link to log in and view
```

### Stage Changed

Sent to: Recruiter who submitted the candidate

```
Subject: Application Update: {candidate_name} - {new_stage}

Body:
- Candidate name
- Job title
- Previous stage
- New stage
```

### Placement Created

Sent to: Recruiter who made the placement

```
Subject: Placement Confirmed: {candidate_name} - ${recruiter_share}

Body:
- Candidate name
- Job title
- Company name
- Salary
- Recruiter share amount
```

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check Resend API Key**
   ```bash
   # Verify key is set
   docker-compose exec notification-service env | grep RESEND
   ```

2. **Check Service Connectivity**
   ```bash
   # Test from notification-service container
   docker-compose exec notification-service curl http://ats-service:3002/jobs
   ```

3. **Check RabbitMQ Connection**
   ```bash
   # View RabbitMQ management UI
   open http://localhost:15672
   # Login: splits / splits_local_dev
   # Check queues and bindings
   ```

4. **Check Notification Logs**
   ```sql
   SELECT status, error_message 
   FROM notifications.notification_logs 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

### Common Issues

**Issue**: `Failed to fetch from service`  
**Solution**: Ensure all services are running and accessible

**Issue**: `Resend API error`  
**Solution**: Verify Resend API key and that sender email is verified

**Issue**: `User not found`  
**Solution**: Ensure recruiter has a valid user_id linking to identity.users

## 🚀 Next Steps

1. **Set up Resend Account**
   - Sign up at https://resend.com
   - Verify your sending domain
   - Get API key from dashboard

2. **Configure Environment**
   - Add `RESEND_API_KEY` to `.env.local`
   - Set `RESEND_FROM_EMAIL` to your verified domain email

3. **Test End-to-End**
   - Submit a real candidate
   - Verify email is received
   - Check notification log status

4. **Monitor in Production**
   - Set up alerts for failed notifications
   - Monitor notification_logs table
   - Track Resend dashboard for delivery stats
