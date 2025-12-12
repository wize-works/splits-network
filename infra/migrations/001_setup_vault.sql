-- Enable the Vault extension if not already enabled
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Create secrets for third-party services
-- These will be encrypted at rest in the vault.secrets table

-- Clerk Authentication secrets
SELECT vault.create_secret(
    '${CLERK_PUBLISHABLE_KEY}',
    'clerk_publishable_key',
    'Clerk publishable key for authentication'
);

SELECT vault.create_secret(
    '${CLERK_SECRET_KEY}',
    'clerk_secret_key',
    'Clerk secret key for server-side authentication'
);

SELECT vault.create_secret(
    '${CLERK_JWKS_URL}',
    'clerk_jwks_url',
    'Clerk JWKS URL for JWT verification'
);

-- Stripe payment secrets
SELECT vault.create_secret(
    '${STRIPE_SECRET_KEY}',
    'stripe_secret_key',
    'Stripe secret key for billing operations'
);

SELECT vault.create_secret(
    '${STRIPE_WEBHOOK_SECRET}',
    'stripe_webhook_secret',
    'Stripe webhook secret for verifying webhook signatures'
);

SELECT vault.create_secret(
    '${STRIPE_PUBLISHABLE_KEY}',
    'stripe_publishable_key',
    'Stripe publishable key for client-side operations'
);

-- Resend email service secret
SELECT vault.create_secret(
    '${RESEND_API_KEY}',
    'resend_api_key',
    'Resend API key for transactional email'
);

-- Create a function to retrieve secrets by name
-- This provides a simple interface for services to fetch secrets
CREATE OR REPLACE FUNCTION public.get_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_value TEXT;
BEGIN
    SELECT decrypted_secret INTO secret_value
    FROM vault.decrypted_secrets
    WHERE name = secret_name;
    
    RETURN secret_value;
END;
$$;

-- Grant execute permission to service role
-- This allows backend services to call get_secret()
GRANT EXECUTE ON FUNCTION public.get_secret(TEXT) TO service_role;

-- Create a view for listing available secrets (without values)
-- Useful for debugging and documentation
CREATE OR REPLACE VIEW public.available_secrets AS
SELECT 
    name,
    description,
    created_at,
    updated_at
FROM vault.decrypted_secrets
WHERE name IS NOT NULL
ORDER BY name;

-- Grant access to service role
GRANT SELECT ON public.available_secrets TO service_role;

COMMENT ON FUNCTION public.get_secret(TEXT) IS 
'Retrieve a decrypted secret value by name. Only accessible to service_role.';

COMMENT ON VIEW public.available_secrets IS 
'List all named secrets with metadata (but not their values).';
