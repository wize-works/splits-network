# API Documentation Guide

This document provides an overview of the API documentation for Splits Network and how to access the interactive Swagger UI for each service.

## Overview

All Splits Network backend services include OpenAPI 3.0 documentation with interactive Swagger UI interfaces. This allows developers to:

- View all available endpoints and their parameters
- Understand request/response schemas
- Test endpoints directly from the browser
- Generate client code for various languages
- Export OpenAPI specifications

## Service Documentation Endpoints

Each service exposes two endpoints for API documentation:

- `/docs` - Interactive Swagger UI interface
- `/docs/json` - Raw OpenAPI JSON specification

### Development Environment

When running services locally in development mode, access the documentation at:

| Service | Swagger UI | OpenAPI JSON |
|---------|------------|--------------|
| API Gateway | http://localhost:3000/docs | http://localhost:3000/docs/json |
| Identity Service | http://localhost:3001/docs | http://localhost:3001/docs/json |
| ATS Service | http://localhost:3002/docs | http://localhost:3002/docs/json |
| Network Service | http://localhost:3003/docs | http://localhost:3003/docs |
| Billing Service | http://localhost:3004/docs | http://localhost:3004/docs/json |
| Notification Service | N/A (event consumer, no HTTP API) | N/A |

### Production Environment

In production, API documentation is available through the API Gateway:

- **Main API**: https://api.splits.network/docs

---

## Service Overview

### 1. API Gateway

**Purpose**: Public entrypoint for all API requests. Routes to backend services with authentication and rate limiting.

**Base URL (dev)**: http://localhost:3000  
**Base URL (prod)**: https://api.splits.network

**Key Features**:
- Clerk JWT authentication
- Redis-based rate limiting
- Request/response logging with correlation IDs
- Service routing and orchestration

**Tags**:
- `identity` - User and organization management
- `ats` - Jobs, candidates, applications, and placements
- `network` - Recruiter profiles and role assignments
- `billing` - Subscription plans and billing
- `documents` - Document storage and retrieval

**Authentication**: All `/api/*` endpoints require a Clerk JWT bearer token.

**Example Request**:
```bash
curl -X GET "http://localhost:3000/api/me" \
  -H "Authorization: Bearer YOUR_CLERK_JWT_TOKEN"
```

---

### 2. Identity Service

**Purpose**: User identity, organizations, and membership management. Syncs with Clerk for authentication.

**Base URL (dev)**: http://localhost:3001  
**Port**: 3001

**Key Features**:
- User profile management
- Organization and membership management
- Clerk webhook integration for user sync

**Tags**:
- `users` - User management
- `organizations` - Organization management
- `memberships` - User-organization memberships
- `webhooks` - Webhook endpoints for Clerk

**Endpoints**:
- `GET /users/:id` - Get user profile
- `GET /users/clerk/:clerkUserId` - Get user by Clerk ID
- `POST /sync-clerk-user` - Sync Clerk user to database (internal)
- `POST /organizations` - Create organization
- `POST /memberships` - Add user to organization
- `DELETE /memberships/:id` - Remove membership
- `POST /webhooks/clerk` - Clerk webhook handler

---

### 3. ATS Service

**Purpose**: Applicant Tracking System - manages jobs, candidates, applications, and placements.

**Base URL (dev)**: http://localhost:3002  
**Port**: 3002

**Key Features**:
- Job/role management
- Candidate profiles
- Application pipeline with stages
- Placement tracking with fee calculations
- RabbitMQ event publishing for notifications

**Tags**:
- `companies` - Company management
- `jobs` - Job/role management
- `candidates` - Candidate management
- `applications` - Job applications and pipeline
- `placements` - Successful hires and placements

**Endpoints**:

**Companies**:
- `POST /companies` - Create company

**Jobs**:
- `GET /jobs` - List jobs (with pagination)
- `GET /jobs/:id` - Get job details
- `POST /jobs` - Create job
- `PATCH /jobs/:id` - Update job

**Candidates**:
- `GET /candidates/:id` - Get candidate details

**Applications**:
- `POST /jobs/:jobId/applications` - Submit candidate to job
- `GET /jobs/:jobId/applications` - List applications for job
- `GET /applications/:id` - Get application details
- `PATCH /applications/:id` - Update application stage

**Placements**:
- `POST /placements` - Create placement (mark hire)
- `GET /placements/:id` - Get placement details
- `GET /placements` - List placements with filters

**Event Publishing**:
- `application.created` - Published when candidate is submitted
- `application.stage_changed` - Published when stage changes
- `placement.created` - Published when hire is confirmed

