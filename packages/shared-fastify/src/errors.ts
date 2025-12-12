import { FastifyRequest, FastifyReply } from 'fastify';
import { ApiError } from '@splits-network/shared-types';

export class HttpError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string, details?: Record<string, any>) {
        super(400, 'BAD_REQUEST', message, details);
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized') {
        super(401, 'UNAUTHORIZED', message);
    }
}

export class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden') {
        super(403, 'FORBIDDEN', message);
    }
}

export class NotFoundError extends HttpError {
    constructor(resource: string, id?: string) {
        const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
        super(404, 'NOT_FOUND', message);
    }
}

export class ConflictError extends HttpError {
    constructor(message: string, details?: Record<string, any>) {
        super(409, 'CONFLICT', message, details);
    }
}

export class InternalServerError extends HttpError {
    constructor(message = 'Internal server error') {
        super(500, 'INTERNAL_SERVER_ERROR', message);
    }
}

/**
 * Error handler middleware for Fastify
 */
export function errorHandler(
    error: Error,
    request: FastifyRequest,
    reply: FastifyReply
) {
    request.log.error(error);

    if (error instanceof HttpError) {
        const response: ApiError = {
            error: {
                code: error.code,
                message: error.message,
                details: error.details,
            },
        };
        return reply.status(error.statusCode).send(response);
    }

    // Default to 500 for unknown errors
    const response: ApiError = {
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
        },
    };
    return reply.status(500).send(response);
}
