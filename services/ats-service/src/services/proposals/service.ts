import { AtsRepository } from '../../repository';
import {
    UnifiedProposal,
    ProposalFilters,
    ProposalsResponse,
    ProposalType,
    ActionParty,
    ActionType,
    StatusBadge,
    getProposalTypeFromStage,
    getPendingActionParty,
    getActionType
} from '@splits-network/shared-types';
import { getNetworkClient } from '../../clients/network-client';

export type UserRole = 'candidate' | 'recruiter' | 'company' | 'admin';

/**
 * Unified Proposal Service
 * 
 * Manages all proposal workflows across the platform by enriching
 * applications with proposal-specific metadata and role-based permissions.
 * 
 * Handles internal entity resolution: converts Clerk user IDs to role-specific entity IDs
 * by calling Network Service when needed (e.g., userId → recruiter_id for recruiters).
 * 
 * @see docs/guidance/unified-proposals-system.md
 */
export class ProposalService {
    private networkClient = getNetworkClient();

    constructor(private repository: AtsRepository) {}

    /**
     * Resolve Clerk user ID to role-specific entity ID
     * 
     * @param clerkUserId - The Clerk user ID from authentication
     * @param userRole - The user's role (recruiter, candidate, company, admin)
     * @param correlationId - Optional correlation ID for tracing
     * @returns The entity ID to use for queries, or null if user is inactive
     */
    async resolveEntityId(
        clerkUserId: string,
        userRole: UserRole,
        correlationId?: string
    ): Promise<string | null> {
        // For recruiters, resolve to recruiter_id via Network Service
        if (userRole === 'recruiter') {
            const recruiter = await this.networkClient.getRecruiterByUserId(clerkUserId, correlationId);
            if (!recruiter) {
                // User is not a recruiter or recruiter is inactive
                return null;
            }
            return recruiter.id;
        }

        // For candidates and companies, Clerk userId maps directly to entity ID
        // (This assumes candidate_id and company_id in applications table match Clerk user IDs)
        // TODO: If companies need similar resolution, add company service client here
        return clerkUserId;
    }

    /**
     * Get all proposals for current user based on their role
     * 
     * @param clerkUserId - The Clerk user ID from authentication
     * @param userRole - The user's role
     * @param filters - Optional filters
     * @param correlationId - Optional correlation ID for tracing
     */
    async getProposalsForUser(
        clerkUserId: string,
        userRole: UserRole,
        filters?: ProposalFilters,
        correlationId?: string
    ): Promise<ProposalsResponse> {
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;

        // Resolve Clerk user ID to entity ID
        const entityId = await this.resolveEntityId(clerkUserId, userRole, correlationId);
        if (!entityId) {
            // User is inactive or not authorized - return empty results
            return {
                data: [],
                pagination: { total: 0, page, limit, total_pages: 0 },
                summary: {
                    actionable_count: 0,
                    waiting_count: 0,
                    urgent_count: 0,
                    overdue_count: 0
                }
            };
        }

        // Build query filters based on role
        const queryFilters: any = {};

        // Role-specific filtering using resolved entity ID
        if (userRole === 'recruiter') {
            queryFilters.recruiter_id = entityId;
        } else if (userRole === 'candidate') {
            queryFilters.candidate_id = entityId;
        } else if (userRole === 'company') {
            queryFilters.company_id = entityId;
        }

        // Type filtering
        if (filters?.type) {
            // Map proposal type to stage(s)
            queryFilters.stage = this.getStagesForProposalType(filters.type);
        }

        // State filtering - handle completed states at DB level
        if (filters?.state === 'completed') {
            queryFilters.stage = ['hired', 'rejected', 'withdrawn'];
        }

        // For actionable/waiting states, we need to get all results first, then filter
        // This is because determining "actionable" requires enrichment logic
        const shouldFilterByState = filters?.state === 'actionable' || filters?.state === 'waiting';
        
        // If we need to filter by state, get more items initially
        const queryLimit = shouldFilterByState ? 100 : limit;
        const queryPage = shouldFilterByState ? 1 : page;

        // Get paginated applications
        const result = await this.repository.findApplicationsPaginated({
            ...queryFilters,
            search: filters?.search,
            sort_by: filters?.sort_by || 'created_at',
            sort_order: filters?.sort_order || 'desc',
            page: queryPage,
            limit: queryLimit
        });

        // Enrich applications as proposals (using entityId for permission checks)
        const proposals = await Promise.all(
            result.data.map(app => this.enrichApplicationAsProposal(app, entityId, userRole))
        );

        // Apply state filtering BEFORE pagination (when we have all items)
        let filteredProposals = proposals;
        if (filters?.state === 'actionable') {
            filteredProposals = proposals.filter(p => p.can_current_user_act);
        } else if (filters?.state === 'waiting') {
            filteredProposals = proposals.filter(p => !p.can_current_user_act && !this.isCompleted(p.stage));
        }

        // Filter by urgency if requested
        if (filters?.urgent_only) {
            filteredProposals = filteredProposals.filter(p => p.is_urgent);
        }

        // Now apply pagination to filtered results (if we did state filtering)
        let paginatedProposals = filteredProposals;
        let totalCount = filteredProposals.length;
        let totalPages = Math.ceil(totalCount / limit);

        if (shouldFilterByState) {
            // Apply pagination to filtered results
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            paginatedProposals = filteredProposals.slice(startIndex, endIndex);
        } else {
            // Use original pagination from DB (flat structure, not nested)
            totalCount = result.total;
            totalPages = result.total_pages;
        }

        // Calculate summary statistics (from all proposals, not just paginated)
        const summary = {
            actionable_count: proposals.filter(p => p.can_current_user_act).length,
            waiting_count: proposals.filter(p => !p.can_current_user_act && !this.isCompleted(p.stage)).length,
            urgent_count: proposals.filter(p => p.is_urgent).length,
            overdue_count: proposals.filter(p => p.is_overdue).length
        };

        return {
            data: paginatedProposals,
            pagination: {
                total: totalCount,
                page,
                limit,
                total_pages: totalPages
            },
            summary
        };
    }

