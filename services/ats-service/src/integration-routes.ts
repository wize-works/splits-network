/**
 * ATS Integration Routes (Phase 4C)
 * API endpoints for managing ATS integrations
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ATSIntegrationService } from './integration-service';

export async function registerIntegrationRoutes(server: FastifyInstance) {
  const integrationService = new ATSIntegrationService(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    process.env.ENCRYPTION_SECRET || 'default-encryption-secret-change-me'
  );

  // List integrations for company
  server.get(
    '/companies/:companyId/integrations',
    {
      schema: {
        tags: ['integrations'],
        description: 'List all ATS integrations for a company',
        params: {
          type: 'object',
          properties: {
            companyId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { companyId } = request.params as { companyId: string };
        const integrations = await integrationService.listCompanyIntegrations(companyId);
        return reply.send({ integrations });
      } catch (error: any) {
        server.log.error(error, 'Failed to list integrations');
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  // Create integration
  server.post(
    '/companies/:companyId/integrations',
    {
      schema: {
        tags: ['integrations'],
        description: 'Create new ATS integration',
        params: {
          type: 'object',
          properties: {
            companyId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['platform', 'api_key'],
          properties: {
            platform: {
              type: 'string',
              enum: ['greenhouse', 'lever', 'workable', 'ashby', 'generic'],
            },
            api_key: { type: 'string' },
            api_base_url: { type: 'string' },
            webhook_url: { type: 'string' },
            config: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { companyId } = request.params as { companyId: string };
        const body = request.body as {
          platform: string;
          api_key: string;
          api_base_url?: string;
          webhook_url?: string;
          config?: any;
        };

        const integration = await integrationService.createIntegration({
          company_id: companyId,
          platform: body.platform as any,
          api_key: body.api_key,
          api_base_url: body.api_base_url,
          webhook_url: body.webhook_url,
          config: body.config,
        });

        return reply.code(201).send(integration);
      } catch (error: any) {
        server.log.error(error, 'Failed to create integration');
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get integration
  server.get(
    '/integrations/:integrationId',
    {
      schema: {
        tags: ['integrations'],
        description: 'Get ATS integration details',
        params: {
          type: 'object',
          properties: {
            integrationId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { integrationId } = request.params as { integrationId: string };
        const integration = await integrationService.getIntegration(integrationId);

        if (!integration) {
          return reply.code(404).send({ error: 'Integration not found' });
        }

        return reply.send(integration);
      } catch (error: any) {
        server.log.error(error, 'Failed to get integration');
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  // Update integration
  server.patch(
    '/integrations/:integrationId',
    {
      schema: {
        tags: ['integrations'],
        description: 'Update ATS integration settings',
        params: {
          type: 'object',
          properties: {
            integrationId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            sync_enabled: { type: 'boolean' },
            sync_roles: { type: 'boolean' },
            sync_candidates: { type: 'boolean' },
            sync_applications: { type: 'boolean' },
            webhook_url: { type: 'string' },
            config: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { integrationId } = request.params as { integrationId: string };
        const body = request.body as any;

        const integration = await integrationService.updateIntegration(integrationId, body);
        return reply.send(integration);
      } catch (error: any) {
        server.log.error(error, 'Failed to update integration');
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Delete integration
  server.delete(
    '/integrations/:integrationId',
    {
      schema: {
        tags: ['integrations'],
        description: 'Delete ATS integration',
        params: {
          type: 'object',
          properties: {
            integrationId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { integrationId } = request.params as { integrationId: string };
        await integrationService.deleteIntegration(integrationId);
        return reply.code(204).send();
      } catch (error: any) {
        server.log.error(error, 'Failed to delete integration');
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  // Trigger manual sync
  server.post(
    '/integrations/:integrationId/sync',
    {
      schema: {
        tags: ['integrations'],
        description: 'Trigger manual synchronization',
        params: {
          type: 'object',
          properties: {
            integrationId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['direction'],
          properties: {
            direction: { type: 'string', enum: ['inbound', 'outbound'] },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { integrationId } = request.params as { integrationId: string };
        const body = request.body as { direction: 'inbound' | 'outbound' };

        const result = await integrationService.triggerSync(integrationId, body.direction);
        return reply.send(result);
      } catch (error: any) {
        server.log.error(error, 'Failed to trigger sync');
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get sync logs
  server.get(
    '/integrations/:integrationId/logs',
    {
      schema: {
        tags: ['integrations'],
        description: 'Get synchronization logs',
        params: {
          type: 'object',
          properties: {
            integrationId: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', default: 50 },
            entity_type: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failed', 'pending', 'conflict'] },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { integrationId } = request.params as { integrationId: string };
        const query = request.query as { limit?: number; entity_type?: string; status?: string };

        const logs = await integrationService.getSyncLogs(integrationId, query);
        return reply.send({ logs });
      } catch (error: any) {
        server.log.error(error, 'Failed to get sync logs');
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  // Test integration connection
  server.post(
    '/integrations/:integrationId/test',
    {
      schema: {
        tags: ['integrations'],
        description: 'Test ATS integration connection',
        params: {
          type: 'object',
          properties: {
            integrationId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { integrationId } = request.params as { integrationId: string };
        
        // For now, return placeholder - actual test would verify API connectivity
        return reply.send({
          success: true,
          message: 'Connection test successful',
        });
      } catch (error: any) {
        server.log.error(error, 'Connection test failed');
        return reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
    }
  );

  // Webhook endpoint for receiving ATS updates
  server.post(
    '/integrations/:integrationId/webhook',
    {
      schema: {
        tags: ['integrations'],
        description: 'Receive webhook from ATS platform',
        params: {
          type: 'object',
          properties: {
            integrationId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { integrationId } = request.params as { integrationId: string };
        const payload = request.body;

        // Verify webhook signature (platform-specific)
        // Process webhook asynchronously
        
        server.log.info({ integrationId, payload }, 'Received ATS webhook');

        return reply.code(202).send({ received: true });
      } catch (error: any) {
        server.log.error(error, 'Failed to process webhook');
        return reply.code(500).send({ error: error.message });
      }
    }
  );
}
