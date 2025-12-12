# Supabase Vault Integration

Splits Network uses [Supabase Vault](https://supabase.com/docs/guides/database/vault) for secure secret management. Vault stores API keys and other sensitive configuration encrypted at rest in Postgres using authenticated encryption.

## Overview

Instead of storing secrets in environment variables or `.env` files (which can accidentally leak), we store them encrypted in Supabase Vault. Services retrieve secrets at runtime using the service role key.

### Benefits

- **Encrypted at rest**: Secrets are encrypted using authenticated encryption (AES-GCM via libsodium)
- **Encrypted in transit**: Secrets remain encrypted in backups and replication streams
- **Centralized management**: Update secrets in one place via Supabase Studio or SQL
- **Audit trail**: Track when secrets were created and updated
- **No file-based secrets**: Eliminates risk of committing secrets to version control

## Setup

### 1. Run the Vault Migration

The migration creates the vault setup and helper functions:

```bash
# Using Supabase CLI
supabase db push --file infra/migrations/001_setup_vault.sql

# Or via psql
psql $DATABASE_URL < infra/migrations/001_setup_vault.sql
```

### 2. Store Your Secrets

You can add secrets via Supabase Studio UI or SQL:

#### Via Supabase Studio

1. Go to **Database** → **Vault** in your Supabase dashboard
2. Click **New Secret**
3. Enter the secret name and value
4. Save

#### Via SQL

Connect to your database and run:

```sql
-- Store Clerk secrets
SELECT vault.create_secret(
    'pk_test_...', -- Your actual Clerk publishable key
    'clerk_publishable_key',
    'Clerk publishable key for authentication'
);

SELECT vault.create_secret(
    'sk_test_...', -- Your actual Clerk secret key
    'clerk_secret_key',
    'Clerk secret key for server-side authentication'
);

-- Store Stripe secrets
SELECT vault.create_secret(
    'sk_test_...', -- Your actual Stripe secret key
    'stripe_secret_key',
    'Stripe secret key for billing operations'
);

-- Store Resend secret
SELECT vault.create_secret(
    're_...', -- Your actual Resend API key
    'resend_api_key',
    'Resend API key for transactional email'
);
```

### 3. Environment Variables

Your `.env` file now only needs:

```bash
# Database connection (required for Vault access)
SUPABASE_URL=https://einhgkqmxbkgdohwfayv.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...

# Non-secret configuration
NODE_ENV=development
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URL=amqp://localhost:5672
RESEND_FROM_EMAIL=noreply@splits.network
```

No more `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, etc. in your `.env` files!

## Usage in Code

### Option 1: Async Vault Loaders (Recommended)

Use the `*FromVault()` functions for loading secrets:

```typescript
import { loadClerkConfigFromVault, loadStripeConfigFromVault } from '@splits-network/shared-config';

async function initializeService() {
    // Load secrets from Vault at startup
    const clerkConfig = await loadClerkConfigFromVault();
    const stripeConfig = await loadStripeConfigFromVault();
    
    // Use the config
    const authMiddleware = new AuthMiddleware(clerkConfig.secretKey);
    const stripe = new Stripe(stripeConfig.secretKey);
}
```

### Option 2: Direct Vault Access

For more control, use the VaultClient directly:

```typescript
import { getVaultClient, getSecret } from '@splits-network/shared-config';

async function example() {
    // Get a single secret
    const apiKey = await getSecret('resend_api_key');
    
    // Get multiple secrets at once
    const vault = getVaultClient();
    const secrets = await vault.getSecrets([
        'clerk_secret_key',
        'stripe_secret_key',
        'resend_api_key'
    ]);
    
    console.log(secrets.clerk_secret_key);
}
```

### Option 3: Environment Variables (Development)

For local development, you can still use environment variables. The sync loaders (`loadClerkConfig()`, etc.) will work as before:

```typescript
import { loadClerkConfig } from '@splits-network/shared-config';

// Works with .env file for local dev
const clerkConfig = loadClerkConfig();
```

## Service Integration Examples

### API Gateway

```typescript
// services/api-gateway/src/index.ts
import { loadClerkConfigFromVault } from '@splits-network/shared-config';

async function main() {
    const baseConfig = loadBaseConfig('api-gateway');
    const clerkConfig = await loadClerkConfigFromVault();
    
    const authMiddleware = new AuthMiddleware(clerkConfig.secretKey);
    // ... rest of setup
}
```

### Billing Service

```typescript
// services/billing-service/src/index.ts
import { loadStripeConfigFromVault } from '@splits-network/shared-config';
import Stripe from 'stripe';

async function main() {
    const baseConfig = loadBaseConfig('billing-service');
    const stripeConfig = await loadStripeConfigFromVault();
    
    const stripe = new Stripe(stripeConfig.secretKey, {
        apiVersion: '2023-10-16',
    });
    // ... rest of setup
}
```

### Notification Service

```typescript
// services/notification-service/src/index.ts
import { loadResendConfigFromVault } from '@splits-network/shared-config';
import { Resend } from 'resend';

async function main() {
    const baseConfig = loadBaseConfig('notification-service');
    const resendConfig = await loadResendConfigFromVault();
    
    const resend = new Resend(resendConfig.apiKey);
    // ... rest of setup
}
```

## Caching

The VaultClient automatically caches secrets for 5 minutes to reduce database queries. You can clear the cache if needed:

```typescript
import { getVaultClient } from '@splits-network/shared-config';

const vault = getVaultClient();

// Clear specific secret
vault.clearCache('stripe_secret_key');

// Clear all secrets
vault.clearCache();
```

## Listing Available Secrets

To see what secrets are available (names only, not values):

```typescript
import { getVaultClient } from '@splits-network/shared-config';

const vault = getVaultClient();
const secrets = await vault.listSecrets();

console.log(secrets);
// [
//   { name: 'clerk_secret_key', description: 'Clerk secret key for server-side authentication' },
//   { name: 'stripe_secret_key', description: 'Stripe secret key for billing operations' },
//   ...
// ]
```

## Updating Secrets

### Via Supabase Studio

1. Go to **Database** → **Vault**
2. Find the secret you want to update
3. Click **Edit**
4. Enter the new value
5. Save

### Via SQL

```sql
-- Update a secret by name
SELECT vault.update_secret(
    (SELECT id FROM vault.decrypted_secrets WHERE name = 'stripe_secret_key'),
    'sk_live_...', -- New secret value
    'stripe_secret_key', -- Keep the same name
    'Stripe secret key for billing operations' -- Keep or update description
);
```

After updating a secret, services will pick up the new value automatically on next fetch (or after cache expires).

## Security Best Practices

1. **Never commit secrets**: The `.env` file should not contain API keys anymore
2. **Use service role key**: Only the service role key can access Vault secrets
3. **Rotate service role key**: Regularly rotate your service role key in production
4. **Least privilege**: Each service should only fetch the secrets it needs
5. **Monitor access**: Review Vault access patterns in your database logs
6. **Separate environments**: Use different Supabase projects for dev/staging/prod

## Troubleshooting

### "Secret not found in Vault"

Make sure you've run the migration and created the secrets:

```sql
-- List all secrets
SELECT name, description FROM vault.decrypted_secrets;
```

### "Failed to retrieve secret"

Check that your service role key is correct and has access:

```bash
# Test access
psql $DATABASE_URL -c "SELECT public.get_secret('clerk_secret_key');"
```

### "Permission denied for function get_secret"

Grant access to the service role:

```sql
GRANT EXECUTE ON FUNCTION public.get_secret(TEXT) TO service_role;
```

## Migration from Environment Variables

To migrate existing deployments:

1. Run the Vault migration
2. Store all secrets in Vault via Studio or SQL
3. Update service initialization code to use `*FromVault()` functions
4. Remove secret values from `.env` files
5. Keep only `SUPABASE_*` and non-secret config in `.env`
6. Deploy updated services

## Production Deployment

For production:

1. Create secrets in your production Supabase project
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` is securely stored (AWS Secrets Manager, etc.)
3. Services will automatically fetch secrets from Vault on startup
4. No additional configuration needed in deployment manifests
