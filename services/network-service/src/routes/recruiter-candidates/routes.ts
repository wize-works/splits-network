import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NetworkService } from '../../service';
import { Logger } from '@splits-network/shared-logging';
import { registerConsentRoutes } from './consent-routes';

export function registerRecruiterCandidateRoutes(app: FastifyInstance, service: NetworkService) {
    // Register consent management routes (for candidate website)
    const logger = app.log as Logger;
    registerConsentRoutes(app, service, logger);

    // Get recruiter-candidate relationship
    app.get(
        '/recruiter-candidates/:recruiterId/:candidateId',
        async (request: FastifyRequest<{ Params: { recruiterId: string; candidateId: string } }>, reply: FastifyReply) => {
            const { recruiterId, candidateId } = request.params;
            const relationship = await service.getRecruiterCandidateRelationship(recruiterId, candidateId);
            
            if (!relationship) {
                return reply.status(404).send({ 
                    error: 'Relationship not found',
                    data: null 
                });
            }
            
            return reply.send({ data: relationship });
        }
    );

    // Create recruiter-candidate relationship
    app.post(
        '/recruiter-candidates',
        async (request: FastifyRequest<{ Body: { recruiter_id: string; candidate_id: string } }>, reply: FastifyReply) => {
            const { recruiter_id, candidate_id } = request.body;
            
            if (!recruiter_id || !candidate_id) {
                return reply.status(400).send({ 
                    error: 'Missing required fields',
                    message: 'recruiter_id and candidate_id are required' 
                });
            }
            
            // Check if relationship already exists
            const existing = await service.getRecruiterCandidateRelationship(recruiter_id, candidate_id);
            if (existing) {
                return reply.send({ data: existing });
            }
            
            // Create new 12-month relationship
            const relationshipEndDate = new Date();
            relationshipEndDate.setMonth(relationshipEndDate.getMonth() + 12);
            
            const relationship = await service.createRecruiterCandidateRelationship({
                recruiter_id,
                candidate_id,
                relationship_start_date: new Date().toISOString(),
                relationship_end_date: relationshipEndDate.toISOString(),
                status: 'active',
            });
            return reply.status(201).send({ data: relationship });
        }
    );

    // Get all candidates for a recruiter
    app.get(
        '/recruiter-candidates/recruiter/:recruiterId',
        async (request: FastifyRequest<{ Params: { recruiterId: string } }>, reply: FastifyReply) => {
            const { recruiterId } = request.params;
            const relationships = await service.findCandidatesByRecruiterId(recruiterId);
            return reply.send({ data: relationships });
        }
    );

    // Get all recruiters for a candidate
    app.get(
        '/recruiter-candidates/candidate/:candidateId',
        async (request: FastifyRequest<{ Params: { candidateId: string } }>, reply: FastifyReply) => {
            const { candidateId } = request.params;
            const relationships = await service.findRecruitersByCandidateId(candidateId);
            return reply.send({ data: relationships });
        }
    );

    // Renew recruiter-candidate relationship
    app.post(
        '/recruiter-candidates/:id/renew',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { id } = request.params;
            const relationship = await service.renewRecruiterCandidateRelationship(id);
            return reply.send({ data: relationship });
        }
    );

    // Resend invitation to candidate
    app.post(
        '/recruiter-candidates/:id/resend-invitation',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { id } = request.params;
            try {
                const relationship = await service.resendInvitation(id);
                return reply.send({ 
                    data: relationship,
                    message: 'Invitation resent successfully'
                });
            } catch (error: any) {
                return reply.status(400).send({ 
                    error: error.message || 'Failed to resend invitation'
                });
            }
        }
    );

    // Cancel invitation (before candidate accepts)
    app.post(
        '/recruiter-candidates/:id/cancel-invitation',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { id } = request.params;
            try {
                const relationship = await service.cancelInvitation(id);
                return reply.send({ 
                    data: relationship,
                    message: 'Invitation cancelled successfully'
                });
            } catch (error: any) {
                return reply.status(400).send({ 
                    error: error.message || 'Failed to cancel invitation'
                });
            }
        }
    );

    // Terminate recruiter-candidate relationship
    app.patch(
        '/recruiter-candidates/:id/terminate',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { id } = request.params;
            const relationship = await service.updateRecruiterCandidateRelationship(id, {
                status: 'terminated'
            });
            return reply.send({ data: relationship });
        }
    );
}
