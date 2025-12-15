# Base stage with Node.js and pnpm
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-fastify/package.json ./packages/shared-fastify/
COPY packages/shared-logging/package.json ./packages/shared-logging/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-job-queue/package.json ./packages/shared-job-queue/
COPY services/automation-service/package.json ./services/automation-service/
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=dependencies /app ./
COPY packages ./packages
COPY services/automation-service ./services/automation-service
EXPOSE 3007
CMD ["pnpm", "--filter", "@splits-network/automation-service", "dev"]

# Build stage
FROM base AS build
COPY --from=dependencies /app ./
COPY packages ./packages
COPY services/automation-service ./services/automation-service
# Build shared packages first
RUN pnpm --filter @splits-network/shared-config build
RUN pnpm --filter @splits-network/shared-types build
RUN pnpm --filter @splits-network/shared-logging build
RUN pnpm --filter @splits-network/shared-fastify build
RUN pnpm --filter @splits-network/shared-job-queue build
# Then build service
RUN pnpm --filter @splits-network/automation-service build

# Production stage
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy built shared packages
COPY --from=build /app/packages/shared-config/package.json ./packages/shared-config/
COPY --from=build /app/packages/shared-config/dist ./packages/shared-config/dist
COPY --from=build /app/packages/shared-fastify/package.json ./packages/shared-fastify/
COPY --from=build /app/packages/shared-fastify/dist ./packages/shared-fastify/dist
COPY --from=build /app/packages/shared-logging/package.json ./packages/shared-logging/
COPY --from=build /app/packages/shared-logging/dist ./packages/shared-logging/dist
COPY --from=build /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build /app/packages/shared-job-queue/package.json ./packages/shared-job-queue/
COPY --from=build /app/packages/shared-job-queue/dist ./packages/shared-job-queue/dist

# Copy built service
COPY --from=build /app/services/automation-service/package.json ./services/automation-service/
COPY --from=build /app/services/automation-service/dist ./services/automation-service/dist

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3007
CMD ["node", "services/automation-service/dist/index.js"]
