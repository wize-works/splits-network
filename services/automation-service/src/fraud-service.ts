import { AutomationRepository } from './repository';
import { Logger } from '@splits-network/shared-logging';
import { FraudSignal, FraudSignalSeverity } from '@splits-network/shared-types';

interface ActivityPattern {
    recruiterId: string;
    activityType: string;
    count: number;
    timeWindowHours: number;
}

/**
 * Phase 3: Fraud Detection Service
 * 
 * Detects suspicious patterns and gaming behaviors:
 * - Duplicate submissions
 * - Suspicious velocity patterns
 * - Circular candidate sharing
 * - Fake applications
 */
export class FraudDetectionService {
    constructor(
        private repository: AutomationRepository,
        private logger: Logger
    ) {}

    /**
     * Check for duplicate candidate submissions across jobs
     */
    async checkDuplicateSubmission(
        candidateId: string,
        jobId: string,
        recruiterId: string,
        existingApplications: Array<{ job_id: string; recruiter_id: string; created_at: Date }>
    ): Promise<FraudSignal | null> {
        // Check if candidate already submitted to this job
        const duplicates = existingApplications.filter(app => 
            app.job_id === jobId && app.recruiter_id !== recruiterId
        );

        if (duplicates.length > 0) {
            const signal = await this.createSignal({
                signal_type: 'duplicate_submission',
                severity: 'high',
                recruiter_id: recruiterId,
                job_id: jobId,
                candidate_id: candidateId,
                signal_data: {
                    duplicate_count: duplicates.length,
                    existing_recruiters: duplicates.map(d => d.recruiter_id),
                    message: 'Candidate already submitted to this job by another recruiter',
                },
                confidence_score: 95,
            });

            this.logger.warn(
                { candidateId, jobId, recruiterId },
                'Duplicate submission detected'
            );

            return signal;
        }

        return null;
    }

    /**
     * Check for suspicious submission velocity
     * (e.g., submitting 20 candidates in 10 minutes)
     */
    async checkSubmissionVelocity(
        recruiterId: string,
        recentSubmissions: Array<{ created_at: Date }>
    ): Promise<FraudSignal | null> {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const submissionsLastHour = recentSubmissions.filter(
            sub => sub.created_at >= oneHourAgo
        );

        // Flag if more than 15 submissions in an hour (likely automated)
        if (submissionsLastHour.length > 15) {
            const signal = await this.createSignal({
                signal_type: 'velocity_anomaly',
                severity: 'medium',
                recruiter_id: recruiterId,
                signal_data: {
                    submissions_count: submissionsLastHour.length,
                    time_window_hours: 1,
                    threshold: 15,
                    message: 'Unusually high submission rate detected',
                },
                confidence_score: 80,
            });

            this.logger.warn(
                { recruiterId, count: submissionsLastHour.length },
                'Suspicious submission velocity detected'
            );

            return signal;
        }

        return null;
    }

    /**
     * Check for suspicious patterns across multiple metrics
     */
    async checkRecruiterActivity(
        recruiterId: string,
        activityData: {
            total_submissions_24h: number;
            unique_candidates_24h: number;
            unique_jobs_24h: number;
            avg_time_between_submissions_minutes: number;
        }
    ): Promise<FraudSignal[]> {
        const signals: FraudSignal[] = [];

        // Pattern 1: Submitting same candidate to many jobs quickly
        const candidateJobRatio = activityData.unique_jobs_24h / Math.max(1, activityData.unique_candidates_24h);
        if (candidateJobRatio > 5 && activityData.unique_candidates_24h > 0) {
            const signal = await this.createSignal({
                signal_type: 'suspicious_pattern',
                severity: 'medium',
                recruiter_id: recruiterId,
                signal_data: {
                    pattern: 'mass_submission_same_candidates',
                    candidate_count: activityData.unique_candidates_24h,
                    job_count: activityData.unique_jobs_24h,
                    ratio: candidateJobRatio,
                    message: 'Submitting same candidates to many jobs',
                },
                confidence_score: 70,
            });
            signals.push(signal);
        }

        // Pattern 2: Very fast submission rate (likely automated)
        if (activityData.avg_time_between_submissions_minutes < 2 && activityData.total_submissions_24h > 10) {
            const signal = await this.createSignal({
                signal_type: 'automated_behavior',
                severity: 'high',
                recruiter_id: recruiterId,
                signal_data: {
                    avg_time_between_submissions: activityData.avg_time_between_submissions_minutes,
                    total_submissions: activityData.total_submissions_24h,
                    message: 'Submission pattern suggests automated tool usage',
                },
                confidence_score: 85,
            });
            signals.push(signal);
        }

        if (signals.length > 0) {
            this.logger.warn(
                { recruiterId, signalCount: signals.length },
                'Suspicious recruiter activity detected'
            );
        }

        return signals;
    }

