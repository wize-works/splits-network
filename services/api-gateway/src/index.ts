import { loadBaseConfig, loadClerkConfig, loadRedisConfig } from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { buildServer, errorHandler } from '@splits-network/shared-fastify';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
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
    if (baseConfig.nodeEnv === 'production' && !redisConfig.password) {
        throw new Error('REDIS_PASSWORD is required in production environment');
    }

    const redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
    });

    // CORS configuration - stricter in production
    const allowedOrigins = baseConfig.nodeEnv === 'production'
        ? (process.env.CORS_ORIGIN || '').split(',').filter(Boolean)
        : true;

    if (baseConfig.nodeEnv === 'production' && (!allowedOrigins || (allowedOrigins as string[]).length === 0)) {
        throw new Error('CORS_ORIGIN must be set in production environment');
    }

    const app = await buildServer({
        logger,
        cors: {
            origin: allowedOrigins,
            credentials: true,
        },
    });

    app.setErrorHandler(errorHandler);

    // Register Swagger
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Splits Network API Gateway',
                description: 'API Gateway for Splits Network - Routes requests to backend services',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Development server',
                },
                {
                    url: 'https://api.splits.network',
                    description: 'Production server',
                },
            ],
            components: {
                securitySchemes: {
                    clerkAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Clerk JWT token from authentication',
                    },
                },
            },
            tags: [
                { name: 'identity', description: 'User and organization management' },
                { name: 'ats', description: 'Jobs, candidates, applications, and placements' },
                { name: 'network', description: 'Recruiter profiles and role assignments' },
                { name: 'billing', description: 'Subscription plans and billing' },
                { name: 'documents', description: 'Document storage and retrieval' },
                { name: 'phase2-ownership', description: 'Phase 2: Candidate sourcing and ownership protection' },
                { name: 'phase2-placements', description: 'Phase 2: Placement lifecycle and guarantees' },
                { name: 'phase2-collaboration', description: 'Phase 2: Multi-recruiter collaboration and splits' },
                { name: 'phase2-proposals', description: 'Phase 2: Candidate proposals and workflows' },
                { name: 'phase2-reputation', description: 'Phase 2: Recruiter reputation and scoring' },
            ],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });

    // Register rate limiting
    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
        redis,
    });

    // Add correlation ID and request logging middleware
    app.addHook('onRequest', async (request, reply) => {
        // Generate or use existing correlation ID
        const correlationId = (request.headers['x-correlation-id'] as string) || randomUUID();
        
        // Store correlation ID and start time in request context
        (request as any).correlationId = correlationId;
        (request as any).startTime = Date.now();
        
        // Add correlation ID to response headers
        reply.header('x-correlation-id', correlationId);
        
        // Log incoming request
        logger.info({
            correlationId,
            method: request.method,
            url: request.url,
            headers: {
                'user-agent': request.headers['user-agent'],
                'content-type': request.headers['content-type'],
            },
            ip: request.ip,
        }, 'Incoming request');
    });

    // Add response logging middleware
    app.addHook('onResponse', async (request, reply) => {
        const correlationId = (request as any).correlationId;
        const startTime = (request as any).startTime;
        const responseTime = Date.now() - startTime;
        
        logger.info({
            correlationId,
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            responseTime: `${responseTime}ms`,
        }, 'Request completed');
    });

    // Initialize auth middleware
    const authMiddleware = new AuthMiddleware(clerkConfig.secretKey);

    // Register auth hook for all /api routes (except webhooks)
    app.addHook('onRequest', async (request, reply) => {
        // Skip auth for webhook endpoints (verified by signature)
        if (request.url.includes('/webhooks/')) {
            return;
        }
        
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
    services.register('document', process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3006');

    // Register routes
    registerRoutes(app, services);

    // Health check endpoint (no auth required)
    app.get('/health', async (request, reply) => {
        try {
            // Check Redis connectivity
            await redis.ping();
            
            return reply.status(200).send({
                status: 'healthy',
                service: 'api-gateway',
                timestamp: new Date().toISOString(),
                checks: {
                    redis: 'connected',
                    auth: 'configured',
                },
            });
        } catch (error) {
            logger.error({ err: error }, 'Health check failed');
            return reply.status(503).send({
                status: 'unhealthy',
                service: 'api-gateway',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });

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
