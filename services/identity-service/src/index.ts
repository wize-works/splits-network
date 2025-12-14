import { loadBaseConfig, loadDatabaseConfig } from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { buildServer, errorHandler } from '@splits-network/shared-fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { IdentityRepository } from './repository';
import { IdentityService } from './service';
import { registerRoutes } from './routes';

async function main() {
    const baseConfig = loadBaseConfig('identity-service');
    const dbConfig = loadDatabaseConfig();

    const logger = createLogger({
        serviceName: baseConfig.serviceName,
        level: baseConfig.nodeEnv === 'development' ? 'debug' : 'info',
        prettyPrint: baseConfig.nodeEnv === 'development',
    });

    const app = await buildServer({
        logger,
        cors: {
            origin: true,
            credentials: true,
        },
    });

    // Set error handler
    app.setErrorHandler(errorHandler);

    // Register Swagger
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Identity Service API',
                description: 'User identity, organizations, and membership management',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'http://localhost:3001',
                    description: 'Development server',
                },
            ],
            tags: [
                { name: 'users', description: 'User management' },
                { name: 'organizations', description: 'Organization management' },
                { name: 'memberships', description: 'User-organization memberships' },
                { name: 'webhooks', description: 'Webhook endpoints' },
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

    // Initialize repository and service
    const repository = new IdentityRepository(
        dbConfig.supabaseUrl,
        dbConfig.supabaseServiceRoleKey || dbConfig.supabaseAnonKey
    );
    const service = new IdentityService(repository);

    // Register routes
    registerRoutes(app, service);

    // Health check endpoint
    app.get('/health', async (request, reply) => {
        try {
            // Check database connectivity
            await repository.healthCheck();
            return reply.status(200).send({
                status: 'healthy',
                service: 'identity-service',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            logger.error({ err: error }, 'Health check failed');
            return reply.status(503).send({
                status: 'unhealthy',
                service: 'identity-service',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });

    // Start server
    try {
        await app.listen({ port: baseConfig.port, host: '0.0.0.0' });
        logger.info(`Identity service listening on port ${baseConfig.port}`);
    } catch (err) {
        logger.error(err);
        process.exit(1);
    }
}

main();
