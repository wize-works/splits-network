# Splits Network - Kubernetes Deployment Guide

This directory contains Kubernetes manifests for the Splits Network platform.

**⚠️ DEPLOYMENT POLICY:**  
All deployments to the AKS cluster MUST go through the GitHub Actions CI/CD pipeline.  
Manual deployments are **not permitted** to ensure:
- Environment consistency
- Audit trail and compliance
- Reproducible deployments
- Version control of all changes

## 📁 Directory Structure

```
infra/
├── k8s/                          # Kubernetes manifests
│   ├── redis/                    # Redis cache
│   │   └── deployment.yaml
│   ├── rabbitmq/                 # RabbitMQ message broker
│   │   └── deployment.yaml
│   ├── identity-service/
│   │   └── deployment.yaml
│   ├── ats-service/
│   │   └── deployment.yaml
│   ├── network-service/
│   │   └── deployment.yaml
│   ├── billing-service/
│   │   └── deployment.yaml
│   ├── notification-service/
│   │   └── deployment.yaml
│   ├── api-gateway/
│   │   └── deployment.yaml
│   ├── portal/
│   │   └── deployment.yaml
│   └── ingress.yaml              # Ingress routing rules
│
└── migrations/                    # Database migrations
```

## 🚀 Deployment Process

### GitHub Actions CI/CD (ONLY Deployment Method) ✅

**ALL deployments MUST go through GitHub Actions.**

### Initial Setup (One-Time)

1. **Configure GitHub Repository Secrets** (Settings → Secrets and variables → Actions):
   ```
   # Azure Infrastructure
   AZURE_CREDENTIALS          # Azure service principal JSON
   ACR_NAME                   # Azure Container Registry name (e.g., "splitsnetwork")
   ACR_LOGIN_SERVER           # ACR FQDN (e.g., "splitsnetwork.azurecr.io")
   AKS_CLUSTER_NAME           # AKS cluster name (e.g., "splits-network-aks")
   AKS_RESOURCE_GROUP         # Azure resource group (e.g., "splits-network-rg")
   
   # Supabase
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   
   # Clerk
   CLERK_PUBLISHABLE_KEY
   CLERK_SECRET_KEY
   CLERK_JWKS_URL
   
   # Stripe
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   STRIPE_PUBLISHABLE_KEY
   
   # Resend
   RESEND_API_KEY
   RESEND_API_KEY
   
   # OpenAI (for AI-assisted application screening)
   OPENAI_API_KEY
   ```

2. **Configure Azure Service Principal** (for GitHub Actions to access AKS):
   ```bash
   # Create service principal
   az ad sp create-for-rbac \
     --name "splits-network-github-actions" \
     --role contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/splits-network-rg \
     --sdk-auth
   
   # Copy the JSON output to GitHub secret: AZURE_CREDENTIALS
   ```

### Deploying Changes

**To deploy to production:**

```bash
# 1. Make your changes in a feature branch
git checkout -b feature/my-changes

# 2. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/my-changes

# 3. Create Pull Request on GitHub
# 4. After code review approval, merge to main
# 5. GitHub Actions automatically deploys to AKS
```

The workflow automatically:
- ✅ Builds all Docker images
- ✅ Pushes to Azure Container Registry  
- ✅ Creates/updates Kubernetes secrets
- ✅ Deploys services in correct dependency order
- ✅ Waits for health checks
- ✅ Reports deployment status

### Monitoring Deployments

View deployment progress:
- **GitHub Actions tab** → Click the running workflow
- **Deployment status** shown for each step
- **Failures** will stop the deployment and notify

## 🔍 Local Development

For local development, use **Docker Compose only**:

```bash
# Run locally with docker-compose
docker-compose up

# This uses local .env file, NOT production secrets
```

**Never test against production Kubernetes cluster directly.**

### Viewing Cluster State (Read-Only)

**Developers can view cluster state but cannot modify it:**

```powershell
# Get Azure credentials (if you have read access)
az aks get-credentials --resource-group splits-network-rg --name splits-network-aks

# View resources (read-only)
kubectl get pods -n splits-network
```

### View Service Endpoints

```powershell
kubectl get svc -n splits-network
```

### View Logs

```powershell
# Follow logs for a specific service
kubectl logs -f deployment/api-gateway -n splits-network

# View all logs for a service
kubectl logs deployment/ats-service -n splits-network --all-containers=true

# View logs for a specific pod
kubectl logs <pod-name> -n splits-network
```

### Describe Resources

```powershell
# Get detailed info about a pod
kubectl describe pod <pod-name> -n splits-network

# View events
kubectl get events -n splits-network --sort-by='.lastTimestamp'
```

