import { AtsRepository } from '../../repository';
import { AIReview, Application } from '@splits-network/shared-types';
import { EventPublisher } from '../../events';

export interface AIReviewInput {
    application_id: string;
    resume_text?: string;
    job_description: string;
    job_title: string;
    required_skills: string[];
    preferred_skills?: string[];
    required_years?: number;
    candidate_location?: string;
    job_location?: string;
    auto_transition?: boolean; // Auto-transition to next stage after review
}

export interface AIReviewResult {
    fit_score: number; // 0-100
    recommendation: 'strong_fit' | 'good_fit' | 'fair_fit' | 'poor_fit';
    overall_summary: string;
    confidence_level: number; // 0-100
    strengths: string[];
    concerns: string[];
    matched_skills: string[];
    missing_skills: string[];
    skills_match_percentage: number;
    required_years?: number;
    candidate_years?: number;
    meets_experience_requirement?: boolean;
    location_compatibility: 'perfect' | 'good' | 'challenging' | 'mismatch';
}

export class AIReviewService {
    private openaiApiKey: string;
    private modelVersion: string;

    constructor(
        private repository: AtsRepository,
        private eventPublisher: EventPublisher,
        openaiApiKey?: string
    ) {
        this.openaiApiKey = openaiApiKey || process.env.OPENAI_API_KEY || '';
        // Use gpt-3.5-turbo for testing (much cheaper), gpt-4-turbo for production
        // Override with OPENAI_MODEL environment variable
        this.modelVersion = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        if (!this.openaiApiKey) {
            console.warn('⚠️ OPENAI_API_KEY not set. AI review service will not function.');
        }
        console.log(`🤖 AI Review Service initialized with model: ${this.modelVersion}`);
    }

    /**
     * Trigger AI review for an application
     */
    async reviewApplication(input: AIReviewInput): Promise<AIReview> {
        const startTime = Date.now();

        try {
            // Publish start event
            await this.eventPublisher.publish('ai_review.started', {
                application_id: input.application_id,
                timestamp: new Date().toISOString()
            }, 'ats-service');

            // Call AI service
            const result = await this.callAIService(input);

            // Calculate processing time
            const processingTimeMs = Date.now() - startTime;

            // Save AI review to database
            const aiReview = await this.repository.createAIReview({
                application_id: input.application_id,
                fit_score: result.fit_score,
                recommendation: result.recommendation,
                overall_summary: result.overall_summary,
                confidence_level: result.confidence_level,
                strengths: result.strengths,
                concerns: result.concerns,
                matched_skills: result.matched_skills,
                missing_skills: result.missing_skills,
                skills_match_percentage: result.skills_match_percentage,
                required_years: result.required_years,
                candidate_years: result.candidate_years,
                meets_experience_requirement: result.meets_experience_requirement,
                location_compatibility: result.location_compatibility,
                model_version: this.modelVersion,
                processing_time_ms: processingTimeMs,
                analyzed_at: new Date(),
            });

            // Mark application as AI reviewed
            await this.repository.updateApplication(input.application_id, {
                ai_reviewed: true
            });

            // Publish completed event
            await this.eventPublisher.publish('ai_review.completed', {
                application_id: input.application_id,
                ai_review_id: aiReview.id,
                fit_score: aiReview.fit_score,
                recommendation: aiReview.recommendation,
                processing_time_ms: processingTimeMs,
                timestamp: new Date().toISOString()
            }, 'ats-service');

            return aiReview;
        } catch (error) {
            // Publish failed event
            await this.eventPublisher.publish('ai_review.failed', {
                application_id: input.application_id,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }, 'ats-service');

            throw error;
        }
    }

    /**
     * Get AI review for an application
     */
    async getAIReview(applicationId: string): Promise<AIReview | null> {
        return await this.repository.findAIReviewByApplicationId(applicationId);
    }

