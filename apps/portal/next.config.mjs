import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@splits-network/shared-types', '@splits-network/shared-config'],
    serverExternalPackages: ['@supabase/supabase-js'],
};

export default withSentryConfig(nextConfig, {
    org: 'splitsnetwork',
    project: 'portal',
    silent: !process.env.CI,
    widenClientFileUpload: true,
    reactComponentAnnotation: {
        enabled: true,
    },
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
});