    /**
     * Check for circular candidate sharing (collusion detection)
     */
    async checkCircularSharing(
        candidateId: string,
        involvedRecruiters: Array<{ recruiter_id: string; action: string; timestamp: Date }>
    ): Promise<FraudSignal | null> {
        // If same candidate bounces between multiple recruiters quickly
        if (involvedRecruiters.length >= 3) {
            const firstAction = involvedRecruiters[0].timestamp;
            const lastAction = involvedRecruiters[involvedRecruiters.length - 1].timestamp;
            const hoursDiff = (lastAction.getTime() - firstAction.getTime()) / (1000 * 60 * 60);

            // Multiple recruiters touching same candidate within 24 hours
            if (hoursDiff < 24) {
                const signal = await this.createSignal({
                    signal_type: 'circular_sharing',
                    severity: 'high',
                    candidate_id: candidateId,
                    signal_data: {
                        recruiter_count: involvedRecruiters.length,
                        recruiters: involvedRecruiters.map(r => r.recruiter_id),
                        time_span_hours: hoursDiff,
                        message: 'Candidate passed between multiple recruiters rapidly',
                    },
                    confidence_score: 75,
                });

                this.logger.warn({ candidateId }, 'Circular candidate sharing detected');
                return signal;
            }
        }

        return null;
    }

    /**
     * Get active fraud signals for review
     */
    async getActiveSignals(filters?: {
        severity?: FraudSignalSeverity;
        recruiter_id?: string;
    }): Promise<FraudSignal[]> {
        return this.repository.findActiveSignals(filters);
    }

    /**
     * Resolve a fraud signal (admin action)
     */
    async resolveSignal(
        signalId: string,
        reviewedBy: string,
        resolution: {
            is_false_positive: boolean;
            notes?: string;
            action_taken?: string;
        }
    ): Promise<FraudSignal> {
        this.logger.info({ signalId, reviewedBy }, 'Resolving fraud signal');

        const status = resolution.is_false_positive ? 'false_positive' : 'resolved';

        const signal = await this.repository.resolveSignal(
            signalId,
            reviewedBy,
            status,
            resolution.notes,
            resolution.action_taken
        );

        // Log decision
        await this.repository.createDecisionLog({
            decision_type: 'fraud_signal_resolved',
            entity_type: 'fraud_signal',
            entity_id: signalId,
            decision_data: {
                signal_type: signal.signal_type,
                severity: signal.severity,
                is_false_positive: resolution.is_false_positive,
                action_taken: resolution.action_taken,
            },
            created_by: reviewedBy,
        });

        return signal;
    }

    /**
     * Create a fraud signal
     */
    private async createSignal(data: {
        signal_type: string;
        severity: FraudSignalSeverity;
        recruiter_id?: string;
        job_id?: string;
        candidate_id?: string;
        application_id?: string;
        placement_id?: string;
        signal_data: Record<string, any>;
        confidence_score: number;
    }): Promise<FraudSignal> {
        const signal = await this.repository.createFraudSignal({
            ...data,
            status: 'active',
        });

        // Log the detection
        await this.repository.createDecisionLog({
            decision_type: 'fraud_flag_raised',
            entity_type: 'fraud_signal',
            entity_id: signal.id,
            decision_data: {
                signal_type: data.signal_type,
                severity: data.severity,
                confidence_score: data.confidence_score,
                ...data.signal_data,
            },
            ai_confidence_score: data.confidence_score,
            created_by: 'system',
        });

        return signal;
    }
}
