# OpenAI API Key Configuration

## Summary

Successfully configured OPENAI_API_KEY environment variable across all deployment environments for the AI-assisted application screening feature.

## Changes Made

### 1. Docker Compose (Local Development)
**File:** `docker-compose.yml`
- Added `OPENAI_API_KEY: ${OPENAI_API_KEY}` to `ats-service` environment variables
- Added `OPENAI_MODEL: ${OPENAI_MODEL:-gpt-3.5-turbo}` for model selection (defaults to cheaper model for testing)
- Value will be read from `.env` file in project root (already configured by user)

### 2. Kubernetes Deployment (Production)
**File:** `infra/k8s/ats-service/deployment.yaml`
- Added OPENAI_API_KEY environment variable referencing Kubernetes secret:
  ```yaml
  - name: OPENAI_API_KEY
    valueFrom:
      secretKeyRef:
        name: openai-secrets
        key: api-key
  - name: OPENAI_MODEL
    value: "gpt-3.5-turbo"  # Change to gpt-4-turbo for production
  ```

### 3. AI Review Service
**File:** `services/ats-service/src/services/ai-review/service.ts`
- Model selection now configurable via `OPENAI_MODEL` environment variable
- Defaults to `gpt-3.5-turbo` (cheaper for testing, ~10x less expensive than GPT-4)
- Can be changed to `gpt-4-turbo` or `gpt-4-turbo-2024-04-09` for production
**File:** `.github/workflows/deploy-aks.yml`
- Added step to create `openai-secrets` Kubernetes secret from GitHub repository secret
- Secret automatically created/updated on every deployment

### 4. Documentation
**File:** `infra/README.md`
- Added `OPENAI_API_KEY` to the list of required GitHub repository secrets
- Documented its purpose: "for AI-assisted application screening"

## Setup Requirements

### ✅ Completed
- [x] Local `.env` file contains OPENAI_API_KEY (user confirmed)
- [x] GitHub repository secret OPENAI_API_KEY set (user confirmed)
- [x] Docker Compose configuration updated
- [x] Kubernetes deployment manifest updated
- [x] GitHub Actions workflow updated
- [x] Documentation updated

### Next Deployment
On the next push to `main` branch or manual workflow dispatch:
1. GitHub Actions will automatically create/update the `openai-secrets` Kubernetes secret
2. ATS service deployment will have access to OPENAI_API_KEY
3. AI review functionality will be fully operational in production

## Verification Commands

### Local Development
```bash
# Verify variable is available in ats-service container
docker-compose exec ats-service env | grep OPENAI_API_KEY
```

### Production (after deployment)
```powershell
# Verify Kubernetes secret exists
kubectl get secret openai-secrets -n splits-network

# Verify ats-service has the environment variable
kubectl exec -n splits-network deployment/ats-service -- env | grep OPENAI_API_KEY
```

## Security Notes

- ✅ API key is stored in GitHub Secrets (encrypted at rest)
- ✅ API key is stored in Kubernetes Secrets (base64 encoded)
- ✅ API key is never committed to version control
- ✅ API key is injected at runtime via environment variables
- ⚠️ Ensure OPENAI_API_KEY has appropriate rate limits and budget alerts configured in OpenAI dashboard

## Cost Monitoring

### Model Pricing (as of December 2024)

**GPT-3.5-Turbo (Testing/Development)**
- Input: $0.0005 per 1K tokens (~$0.001 per review)
- Output: $0.0015 per 1K tokens (~$0.003 per review)
- **Total per review: ~$0.004 (less than 1 cent)**
- ~10x cheaper than GPT-4

**GPT-4-Turbo (Production)**
- Input: $0.01 per 1K tokens (~$0.02 per review)
- Output: $0.03 per 1K tokens (~$0.06 per review)  
- **Total per review: ~$0.08**

### Configuration

**For Testing/Development (Default):**
```bash
# In .env file
OPENAI_MODEL=gpt-3.5-turbo
```

**For Production:**
```bash
# In .env file or Kubernetes deployment
OPENAI_MODEL=gpt-4-turbo
# or
OPENAI_MODEL=gpt-4-turbo-2024-04-09
```

### Monitoring
- Monitor usage in OpenAI dashboard: https://platform.openai.com/usage
- Set up budget alerts in OpenAI to prevent unexpected charges
- Expected monthly cost based on volume documented in `docs/implementation-plans/ai-assisted-application-flow-COMPLETED.md`

## Related Documentation

- AI Review Implementation: `docs/implementation-plans/ai-assisted-application-flow-COMPLETED.md`
- Deployment Guide: `infra/README.md`
- ATS Service: `services/ats-service/README.md`
