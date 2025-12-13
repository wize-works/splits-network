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
COPY services/api-gateway/package.json ./services/api-gateway/
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=dependencies /app ./
COPY packages ./packages
COPY services/api-gateway ./services/api-gateway
EXPOSE 3000
CMD ["pnpm", "--filter", "@splits-network/api-gateway", "dev"]

# Build stage
FROM base AS build
COPY --from=dependencies /app ./
COPY packages ./packages
COPY services/api-gateway ./services/api-gateway
# Build shared packages first
RUN pnpm --filter @splits-network/shared-config build
RUN pnpm --filter @splits-network/shared-types build
RUN pnpm --filter @splits-network/shared-logging build
RUN pnpm --filter @splits-network/shared-fastify build
# Then build service
RUN pnpm --filter @splits-network/api-gateway build

# Production stage
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared-config/dist ./node_modules/@splits-network/shared-config/dist
COPY --from=build /app/packages/shared-config/package.json ./node_modules/@splits-network/shared-config/
COPY --from=build /app/packages/shared-types/dist ./node_modules/@splits-network/shared-types/dist
COPY --from=build /app/packages/shared-types/package.json ./node_modules/@splits-network/shared-types/
COPY --from=build /app/packages/shared-logging/dist ./node_modules/@splits-network/shared-logging/dist
COPY --from=build /app/packages/shared-logging/package.json ./node_modules/@splits-network/shared-logging/
COPY --from=build /app/packages/shared-fastify/dist ./node_modules/@splits-network/shared-fastify/dist
COPY --from=build /app/packages/shared-fastify/package.json ./node_modules/@splits-network/shared-fastify/
COPY --from=build /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=build /app/services/api-gateway/package.json ./services/api-gateway/
EXPOSE 3000
CMD ["node", "services/api-gateway/dist/index.js"]
