import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { NetworkService } from '../../service';
import { NotFoundError, BadRequestError, ForbiddenError } from '@splits-network/shared-fastify';

interface UpdateMarketplaceProfileBody {
    marketplace_enabled?: boolean;
    marketplace_visibility?: 'public' | 'limited' | 'hidden';
    marketplace_industries?: string[];
    marketplace_specialties?: string[];
    marketplace_location?: string;
    marketplace_tagline?: string;
    marketplace_years_experience?: number;
    marketplace_profile?: Record<string, any>;
    show_success_metrics?: boolean;
    show_contact_info?: boolean;
}

interface SearchMarketplaceQuery {
    industries?: string;
    specialties?: string;
    location?: string;
    search?: string;
    page?: string;
    limit?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

interface CreateConnectionBody {
    recruiter_id: string;
    message?: string;
}

interface RespondToConnectionBody {
    status: 'accepted' | 'declined';
}

interface SendMessageBody {
    message: string;
}

/**
 * Marketplace Routes
 * - Browse recruiters in the marketplace
 * - Connect with recruiters
 * - Message recruiters
 * - Manage marketplace profile (recruiter settings)
 */
export function registerMarketplaceRoutes(app: FastifyInstance, service: NetworkService) {
    // ========================================================================
    // Public Marketplace Browsing
    // ========================================================================

    // Search/browse marketplace recruiters
    app.get('/marketplace/recruiters', async (request: FastifyRequest<{
        Querystring: SearchMarketplaceQuery;
    }>, reply: FastifyReply) => {
        const query = request.query;

        const filters = {
            industries: query.industries ? query.industries.split(',') : undefined,
            specialties: query.specialties ? query.specialties.split(',') : undefined,
            location: query.location,
            search: query.search,
            page: query.page ? parseInt(query.page) : 1,
            limit: query.limit ? parseInt(query.limit) : 25,
            sort_by: query.sort_by || 'created_at',
            sort_order: query.sort_order || 'desc',
        };

        const result = await service.searchMarketplaceRecruiters(filters);

        // Enrich with reputation data if show_success_metrics is true
        const enrichedData = await Promise.all(result.data.map(async (recruiter: any) => {
            const recruiterData: any = {
                id: recruiter.id,
                user_id: recruiter.user_id,
                user_name: recruiter.user_name,
                user_email: recruiter.user_email,
                marketplace_tagline: recruiter.marketplace_tagline,
                marketplace_industries: recruiter.marketplace_industries,
                marketplace_specialties: recruiter.marketplace_specialties,
                marketplace_location: recruiter.marketplace_location,
                marketplace_years_experience: recruiter.marketplace_years_experience,
                marketplace_profile: recruiter.marketplace_profile,
                bio: recruiter.bio,
                created_at: recruiter.created_at,
            };

            // Include contact info if allowed
            if (recruiter.show_contact_info) {
                // We need to get user info from identity service
                // For now, just mark that contact is available
                recruiterData.contact_available = true;
            }

            // Include success metrics if allowed
            if (recruiter.show_success_metrics) {
                const reputation = await service.getRecruiterReputation(recruiter.id);
                if (reputation) {
                    recruiterData.total_placements = reputation.total_placements;
                    recruiterData.success_rate = reputation.hire_rate;
                    recruiterData.reputation_score = reputation.reputation_score;
                }
            }

            return recruiterData;
        }));

        return reply.send({
            data: enrichedData,
            pagination: {
                total: result.total,
                page: filters.page,
                limit: filters.limit,
                total_pages: Math.ceil(result.total / filters.limit),
            },
        });
    });

    // Get single marketplace recruiter profile
    app.get('/marketplace/recruiters/:id', async (request: FastifyRequest<{
        Params: { id: string };
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        const recruiter = await service.getMarketplaceRecruiter(id);
        if (!recruiter) {
            throw new NotFoundError('Recruiter not found or not available in marketplace');
        }

        const recruiterData: any = {
            id: recruiter.id,
            user_id: recruiter.user_id,
            user_name: recruiter.user_name,
            user_email: recruiter.user_email,
            marketplace_tagline: recruiter.marketplace_tagline,
            marketplace_industries: recruiter.marketplace_industries,
            marketplace_specialties: recruiter.marketplace_specialties,
            marketplace_location: recruiter.marketplace_location,
            marketplace_years_experience: recruiter.marketplace_years_experience,
            marketplace_profile: recruiter.marketplace_profile,
            bio: recruiter.bio,
            created_at: recruiter.created_at,
        };

        // Include contact info if allowed
        if (recruiter.show_contact_info) {
            recruiterData.contact_available = true;
        }

        // Include success metrics if allowed
        if (recruiter.show_success_metrics) {
            const reputation = await service.getRecruiterReputation(recruiter.id);
            if (reputation) {
                recruiterData.total_placements = reputation.total_placements;
                recruiterData.success_rate = reputation.hire_rate;
                recruiterData.reputation_score = reputation.reputation_score;
            }
        }

        return reply.send({ data: recruiterData });
    });

    // ========================================================================
    // Recruiter Marketplace Profile Management
    // ========================================================================

    // Update recruiter's marketplace profile (requires auth, recruiter only)
    app.patch('/recruiters/:id/marketplace', async (request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateMarketplaceProfileBody;
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const updates = request.body;

        // Check if recruiter can enable marketplace (e.g., active subscription)
        if (updates.marketplace_enabled) {
            const requireSubscription = await service.getMarketplaceConfig('require_active_subscription');
            if (requireSubscription === true) {
                // This check would be done in API Gateway or here via billing service call
                // For now, we'll allow it
            }
        }

        const recruiter = await service.updateRecruiter(id, updates);
        return reply.send({ data: recruiter });
    });

    // Get recruiter's own marketplace settings
    app.get('/recruiters/:id/marketplace', async (request: FastifyRequest<{
        Params: { id: string };
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const recruiter = await service.getRecruiterById(id);
        
        if (!recruiter) {
            throw new NotFoundError('Recruiter not found');
        }

        return reply.send({
            data: {
                marketplace_enabled: recruiter.marketplace_enabled || false,
                marketplace_visibility: recruiter.marketplace_visibility || 'public',
                marketplace_industries: recruiter.marketplace_industries || [],
                marketplace_specialties: recruiter.marketplace_specialties || [],
                marketplace_location: recruiter.marketplace_location,
                marketplace_tagline: recruiter.marketplace_tagline,
                marketplace_years_experience: recruiter.marketplace_years_experience,
                marketplace_profile: recruiter.marketplace_profile || {},
                show_success_metrics: recruiter.show_success_metrics || false,
                show_contact_info: recruiter.show_contact_info !== false, // Default true
            },
        });
    });

    // ========================================================================
    // Connection Requests (Candidate actions)
    // ========================================================================

    // Create connection request (candidate to recruiter)
    app.post('/marketplace/connections', async (request: FastifyRequest<{
        Body: CreateConnectionBody & { user_id: string };
    }>, reply: FastifyReply) => {
        const { recruiter_id, message, user_id: candidate_user_id } = request.body;

        if (!candidate_user_id) {
            throw new BadRequestError('User ID is required');
        }

        // Check if connection already exists
        const existing = await service.findMarketplaceConnection(candidate_user_id, recruiter_id);
        if (existing) {
            throw new BadRequestError('Connection request already exists');
        }

        const connection = await service.createMarketplaceConnection({
            candidate_user_id,
            recruiter_id,
            message,
        });

        // TODO: Send notification to recruiter via notification service

        return reply.status(201).send({ data: connection });
    });

    // List candidate's connections
    app.get('/marketplace/connections/user/:userId', async (request: FastifyRequest<{
        Params: { userId: string };
    }>, reply: FastifyReply) => {
        const { userId: candidate_user_id } = request.params;

        if (!candidate_user_id) {
            throw new BadRequestError('User ID is required');
        }

        const connections = await service.listCandidateConnections(candidate_user_id);

        // Enrich with recruiter info and unread counts
        const enrichedConnections = await Promise.all(connections.map(async (conn: any) => {
            const unreadCount = await service.getUnreadMessageCount(conn.id, candidate_user_id);
            return {
                ...conn,
                unread_count: unreadCount,
            };
        }));

        return reply.send({ data: enrichedConnections });
    });

    // ========================================================================
    // Connection Requests (Recruiter actions)
    // ========================================================================

    // List recruiter's connection requests
    app.get('/recruiters/:id/connections', async (request: FastifyRequest<{
        Params: { id: string };
    }>, reply: FastifyReply) => {
        const { id } = request.params;

        const connections = await service.listRecruiterConnections(id);

        // Enrich with unread counts
        const recruiter = await service.getRecruiterById(id);
        if (!recruiter) {
            throw new NotFoundError('Recruiter not found');
        }

        const enrichedConnections = await Promise.all(connections.map(async (conn: any) => {
            const unreadCount = await service.getUnreadMessageCount(conn.id, recruiter.user_id);
            return {
                ...conn,
                unread_count: unreadCount,
            };
        }));

        return reply.send({ data: enrichedConnections });
    });

    // Respond to connection request (recruiter accepts/declines)
    app.patch('/marketplace/connections/:id', async (request: FastifyRequest<{
        Params: { id: string };
        Body: RespondToConnectionBody & { user_id: string };
    }>, reply: FastifyReply) => {
        const { id } = request.params;
        const { status, user_id } = request.body;

        const connection = await service.getMarketplaceConnectionById(id);
        if (!connection) {
            throw new NotFoundError('Connection not found');
        }

        const updated = await service.updateMarketplaceConnection(id, {
            status,
            responded_at: new Date(),
        });

        // TODO: Send notification to candidate via notification service

        return reply.send({ data: updated });
    });

    // ========================================================================
    // Messaging
    // ========================================================================

    // Send message in a connection
    app.post('/marketplace/connections/:id/messages', async (request: FastifyRequest<{
        Params: { id: string };
        Body: SendMessageBody & { user_id: string };
    }>, reply: FastifyReply) => {
        const { id: connection_id } = request.params;
        const { message, user_id: sender_user_id } = request.body;

        if (!sender_user_id) {
            throw new BadRequestError('User ID is required');
        }

        const connection = await service.getMarketplaceConnectionById(connection_id);
        if (!connection) {
            throw new NotFoundError('Connection not found');
        }

        // Determine sender type
        let recruiter;
        try {
            recruiter = await service.getRecruiterById(connection.recruiter_id);
        } catch (error) {
            recruiter = null;
        }
        const sender_type = recruiter && recruiter.user_id === sender_user_id ? 'recruiter' : 'candidate';

        // Only allow messaging if connection is accepted
        if (connection.status !== 'accepted') {
            throw new ForbiddenError('Can only message after connection is accepted');
        }

        const newMessage = await service.createMarketplaceMessage({
            connection_id,
            sender_user_id,
            sender_type,
            message,
        });

        // TODO: Send notification to recipient via notification service

        return reply.status(201).send({ data: newMessage });
    });

    // Get messages for a connection
    app.get('/marketplace/connections/:id/messages', async (request: FastifyRequest<{
        Params: { id: string };
        Querystring: { user_id: string };
    }>, reply: FastifyReply) => {
        const { id: connection_id } = request.params;
        const { user_id } = request.query;

        if (!user_id) {
            throw new BadRequestError('User ID is required');
        }

        const connection = await service.getMarketplaceConnectionById(connection_id);
        if (!connection) {
            throw new NotFoundError('Connection not found');
        }

        // Verify user is part of this connection
        let recruiter;
        try {
            recruiter = await service.getRecruiterById(connection.recruiter_id);
        } catch (error) {
            recruiter = null;
        }
        const isParticipant = connection.candidate_user_id === user_id || 
                             (recruiter && recruiter.user_id === user_id);

        if (!isParticipant) {
            throw new ForbiddenError('Not authorized to view these messages');
        }

        const messages = await service.listConnectionMessages(connection_id);

        // Mark messages as read
        await service.markConnectionMessagesAsRead(connection_id, user_id);

        return reply.send({ data: messages });
    });

    // ========================================================================
    // Marketplace Configuration (Admin only - would be protected by API Gateway)
    // ========================================================================

    // Get marketplace config value
    app.get('/marketplace/config/:key', async (request: FastifyRequest<{
        Params: { key: string };
    }>, reply: FastifyReply) => {
        const { key } = request.params;
        const value = await service.getMarketplaceConfig(key);
        
        if (value === null) {
            throw new NotFoundError('Config key not found');
        }

        return reply.send({ data: { key, value } });
    });
}
