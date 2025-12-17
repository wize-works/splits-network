import { FastifyInstance } from 'fastify';
import { NetworkService } from './service';
import { CandidateRoleAssignmentService } from './services/proposals/service';
import { RecruiterReputationService } from './services/reputation/service';
import { registerRecruiterRoutes } from './routes/recruiters/routes';
import { registerAssignmentRoutes } from './routes/assignments/routes';
import { registerProposalRoutes } from './routes/proposals/routes';
import { registerReputationRoutes } from './routes/reputation/routes';
import { registerStatsRoutes } from './routes/stats/routes';
import { registerTeamRoutes } from './routes/teams/routes';
import { registerRecruiterCandidateRoutes } from './routes/recruiter-candidates/routes';

/**
 * Main Route Registry
 * Registers all domain-specific routes
 */
export function registerRoutes(
    app: FastifyInstance,
    service: NetworkService,
    proposalService: CandidateRoleAssignmentService,
    reputationService: RecruiterReputationService
) {
    // Register Phase 1 routes
    registerRecruiterRoutes(app, service);
    registerAssignmentRoutes(app, service);
    registerStatsRoutes(app, service);

    // Register Phase 2 routes
    registerProposalRoutes(app, proposalService);
    registerReputationRoutes(app, reputationService);

    // Register Phase 4B Team routes
    registerTeamRoutes(app);

    // Register Recruiter-Candidate relationship routes
    registerRecruiterCandidateRoutes(app, service);
}
