/**
 * Team Routes (Phase 4B)
 * API endpoints for team and agency management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TeamService } from './team-service';
import { TeamRepository } from './team-repository';

export async function registerTeamRoutes(server: FastifyInstance) {
  const repo = new TeamRepository(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const service = new TeamService(repo);

  // Create team
  server.post(
    '/teams',
    {
      schema: {
        tags: ['teams'],
        description: 'Create a new recruiting team or agency',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            billing_organization_id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const body = request.body as { name: string; billing_organization_id?: string };
        const team = await service.createTeam({
          name: body.name,
          owner_user_id: userId,
          billing_organization_id: body.billing_organization_id,
        });

        return reply.code(201).send(team);
      } catch (error: any) {
        server.log.error(error, 'Failed to create team');
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // List user's teams
  server.get(
    '/teams',
    {
      schema: {
        tags: ['teams'],
        description: 'List all teams for the authenticated user',
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const teams = await service.listUserTeams(userId);
        return reply.send({ teams });
      } catch (error: any) {
        server.log.error(error, 'Failed to list teams');
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  // Get team details
  server.get(
    '/teams/:teamId',
    {
      schema: {
        tags: ['teams'],
        description: 'Get team details with stats',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { teamId } = request.params as { teamId: string };
        const team = await service.getTeamWithStats(teamId);
        return reply.send(team);
      } catch (error: any) {
        server.log.error(error, 'Failed to get team');
        return reply.code(404).send({ error: error.message });
      }
    }
  );

  // Update team
  server.patch(
    '/teams/:teamId',
    {
      schema: {
        tags: ['teams'],
        description: 'Update team details (owner only)',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            status: { type: 'string', enum: ['active', 'suspended'] },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { teamId } = request.params as { teamId: string };
        const body = request.body as { name?: string; status?: 'active' | 'suspended' };

        const team = await service.updateTeam(teamId, userId, body);
        return reply.send(team);
      } catch (error: any) {
        server.log.error(error, 'Failed to update team');
        return reply.code(403).send({ error: error.message });
      }
    }
  );

  // List team members
  server.get(
    '/teams/:teamId/members',
    {
      schema: {
        tags: ['teams'],
        description: 'List all members of a team',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { teamId } = request.params as { teamId: string };
        const members = await service.listTeamMembers(teamId);
        return reply.send({ members });
      } catch (error: any) {
        server.log.error(error, 'Failed to list team members');
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  // Invite member
  server.post(
    '/teams/:teamId/invitations',
    {
      schema: {
        tags: ['teams'],
        description: 'Invite a member to join the team',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['email', 'role'],
          properties: {
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'member', 'collaborator'] },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { teamId } = request.params as { teamId: string };
        const body = request.body as { email: string; role: 'admin' | 'member' | 'collaborator' };

        const invitation = await service.inviteMember({
          team_id: teamId,
          email: body.email,
          role: body.role,
          invited_by: userId,
        });

        return reply.code(201).send(invitation);
      } catch (error: any) {
        server.log.error(error, 'Failed to invite member');
        return reply.code(403).send({ error: error.message });
      }
    }
  );

  // Accept invitation
  server.post(
    '/teams/invitations/:token/accept',
    {
      schema: {
        tags: ['teams'],
        description: 'Accept a team invitation',
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { token } = request.params as { token: string };
        const member = await service.acceptInvitation(token, userId);

        return reply.send(member);
      } catch (error: any) {
        server.log.error(error, 'Failed to accept invitation');
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Update member role
  server.patch(
    '/teams/:teamId/members/:memberId',
    {
      schema: {
        tags: ['teams'],
        description: 'Update team member role (owner only)',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', format: 'uuid' },
            memberId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['admin', 'member', 'collaborator'] },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { teamId, memberId } = request.params as { teamId: string; memberId: string };
        const body = request.body as { role: 'admin' | 'member' | 'collaborator' };

        const member = await service.updateMemberRole(teamId, memberId, body.role, userId);
        return reply.send(member);
      } catch (error: any) {
        server.log.error(error, 'Failed to update member role');
        return reply.code(403).send({ error: error.message });
      }
    }
  );

  // Remove member
  server.delete(
    '/teams/:teamId/members/:memberId',
    {
      schema: {
        tags: ['teams'],
        description: 'Remove a team member (owner/admin only)',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', format: 'uuid' },
            memberId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { teamId, memberId } = request.params as { teamId: string; memberId: string };
        await service.removeMember(teamId, memberId, userId);

        return reply.code(204).send();
      } catch (error: any) {
        server.log.error(error, 'Failed to remove member');
        return reply.code(403).send({ error: error.message });
      }
    }
  );

  // Configure split model
  server.post(
    '/teams/:teamId/split-configurations',
    {
      schema: {
        tags: ['teams'],
        description: 'Configure split distribution model for team',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['model', 'config'],
          properties: {
            model: { type: 'string', enum: ['flat_split', 'tiered_split', 'individual_credit', 'hybrid'] },
            config: { type: 'object' },
            is_default: { type: 'boolean', default: false },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { teamId } = request.params as { teamId: string };
        const body = request.body as { model: any; config: any; is_default?: boolean };

        const config = await service.configureSplitModel({
          team_id: teamId,
          model: body.model,
          config: body.config,
          is_default: body.is_default || false,
          user_id: userId,
        });

        return reply.code(201).send(config);
      } catch (error: any) {
        server.log.error(error, 'Failed to configure split model');
        return reply.code(400).send({ error: error.message });
      }
    }
  );

  // Get team analytics
  server.get(
    '/teams/:teamId/analytics',
    {
      schema: {
        tags: ['teams'],
        description: 'Get team performance analytics',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            period_start: { type: 'string', format: 'date-time' },
            period_end: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { teamId } = request.params as { teamId: string };
        const query = request.query as { period_start?: string; period_end?: string };

        // Default to last 30 days
        const periodEnd = query.period_end || new Date().toISOString();
        const periodStart =
          query.period_start ||
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const analytics = await service.getTeamAnalytics(teamId, periodStart, periodEnd);
        return reply.send(analytics);
      } catch (error: any) {
        server.log.error(error, 'Failed to get team analytics');
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  // Calculate placement splits
  server.post(
    '/teams/:teamId/placements/:placementId/splits',
    {
      schema: {
        tags: ['teams'],
        description: 'Calculate and create split distributions for a placement',
        params: {
          type: 'object',
          properties: {
            teamId: { type: 'string', format: 'uuid' },
            placementId: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          required: ['placement_fee'],
          properties: {
            placement_fee: { type: 'number' },
            split_configuration_id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { teamId, placementId } = request.params as { teamId: string; placementId: string };
        const body = request.body as { placement_fee: number; split_configuration_id?: string };

        const splits = await service.calculatePlacementSplits({
          placement_id: placementId,
          team_id: teamId,
          placement_fee: body.placement_fee,
          split_configuration_id: body.split_configuration_id,
        });

        return reply.code(201).send({ splits });
      } catch (error: any) {
        server.log.error(error, 'Failed to calculate placement splits');
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
