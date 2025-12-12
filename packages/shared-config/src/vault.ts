import { createClient } from '@supabase/supabase-js';
import { getEnvOrThrow } from './index';

/**
 * Vault client for retrieving encrypted secrets from Supabase Vault
 */
export class VaultClient {
    private supabase: ReturnType<typeof createClient>;
    private cache: Map<string, { value: string; expiry: number }>;
    private cacheTTL: number;

    constructor() {
        const supabaseUrl = getEnvOrThrow('SUPABASE_URL');
        const serviceRoleKey = getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY');
        
        this.supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        });
        
        // Cache secrets for 5 minutes to reduce database calls
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
    }

    /**
     * Retrieve a secret by name from Supabase Vault
     * @param secretName - The unique name of the secret
     * @param useCache - Whether to use cached value (default: true)
     * @returns The decrypted secret value
     */
    async getSecret(secretName: string, useCache: boolean = true): Promise<string> {
        // Check cache first
        if (useCache) {
            const cached = this.cache.get(secretName);
            if (cached && cached.expiry > Date.now()) {
                return cached.value;
            }
        }

        // Fetch from Vault using the helper function
        const { data, error } = await this.supabase.rpc('get_secret', {
            secret_name: secretName,
        } as any);

        if (error) {
            throw new Error(`Failed to retrieve secret '${secretName}': ${error.message}`);
        }

        if (!data) {
            throw new Error(`Secret '${secretName}' not found in Vault`);
        }

        const secretValue = data as string;

        // Cache the value
        if (useCache) {
            this.cache.set(secretName, {
                value: secretValue,
                expiry: Date.now() + this.cacheTTL,
            });
        }

        return secretValue;
    }

    /**
     * Retrieve multiple secrets at once
     * @param secretNames - Array of secret names to retrieve
     * @returns Object with secret names as keys and values
     */
    async getSecrets(secretNames: string[]): Promise<Record<string, string>> {
        const secrets: Record<string, string> = {};
        
        await Promise.all(
            secretNames.map(async (name) => {
                secrets[name] = await this.getSecret(name);
            })
        );

        return secrets;
    }

    /**
     * Clear the cache for a specific secret or all secrets
     * @param secretName - Optional secret name to clear, or undefined to clear all
     */
    clearCache(secretName?: string): void {
        if (secretName) {
            this.cache.delete(secretName);
        } else {
            this.cache.clear();
        }
    }

    /**
     * List all available secrets (names only, not values)
     */
    async listSecrets(): Promise<Array<{ name: string; description: string }>> {
        const { data, error } = await this.supabase
            .from('available_secrets')
            .select('name, description');

        if (error) {
            throw new Error(`Failed to list secrets: ${error.message}`);
        }

        return data || [];
    }
}

// Singleton instance
let vaultClient: VaultClient | null = null;

/**
 * Get the Vault client instance (singleton)
 */
export function getVaultClient(): VaultClient {
    if (!vaultClient) {
        vaultClient = new VaultClient();
    }
    return vaultClient;
}

/**
 * Helper function to get a secret directly
 */
export async function getSecret(secretName: string): Promise<string> {
    return getVaultClient().getSecret(secretName);
}
