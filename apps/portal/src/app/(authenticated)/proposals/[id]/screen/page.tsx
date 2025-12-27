import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAuthenticatedClient } from '@/lib/api-client';
import ScreenForm from './components/screen-form';
import Link from 'next/link';

export default async function ProposalScreenPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
        redirect('/sign-in');
    }

    const client = createAuthenticatedClient(token);
    const { id: proposalId } = await params;

    let proposal: any = null;
    let job: any = null;
    let candidate: any = null;
    let documents: any[] = [];
    let error: string | null = null;

    try {
        // Get proposal details
        const proposalResponse: any = await client.get(`/proposals/${proposalId}`);
        const proposalData = proposalResponse.data || proposalResponse;

        proposal = proposalData.proposal || proposalData;

        // Extract job and candidate from various possible locations
        job = proposalData.job || proposal.job || proposal.role || null;
        candidate = proposalData.candidate || proposal.candidate || null;

        // Debug log to see what we're getting
        console.log('Proposal data:', {
            proposal,
            job,
            candidate,
            proposalType: proposal?.type,
            proposalStage: proposal?.stage,
            fullData: proposalData,
            allProposalKeys: Object.keys(proposal || {})
        });

        // For application_screen type, we might need to fetch job separately
        if (!job && proposal.job_id) {
            try {
                const jobResponse: any = await client.get(`/jobs/${proposal.job_id}`);
                job = jobResponse.data || jobResponse;
            } catch (jobErr) {
                console.warn('Could not load job details:', jobErr);
            }
        }

        // Fetch full candidate details if we only have minimal data
        if (candidate?.id && (!candidate.email || !candidate.full_name)) {
            try {
                console.log('Fetching full candidate details for:', candidate.id);
                const candidateResponse: any = await client.get(`/candidates/${candidate.id}`);
                const fullCandidate = candidateResponse.data || candidateResponse;
                candidate = fullCandidate.candidate || fullCandidate;
                console.log('Full candidate data loaded:', candidate);
            } catch (candidateErr) {
                console.warn('Could not load full candidate details:', candidateErr);
                // Continue with minimal candidate data
            }
        }

        // Validate required data
        if (!job) {
            console.warn('Job information is missing from the proposal');
            // Don't set error yet - we'll show what we have
        }
        if (!candidate) {
            error = 'Candidate information is missing from the proposal';
        }

        // Get candidate documents if candidate_id exists
        if (candidate?.id) {
            try {
                const docsResponse: any = await client.getDocumentsByEntity('candidate', candidate.id);
                documents = docsResponse.data || docsResponse || [];
            } catch (docErr) {
                console.warn('Could not load candidate documents:', docErr);
                // Continue without documents
            }
        }

        // Verify proposal is still pending
        // Status can be: pending, accepted, declined, etc.
        const isPending = proposal.status === 'pending' || proposal.status === 'proposed';
        if (!isPending && proposal.status) {
            error = `This proposal has already been ${proposal.status}`;
        }
    } catch (err: any) {
        console.error('Error loading proposal:', err);
        error = err.message || 'Failed to load proposal details';
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <div className="alert alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                        <div className="card-actions justify-start mt-4">
                            <Link href="/proposals" className="btn">
                                <i className="fa-solid fa-arrow-left"></i>
                                Back to Proposals
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-base-content/60">
                <Link href="/proposals" className="hover:text-primary">
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    Proposals
                </Link>
            </div>

            {/* Page Header */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h1 className="text-3xl font-bold">
                        <i className="fa-solid fa-user-check text-primary mr-3"></i>
                        Screen Candidate Proposal
                    </h1>
                    <p className="text-base-content/70">
                        Review the candidate and role details before accepting or declining this proposal
                    </p>
                </div>
            </div>

            <ScreenForm
                proposal={proposal || {}}
                job={job || {}}
                candidate={candidate || {}}
                documents={documents || []}
            />
        </div>
    );
}
