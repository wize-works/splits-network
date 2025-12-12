# Base stage with Node.js and pnpm
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
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
# Clerk keys will be fetched from Supabase Vault at runtime
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
COPY --from=dependencies /app ./
COPY packages ./packages
COPY apps/portal ./apps/portal
# Build shared packages first
RUN pnpm --filter @splits-network/shared-config build
RUN pnpm --filter @splits-network/shared-types build
# Then build portal
RUN pnpm --filter @splits-network/portal build

# Production stage
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/portal/.next ./apps/portal/.next
COPY --from=build /app/apps/portal/package.json ./apps/portal/
COPY --from=build /app/apps/portal/public ./apps/portal/public
COPY --from=build /app/apps/portal/next.config.mjs ./apps/portal/
EXPOSE 3100
CMD ["pnpm", "--filter", "@splits-network/portal", "start"]
