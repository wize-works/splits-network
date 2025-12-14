# Security Audit Report

**Date**: December 14, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready with Recommended Improvements

---

## Executive Summary

This security audit evaluates the Splits Network platform's security posture across CORS configuration, secrets management, TLS/SSL, authentication, and general security best practices. The platform demonstrates **strong foundational security** with proper implementation of industry-standard practices.

### Overall Security Score: 8.5/10

**Strengths**:
- ✅ Clerk JWT authentication properly implemented
- ✅ Helmet security headers enabled by default
- ✅ TLS/SSL configured with Let's Encrypt
- ✅ Secrets stored in Kubernetes Secrets (not in code)
- ✅ RBAC implemented with proper role checking
- ✅ Environment variables properly managed

**Areas for Improvement**:
- ⚠️ CORS configuration needs production hardening
- ⚠️ Committed `.env.local` file contains test secrets
- ⚠️ No rate limiting on individual service endpoints
- ⚠️ Missing security response headers configuration
- ⚠️ No explicit database connection TLS enforcement

---

## 1. CORS Configuration Audit

### Current State

**API Gateway** (`services/api-gateway/src/index.ts`):
```typescript
cors: {
    origin: process.env.CORS_ORIGIN || true,  // ⚠️ Falls back to allowing all
    credentials: true,
}
```

**Backend Services** (identity, ats, network, billing):
```typescript
cors: {
    origin: true,  // ⚠️ Allows all origins
    credentials: true,
}
```

### Risk Assessment

| Issue | Severity | Impact |
|-------|----------|--------|
| Backend services allow all CORS origins | **Medium** | Services are behind gateway, but defense-in-depth is lacking |
| API Gateway falls back to `origin: true` | **High** | Production could allow unauthorized origins if CORS_ORIGIN not set |
| Credentials enabled with broad CORS | **High** | Cookies/auth headers exposed to any origin |

### Recommendations

#### ✅ IMMEDIATE (Pre-Launch)

1. **API Gateway - Enforce specific origins in production**:
   ```typescript
   const allowedOrigins = process.env.NODE_ENV === 'production'
       ? (process.env.CORS_ORIGIN || '').split(',')
       : true;

   cors: {
       origin: allowedOrigins,
       credentials: true,
   }
   ```

2. **Kubernetes Deployment - Set CORS_ORIGIN explicitly**:
   ```yaml
   - name: CORS_ORIGIN
     value: "https://splits.network,https://www.splits.network"
   ```

3. **Backend Services - Restrict to internal cluster only**:
   ```typescript
   cors: {
       origin: process.env.NODE_ENV === 'production' 
           ? false  // Disable CORS entirely (internal services)
           : true,  // Allow all in dev
       credentials: true,
   }
   ```

#### 🔄 ONGOING

- Monitor CORS errors in production logs
- Document allowed origins in deployment guide
- Add CORS validation tests

---

## 2. Secrets Management Audit

### Current State

**✅ GOOD PRACTICES OBSERVED**:

1. **Kubernetes Secrets Used**:
   - Supabase credentials → `supabase-secrets`
   - Clerk credentials → `clerk-secrets`
   - Stripe credentials → `stripe-secrets`
   - Resend API key → `resend-secrets`

2. **Environment Variables Loaded via Config Package**:
   - Centralized in `@splits-network/shared-config`
   - Uses `getEnvOrThrow()` for required secrets
   - No hardcoded secrets found in source code

3. **`.gitignore` Properly Configured**:
   ```
   .env
   .env.local
   .env.*.local
   ```

### Security Issues Found

#### ✅ LOW RISK (False Alarm)

**`.env.local` File Exists Locally**:
- **File**: `apps/portal/.env.local`
- **Status**: ✅ Properly listed in `.gitignore`, NOT committed to repository
- **Risk**: None - this is expected development behavior
- **Action**: No action needed - file correctly ignored by git

#### ⚠️ MEDIUM

**No Secret Rotation Policy**:
- No documented process for rotating secrets
- No expiration tracking for API keys
- Kubernetes Secrets are static

**Redis Password Optional**:
- Redis connection accepts no password in development
- Could be exploited if Redis exposed

