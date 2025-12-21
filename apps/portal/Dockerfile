# Base stage with Node.js and pnpm
# Force rebuild: 2025-12-21-001
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/portal/package.json ./apps/portal/
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=dependencies /app ./
COPY packages ./packages
COPY apps/portal ./apps/portal
EXPOSE 3100
CMD ["pnpm", "--filter", "@splits-network/portal", "dev"]

# Build stage
FROM base AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG SENTRY_AUTH_TOKEN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
COPY --from=dependencies /app ./
# Copy package source files (needed for Next.js transpilePackages)
COPY packages/shared-config ./packages/shared-config
COPY packages/shared-types ./packages/shared-types
COPY apps/portal ./apps/portal
# Build shared packages first (creates dist/ for other services)
RUN pnpm --filter @splits-network/shared-config build
RUN pnpm --filter @splits-network/shared-types build
# Then build portal (will transpile packages from source)
RUN pnpm --filter @splits-network/portal build

# Production stage
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
WORKDIR /app
ENV NODE_ENV=production

# Copy package files for production install
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages/shared-config/package.json ./packages/shared-config/
COPY --from=build /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=build /app/apps/portal/package.json ./apps/portal/

# Production install (only dependencies, no devDependencies)
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts
COPY --from=build /app/packages/shared-config/dist ./packages/shared-config/dist
COPY --from=build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build /app/apps/portal/.next ./apps/portal/.next
COPY --from=build /app/apps/portal/public ./apps/portal/public
COPY --from=build /app/apps/portal/next.config.mjs ./apps/portal/

EXPOSE 3100
CMD ["pnpm", "--filter", "@splits-network/portal", "start"]
