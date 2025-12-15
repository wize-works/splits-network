import { AutomationRepository } from './repository';
import { Logger } from '@splits-network/shared-logging';
import { CandidateRoleMatch } from '@splits-network/shared-types';

/**
 * Phase 3: AI-Assisted Candidate-Role Matching
 * 
 * Provides intelligent suggestions for candidate-job pairings.
 * Key principle: Explainable AI only, humans approve all actions.
 */
export class MatchingService {
    constructor(
        private repository: AutomationRepository,
        private logger: Logger
    ) {}

    /**
     * Generate match suggestions for a candidate across all active jobs
     * 
     * This is a simplified rule-based matching. In production, this would:
     * - Use embeddings/vector search
     * - Consider past placement success patterns
     * - Factor in recruiter specializations
     * - Analyze job descriptions vs candidate profiles
     */
    async suggestMatchesForCandidate(
        candidateId: string,
        candidateData: {
            skills?: string[];
            experience_years?: number;
            linkedin_url?: string;
            past_titles?: string[];
        },
        jobs: Array<{
            id: string;
            title: string;
            department?: string;
            location?: string;
            salary_min?: number;
            salary_max?: number;
            description?: string;
        }>
    ): Promise<CandidateRoleMatch[]> {
        this.logger.info(
            { candidateId, jobCount: jobs.length },
            'Generating candidate match suggestions'
        );

        const matches: CandidateRoleMatch[] = [];

        for (const job of jobs) {
            const matchResult = this.calculateMatch(candidateData, job);
            
            if (matchResult.score >= 60) { // Only suggest matches above 60% confidence
                const match = await this.repository.createCandidateMatch({
                    candidate_id: candidateId,
                    job_id: job.id,
                    match_score: matchResult.score,
                    match_reason: matchResult.reasons,
                    suggested_by: 'system',
                    suggested_at: new Date(),
                });

                matches.push(match);
                
                this.logger.info(
                    { candidateId, jobId: job.id, score: matchResult.score },
                    'Match suggestion created'
                );
            }
        }

        return matches;
    }

    /**
     * Calculate match score and provide explainable reasons
     * 
     * Simplified rule-based scoring. Production version would use:
     * - ML models trained on successful placements
     * - Semantic similarity on job descriptions
     * - Skills matching algorithms
     * - Location/compensation alignment
     */
    private calculateMatch(
        candidate: {
            skills?: string[];
            experience_years?: number;
            past_titles?: string[];
        },
        job: {
            title: string;
            department?: string;
            salary_min?: number;
            salary_max?: number;
            description?: string;
        }
    ): { score: number; reasons: string[] } {
        let score = 0;
        const reasons: string[] = [];

        // Title similarity (basic keyword matching)
        if (candidate.past_titles && candidate.past_titles.length > 0) {
            const jobTitleLower = job.title.toLowerCase();
            const titleMatch = candidate.past_titles.some(title => 
                jobTitleLower.includes(title.toLowerCase()) ||
                title.toLowerCase().includes(jobTitleLower)
            );
            
            if (titleMatch) {
                score += 30;
                reasons.push('Previous title matches job title');
            }
        }

        // Experience level alignment
        if (candidate.experience_years) {
            // Assume job titles indicate seniority
            const isSeniorRole = /senior|lead|principal|staff/i.test(job.title);
            const isJuniorRole = /junior|entry|associate/i.test(job.title);
            
            if (isSeniorRole && candidate.experience_years >= 5) {
                score += 20;
                reasons.push('Experience level matches senior role');
            } else if (!isSeniorRole && !isJuniorRole && candidate.experience_years >= 2) {
                score += 20;
                reasons.push('Experience level appropriate for mid-level role');
            } else if (isJuniorRole && candidate.experience_years <= 3) {
                score += 20;
                reasons.push('Experience level matches junior role');
            }
        }

        // Skills matching (basic keyword search)
        if (candidate.skills && candidate.skills.length > 0 && job.description) {
            const descLower = job.description.toLowerCase();
            const matchingSkills = candidate.skills.filter(skill =>
                descLower.includes(skill.toLowerCase())
            );
            
            if (matchingSkills.length > 0) {
                const skillScore = Math.min(30, matchingSkills.length * 10);
                score += skillScore;
                reasons.push(`${matchingSkills.length} matching skills found`);
            }
        }

        // Department/specialization (basic matching)
        if (job.department && candidate.past_titles) {
            const deptMatch = candidate.past_titles.some(title =>
                title.toLowerCase().includes(job.department!.toLowerCase())
            );
            
            if (deptMatch) {
                score += 20;
                reasons.push(`Experience in ${job.department} department`);
            }
        }

        // Base score for any candidate (everyone gets considered)
        if (score === 0) {
            score = 40;
            reasons.push('General profile match');
        }

        return { score: Math.min(100, score), reasons };
    }

    /**
     * Get pending matches for human review
     */
    async getPendingMatches(limit: number = 50): Promise<CandidateRoleMatch[]> {
        return this.repository.findPendingMatches(limit);
    }

    /**
     * Human reviews and accepts/rejects a match suggestion
     */
    async reviewMatch(
        matchId: string,
        reviewedBy: string,
        accepted: boolean,
        rejectionReason?: string
    ): Promise<CandidateRoleMatch> {
        this.logger.info(
            { matchId, reviewedBy, accepted },
            'Match suggestion reviewed'
        );

        const match = await this.repository.reviewMatch(
            matchId,
            reviewedBy,
            accepted,
            rejectionReason
        );

        // Log decision
        await this.repository.createDecisionLog({
            decision_type: accepted ? 'ai_suggestion_accepted' : 'ai_suggestion_rejected',
            entity_type: 'candidate_role_match',
            entity_id: matchId,
            decision_data: {
                match_score: match.match_score,
                match_reasons: match.match_reason,
                rejection_reason: rejectionReason,
            },
            ai_confidence_score: match.match_score,
            created_by: reviewedBy,
        });

        return match;
    }

    /**
     * Batch generate matches for multiple candidates
     * (Run as scheduled job)
     */
    async batchGenerateMatches(
        candidates: Array<{
            id: string;
            skills?: string[];
            experience_years?: number;
            past_titles?: string[];
        }>,
        jobs: Array<{
            id: string;
            title: string;
            department?: string;
            location?: string;
            salary_min?: number;
            salary_max?: number;
            description?: string;
        }>
    ): Promise<number> {
        this.logger.info(
            { candidateCount: candidates.length, jobCount: jobs.length },
            'Batch generating match suggestions'
        );

        let totalMatches = 0;

        for (const candidate of candidates) {
            try {
                const matches = await this.suggestMatchesForCandidate(
                    candidate.id,
                    candidate,
                    jobs
                );
                totalMatches += matches.length;
            } catch (error) {
                this.logger.error(
                    { candidateId: candidate.id, error },
                    'Failed to generate matches for candidate'
                );
            }
        }

        this.logger.info({ totalMatches }, 'Batch match generation complete');
        return totalMatches;
    }
}
