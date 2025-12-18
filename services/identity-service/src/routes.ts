/**
 * Identity Service - Main Route Registry
 * Registers all domain-specific routes
 */

import { FastifyInstance } from 'fastify';
import { IdentityService } from './service';
import { registerUsersRoutes } from './routes/users/routes';
import { registerOrganizationsRoutes } from './routes/organizations/routes';
import { registerMembershipsRoutes } from './routes/memberships/routes';
import { registerWebhooksRoutes } from './routes/webhooks/routes';
import { registerConsentRoutes } from './routes/consent/routes';

export function registerRoutes(app: FastifyInstance, service: IdentityService) {
    // Register domain routes
    registerUsersRoutes(app, service.users);
    registerOrganizationsRoutes(app, service.organizations);
    registerMembershipsRoutes(app, service.memberships);
    registerWebhooksRoutes(app, service.webhooks);
    registerConsentRoutes(app, service.consent);
}
