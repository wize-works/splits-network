# API Response Format Standard

This document defines the standard response format for all Splits Network APIs.

**Version**: 1.0  
**Last Updated**: December 18, 2025  
**Status**: STANDARD (all APIs must comply)

---

## Executive Summary

All Splits Network backend services MUST return responses in a consistent, predictable format. This ensures:
- **Client simplicity**: Frontend code can unwrap responses uniformly
- **Type safety**: TypeScript interfaces can be reliably defined
- **Debugging ease**: Response structure is always known
- **API composability**: Gateway can proxy responses without transformation

---

## Current State Analysis

### Survey Results (December 2025)

We audited all service endpoints across the monorepo:

**Services Reviewed**:
- ✅ **identity-service**: All endpoints compliant
- ✅ **ats-service**: All endpoints compliant
- ✅ **network-service**: All endpoints compliant
- ✅ **billing-service**: All endpoints compliant
- ✅ **notification-service**: N/A (event-driven, no REST endpoints)
- ⚠️ **api-gateway**: Pass-through proxying - inherits backend format

**Pattern Found**: **100% of backend services** already use the wrapped format:

```typescript
reply.send({ data: <payload> })
```

**Examples from production code**:
- [identity-service/src/routes/users/routes.ts:26](../../services/identity-service/src/routes/users/routes.ts#L26)
- [ats-service/src/routes/companies/routes.ts:15](../../services/ats-service/src/routes/companies/routes.ts#L15)
- [network-service/src/routes/recruiters/routes.ts:22](../../services/network-service/src/routes/recruiters/routes.ts#L22)
- [billing-service/src/routes/subscriptions/routes.ts:20](../../services/billing-service/src/routes/subscriptions/routes.ts#L20)

---

## The Standard: Wrapped Data Envelope

### Success Responses

All successful API responses MUST use this format:

```typescript
{
  "data": <payload>
}
```

- **`data`**: The actual response payload (object, array, primitive, or null)
- **No additional metadata** in the root (use headers for correlation IDs, etc.)

### Examples

#### Single Object Response

```json
{
  "data": {
    "id": "11ce3517-2925-4f62-8de2-3dceec3ec1f2",
    "user_id": "41a7e453-e648-4368-aab0-1ee48eedf5b9",
    "bio": "Experienced tech recruiter",
    "status": "active",
    "created_at": "2025-12-01T10:30:00Z"
  }
}
```

#### Array Response

```json
{
  "data": [
    { "id": "1", "name": "Company A" },
    { "id": "2", "name": "Company B" }
  ]
}
```

#### Empty Array Response

```json
{
  "data": []
}
```

#### Primitive Response

For simple boolean/status checks:

```json
{
  "data": { "is_active": true }
}
```

**Note**: While technically you could return `{ "data": true }`, prefer wrapping primitives in an object for clarity and extensibility.

#### Null Response

For endpoints that may return nothing (optional lookups):

```json
{
  "data": null
}
```

**Better**: Return `404 Not Found` instead of `200` with `null` data.

---

## Error Responses

Error responses MUST use a different format to distinguish them from successful responses.

### Standard Error Format

```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details"?: any  // Optional additional context
  }
}
```

### HTTP Status Codes

- **400 Bad Request**: Validation errors, malformed input
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource does not exist
- **409 Conflict**: Duplicate resource, state conflict
- **500 Internal Server Error**: Unhandled server error

### Error Examples

#### Validation Error (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "user_id is required",
    "details": {
      "field": "user_id",
      "constraint": "required"
    }
  }
}
```

#### Not Found (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Recruiter not found",
    "details": {
      "resource": "Recruiter",
      "id": "invalid-id-123"
    }
  }
}
```

#### Authentication Error (401)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authorization header"
  }
}
```

---

## Implementation Patterns

### Backend Services (Fastify)

All services use Fastify with the following patterns:

#### ✅ Correct Implementation

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

app.get('/recruiters/:id', async (request, reply) => {
    const recruiter = await service.getRecruiterById(request.params.id);
    return reply.send({ data: recruiter });
});

app.post('/recruiters', async (request, reply) => {
    const recruiter = await service.createRecruiter(request.body);
    return reply.status(201).send({ data: recruiter });
});
```

#### ❌ Incorrect Implementation

```typescript
// WRONG: Unwrapped response
return reply.send(recruiter);

// WRONG: Custom wrapper
return reply.send({ recruiter: recruiter });

// WRONG: Nested data
return reply.send({ success: true, data: recruiter });
```

### API Gateway (Proxy Pattern)

The API Gateway uses `ServiceClient` to proxy requests to backend services. It returns responses **as-is** from backend services:

```typescript
// From services/api-gateway/src/routes/recruiter-candidates/routes.ts
app.get('/api/network/recruiters/:id', async (request, reply) => {
    const data = await networkService().get(
        `/recruiters/${request.params.id}`,
        undefined,
        correlationId
    );
    return reply.send(data);  // Already has { data: ... } format
});
```