    /**
     * Get proposals requiring user's action
     * 
     * @param clerkUserId - The Clerk user ID from authentication
     * @param userRole - The user's role
     * @param correlationId - Optional correlation ID for tracing
     */
    async getActionableProposals(
        clerkUserId: string,
        userRole: UserRole,
        correlationId?: string
    ): Promise<UnifiedProposal[]> {
        const response = await this.getProposalsForUser(clerkUserId, userRole, {
            state: 'actionable',
            sort_by: 'urgency'
        }, correlationId);
        return response.data;
    }

    /**
     * Get proposals awaiting others (user initiated, pending response)
     * 
     * @param clerkUserId - The Clerk user ID from authentication
     * @param userRole - The user's role
     * @param correlationId - Optional correlation ID for tracing
     */
    async getPendingProposals(
        clerkUserId: string,
        userRole: UserRole,
        correlationId?: string
    ): Promise<UnifiedProposal[]> {
        const response = await this.getProposalsForUser(clerkUserId, userRole, {
            state: 'waiting'
        }, correlationId);
        return response.data;
    }

    /**
     * Enrich application with proposal metadata
     */
    async enrichApplicationAsProposal(
        application: any,  // Enriched application with candidate, job, company, recruiter
        currentUserId: string,
        currentUserRole: UserRole
    ): Promise<UnifiedProposal> {
        const proposalType = getProposalTypeFromStage(application.stage, application.recruiter_id);
        const pendingActionBy = this.determineActionParty(application);
        const pendingActionType = getActionType(application.stage);
        const canCurrentUserAct = this.canUserAct(application, currentUserId, currentUserRole, pendingActionBy);

        // Calculate urgency
        const urgencyInfo = this.calculateUrgency(application);

        // Generate status badge
        const statusBadge = this.getStatusBadge(application.stage, proposalType);

        // Generate action label
        const actionLabel = this.getActionLabel(proposalType, pendingActionType);

        // Generate subtitle
        const subtitle = this.getSubtitle(proposalType, application, currentUserRole);

        return {
            id: application.id,
            type: proposalType,
            stage: application.stage,

            // Parties
            candidate: {
                id: application.candidate_id || application.candidate?.id,
                name: application.candidate?.full_name || application.candidate_name || 'Unknown',
                email: application.candidate?.email || application.candidate_email,
                type: 'candidate'
            },
            recruiter: application.recruiter_id ? {
                id: application.recruiter_id,
                name: application.recruiter?.name || 'Recruiter',
                email: application.recruiter?.email,
                type: 'recruiter'
            } : undefined,
            company: {
                id: application.company_id || application.company?.id,
                name: application.company?.name || 'Company',
                type: 'company'
            },

            // Job details
            job_id: application.job_id || application.job?.id,
            job_title: application.job?.title || application.job_title || 'Position',
            job_description: application.job?.description,
            job_location: application.job?.location,

            // Action tracking
            pending_action_by: pendingActionBy,
            pending_action_type: pendingActionType,
            can_current_user_act: canCurrentUserAct,

            // Deadlines and urgency
            action_due_date: application.action_due_date,
            expires_at: application.expires_at,
            is_urgent: urgencyInfo.is_urgent,
            is_overdue: urgencyInfo.is_overdue,
            hours_remaining: urgencyInfo.hours_remaining,

            // Context
            proposal_notes: application.recruiter_notes || application.metadata?.recruiter_pitch,
            response_notes: application.response_notes,
            ai_analysis: application.ai_analysis,
            metadata: application.metadata,

            // Timestamps
            created_at: application.created_at,
            updated_at: application.updated_at,
            responded_at: application.responded_at,

            // Display helpers
            status_badge: statusBadge,
            action_label: actionLabel,
            subtitle: subtitle
        };
    }

