import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NetworkService } from '../../service';

export function registerRecruiterCandidateRoutes(app: FastifyInstance, service: NetworkService) {
    // Get recruiter-candidate relationship
    app.get(
        '/recruiter-candidates/:recruiterId/:candidateId',
        async (request: FastifyRequest<{ Params: { recruiterId: string; candidateId: string } }>, reply: FastifyReply) => {
            const { recruiterId, candidateId } = request.params;
            const relationship = await service.findRecruiterCandidateRelationship(recruiterId, candidateId);
            
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
            const existing = await service.findRecruiterCandidateRelationship(recruiter_id, candidate_id);
            if (existing) {
                return reply.send({ data: existing });
            }
            
            const relationship = await service.createRecruiterCandidateRelationship(recruiter_id, candidate_id);
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

    // Renew recruiter-candidate relationship
    app.post(
        '/recruiter-candidates/:id/renew',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const { id } = request.params;
            const relationship = await service.renewRecruiterCandidateRelationship(id);
            return reply.send({ data: relationship });
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
