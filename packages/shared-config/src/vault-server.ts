/**
 * Server-only vault utilities
 * This file should only be imported in server contexts (Server Components, API routes, etc.)
 * 
 * Uses fully dynamic imports to prevent Next.js from trying to bundle @supabase/supabase-js
 * for the client bundle during the build/analysis phase.
 */

// Note: 'server-only' import removed as it's not needed for backend services

/**
 * Get the singleton VaultClient instance
 */
export async function getVaultClient() {
    const vault = await import('./vault');
    return vault.getVaultClient();
}

/**
 * Get a secret from Vault by name
 */
export async function getSecret(name: string): Promise<string> {
    const vault = await import('./vault');
    return vault.getSecret(name);
}

/**
 * Get the VaultClient class for direct instantiation
 */
export async function getVaultClientClass() {
    const vault = await import('./vault');
    return vault.VaultClient;
}