    /**
     * Determine who can act on a proposal
     */
    private determineActionParty(application: any): ActionParty {
        return getPendingActionParty(application.stage, application.recruiter_id);
    }

    /**
     * Check if current user can act on proposal
     */
    private canUserAct(
        application: any,
        userId: string,
        userRole: UserRole,
        pendingActionBy: ActionParty
    ): boolean {
        // Match role to action party
        if (userRole === 'admin') return true;  // Admins can always act

        if (pendingActionBy === 'candidate') {
            return userRole === 'candidate' && application.candidate_id === userId;
        } else if (pendingActionBy === 'recruiter') {
            return userRole === 'recruiter' && application.recruiter_id === userId;
        } else if (pendingActionBy === 'company') {
            return userRole === 'company' && application.company_id === userId;
        }

        return false;
    }

    /**
     * Calculate urgency based on deadlines
     */
    private calculateUrgency(application: any): {
        is_urgent: boolean;
        is_overdue: boolean;
        hours_remaining?: number;
    } {
        const dueDate = application.action_due_date || application.expires_at;
        if (!dueDate) {
            return { is_urgent: false, is_overdue: false };
        }

        const now = new Date();
        const due = new Date(dueDate);
        const diffMs = due.getTime() - now.getTime();
        const hours_remaining = diffMs / (1000 * 60 * 60);

        const is_overdue = hours_remaining < 0;
        const is_urgent = hours_remaining < 24 && hours_remaining >= 0;

        return {
            is_urgent,
            is_overdue,
            hours_remaining: Math.max(0, hours_remaining)
        };
    }

    /**
     * Get status badge configuration
     */
    private getStatusBadge(stage: string, type: ProposalType): StatusBadge {
        // Stage-specific badges
        if (stage === 'recruiter_proposed') {
            return { text: 'Pending Response', color: 'warning', icon: 'clock' };
        } else if (stage === 'draft') {
            return { text: 'In Progress', color: 'info', icon: 'pencil' };
        } else if (stage === 'ai_review') {
            return { text: 'AI Reviewing', color: 'info', icon: 'robot' };
        } else if (stage === 'screen') {
            return { text: 'Screening', color: 'info', icon: 'phone' };
        } else if (stage === 'submitted') {
            return { text: 'Under Review', color: 'info', icon: 'eye' };
        } else if (stage === 'interview') {
            return { text: 'Interview Stage', color: 'info', icon: 'calendar' };
        } else if (stage === 'offer') {
            return { text: 'Offer Extended', color: 'success', icon: 'handshake' };
        } else if (stage === 'hired') {
            return { text: 'Hired', color: 'success', icon: 'check-circle' };
        } else if (stage === 'rejected') {
            return { text: 'Declined', color: 'error', icon: 'times-circle' };
        } else if (stage === 'withdrawn') {
            return { text: 'Withdrawn', color: 'neutral', icon: 'ban' };
        }

        return { text: stage, color: 'neutral', icon: 'circle' };
    }

    /**
     * Get action label for proposal
     */
    private getActionLabel(type: ProposalType, actionType: ActionType): string {
        if (type === 'job_opportunity') {
            return 'Review Opportunity';
        } else if (type === 'application_screen') {
            return 'Conduct Screen';
        } else if (type === 'application_review') {
            return 'Review Application';
        } else if (type === 'collaboration') {
            return 'Review Proposal';
        } else if (type === 'interview_invitation') {
            return 'Schedule Interview';
        } else if (type === 'job_offer') {
            return 'Review Offer';
        }

        return 'Take Action';
    }

    /**
     * Get subtitle for proposal card
     */
    private getSubtitle(type: ProposalType, application: any, userRole: UserRole): string {
        if (type === 'job_opportunity') {
            return `From ${application.recruiter?.name || 'Recruiter'}`;
        } else if (type === 'direct_application') {
            return `Applied by ${application.candidate?.full_name || 'Candidate'}`;
        } else if (type === 'application_screen') {
            return `Screen: ${application.candidate?.full_name || 'Candidate'}`;
        } else if (type === 'application_review') {
            if (userRole === 'recruiter') {
                return `Submitted to ${application.company?.name || 'Company'}`;
            }
            return `From ${application.recruiter?.name || application.candidate?.full_name || 'Candidate'}`;
        }

        return '';
    }

    /**
     * Get application stages for a proposal type
     */
    private getStagesForProposalType(type: ProposalType): string | string[] {
        switch (type) {
            case 'job_opportunity':
                return 'recruiter_proposed';
            case 'direct_application':
                return ['draft', 'submitted'];
            case 'application_screen':
                return ['screen', 'ai_review'];
            case 'application_review':
                return ['submitted', 'interview'];
            case 'job_offer':
                return 'offer';
            default:
                return [];
        }
    }

    /**
     * Check if stage represents a completed proposal
     */
    private isCompleted(stage: string): boolean {
        return ['hired', 'rejected', 'withdrawn'].includes(stage);
    }
}
