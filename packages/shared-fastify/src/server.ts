import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { Logger } from '@splits-network/shared-logging';

export interface BuildServerOptions {
    logger: Logger;
    cors?: {
        origin: string | string[] | boolean;
        credentials?: boolean;
    };
    helmet?: boolean;
}

/**
 * Build a Fastify server with common plugins and configuration
 */
export async function buildServer(
    options: BuildServerOptions
): Promise<FastifyInstance> {
    const { logger, cors: corsOptions, helmet: useHelmet = true } = options;

    // Fastify 5.x expects logger to be true, false, or a pino options object
    // We pass true and then the logger instance will be used internally
    const serverOptions: FastifyServerOptions = {
        logger: true,
        disableRequestLogging: false,
        requestIdLogLabel: 'reqId',
    };

    const app = fastify(serverOptions);
    
    // Replace the default logger with our configured one
    (app as any).log = logger;

    // Register CORS
    if (corsOptions) {
        await app.register(cors, {
            origin: corsOptions.origin,
            credentials: corsOptions.credentials ?? true,
        });
    }

    // Register Helmet for security headers
    if (useHelmet) {
        await app.register(helmet);
    }

    // Health check endpoint
    app.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    return app;
}

export { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
