import { loadBaseConfig, loadClerkConfig, loadRedisConfig } from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { buildServer, errorHandler } from '@splits-network/shared-fastify';
import rateLimit from '@fastify/rate-limit';
import Redis from 'ioredis';
import { AuthMiddleware } from './auth';
import { ServiceRegistry } from './clients';
import { registerRoutes } from './routes';

async function main() {
    const baseConfig = loadBaseConfig('api-gateway');
    const clerkConfig = loadClerkConfig();
    const redisConfig = loadRedisConfig();

    const logger = createLogger({
        serviceName: baseConfig.serviceName,
        level: baseConfig.nodeEnv === 'development' ? 'debug' : 'info',
        prettyPrint: baseConfig.nodeEnv === 'development',
    });

    // Initialize Redis for rate limiting
    const redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
    });

    const app = await buildServer({
        logger,
        cors: {
            origin: process.env.CORS_ORIGIN || true,
            credentials: true,
        },
    });

    app.setErrorHandler(errorHandler);

    // Register rate limiting
    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        redis,
    });

    // Initialize auth middleware
    const authMiddleware = new AuthMiddleware(clerkConfig.secretKey);

    // Register auth hook for all /api routes
    app.addHook('onRequest', async (request, reply) => {
        if (request.url.startsWith('/api/')) {
            await authMiddleware.createMiddleware()(request, reply);
        }
    });

    // Initialize service registry
    const services = new ServiceRegistry(logger);

    // Register services (use env vars or defaults)
    services.register('identity', process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001');
    services.register('ats', process.env.ATS_SERVICE_URL || 'http://localhost:3002');
    services.register('network', process.env.NETWORK_SERVICE_URL || 'http://localhost:3003');
    services.register('billing', process.env.BILLING_SERVICE_URL || 'http://localhost:3004');

    // Register routes
    registerRoutes(app, services);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, shutting down gracefully');
        await redis.quit();
        await app.close();
        process.exit(0);
    });

    // Start server
    try {
        await app.listen({ port: baseConfig.port, host: '0.0.0.0' });
        logger.info(`API Gateway listening on port ${baseConfig.port}`);
    } catch (err) {
        logger.error(err);
        await redis.quit();
        process.exit(1);
    }
}

main();
