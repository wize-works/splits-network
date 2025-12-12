-- Helper functions for the populate-vault script

-- Function to create a vault secret (wrapper around vault.create_secret)
CREATE OR REPLACE FUNCTION public.create_vault_secret(
    secret_value TEXT,
    secret_name TEXT,
    secret_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_id UUID;
BEGIN
    SELECT vault.create_secret(secret_value, secret_name, secret_description)
    INTO secret_id;
    
    RETURN secret_id;
END;
$$;

-- Function to update a vault secret by name
CREATE OR REPLACE FUNCTION public.update_vault_secret(
    secret_name TEXT,
    new_value TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_id UUID;
    old_description TEXT;
BEGIN
    -- Get the secret ID and description
    SELECT id, description INTO secret_id, old_description
    FROM vault.decrypted_secrets
    WHERE name = secret_name;
    
    IF secret_id IS NULL THEN
        RAISE EXCEPTION 'Secret % not found', secret_name;
    END IF;
    
    -- Update the secret
    PERFORM vault.update_secret(secret_id, new_value, secret_name, old_description);
END;
$$;

-- Grant access to service role
GRANT EXECUTE ON FUNCTION public.create_vault_secret(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_vault_secret(TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.create_vault_secret IS 
'Create a new secret in Vault. Wrapper for vault.create_secret.';

COMMENT ON FUNCTION public.update_vault_secret IS 
'Update an existing secret in Vault by name.';