---

### 4. Network Service

**Purpose**: Recruiter network management - profiles, assignments, and performance statistics.

**Base URL (dev)**: http://localhost:3003  
**Port**: 3003

**Key Features**:
- Recruiter profile management
- Job role assignments
- Recruiter performance statistics
- Integration with ATS service for job access

**Tags**:
- `recruiters` - Recruiter profile management
- `assignments` - Job role assignments to recruiters
- `stats` - Recruiter performance statistics

**Endpoints**:

**Recruiters**:
- `GET /recruiters` - List all recruiters
- `GET /recruiters/:id` - Get recruiter details
- `GET /recruiters/user/:userId` - Get recruiter by user ID
- `POST /recruiters` - Create recruiter profile
- `PATCH /recruiters/:id/status` - Update recruiter status

**Assignments**:
- `POST /role-assignments` - Assign recruiter to job
- `DELETE /role-assignments` - Remove assignment (query params: recruiterId, jobId)
- `GET /recruiters/:recruiterId/jobs` - List jobs assigned to recruiter
- `GET /jobs/:jobId/recruiters` - List recruiters assigned to job

**Stats**:
- `GET /recruiters/:id/stats` - Get recruiter statistics (submissions, placements, earnings)

---

### 5. Billing Service

**Purpose**: Subscription management and Stripe integration for recruiter billing.

**Base URL (dev)**: http://localhost:3004  
**Port**: 3004

**Key Features**:
- Subscription plan management
- Stripe integration for payments
- Webhook handling for subscription events
- Subscription status tracking

**Tags**:
- `plans` - Subscription plan management
- `subscriptions` - Recruiter subscription management
- `webhooks` - Stripe webhook endpoints

**Endpoints**:

**Plans**:
- `GET /plans` - List subscription plans
- `GET /plans/:id` - Get plan details
- `POST /plans` - Create plan (admin only)

**Subscriptions**:
- `GET /subscriptions/recruiter/:recruiterId` - Get recruiter subscription
- `GET /subscriptions/recruiter/:recruiterId/status` - Get subscription status
- `POST /subscriptions` - Create subscription for recruiter
- `POST /subscriptions/:recruiterId/cancel` - Cancel subscription

**Webhooks**:
- `POST /webhooks/stripe` - Stripe webhook handler (signature verification)

**Stripe Events Handled**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Using Swagger UI

### Accessing the Documentation

1. Start the service locally:
   ```bash
   pnpm --filter @splits-network/ats-service dev
   ```

2. Open your browser to the service's `/docs` endpoint:
   ```
   http://localhost:3002/docs
   ```

### Exploring Endpoints

1. **Browse by Tag**: Endpoints are organized by logical groups (tags) like `jobs`, `candidates`, etc.

2. **Expand Endpoint**: Click on any endpoint to see:
   - HTTP method and path
   - Description
   - Request parameters (path, query, body)
   - Response schemas
   - Response codes and meanings

3. **View Schemas**: Click on schema names to see full object structures.

### Testing Endpoints

1. Click **"Try it out"** button on any endpoint

2. Fill in required parameters:
   - Path parameters (e.g., `jobId`)
   - Query parameters (e.g., `limit`, `offset`)
   - Request body (JSON)

3. Click **"Execute"**

4. View the response:
   - HTTP status code
   - Response headers
   - Response body (JSON)
   - Response time

### Authentication in Swagger UI

For services behind the API Gateway:

1. Click the **"Authorize"** button at the top right

2. Enter your Clerk JWT token:
   ```
   Bearer YOUR_JWT_TOKEN_HERE
   ```

3. Click **"Authorize"** then **"Close"**

4. All subsequent requests will include the authorization header

### Exporting OpenAPI Specification

To download the OpenAPI JSON spec:

1. Navigate to `/docs/json` endpoint in your browser
2. Save the JSON file
3. Use it to:
   - Generate client code (using openapi-generator)
   - Import into Postman or Insomnia
   - Share with frontend developers
   - Generate documentation in other formats

---

## Schema Documentation

### Common Schemas