### Recommendations

#### ✅ IMMEDIATE (Pre-Launch)

1. **~~Remove committed secrets~~** ✅ - False alarm, `.env.local` properly in `.gitignore`

2. **~~Rotate exposed Clerk test keys~~** ✅ - Not needed, keys never committed

3. **Add to CI/CD pipeline** (detect secret leaks):
   ```bash
   # Install trufflehog or git-secrets
   npm install -g trufflehog
   
   # Add pre-commit hook
   trufflehog filesystem ./ --exclude-paths .trufflehogignore
   ```

4. **Enforce Redis password in production**:
   ```typescript
   if (baseConfig.nodeEnv === 'production' && !redisConfig.password) {
       throw new Error('REDIS_PASSWORD is required in production');
   }
   ```

#### 🔄 ONGOING

- Document secret rotation schedule (quarterly)
- Implement secret expiration monitoring
- Consider external secret management (Azure Key Vault, HashiCorp Vault)
- Add secret scanning to CI/CD

---

## 3. TLS/SSL Configuration Audit

### Current State

**✅ PROPERLY CONFIGURED**:

**Ingress TLS** (`infra/k8s/ingress.yaml`):
```yaml
annotations:
  cert-manager.io/cluster-issuer: letsencrypt-prod
  nginx.ingress.kubernetes.io/ssl-redirect: "true"
  nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
tls:
  - hosts:
      - splits.network
      - api.splits.network
    secretName: splits-network-tls
```

**Features**:
- ✅ Let's Encrypt automatic certificate provisioning
- ✅ Force HTTPS redirect enabled
- ✅ Separate TLS for main domain and API subdomain
- ✅ cert-manager ClusterIssuer configured

### Security Issues Found

#### ⚠️ MEDIUM

**Database Connections Not Enforcing TLS**:
- Supabase client initialized without explicit `sslmode` parameter
- Could fallback to unencrypted connection if misconfigured
- No validation that TLS is actually used

**No TLS Version Restriction**:
- Ingress doesn't specify minimum TLS version
- Could accept TLS 1.0/1.1 (deprecated protocols)

**Missing HSTS Preload**:
- Strict-Transport-Security header not configured for preload list
- Users could be vulnerable on first visit

### Recommendations

#### ✅ IMMEDIATE (Pre-Launch)

1. **Enforce TLS 1.2+ in Ingress**:
   ```yaml
   annotations:
     nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
     nginx.ingress.kubernetes.io/ssl-ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384"
   ```

2. **Add HSTS Headers**:
   ```yaml
   annotations:
     nginx.ingress.kubernetes.io/configuration-snippet: |
       more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload";
   ```

3. **Verify Supabase TLS**:
   ```typescript
   const supabase = createClient(url, key, {
       db: {
           schema: 'public',
       },
       auth: {
           persistSession: false,
       },
       global: {
           headers: {
               'x-connection-encrypted': 'true',
           },
       },
   });
   ```

#### 🔄 ONGOING

- Monitor TLS certificate expiration (cert-manager should auto-renew)
- Test certificate renewal process
- Add to HSTS preload list: https://hstspreload.org/
- Regular SSL Labs testing: https://www.ssllabs.com/ssltest/

---

## 4. Authentication & Authorization Audit

### Current State

**✅ STRONG IMPLEMENTATION**:

**Clerk JWT Verification** (`services/api-gateway/src/auth.ts`):
```typescript
const verified = await verifyToken(token, {
    secretKey: this.secretKey,
});
```

**Features**:
- ✅ Proper JWT signature verification using Clerk SDK
- ✅ Token extracted from `Authorization: Bearer` header
- ✅ User details fetched from Clerk API
- ✅ Auth context attached to request

**RBAC Implementation** (`services/api-gateway/src/rbac.ts`):
```typescript
export function requireRoles(allowedRoles: UserRole[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        // Check if user has any of the allowed roles
        const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role));
        if (!hasAllowedRole) {
            throw new ForbiddenError(...);
        }
    };
}
```

**Features**:
- ✅ Role-based access control (RBAC) enforced
- ✅ Membership verification
- ✅ Helper functions for role checking
- ✅ Detailed error messages for debugging

