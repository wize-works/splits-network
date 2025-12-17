import { AtsRepository } from '../../repository';
import { Candidate, MaskedCandidate } from '@splits-network/shared-types';

export class CandidateService {
    constructor(private repository: AtsRepository) {}

    /**
     * Masks candidate data for company users before acceptance
     */
    maskCandidate(candidate: Candidate): MaskedCandidate {
        const names = candidate.full_name.trim().split(' ');
        const initials = names.length > 1
            ? `${names[0][0]}.${names[names.length - 1][0]}.`
            : `${names[0][0]}.`;

        return {
            id: candidate.id,
            email: 'hidden@splits.network',
            full_name: initials,
            linkedin_url: undefined,
            created_at: candidate.created_at,
            updated_at: candidate.updated_at,
            _masked: true,
        };
    }

    async getCandidates(filters?: { search?: string; limit?: number; offset?: number; recruiter_id?: string }): Promise<Candidate[]> {
        return await this.repository.findAllCandidates(filters);
    }

    async getCandidateById(id: string): Promise<Candidate> {
        const candidate = await this.repository.findCandidateById(id);
        if (!candidate) {
            throw new Error(`Candidate ${id} not found`);
        }
        return candidate;
    }

    async findOrCreateCandidate(
        email: string,
        fullName: string,
        linkedinUrl?: string,
        recruiterId?: string
    ): Promise<Candidate> {
        let candidate = await this.repository.findCandidateByEmail(email);
        if (!candidate) {
            candidate = await this.repository.createCandidate({
                email,
                full_name: fullName,
                linkedin_url: linkedinUrl,
                recruiter_id: recruiterId, // SOURCER: Permanent credit for bringing candidate to platform
            });
        }
        return candidate;
    }

    async updateCandidate(
        id: string,
        updates: { 
            full_name?: string; 
            email?: string; 
            linkedin_url?: string;
            phone?: string;
            location?: string;
            current_title?: string;
            current_company?: string;
        }
    ): Promise<Candidate> {
        const candidate = await this.repository.findCandidateById(id);
        if (!candidate) {
            throw new Error(`Candidate ${id} not found`);
        }

        // Only allow updates if candidate is not self-managed
        if (candidate.user_id) {
            throw new Error('Cannot update self-managed candidate profile');
        }

        return await this.repository.updateCandidate(id, updates);
    }

    /**
     * Get candidate details for a company user
     * Returns masked data if application not accepted
     */
    async getCandidateForCompany(
        candidateId: string,
        companyId: string
    ): Promise<Candidate | MaskedCandidate> {
        const candidate = await this.repository.findCandidateById(candidateId);
        if (!candidate) {
            throw new Error(`Candidate ${candidateId} not found`);
        }

        // Check if any application to this company's jobs has been accepted
        const jobs = await this.repository.findJobsByCompanyId(companyId);
        const jobIds = jobs.map(j => j.id);

        const applications = await this.repository.findApplications({
            candidate_id: candidateId,
            job_ids: jobIds,
        });

        // If no applications found, company shouldn't see this candidate
        if (applications.length === 0) {
            throw new Error('Candidate not found');
        }

        // If any application is accepted, show full details
        const hasAcceptedApplication = applications.some(app => app.accepted_by_company);

        return hasAcceptedApplication ? candidate : this.maskCandidate(candidate);
    }
}
