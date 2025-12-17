import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AtsService } from '../../service';

export function registerCandidateRoutes(app: FastifyInstance, service: AtsService) {
    // Get all candidates with optional filters
    app.get(
        '/candidates',
        async (request: FastifyRequest<{ Querystring: { search?: string; limit?: string; offset?: string; recruiter_id?: string } }>, reply: FastifyReply) => {
            const { search, limit, offset, recruiter_id } = request.query;
            const candidates = await service.getCandidates({
                search,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
                recruiter_id,
            });
            return reply.send({ data: candidates });
        }
    );

    // Get candidate by ID
    app.get(
        '/candidates/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const candidate = await service.getCandidateById(request.params.id);
            return reply.send({ data: candidate });
        }
    );

    // Get applications for a candidate
    app.get(
        '/candidates/:id/applications',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const applications = await service.getApplicationsByCandidateId(request.params.id);
            return reply.send({ data: applications });
        }
    );

    // Create a new candidate
    app.post(
        '/candidates',
        async (request: FastifyRequest<{ Body: { email: string; full_name: string; linkedin_url?: string } }>, reply: FastifyReply) => {
            const { email, full_name, linkedin_url } = request.body;
            
            if (!email || !full_name) {
                return reply.status(400).send({ 
                    error: 'Missing required fields',
                    message: 'email and full_name are required' 
                });
            }
            
            const candidate = await service.findOrCreateCandidate(email, full_name, linkedin_url);
            return reply.status(201).send({ data: candidate });
        }
    );

    // Update a candidate
    app.patch(
        '/candidates/:id',
        async (request: FastifyRequest<{ 
            Params: { id: string }; 
            Body: { 
                full_name?: string; 
                email?: string; 
                linkedin_url?: string;
                phone?: string;
                location?: string;
                current_title?: string;
                current_company?: string;
            } 
        }>, reply: FastifyReply) => {
            const { id } = request.params;
            const updates = request.body;
            
            const candidate = await service.updateCandidate(id, updates);
            return reply.send({ data: candidate });
        }
    );
}
