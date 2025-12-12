/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@splits-network/shared-types'],
    serverExternalPackages: ['@supabase/supabase-js'],
    // No rewrites needed - client-side API calls go directly to the gateway
};

export default nextConfig;
