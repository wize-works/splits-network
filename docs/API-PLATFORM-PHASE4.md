# Phase 4 API Platform Documentation

## Overview

Phase 4 introduces a comprehensive API platform for Splits Network, enabling partners, agencies, and power users to integrate with the platform programmatically.

## Features Implemented

### ✅ OAuth 2.0 Authentication
- Client credentials flow for server-to-server authentication
- Refresh token flow for long-lived sessions
- Scoped access control with role-based defaults
- Token introspection and revocation endpoints
- RFC 8414 OAuth discovery endpoint

### ✅ API Versioning
- URL-based versioning (`/api/v1/...`)
- Deprecation headers for smooth migrations
- Version metadata endpoint
- Support for multiple concurrent versions

### ✅ Webhook System
- Subscribe to real-time platform events
- HMAC-SHA256 signature verification
- Automatic retry with exponential backoff (1min, 5min, 15min)
- Webhook delivery history and monitoring
- Secret rotation support

### 🚧 In Progress
- API key authentication (server-to-server)
- Database persistence for webhooks and OAuth clients
- RabbitMQ integration for webhook queue
- Rate limiting by API key/user tier

---

## Quick Start

### 1. Obtain OAuth Access Token

```bash
POST /oauth/token
Content-Type: application/json
Authorization: Bearer <your-clerk-jwt>

{
  "grant_type": "client_credentials",
  "scope": "read:roles read:candidates write:submissions"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "scope": "read:roles read:candidates write:submissions"
}
```

### 2. Make API Requests

```bash
GET /api/v1/roles
Authorization: Bearer <access_token>
```

### 3. Create Webhook Subscription

```bash
POST /api/v1/webhooks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/splits",
  "events": [
    "application.submitted",
    "application.stage_changed",
    "placement.created"
  ],
  "description": "Production webhook for candidate updates"
}
```

Response:
```json
{
  "id": "wh_abc123",
  "url": "https://your-app.com/webhooks/splits",
  "events": ["application.submitted", "application.stage_changed", "placement.created"],
  "secret": "whsec_f8e7d6c5b4a39281...",
  "active": true,
  "createdAt": "2025-12-15T10:30:00Z"
}
```

---

## OAuth 2.0 Scopes

### Read Scopes
- `read:roles` – List and view open roles
- `read:candidates` – View candidate profiles (own submissions only)
- `read:placements` – View placement records and status
- `read:payouts` – View payout history and amounts

### Write Scopes
- `write:submissions` – Submit candidates to roles
- `write:updates` – Update candidate status and notes
- `write:roles` – Create and manage roles (Company only)

### Admin Scopes
- `admin:all` – Full platform access (Admin only)

### Role-Based Defaults

**Recruiter:**
- `read:roles`, `read:candidates`, `read:placements`, `read:payouts`
- `write:submissions`, `write:updates`

**Company:**
- `read:roles`, `read:candidates`, `read:placements`
- `write:roles`, `write:updates`

**Admin:**
- `admin:all`

---

## Webhook Events

### Role Events
- `role.created` – New role posted
- `role.updated` – Role details changed
- `role.closed` – Role no longer accepting submissions

### Application Events
- `application.submitted` – New candidate submitted
- `application.stage_changed` – Candidate moved to new stage
- `application.withdrawn` – Candidate withdrawn from consideration

### Placement Events
- `placement.created` – Placement finalized
- `placement.confirmed` – Company confirmed placement
- `placement.cancelled` – Placement cancelled

### Payout Events
- `payout.processed` – Payment completed
- `payout.failed` – Payment error occurred

### Team Events (Phase 4)
- `team.member_added` – Team member added
- `team.member_removed` – Team member removed

---

## Webhook Payload Structure

```json
{
  "id": "wh_delivery_xyz789",
  "event": "application.stage_changed",
  "timestamp": "2025-12-15T10:30:00Z",
  "data": {
    "application_id": "uuid",
    "role_id": "uuid",
    "candidate_id": "uuid",
    "old_stage": "screening",
    "new_stage": "interview",
    "changed_by": "user_uuid"
  }
}
```

---

## Webhook Signature Verification

All webhook requests include an `X-Webhook-Signature` header for verification.

### Node.js Example

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  // Parse signature header: "t=1234567890,v1=abc123..."
  const parts = signature.split(',');
  const timestamp = parts[0].split('=')[1];
  const expectedSig = parts[1].split('=')[1];
  
  // Reconstruct signed payload
  const signedPayload = `${timestamp}.${payload}`;
  
  // Compute HMAC
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  const computedSig = hmac.digest('hex');
  
  return computedSig === expectedSig;
}