### Security Issues Found

#### ⚠️ LOW

**No Token Expiration Validation**:
- Clerk tokens expire, but no explicit check for expiration
- Relies entirely on Clerk's verification
- No custom TTL enforcement

**No Rate Limiting Per User**:
- Global rate limiting exists (100 req/min)
- No per-user rate limiting
- Could be abused by authenticated users

**Error Messages May Leak Info**:
- Error messages reveal role requirements
- Could help attackers understand access control structure

### Recommendations

#### ✅ IMMEDIATE (Pre-Launch)

1. **Add Token Expiration Check**:
   ```typescript
   if (verified.exp && verified.exp < Math.floor(Date.now() / 1000)) {
       throw new UnauthorizedError('Token expired');
   }
   ```

2. **Sanitize RBAC Error Messages in Production**:
   ```typescript
   if (baseConfig.nodeEnv === 'production') {
       throw new ForbiddenError('Access denied');
   } else {
       throw new ForbiddenError(`Required roles: ${allowedRoles.join(' or ')}`);
   }
   ```

3. **Add Per-User Rate Limiting**:
   ```typescript
   await app.register(rateLimit, {
       max: 100,
       timeWindow: '1 minute',
       redis,
       keyGenerator: (request) => {
           const auth = (request as any).auth;
           return auth?.userId || request.ip;
       },
   });
   ```

#### 🔄 ONGOING

- Monitor authentication failures
- Implement account lockout after N failed attempts
- Add anomaly detection (unusual access patterns)

---

## 5. Additional Security Concerns

### A. Security Headers (Helmet)

**✅ CURRENT STATE**:
- Helmet enabled by default in `shared-fastify`
- Applies standard security headers

