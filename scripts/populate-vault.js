#!/usr/bin/env node

/**
 * Script to populate Supabase Vault with secrets from environment variables
 * Usage: node scripts/populate-vault.js
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');
const readline = require('readline');

// Load .env file
config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

const secrets = [
    {
        name: 'clerk_publishable_key',
        envVar: 'CLERK_PUBLISHABLE_KEY',
        description: 'Clerk publishable key for authentication',
    },
    {
        name: 'clerk_secret_key',
        envVar: 'CLERK_SECRET_KEY',
        description: 'Clerk secret key for server-side authentication',
    },
    {
        name: 'clerk_jwks_url',
        envVar: 'CLERK_JWKS_URL',
        description: 'Clerk JWKS URL for JWT verification',
    },
    {
        name: 'stripe_secret_key',
        envVar: 'STRIPE_SECRET_KEY',
        description: 'Stripe secret key for billing operations',
    },
    {
        name: 'stripe_webhook_secret',
        envVar: 'STRIPE_WEBHOOK_SECRET',
        description: 'Stripe webhook secret for verifying webhook signatures',
    },
    {
        name: 'stripe_publishable_key',
        envVar: 'STRIPE_PUBLISHABLE_KEY',
        description: 'Stripe publishable key for client-side operations',
    },
    {
        name: 'resend_api_key',
        envVar: 'RESEND_API_KEY',
        description: 'Resend API key for transactional email',
    },
];

async function main() {
    console.log('🔐 Supabase Vault Secret Populator\n');

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    console.log(`📍 Connected to: ${supabaseUrl}\n`);

    // Check which secrets exist
    const { data: existingSecrets, error: listError } = await supabase
        .from('available_secrets')
        .select('name');

    if (listError) {
        console.error('❌ Failed to list existing secrets:', listError.message);
        console.log('💡 Make sure you have run the vault migration first!');
        process.exit(1);
    }

    const existingNames = new Set((existingSecrets || []).map((s) => s.name));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const secret of secrets) {
        const value = process.env[secret.envVar];
        const exists = existingNames.has(secret.name);

        if (!value || value.includes('your_') || value.includes('_here')) {
            console.log(`⏭️  Skipping ${secret.name} (not set or placeholder value)`);
            skipped++;
            continue;
        }

        if (exists) {
            const answer = await question(
                `⚠️  ${secret.name} already exists. Update? (y/N): `
            );

            if (answer.toLowerCase() !== 'y') {
                console.log(`⏭️  Skipped ${secret.name}`);
                skipped++;
                continue;
            }

            // Update existing secret
            const { error: updateError } = await supabase.rpc('update_vault_secret', {
                secret_name: secret.name,
                new_value: value,
            });

            if (updateError) {
                console.error(`❌ Failed to update ${secret.name}:`, updateError.message);
            } else {
                console.log(`✅ Updated ${secret.name}`);
                updated++;
            }
        } else {
            // Create new secret using SQL function
            const { error: createError } = await supabase.rpc('create_vault_secret', {
                secret_value: value,
                secret_name: secret.name,
                secret_description: secret.description,
            });

            if (createError) {
                console.error(`❌ Failed to create ${secret.name}:`, createError.message);
            } else {
                console.log(`✅ Created ${secret.name}`);
                created++;
            }
        }
    }

    rl.close();

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('\n✨ Done! Your secrets are now stored securely in Supabase Vault.');
    console.log('   You can remove them from your .env file for better security.\n');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    rl.close();
    process.exit(1);
});