// Express middleware
app.post('/webhooks/splits', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.SPLITS_WEBHOOK_SECRET;
  
  if (!verifyWebhook(payload, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  console.log('Event:', req.body.event);
  console.log('Data:', req.body.data);
  
  res.status(200).send('OK');
});
```

### Python Example

```python
import hmac
import hashlib

def verify_webhook(payload: str, signature: str, secret: str) -> bool:
    # Parse signature header
    parts = dict(item.split('=') for item in signature.split(','))
    timestamp = parts['t']
    expected_sig = parts['v1']
    
    # Reconstruct signed payload
    signed_payload = f"{timestamp}.{payload}"
    
    # Compute HMAC
    computed_sig = hmac.new(
        secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return computed_sig == expected_sig
```

---

## Rate Limiting

### Standard Tier (Free)
- 100 requests/hour
- Best-effort support
- Webhook retries: 3 attempts

### Premium Tier ($500/month)
- 1,000 requests/hour
- 4-hour support response
- Priority webhook delivery

### Enterprise Tier (Custom)
- Custom rate limits
- Dedicated support
- SLA guarantees

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702656000
```

---

## API Versioning

### Current Version
- `v1` (stable)

### Deprecated Versions
- None currently

### Version Headers

All responses include:
```
X-API-Version: v1
```

Deprecated versions include additional headers:
```
Deprecation: true
Sunset: 2026-06-01
X-API-Deprecation-Message: This version will be sunset on June 1, 2026
X-API-Current-Version: v2
```

### Check Available Versions

```bash
GET /api/versions
```

Response:
```json
{
  "current": "v1",
  "available": ["v1"],
  "deprecated": {}
}
```

---

## Interactive Documentation

Visit the Swagger UI at:
- Development: http://localhost:3000/docs
- Production: https://api.splits.network/docs

All endpoints, schemas, and authentication flows are documented interactively.

---

## OAuth Discovery

RFC 8414 compliant authorization server metadata:

```bash
GET /.well-known/oauth-authorization-server
```

Response:
```json
{
  "issuer": "https://api.splits.network",
  "token_endpoint": "https://api.splits.network/oauth/token",
  "token_endpoint_auth_methods_supported": ["client_secret_post", "client_secret_basic"],
  "grant_types_supported": ["client_credentials", "refresh_token"],
  "scopes_supported": ["read:roles", "read:candidates", ...],
  "introspection_endpoint": "https://api.splits.network/oauth/introspect",
  "revocation_endpoint": "https://api.splits.network/oauth/revoke"
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "invalid_scope",
  "error_description": "No valid scopes requested",
  "timestamp": "2025-12-15T10:30:00Z",
  "path": "/oauth/token"
}
```

### Common HTTP Status Codes

- `200 OK` – Success
- `201 Created` – Resource created
- `204 No Content` – Success with no response body
- `400 Bad Request` – Invalid request parameters
- `401 Unauthorized` – Missing or invalid authentication
- `403 Forbidden` – Insufficient permissions/scopes
- `404 Not Found` – Resource not found
- `429 Too Many Requests` – Rate limit exceeded
- `500 Internal Server Error` – Server error
- `503 Service Unavailable` – Service temporarily unavailable

---

## Best Practices

### 1. Token Management
- Store access tokens securely (never in source code)
- Refresh tokens before expiration
- Implement token caching to reduce requests
- Rotate refresh tokens periodically

### 2. Webhook Security
- Always verify webhook signatures
- Use HTTPS endpoints only
- Validate event data before processing
- Implement idempotency (use webhook delivery ID)
- Return 200 status immediately (process async)

### 3. Error Handling
- Implement exponential backoff for retries
- Log correlation IDs for debugging
- Handle rate limit responses gracefully
- Monitor webhook delivery failures

### 4. Performance
- Cache frequently accessed data
- Use webhooks instead of polling
- Request only needed scopes
- Paginate large result sets

---

## SDK Examples (Coming Soon)

Official SDKs will be available for:
- JavaScript/TypeScript (Node.js, Browser)
- Python
- Ruby
- Go

---

## Support

- **Documentation:** https://docs.splits.network
- **API Status:** https://status.splits.network
- **Support Email:** api-support@splits.network
- **Discord:** https://discord.gg/splits-network

---

## Migration Guide

When a new API version is released, we will:
1. Announce 6 months in advance
2. Provide migration guide with examples
3. Add deprecation headers to old version
4. Maintain old version for minimum 12 months
5. Offer automated migration tools

---

## Changelog

### 2025-12-15 - Phase 4A Release
- ✅ OAuth 2.0 authentication
- ✅ API versioning (v1)
- ✅ Webhook management
- ✅ OpenAPI/Swagger documentation
- ✅ Rate limiting infrastructure

### Coming Soon
- 📋 API keys for server-to-server auth
- 📋 Webhook queue with RabbitMQ
- 📋 Tiered rate limiting enforcement
- 📋 API usage analytics dashboard