    /**
     * Get AI review statistics for a job
     */
    async getAIReviewStats(jobId: string): Promise<{
        total_applications: number;
        ai_reviewed_count: number;
        average_fit_score: number;
        recommendation_breakdown: {
            strong_fit: number;
            good_fit: number;
            fair_fit: number;
            poor_fit: number;
        };
        most_matched_skills: string[];
        most_missing_skills: string[];
    }> {
        return await this.repository.getAIReviewStatsByJobId(jobId);
    }

    /**
     * Call OpenAI API to generate AI review
     */
    private async callAIService(input: AIReviewInput): Promise<AIReviewResult> {
        if (!this.openaiApiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }

        // Build the prompt
        const prompt = this.buildPrompt(input);

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`
            },
            body: JSON.stringify({
                model: this.modelVersion,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert recruiter assistant analyzing candidate-job fit. Provide detailed, honest assessments in valid JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3, // Lower temperature for more consistent results
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${error}`);
        }

        const data = await response.json();
        const content = (data as any).choices[0].message.content;
        const result = JSON.parse(content) as AIReviewResult;

        // Validate result
        this.validateAIResult(result);

        return result;
    }

    /**
     * Build the AI prompt
     */
    private buildPrompt(input: AIReviewInput): string {
        return `Analyze the following candidate-job match and provide a detailed assessment.

**Job Information:**
- Title: ${input.job_title}
- Description: ${input.job_description}
- Required Skills: ${input.required_skills.join(', ')}
- Preferred Skills: ${input.preferred_skills?.join(', ') || 'None'}
- Required Experience: ${input.required_years ? `${input.required_years} years` : 'Not specified'}
- Location: ${input.job_location || 'Not specified'}

**Candidate Information:**
${input.resume_text ? `- Resume/Profile: ${input.resume_text.substring(0, 4000)}` : '- Resume: Not provided'}
- Location: ${input.candidate_location || 'Not specified'}

**Instructions:**
Analyze this candidate's fit for the role and provide your assessment in the following JSON format:

{
  "fit_score": <number 0-100>,
  "recommendation": "<strong_fit|good_fit|fair_fit|poor_fit>",
  "overall_summary": "<2-3 sentences summarizing the overall fit>",
  "confidence_level": <number 0-100, how confident you are in this analysis>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "concerns": ["<concern 1>", "<concern 2>", ...],
  "matched_skills": ["<skill 1>", "<skill 2>", ...],
  "missing_skills": ["<skill 1>", "<skill 2>", ...],
  "skills_match_percentage": <number 0-100>,
  "required_years": ${input.required_years || null},
  "candidate_years": <estimated years of relevant experience>,
  "meets_experience_requirement": <boolean>,
  "location_compatibility": "<perfect|good|challenging|mismatch>"
}

**Scoring Guidelines:**
- fit_score: 90-100 = strong_fit, 70-89 = good_fit, 50-69 = fair_fit, 0-49 = poor_fit
- List 3-5 strengths (specific matching qualifications)
- List 0-3 concerns (specific gaps or mismatches)
- matched_skills: Skills from required/preferred list that candidate has
- missing_skills: Skills from required/preferred list that candidate lacks
- location_compatibility: perfect (same location/remote), good (nearby/willing to relocate), challenging (different location but possible), mismatch (incompatible)

Be honest and specific in your assessment. Focus on concrete qualifications and experience.`;
    }

    /**
     * Validate AI result
     */
    private validateAIResult(result: AIReviewResult): void {
        if (result.fit_score < 0 || result.fit_score > 100) {
            throw new Error('Invalid fit_score: must be 0-100');
        }
        if (!['strong_fit', 'good_fit', 'fair_fit', 'poor_fit'].includes(result.recommendation)) {
            throw new Error('Invalid recommendation value');
        }
        if (result.confidence_level < 0 || result.confidence_level > 100) {
            throw new Error('Invalid confidence_level: must be 0-100');
        }
        if (result.skills_match_percentage < 0 || result.skills_match_percentage > 100) {
            throw new Error('Invalid skills_match_percentage: must be 0-100');
        }
        if (!['perfect', 'good', 'challenging', 'mismatch'].includes(result.location_compatibility)) {
            throw new Error('Invalid location_compatibility value');
        }
    }
}
