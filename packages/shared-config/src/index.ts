// Load environment variables from .env file (skip in Edge runtime)
try {
    // Dynamic require to avoid issues in Edge runtime
    require('dotenv').config();
} catch {
    // dotenv not available or failed to load (e.g., in Edge runtime)
}

// Note: Vault utilities are NOT re-exported here to avoid bundling
// server-side dependencies (@supabase/supabase-js) in client bundles.
// Vault functionality is accessible through the *FromVault() functions below,
// which use dynamic imports. If you need direct access to VaultClient,
// use: import { VaultClient } from '@splits-network/shared-config/src/vault';

export interface BaseConfig {
    nodeEnv: string;
    port: number;
    serviceName: string;
}

export interface DatabaseConfig {
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceRoleKey?: string;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
}

export interface RabbitMQConfig {
    url: string;
}

export interface ClerkConfig {
    publishableKey: string;
    secretKey: string;
    jwksUrl: string;
}

export interface StripeConfig {
    secretKey: string;
    webhookSecret: string;
    publishableKey: string;
}

export interface ResendConfig {
    apiKey: string;
    fromEmail: string;
}

/**
 * Get required environment variable or throw error
 */
export function getEnvOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

/**
 * Get optional environment variable with default
 */
export function getEnvOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

/**
 * Load base configuration common to all services
 */
export function loadBaseConfig(serviceName: string): BaseConfig {
    return {
        nodeEnv: getEnvOrDefault('NODE_ENV', 'development'),
        port: parseInt(getEnvOrDefault('PORT', '3000'), 10),
        serviceName,
    };
}

/**
 * Load database configuration
 */
export function loadDatabaseConfig(): DatabaseConfig {
    return {
        supabaseUrl: getEnvOrThrow('SUPABASE_URL'),
        supabaseAnonKey: getEnvOrThrow('SUPABASE_ANON_KEY'),
        supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
}

/**
 * Load Redis configuration
 */
export function loadRedisConfig(): RedisConfig {
    return {
        host: getEnvOrDefault('REDIS_HOST', 'localhost'),
        port: parseInt(getEnvOrDefault('REDIS_PORT', '6379'), 10),
        password: process.env.REDIS_PASSWORD,
    };
}

/**
 * Load RabbitMQ configuration
 */
export function loadRabbitMQConfig(): RabbitMQConfig {
    return {
        url: getEnvOrDefault('RABBITMQ_URL', 'amqp://localhost:5672'),
    };
}

/**
 * Load Clerk configuration
 * If USE_VAULT=true, secrets will be fetched from Supabase Vault
 */
export function loadClerkConfig(): ClerkConfig {
    return {
        publishableKey: getEnvOrThrow('CLERK_PUBLISHABLE_KEY'),
        secretKey: getEnvOrThrow('CLERK_SECRET_KEY'),
        jwksUrl: getEnvOrDefault(
            'CLERK_JWKS_URL',
            'https://api.clerk.com/v1/jwks'
        ),
    };
}

/**
 * Load Clerk configuration from Vault (async)
 * Fetches secrets from Supabase Vault instead of environment variables
 * SERVER-ONLY: This function uses Supabase and must only be called from server contexts
 */
export async function loadClerkConfigFromVault(): Promise<ClerkConfig> {
    const { getSecret } = await import('./vault-server');
    return {
        publishableKey: await getSecret('clerk_publishable_key'),
        secretKey: await getSecret('clerk_secret_key'),
        jwksUrl: await getSecret('clerk_jwks_url'),
    };
}

/**
 * Load Stripe configuration
 * If USE_VAULT=true, secrets will be fetched from Supabase Vault
 */
export function loadStripeConfig(): StripeConfig {
    return {
        secretKey: getEnvOrThrow('STRIPE_SECRET_KEY'),
        webhookSecret: getEnvOrThrow('STRIPE_WEBHOOK_SECRET'),
        publishableKey: getEnvOrThrow('STRIPE_PUBLISHABLE_KEY'),
    };
}

/**
 * Load Stripe configuration from Vault (async)
 * Fetches secrets from Supabase Vault instead of environment variables
 * SERVER-ONLY: This function uses Supabase and must only be called from server contexts
 */
export async function loadStripeConfigFromVault(): Promise<StripeConfig> {
    const { getSecret } = await import('./vault-server');
    return {
        secretKey: await getSecret('stripe_secret_key'),
        webhookSecret: await getSecret('stripe_webhook_secret'),
        publishableKey: await getSecret('stripe_publishable_key'),
    };
}

/**
 * Load Resend configuration
 * If USE_VAULT=true, secrets will be fetched from Supabase Vault
 */
export function loadResendConfig(): ResendConfig {
    return {
        apiKey: getEnvOrThrow('RESEND_API_KEY'),
        fromEmail: getEnvOrDefault('RESEND_FROM_EMAIL', 'notifications@updates.splits.network'),
    };
}

/**
 * Load Resend configuration from Vault (async)
 * Fetches secrets from Supabase Vault instead of environment variables
 * SERVER-ONLY: This function uses Supabase and must only be called from server contexts
 */
export async function loadResendConfigFromVault(): Promise<ResendConfig> {
    const { getSecret } = await import('./vault-server');
    return {
        apiKey: await getSecret('resend_api_key'),
        fromEmail: getEnvOrDefault('RESEND_FROM_EMAIL', 'notifications@updates.splits.network'),
    };
}

/**
 * Generic config loader for simple service configuration
 * Returns a Record<string, string | undefined> of all environment variables
 */
export function loadConfig(): Record<string, string | undefined> {
    return process.env as Record<string, string | undefined>;
}