#### User
```json
{
  "id": "uuid",
  "clerk_user_id": "string",
  "email": "string",
  "name": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### Job
```json
{
  "id": "uuid",
  "company_id": "uuid",
  "title": "string",
  "department": "string",
  "location": "string",
  "salary_min": "number",
  "salary_max": "number",
  "fee_percent": "number",
  "status": "active | paused | filled",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### Candidate
```json
{
  "id": "uuid",
  "full_name": "string",
  "email": "string",
  "linkedin_url": "string | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### Application
```json
{
  "id": "uuid",
  "job_id": "uuid",
  "candidate_id": "uuid",
  "recruiter_id": "uuid",
  "stage": "submitted | screen | interview | offer | hired | rejected",
  "status": "active | inactive",
  "notes": "string | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### Placement
```json
{
  "id": "uuid",
  "application_id": "uuid",
  "job_id": "uuid",
  "candidate_id": "uuid",
  "recruiter_id": "uuid",
  "company_id": "uuid",
  "salary": "number",
  "fee_percent": "number",
  "fee_amount": "number",
  "recruiter_share": "number",
  "platform_share": "number",
  "status": "pending | confirmed | paid",
  "created_at": "timestamp"
}
```

#### Recruiter
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "status": "pending | active | suspended",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## Development Best Practices

### Adding Documentation to New Endpoints

When creating new endpoints, add schema documentation:

```typescript
app.get('/jobs/:id', {
  schema: {
    description: 'Get job details by ID',
    tags: ['jobs'],
    params: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Job ID' }
      },
      required: ['id']
    },
    response: {
      200: {
        description: 'Successful response',
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          company_id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['active', 'paused', 'filled'] }
        }
      },
      404: {
        description: 'Job not found',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  // Handler implementation
});
```

### Schema Validation

Fastify uses JSON Schema for validation. When you define schemas:

- Request validation happens automatically
- Invalid requests return 400 with validation errors
- Swagger UI shows the expected format
- TypeScript types can be generated from schemas

### Documentation Tags

Use consistent tag names across services:

- **users** - User management
- **organizations** - Organization management
- **jobs** - Job/role management
- **candidates** - Candidate management
- **applications** - Application pipeline
- **placements** - Placements and payouts
- **recruiters** - Recruiter profiles
- **subscriptions** - Billing and subscriptions

---

## Troubleshooting

### Swagger UI Not Loading

1. Check that the service is running:
   ```bash
   pnpm --filter @splits-network/<service-name> dev
   ```

2. Verify the port is correct (check `src/index.ts` for `baseConfig.port`)

3. Check logs for registration errors

### "Try It Out" Returns CORS Error

This is expected when calling from Swagger UI to a protected API Gateway endpoint. Either:

1. Use the gateway's Swagger UI instead: http://localhost:3000/docs
2. Set `CORS_ORIGIN=*` in gateway environment variables (dev only)
3. Use curl or Postman for testing cross-origin requests

### Authentication Token Issues

For Clerk JWT tokens:

1. Tokens expire after a set time (default 1 hour)
2. Get a fresh token from your frontend app
3. Copy the full token including the `Bearer ` prefix
4. Verify the token is valid: https://clerk.com/docs/backend-requests/handling/manual-jwt

### Missing Endpoint in Documentation

If an endpoint doesn't appear in Swagger UI:

1. Check that the route has a `schema` property
2. Verify the endpoint is registered in `registerRoutes()`
3. Check for TypeScript errors in the route file
4. Restart the service to reload changes

---

## CI/CD Integration

### Generating Static Documentation

To generate static HTML documentation for deployment:

```bash
# Install redoc-cli globally
npm install -g redoc-cli

# Generate HTML from OpenAPI JSON
curl http://localhost:3002/docs/json > openapi.json
redoc-cli bundle openapi.json -o api-docs.html
```

### Automated Testing

Use the OpenAPI spec for contract testing:

```bash
# Install openapi-validator
npm install -D jest-openapi

# Test that responses match the spec
import jestOpenAPI from 'jest-openapi';
jestOpenAPI('http://localhost:3002/docs/json');

test('GET /jobs returns valid response', async () => {
  const response = await fetch('http://localhost:3002/jobs');
  expect(response).toSatisfyApiSpec();
});
```

---

## Next Steps

1. **Add Request/Response Examples**: Enhance schemas with realistic examples
2. **Document Error Codes**: Add comprehensive error response schemas
3. **Generate Client SDKs**: Use openapi-generator to create TypeScript/JavaScript clients
4. **API Versioning**: Plan for `/v1/` prefixes as APIs mature
5. **Rate Limit Documentation**: Document rate limits per endpoint
6. **Webhook Documentation**: Add comprehensive webhook payload examples

---

## Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Fastify Swagger Plugin](https://github.com/fastify/fastify-swagger)
- [Fastify Swagger UI Plugin](https://github.com/fastify/fastify-swagger-ui)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [ReDoc](https://github.com/Redocly/redoc) - Alternative documentation renderer

---

**Last Updated**: December 14, 2025  
**Version**: 1.0