### Port Forwarding (for debugging)

```powershell
# Forward API Gateway port to localhost
kubectl port-forward svc/api-gateway 3000:80 -n splits-network

# Forward Portal port to localhost
kubectl port-forward svc/portal 3100:80 -n splits-network
```

**⚠️ WARNING: Do NOT make changes to the cluster directly.**  
All changes must go through GitHub Actions to maintain consistency.

## 🚫 What NOT To Do

❌ **Never** run `kubectl apply` against production  
❌ **Never** run `kubectl delete` against production  
❌ **Never** run `kubectl edit` against production  
❌ **Never** run `kubectl exec` to modify files  
❌ **Never** manually update secrets or configmaps  

**If you need to make changes:**  
1. Update the YAML manifests in git
2. Create a pull request
3. Merge to main after review
4. Let GitHub Actions deploy

## 🔄 Rollback Process

If a deployment fails:

1. **Automatic** - GitHub Actions stops deployment on failure
2. **Revert the commit**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

## 🏗️ Architecture

### Service Ports

| Service | Internal Port | External Port | Protocol |
|---------|--------------|---------------|----------|
| Identity Service | 3001 | N/A | ClusterIP |
| ATS Service | 3002 | N/A | ClusterIP |
| Network Service | 3003 | N/A | ClusterIP |
| Billing Service | 3004 | N/A | ClusterIP |
| Notification Service | 3005 | N/A | ClusterIP |
| API Gateway | 3000 | 80 | LoadBalancer |
| Portal | 3100 | 80 | LoadBalancer |
| Redis | 6379 | N/A | ClusterIP |
| RabbitMQ | 5672/15672 | N/A | ClusterIP |

### Dependencies

```
Redis, RabbitMQ (infrastructure)
    ↓
Identity, ATS, Network, Billing, Notification Services
    ↓
API Gateway
    ↓
Portal
```

Services are deployed in this order to ensure dependencies are available.

## 📊 Resource Limits

### Backend Services
- **Requests**: 100m CPU, 128Mi memory
- **Limits**: 500m CPU, 512Mi memory
- **Replicas**: 2

### API Gateway & Portal
- **Requests**: 200m CPU, 256Mi memory
- **Limits**: 1000m CPU, 1Gi memory
- **Replicas**: 3

### Infrastructure
- **Redis**: 256Mi memory
- **RabbitMQ**: 512Mi memory

## 🔒 Security

### Secrets Management

All secrets are stored in Kubernetes Secrets and injected as environment variables.

**Never commit secrets to the repository.**

### Network Policies

Services communicate via ClusterIP services (internal only). Only API Gateway and Portal are exposed via LoadBalancer.

### HTTPS/TLS

The Ingress configuration includes cert-manager annotations for automatic TLS certificate provisioning.

## 🧪 Testing

### Health Checks

All services expose a `/health` endpoint:

```powershell
# Test API Gateway health
curl http://<api-gateway-external-ip>/health

# Test from within cluster
kubectl run curl --image=curlimages/curl -i --rm --restart=Never -- curl http://api-gateway/health -n splits-network
```

### Service Discovery

Test internal service communication:

```powershell
kubectl run test-pod --image=curlimages/curl -i --rm --restart=Never -n splits-network -- curl http://identity-service:3001/health
```

## 📝 Notes

- **Image Tags**: Use semantic versioning (e.g., `v1.0.0`, `v1.1.0`)
- **Namespace**: All resources deploy to `splits-network` namespace
- **Storage**: Redis and RabbitMQ use PersistentVolumeClaims (10Gi each)
- **Ingress**: Configured for Azure Application Gateway with Let's Encrypt TLS

## 🆘 Common Issues

### Pods in ImagePullBackOff

Check ACR credentials:
```powershell
kubectl describe pod <pod-name> -n splits-network
```

Create image pull secret if needed:
```powershell
kubectl create secret docker-registry acr-secret \
    --docker-server=splitsnetwork.azurecr.io \
    --docker-username=<username> \
    --docker-password=<password> \
    --namespace=splits-network
```

### Pods in CrashLoopBackOff

Check logs for errors:
```powershell
kubectl logs <pod-name> -n splits-network --previous
```

Common causes:
- Missing environment variables/secrets
- Database connection issues
- Port conflicts

### Service Not Responding

1. Check pod status: `kubectl get pods -n splits-network`
2. Check service endpoints: `kubectl get endpoints -n splits-network`
3. Check logs: `kubectl logs deployment/<service-name> -n splits-network`
4. Test connectivity: Port forward and test locally

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Splits Network Architecture](../docs/splits-network-architecture.md)
- [Phase 1 PRD](../docs/splits-network-phase1-prd.md)
