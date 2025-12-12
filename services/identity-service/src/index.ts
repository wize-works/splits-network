import { loadBaseConfig, loadDatabaseConfig } from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { buildServer, errorHandler } from '@splits-network/shared-fastify';
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

    // Initialize repository and service
    const repository = new IdentityRepository(
        dbConfig.supabaseUrl,
        dbConfig.supabaseServiceRoleKey || dbConfig.supabaseAnonKey
    );
    const service = new IdentityService(repository);

    // Register routes
    registerRoutes(app, service);

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
