# Supabase Vault Quick Start

This guide will help you quickly set up Supabase Vault for secure secret management.

## Prerequisites

- Supabase project set up
- PostgreSQL client (psql) installed
- Node.js and pnpm installed

## Setup Steps

### 1. Set Your Database Connection

Make sure your `.env` file has the Supabase connection details:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### 2. Run the Vault Migrations

This sets up the vault extension and helper functions:

```bash
npm run vault:setup
```

Or manually:

```bash
psql $DATABASE_URL -f infra/migrations/001_setup_vault.sql
psql $DATABASE_URL -f infra/migrations/002_vault_helpers.sql
```

### 3. Populate Secrets

You have two options:

#### Option A: Use the Script (Recommended)

If you have secrets in your `.env` file, migrate them to Vault:

```bash
npm run vault:populate
```

This will:
- Read secrets from your `.env` file
- Store them encrypted in Supabase Vault
- Prompt you before updating existing secrets

#### Option B: Manual via Supabase Studio

1. Go to your Supabase dashboard
2. Navigate to **Database** → **Vault**
3. Click **New Secret**
4. Add each secret with its name and value

Required secrets:
- `clerk_publishable_key`
- `clerk_secret_key`
- `clerk_jwks_url`
- `stripe_secret_key`
- `stripe_webhook_secret`
- `stripe_publishable_key`
- `resend_api_key`

#### Option C: Manual via SQL

```sql
-- Connect to your database
psql $DATABASE_URL

-- Add secrets
SELECT vault.create_secret(
    'your-actual-clerk-secret-key',
    'clerk_secret_key',
    'Clerk secret key for server-side authentication'
);

-- Repeat for all secrets...
```

### 4. Verify Setup

Check that secrets were created:

```bash
psql $DATABASE_URL -c "SELECT name, description FROM public.available_secrets;"
```

You should see all your secrets listed (but not their values).

### 5. Update Your Code

Services can now load secrets from Vault:

```typescript
// Old way (environment variables)
import { loadClerkConfig } from '@splits-network/shared-config';
const config = loadClerkConfig(); // Synchronous

// New way (Vault)
import { loadClerkConfigFromVault } from '@splits-network/shared-config';
const config = await loadClerkConfigFromVault(); // Async
```

### 6. Clean Up .env Files

After verifying everything works, you can remove the secret values from `.env`:

```bash
# Keep these (database connection)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...

# Remove these (now in Vault)
# CLERK_SECRET_KEY=...
# STRIPE_SECRET_KEY=...
# etc.
```

## Testing

Test that your services can retrieve secrets:

```bash
# Test from command line
psql $DATABASE_URL -c "SELECT public.get_secret('clerk_secret_key');"

# Should return your secret value
```

## Troubleshooting

### "function public.get_secret does not exist"

Run the migrations again:

```bash
npm run vault:setup
```

### "permission denied for function get_secret"

Grant access to service_role:

```sql
GRANT EXECUTE ON FUNCTION public.get_secret(TEXT) TO service_role;
```

### "Secret not found in Vault"

Make sure you've populated the secrets:

```bash
npm run vault:populate
```

Or check what's in the vault:

```sql
SELECT name FROM vault.decrypted_secrets;
```

## Next Steps

- Read the full [Vault documentation](./VAULT.md)
- Update your service initialization code to use Vault
- Set up secret rotation procedures
- Configure Vault in your CI/CD pipeline

## Quick Reference

```bash
# Setup vault
npm run vault:setup

# Populate secrets from .env
npm run vault:populate

# List secrets (names only)
psql $DATABASE_URL -c "SELECT name, description FROM public.available_secrets;"

# Get a specific secret (returns value)
psql $DATABASE_URL -c "SELECT public.get_secret('clerk_secret_key');"

# Update a secret via SQL
psql $DATABASE_URL -c "SELECT vault.update_secret(
    (SELECT id FROM vault.decrypted_secrets WHERE name = 'clerk_secret_key'),
    'new-secret-value',
    'clerk_secret_key',
    'Clerk secret key for server-side authentication'
);"
```
