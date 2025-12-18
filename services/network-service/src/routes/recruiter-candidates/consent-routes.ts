import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NetworkService } from '../../service';
import { Logger } from '@splits-network/shared-logging';

/**
 * Consent routes for candidate invitations
 * These endpoints are called by the candidate website (Applicant Network)
 * when candidates accept or decline recruiter invitations
 */
export async function registerConsentRoutes(
    fastify: FastifyInstance,
    service: NetworkService,
    logger: Logger
): Promise<void> {
    
    /**
     * GET /recruiter-candidates/invitation/:token
     * Validates invitation token and returns relationship details
     */
    fastify.get<{
        Params: { token: string };
    }>('/recruiter-candidates/invitation/:token', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { token } = request.params as { token: string };
            
            const relationship = await service.getRelationshipByInvitationToken(token);
            
            if (!relationship) {
                return reply.status(404).send({
                    error: 'Invitation not found',
                    message: 'This invitation does not exist or has been revoked'
                });
            }
            
            // Check if token is expired
            if (relationship.invitation_expires_at && new Date(relationship.invitation_expires_at) < new Date()) {
                return reply.status(410).send({
                    error: 'Invitation expired',
                    message: 'This invitation has expired. Please contact your recruiter for a new invitation'
                });
            }
            
            // Check if already processed
            if (relationship.consent_given === true) {
                return reply.status(409).send({
                    error: 'Already accepted',
                    message: 'This invitation has already been accepted'
                });
            }
            
            if (relationship.declined_at) {
                return reply.status(409).send({
                    error: 'Already declined',
                    message: 'This invitation has already been declined'
                });
            }
            
            return reply.send({
                relationship_id: relationship.id,
                recruiter_id: relationship.recruiter_id,
                candidate_id: relationship.candidate_id,
                invited_at: relationship.invited_at,
                expires_at: relationship.invitation_expires_at,
                status: 'pending'
            });
            
        } catch (error) {
            logger.error({ err: error }, 'Error fetching invitation details');
            return reply.status(500).send({
                error: 'Server error',
                message: 'An error occurred while retrieving invitation details'
            });
        }
    });
    
    /**
     * POST /recruiter-candidates/invitation/:token/accept
     * Candidate accepts the invitation and grants right to represent
     */
    fastify.post<{
        Params: { token: string };
        Body: {
            ip_address?: string;
            user_agent?: string;
        };
    }>('/recruiter-candidates/invitation/:token/accept', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { token } = request.params as { token: string };
            const body = request.body as { ip_address?: string; user_agent?: string } || {};
            
            // Extract IP and user agent from request if not provided in body
            const ipAddress = body.ip_address || request.ip || 'unknown';
            const userAgent = body.user_agent || request.headers['user-agent'] || 'unknown';
            
            const relationship = await service.acceptInvitation(token, {
                ip_address: ipAddress,
                user_agent: userAgent,
            });
            
            if (!relationship) {
                return reply.status(404).send({
                    error: 'Invitation not found',
                    message: 'This invitation does not exist or has been revoked'
                });
            }
            
            logger.info({
                relationship_id: relationship.id,
                recruiter_id: relationship.recruiter_id,
                candidate_id: relationship.candidate_id,
            }, 'Candidate accepted invitation');
            
            return reply.send({
                success: true,
                message: 'Invitation accepted successfully',
                relationship_id: relationship.id,
                consent_given_at: relationship.consent_given_at,
            });
            
        } catch (error: any) {
            if (error.message?.includes('expired')) {
                return reply.status(410).send({
                    error: 'Invitation expired',
                    message: error.message
                });
            }
            
            if (error.message?.includes('already')) {
                return reply.status(409).send({
                    error: 'Already processed',
                    message: error.message
                });
            }
            
            logger.error({ err: error }, 'Error accepting invitation');
            return reply.status(500).send({
                error: 'Server error',
                message: 'An error occurred while accepting the invitation'
            });
        }
    });
    
    /**
     * POST /recruiter-candidates/invitation/:token/decline
     * Candidate declines the invitation
     */
    fastify.post<{
        Params: { token: string };
        Body: {
            reason?: string;
            ip_address?: string;
            user_agent?: string;
        };
    }>('/recruiter-candidates/invitation/:token/decline', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { token } = request.params as { token: string };
            const body = request.body as { reason?: string; ip_address?: string; user_agent?: string } || {};
            
            const ipAddress = body.ip_address || request.ip || 'unknown';
            const userAgent = body.user_agent || request.headers['user-agent'] || 'unknown';
            
            const relationship = await service.declineInvitation(token, {
                reason: body.reason,
                ip_address: ipAddress,
                user_agent: userAgent,
            });
            
            if (!relationship) {
                return reply.status(404).send({
                    error: 'Invitation not found',
                    message: 'This invitation does not exist or has been revoked'
                });
            }
            
            logger.info({
                relationship_id: relationship.id,
                recruiter_id: relationship.recruiter_id,
                candidate_id: relationship.candidate_id,
                reason: body.reason,
            }, 'Candidate declined invitation');
            
            return reply.send({
                success: true,
                message: 'Invitation declined',
                relationship_id: relationship.id,
                declined_at: relationship.declined_at,
            });
            
        } catch (error: any) {
            if (error.message?.includes('already')) {
                return reply.status(409).send({
                    error: 'Already processed',
                    message: error.message
                });
            }
            
            logger.error({ err: error }, 'Error declining invitation');
            return reply.status(500).send({
                error: 'Server error',
                message: 'An error occurred while declining the invitation'
            });
        }
    });
}
