import { FastifyInstance } from 'fastify';

/**
 * API version configuration
 */
export const API_VERSIONS = {
    V1: 'v1',
    V2: 'v2', // Future version
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

/**
 * Current stable API version
 */
export const CURRENT_VERSION: ApiVersion = API_VERSIONS.V1;

/**
 * Deprecated API versions with sunset dates
 */
export const DEPRECATED_VERSIONS: Record<string, { sunsetDate: string; message: string }> = {
    // Example: 'v0': { sunsetDate: '2026-01-01', message: 'v0 API will be sunset on January 1, 2026' }
};

/**
 * Add deprecation headers to response
 */
export function addDeprecationHeaders(
    reply: any,
    version: string,
    deprecationInfo?: { sunsetDate: string; message: string }
) {
    if (deprecationInfo) {
        reply.header('Deprecation', 'true');
        reply.header('Sunset', deprecationInfo.sunsetDate);
        reply.header('X-API-Deprecation-Message', deprecationInfo.message);
        reply.header('X-API-Current-Version', CURRENT_VERSION);
    }
}

/**
 * Register versioned API prefix
 * 
 * Example:
 *   registerApiVersion(app, 'v1', (versionedApp) => {
 *     versionedApp.get('/roles', handler);
 *   });
 * 
 * Results in route: /api/v1/roles
 */
export async function registerApiVersion(
    app: FastifyInstance,
    version: ApiVersion,
    register: (versionedApp: FastifyInstance) => void | Promise<void>
) {
    await app.register(async (versionedApp) => {
        // Add version deprecation hook
        versionedApp.addHook('onRequest', async (request, reply) => {
            const deprecationInfo = DEPRECATED_VERSIONS[version];
            if (deprecationInfo) {
                addDeprecationHeaders(reply, version, deprecationInfo);
            }
            
            // Add current version header
            reply.header('X-API-Version', version);
        });

        // Register routes under this version
        await register(versionedApp);
    }, { prefix: `/api/${version}` });
}

/**
 * Create a version migration notice endpoint
 */
export function registerVersionInfo(app: FastifyInstance) {
    app.get('/api/versions', {
        schema: {
            description: 'List all API versions and their status',
            tags: ['meta'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        current: { type: 'string' },
                        available: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                        deprecated: {
                            type: 'object',
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    sunsetDate: { type: 'string' },
                                    message: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        return reply.send({
            current: CURRENT_VERSION,
            available: Object.values(API_VERSIONS),
            deprecated: DEPRECATED_VERSIONS,
        });
    });
}
