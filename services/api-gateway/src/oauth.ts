import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import type { Logger } from '@splits-network/shared-logging';

/**
 * OAuth 2.0 scopes for API access control
 */
export const API_SCOPES = {
    // Read scopes
    READ_ROLES: 'read:roles',
    READ_CANDIDATES: 'read:candidates',
    READ_PLACEMENTS: 'read:placements',
    READ_PAYOUTS: 'read:payouts',
    
    // Write scopes
    WRITE_SUBMISSIONS: 'write:submissions',
    WRITE_UPDATES: 'write:updates',
    WRITE_ROLES: 'write:roles',
    
    // Admin scopes
    ADMIN_ALL: 'admin:all',
} as const;

export type ApiScope = typeof API_SCOPES[keyof typeof API_SCOPES];

/**
 * Role-based default scopes
 */
export const ROLE_SCOPES: Record<string, ApiScope[]> = {
    recruiter: [
        API_SCOPES.READ_ROLES,
        API_SCOPES.READ_CANDIDATES,
        API_SCOPES.READ_PLACEMENTS,
        API_SCOPES.READ_PAYOUTS,
        API_SCOPES.WRITE_SUBMISSIONS,
        API_SCOPES.WRITE_UPDATES,
    ],
    company: [
        API_SCOPES.READ_ROLES,
        API_SCOPES.READ_CANDIDATES,
        API_SCOPES.READ_PLACEMENTS,
        API_SCOPES.WRITE_ROLES,
        API_SCOPES.WRITE_UPDATES,
    ],
    admin: [
        API_SCOPES.ADMIN_ALL,
    ],
};

/**
 * OAuth token payload structure
 */
export interface OAuthTokenPayload {
    sub: string; // User ID
    scopes: ApiScope[];
    type: 'access' | 'refresh';
    jti: string; // Token ID
    iat: number;
    exp: number;
}

/**
 * API key structure
 */
export interface ApiKey {
    id: string;
    userId: string;
    name: string;
    keyHash: string;
    scopes: ApiScope[];
    rateLimitTier: 'standard' | 'premium' | 'enterprise';
    createdAt: Date;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    revoked: boolean;
}

/**
 * OAuth token manager for API access
 */
export class OAuthTokenManager {
    private jwtSecret: string;
    private accessTokenTTL: number = 3600; // 1 hour
    private refreshTokenTTL: number = 2592000; // 30 days

    constructor(jwtSecret: string) {
        if (!jwtSecret) {
            throw new Error('JWT secret is required for OAuth token manager');
        }
        this.jwtSecret = jwtSecret;
    }

    /**
     * Generate access token
     */
    generateAccessToken(userId: string, scopes: ApiScope[]): string {
        const payload: OAuthTokenPayload = {
            sub: userId,
            scopes,
            type: 'access',
            jti: randomBytes(16).toString('hex'),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.accessTokenTTL,
        };

        return jwt.sign(payload, this.jwtSecret);
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(userId: string, scopes: ApiScope[]): string {
        const payload: OAuthTokenPayload = {
            sub: userId,
            scopes,
            type: 'refresh',
            jti: randomBytes(16).toString('hex'),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.refreshTokenTTL,
        };

        return jwt.sign(payload, this.jwtSecret);
    }

    /**
     * Verify and decode token
     */
    verifyToken(token: string): OAuthTokenPayload {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as OAuthTokenPayload;
            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Check if token has required scope
     */
    hasScope(token: OAuthTokenPayload, requiredScope: ApiScope): boolean {
        // Admin has access to everything
        if (token.scopes.includes(API_SCOPES.ADMIN_ALL)) {
            return true;
        }
        
        return token.scopes.includes(requiredScope);
    }

    /**
     * Check if token has any of the required scopes
     */
    hasAnyScope(token: OAuthTokenPayload, requiredScopes: ApiScope[]): boolean {
        // Admin has access to everything
        if (token.scopes.includes(API_SCOPES.ADMIN_ALL)) {
            return true;
        }
        
        return requiredScopes.some(scope => token.scopes.includes(scope));
    }

    /**
     * Generate API key (non-JWT, for server-to-server)
     */
    generateApiKey(): string {
        return `sk_${randomBytes(32).toString('hex')}`;
    }
}

/**
 * Fastify decorator types for OAuth
 */
declare module 'fastify' {
    interface FastifyRequest {
        oauthToken?: OAuthTokenPayload;
        apiKey?: ApiKey;
    }
}

/**
 * OAuth authentication hook
 */
export function createOAuthHook(tokenManager: OAuthTokenManager, logger: Logger) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const authHeader = request.headers.authorization;
        
        if (!authHeader) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Authorization header is required',
            });
        }

        const [type, token] = authHeader.split(' ');
        
        if (type !== 'Bearer' || !token) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Invalid authorization header format',
            });
        }

        try {
            // Check if it's a JWT token (OAuth) or API key
            if (token.startsWith('sk_')) {
                // API key authentication (to be implemented with database lookup)
                logger.warn('API key authentication not yet implemented');
                return reply.status(501).send({
                    error: 'Not Implemented',
                    message: 'API key authentication is not yet available',
                });
            } else {
                // OAuth token authentication
                const decoded = tokenManager.verifyToken(token);
                
                if (decoded.type !== 'access') {
                    return reply.status(401).send({
                        error: 'Unauthorized',
                        message: 'Refresh tokens cannot be used for API access',
                    });
                }
                
                // Attach token to request
                request.oauthToken = decoded;
            }
        } catch (error) {
            logger.error({ err: error }, 'OAuth token verification failed');
            return reply.status(401).send({
                error: 'Unauthorized',
                message: error instanceof Error ? error.message : 'Token verification failed',
            });
        }
    };
}

/**
 * Scope validation decorator
 */
export function requireScope(...requiredScopes: ApiScope[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const token = request.oauthToken;
        
        if (!token) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'OAuth token is required',
            });
        }

        const tokenManager = new OAuthTokenManager(process.env.JWT_SECRET || '');
        const hasAccess = tokenManager.hasAnyScope(token, requiredScopes);
        
        if (!hasAccess) {
            return reply.status(403).send({
                error: 'Forbidden',
                message: `Insufficient scope. Required: ${requiredScopes.join(', ')}`,
            });
        }
    };
}