**Key Point**: Gateway does NOT transform responses. Backend services MUST send wrapped responses.

### Frontend Client (Next.js)

Frontend API clients MUST unwrap the `data` envelope:

```typescript
// apps/portal/src/lib/api.ts or apps/candidate/src/lib/api.ts
export async function fetchApi<T>(
    endpoint: string,
    options?: RequestInit,
    authToken?: string | null
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        // Handle error responses
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }

    const json = await response.json();
    
    // Unwrap the data envelope
    if (json && typeof json === 'object' && 'data' in json) {
        return json.data as T;
    }
    
    return json as T;
}
```

**Note**: This unwrapping logic assumes ALL successful responses have `{ data: ... }` format.

---

## Edge Cases & Special Scenarios

### Pagination

For paginated responses, include pagination metadata OUTSIDE the data envelope:

```typescript
{
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Status**: Not yet implemented. For Phase 1, pagination is out of scope.

### File Downloads

For binary file responses (CSV exports, PDFs, etc.), use appropriate `Content-Type` headers and return raw binary data WITHOUT JSON wrapping:

```typescript
reply
    .header('Content-Type', 'text/csv')
    .header('Content-Disposition', 'attachment; filename="export.csv"')
    .send(csvBuffer);
```

### Webhooks (Stripe, Clerk, etc.)

Webhook handlers may return minimal responses per third-party specs:

```typescript
// Stripe webhook response
return reply.send({ received: true });
```

These are **exceptions** to the standard format since they're not consumed by our frontend.

### Health Checks / Readiness Probes

System endpoints like `/health` or `/ready` may use simplified formats:

```json
{
  "status": "ok",
  "timestamp": "2025-12-18T10:00:00Z"
}
```

These are infrastructure endpoints, not business APIs.

---

## Migration Checklist

If you encounter a non-compliant endpoint:

- [ ] Identify the service and route file
- [ ] Verify the response format (check actual response with curl/Postman)
- [ ] Update the endpoint to wrap response in `{ data: ... }`
- [ ] Update frontend client code to unwrap the response
- [ ] Add test coverage for the new format
- [ ] Document in service README if it's a breaking change

---

## Rationale & Design Decisions

### Why Wrap Responses?

1. **Extensibility**: Future metadata (pagination, warnings, deprecation notices) can be added without breaking clients
2. **Consistency**: All responses have the same top-level structure
3. **Error Differentiation**: `{ data: ... }` vs `{ error: ... }` is unambiguous
4. **Industry Standard**: Many mature APIs (Stripe, GitHub, Google) use envelope patterns

### Why Not Use Status Codes Alone?

While HTTP status codes indicate success/failure, the response body structure must also be predictable. Clients should not need to inspect status codes to determine how to parse the body.

### Why Not Versioned Envelopes?

Considered:
```json
{ "version": "1.0", "data": {...} }
```

Rejected because:
- Adds complexity for minimal benefit in Phase 1
- API versioning should be done via URL path (`/v1/`, `/v2/`) or headers
- Envelope format itself is unlikely to change

---

## Enforcement

### Code Review

All PRs adding or modifying API endpoints MUST:
- Follow this format
- Include examples in PR description
- Update API documentation

### Automated Testing

Shared test utilities should validate response format:

```typescript
// packages/shared-testing/src/api-test-helpers.ts (future)
export function expectWrappedResponse(response: any) {
    expect(response).toHaveProperty('data');
    expect(response).not.toHaveProperty('error');
}
```

### Linting (Future)

Consider ESLint rule to flag `reply.send()` calls without `{ data: }` wrapper.

---

## FAQ

**Q: What if the backend service returns an array directly?**  
A: Wrap it: `{ data: [...] }`. The client will unwrap to get the array.

**Q: What if I need to return multiple top-level properties?**  
A: Put them inside the `data` object:
```json
{
  "data": {
    "user": {...},
    "preferences": {...}
  }
}
```

**Q: Can I add custom properties to the root?**  
A: No. Use `data` for payload, headers for metadata. If you need request-specific metadata, add it to the `data` object.

**Q: What about streaming responses?**  
A: Streaming (SSE, WebSockets) is outside the scope of this REST API standard.

**Q: Should the API Gateway unwrap and re-wrap responses?**  
A: No. Gateway should pass through responses as-is. Backend services are responsible for correct format.

---

## References

- [Splits Network Architecture](../splits-network-architecture.md)
- [Fastify Documentation](https://fastify.dev/)
- [Form Controls Guidance](./form-controls.md) (frontend standards)
- [User Roles and Permissions](./user-roles-and-permissions.md) (RBAC standards)

---

**Document Owner**: Platform Team  
**Review Cycle**: Quarterly  
**Next Review**: March 2026