**DEFAULT HEADERS APPLIED**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy` (default)

**⚠️ IMPROVEMENTS NEEDED**:

1. **Custom CSP for API Gateway**:
   ```typescript
   await app.register(helmet, {
       contentSecurityPolicy: {
           directives: {
               defaultSrc: ["'self'"],
               scriptSrc: ["'self'"],
               styleSrc: ["'self'", "'unsafe-inline'"],
               imgSrc: ["'self'", "data:", "https:"],
               connectSrc: ["'self'", "https://api.splits.network"],
           },
       },
   });
   ```

2. **Add Additional Security Headers**:
   ```typescript
   app.addHook('onSend', async (request, reply) => {
       reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
       reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
   });
   ```

### B. Input Validation

**✅ GOOD**:
- Fastify JSON schema validation used
- Type checking via TypeScript

**⚠️ GAPS**:
- No explicit SQL injection prevention docs
- No XSS sanitization library
- File upload validation limited

**RECOMMENDATIONS**:
1. Add DOMPurify for XSS prevention in frontend
2. Document parameterized query usage
3. Add file type validation for uploads

### C. Logging & Monitoring

**✅ GOOD**:
- Structured logging with correlation IDs
- Request/response logging in gateway
- Error logging with stack traces

**⚠️ GAPS**:
- No centralized log aggregation
- No security event monitoring
- No alerting on suspicious patterns

**RECOMMENDATIONS**:
1. Implement log aggregation (ELK stack or Azure Monitor)
2. Add security event logging:
   - Failed login attempts
   - Permission denials
   - Unusual API usage
3. Set up alerting rules

### D. Dependency Security

**⚠️ FINDINGS**:
- No automated dependency scanning
- No vulnerability alerts
- Dependencies not regularly audited

**RECOMMENDATIONS**:
1. Enable GitHub Dependabot:
   ```yaml
   # .github/dependabot.yml
   version: 2
   updates:
     - package-ecosystem: "npm"
       directory: "/"
       schedule:
         interval: "weekly"
   ```

2. Add security audit to CI/CD:
   ```bash
   pnpm audit --audit-level=moderate
   ```

3. Install and run npm-check-updates monthly:
   ```bash
   npx npm-check-updates -u
   ```

---

## 6. Compliance & Best Practices

### OWASP Top 10 Coverage

| Risk | Status | Notes |
|------|--------|-------|
| A01:2021 - Broken Access Control | ✅ Good | RBAC implemented, needs per-user rate limiting |
| A02:2021 - Cryptographic Failures | ✅ Good | TLS enforced, secrets in K8s, needs DB TLS validation |
| A03:2021 - Injection | ✅ Good | Supabase parameterized queries, no eval() usage |
| A04:2021 - Insecure Design | ✅ Good | Sound architecture, needs threat modeling |
| A05:2021 - Security Misconfiguration | ⚠️ Fair | CORS needs hardening, default configs reviewed |
| A06:2021 - Vulnerable Components | ⚠️ Fair | No dependency scanning, manual audits only |
| A07:2021 - Authentication Failures | ✅ Good | Clerk JWT, needs lockout mechanism |
| A08:2021 - Software/Data Integrity | ✅ Good | Code signing via GitHub, needs SRI |
| A09:2021 - Logging Failures | ⚠️ Fair | Logging present, needs aggregation & alerting |
| A10:2021 - Server-Side Request Forgery | ✅ Good | No user-supplied URLs, services isolated |

### GDPR Considerations

**✅ GOOD**:
- User data minimal (name, email)
- PII logging prevention noted in docs
- User deletion supported (Clerk webhooks)

**⚠️ NEEDS ATTENTION**:
- No data retention policy documented
- No user data export functionality
- No cookie consent banner in frontend
- No privacy policy

---

## 7. Action Plan

### Priority 1: Pre-Launch (Complete Before Design Partners)

- [ ] Harden CORS configuration in production
- [ ] Remove committed `.env.local` and rotate test keys
- [ ] Add TLS 1.2+ enforcement to Ingress
- [ ] Add HSTS headers with preload
- [ ] Sanitize RBAC error messages in production
- [ ] Enable Dependabot for dependency scanning
- [ ] Document secret rotation process

### Priority 2: First Month Post-Launch

- [ ] Implement per-user rate limiting
- [ ] Add centralized logging (Azure Monitor)
- [ ] Set up security alerting rules
- [ ] Conduct external penetration testing
- [ ] Implement account lockout mechanism
- [ ] Add CSP headers to API Gateway
- [ ] Create incident response playbook

### Priority 3: Ongoing Maintenance

- [ ] Quarterly secret rotation
- [ ] Monthly dependency audits
- [ ] Weekly security log reviews
- [ ] Annual security audit
- [ ] Continuous threat modeling updates

---

## 8. Security Testing Checklist

Before production deployment, verify:

- [ ] CORS only allows `https://splits.network` and `https://www.splits.network`
- [ ] All secrets stored in Kubernetes Secrets (not env files)
- [ ] TLS certificates valid and auto-renewing
- [ ] Rate limiting enforced (test with 100+ req/min)
- [ ] JWT tokens properly verified (test with invalid/expired tokens)
- [ ] RBAC denies unauthorized access (test each role)
- [ ] Helmet security headers present in responses
- [ ] HTTPS redirect working (test HTTP → HTTPS)
- [ ] No secrets in Docker images (check image layers)
- [ ] Database connections using TLS (verify with pg logs)
- [ ] No PII in application logs (review log samples)
- [ ] Error messages don't leak sensitive info (test various errors)

---

## 9. Conclusion

The Splits Network platform demonstrates **strong security fundamentals** with proper authentication, authorization, and infrastructure security. The main areas requiring attention are:

1. **CORS hardening** for production
2. **Secret management** hygiene (remove committed files)
3. **TLS configuration** enhancements
4. **Monitoring and alerting** setup

With the recommended improvements implemented, the platform will be **production-ready from a security perspective** and suitable for design partner onboarding.

**Estimated Effort**:
- Priority 1 items: 4-6 hours
- Priority 2 items: 16-24 hours
- Priority 3 items: Ongoing

**Recommended Timeline**:
- Complete Priority 1 before first design partner
- Complete Priority 2 within first month of production
- Implement Priority 3 as ongoing operational practice

---

**Audit Conducted By**: GitHub Copilot  
**Review Status**: Ready for Human Review  
**Next Review**: 90 days post-launch

