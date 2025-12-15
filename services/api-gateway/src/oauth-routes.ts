import { FastifyInstance } from 'fastify';
import { OAuthTokenManager, ROLE_SCOPES, ApiScope } from './oauth';
import type { Logger } from '@splits-network/shared-logging';

interface TokenRequest {
    grant_type: 'client_credentials' | 'refresh_token';
    refresh_token?: string;
    scope?: string;
}

interface TokenResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token?: string;
    scope: string;
}

/**
 * Register OAuth 2.0 routes
 */
export function registerOAuthRoutes(
    app: FastifyInstance,
    tokenManager: OAuthTokenManager,
    logger: Logger
) {
    /**
     * OAuth token endpoint (OAuth 2.0 client credentials or refresh token flow)
     */
    app.post<{ Body: TokenRequest }>('/oauth/token', {
        schema: {
            description: 'Issue or refresh OAuth access token',
            tags: ['oauth'],
            body: {
                type: 'object',
                required: ['grant_type'],
                properties: {
                    grant_type: {
                        type: 'string',
                        enum: ['client_credentials', 'refresh_token'],
                    },
                    refresh_token: {
                        type: 'string',
                        description: 'Required for refresh_token grant type',
                    },
                    scope: {
                        type: 'string',
                        description: 'Space-separated list of scopes',
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { grant_type, refresh_token, scope } = request.body;

        try {
            // In production, this would validate against stored client credentials
            // For now, we'll use the Clerk user from the auth middleware
            const clerkUserId = (request as any).auth?.userId;
            
            if (!clerkUserId) {
                return reply.status(401).send({
                    error: 'invalid_client',
                    error_description: 'User authentication required',
                });
            }

            if (grant_type === 'client_credentials') {
                // Determine scopes based on user role
                // In production, fetch user role from identity service
                const userRole = 'recruiter'; // Placeholder
                const defaultScopes = ROLE_SCOPES[userRole] || [];
                
                // Parse requested scopes
                const requestedScopes = scope ? scope.split(' ') as ApiScope[] : defaultScopes;
                
                // Validate requested scopes against allowed scopes
                const allowedScopes = requestedScopes.filter(s => defaultScopes.includes(s));
                
                if (allowedScopes.length === 0) {
                    return reply.status(400).send({
                        error: 'invalid_scope',
                        error_description: 'No valid scopes requested',
                    });
                }

                const accessToken = tokenManager.generateAccessToken(clerkUserId, allowedScopes);
                const refreshToken = tokenManager.generateRefreshToken(clerkUserId, allowedScopes);

                logger.info({ userId: clerkUserId, scopes: allowedScopes }, 'OAuth token issued');

                const response: TokenResponse = {
                    access_token: accessToken,
                    token_type: 'Bearer',
                    expires_in: 3600,
                    refresh_token: refreshToken,
                    scope: allowedScopes.join(' '),
                };

                return reply.send(response);

            } else if (grant_type === 'refresh_token') {
                if (!refresh_token) {
                    return reply.status(400).send({
                        error: 'invalid_request',
                        error_description: 'refresh_token is required',
                    });
                }

                // Verify refresh token
                const decoded = tokenManager.verifyToken(refresh_token);
                
                if (decoded.type !== 'refresh') {
                    return reply.status(400).send({
                        error: 'invalid_grant',
                        error_description: 'Invalid refresh token',
                    });
                }

                // Issue new access token with same scopes
                const newAccessToken = tokenManager.generateAccessToken(decoded.sub, decoded.scopes);

                logger.info({ userId: decoded.sub, scopes: decoded.scopes }, 'OAuth token refreshed');

                const response: TokenResponse = {
                    access_token: newAccessToken,
                    token_type: 'Bearer',
                    expires_in: 3600,
                    scope: decoded.scopes.join(' '),
                };

                return reply.send(response);

            } else {
                return reply.status(400).send({
                    error: 'unsupported_grant_type',
                    error_description: 'Only client_credentials and refresh_token are supported',
                });
            }

        } catch (error) {
            logger.error({ err: error }, 'OAuth token endpoint error');
            return reply.status(400).send({
                error: 'invalid_request',
                error_description: error instanceof Error ? error.message : 'Token generation failed',
            });
        }
    });

    /**
     * Token introspection endpoint (RFC 7662)
     */
    app.post<{ Body: { token: string } }>('/oauth/introspect', {
        schema: {
            description: 'Introspect an OAuth access token',
            tags: ['oauth'],
            body: {
                type: 'object',
                required: ['token'],
                properties: {
                    token: { type: 'string' },
                },
            },
        },
    }, async (request, reply) => {
        const { token } = request.body;

        try {
            const decoded = tokenManager.verifyToken(token);

            return reply.send({
                active: true,
                scope: decoded.scopes.join(' '),
                sub: decoded.sub,
                token_type: decoded.type,
                exp: decoded.exp,
                iat: decoded.iat,
            });

        } catch (error) {
            // Token is invalid or expired
            return reply.send({
                active: false,
            });
        }
    });

    /**
     * Token revocation endpoint (RFC 7009)
     */
    app.post<{ Body: { token: string; token_type_hint?: string } }>('/oauth/revoke', {
        schema: {
            description: 'Revoke an OAuth token',
            tags: ['oauth'],
            body: {
                type: 'object',
                required: ['token'],
                properties: {
                    token: { type: 'string' },
                    token_type_hint: {
                        type: 'string',
                        enum: ['access_token', 'refresh_token'],
                    },
                },
            },
        },
    }, async (request, reply) => {
        const { token } = request.body;

        try {
            const decoded = tokenManager.verifyToken(token);
            
            // In production, store revoked tokens in Redis with TTL
            // For now, just log the revocation
            logger.info({ tokenId: decoded.jti, userId: decoded.sub }, 'OAuth token revoked');

            return reply.send({
                message: 'Token revoked successfully',
            });

        } catch (error) {
            // Per RFC 7009, return 200 even if token is invalid
            return reply.send({
                message: 'Token revocation processed',
            });
        }
    });

    /**
     * OAuth discovery endpoint (RFC 8414)
     */
    app.get('/.well-known/oauth-authorization-server', {
        schema: {
            description: 'OAuth 2.0 authorization server metadata',
            tags: ['oauth'],
        },
    }, async (request, reply) => {
        const baseUrl = process.env.API_BASE_URL || 'https://api.splits.network';
        
        return reply.send({
            issuer: baseUrl,
            token_endpoint: `${baseUrl}/oauth/token`,
            token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
            grant_types_supported: ['client_credentials', 'refresh_token'],
            scopes_supported: Object.values(ROLE_SCOPES).flat(),
            introspection_endpoint: `${baseUrl}/oauth/introspect`,
            revocation_endpoint: `${baseUrl}/oauth/revoke`,
        });
    });
}
