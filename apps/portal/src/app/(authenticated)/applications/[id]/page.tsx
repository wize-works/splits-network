import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAuthenticatedClient } from '@/lib/api-client';
import ApplicationDetailClient from './application-detail-client';

export default async function ApplicationDetailPage({
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
    const { id } = await params;
    const applicationId = id;

    let application: any = null;
    let job: any = null;
    let candidate: any = null;
    let documents: any[] = [];
    let preScreenAnswers: any[] = [];
    let questions: any[] = [];
    let recruiter: any = null;
    let relationship: any = null;
    let error: string | null = null;

    try {
        // Get recruiter profile first
        const recruiterResponse: any = await client.getRecruiterProfile();
        recruiter = recruiterResponse.data || recruiterResponse;

        console.log('Recruiter profile:', recruiter);

        // Get application full details
        const appResponse: any = await client.getApplicationFullDetails(applicationId);
        const appData = appResponse.data || appResponse;

        console.log('Application response:', appData);

        application = appData.application || appData;
        job = appData.job || application.job;
        candidate = appData.candidate || application.candidate;
        documents = appData.documents || [];
        preScreenAnswers = appData.pre_screen_answers || [];
        questions = appData.questions || [];

        console.log('Parsed application:', application);
        console.log('Application recruiter_id:', application.recruiter_id);
        console.log('Recruiter id:', recruiter.id);

        // Check recruiter-candidate relationship status first
        if (candidate && recruiter) {
            try {
                const relationshipResponse: any = await client.getRecruiterCandidateRelationship(
                    recruiter.id,
                    candidate.id
                );
                relationship = relationshipResponse.data || relationshipResponse;
                console.log('Recruiter-candidate relationship:', relationship);
            } catch (err) {
                console.warn('Could not fetch recruiter-candidate relationship:', err);
            }
        }

        // Verify recruiter has permission to view this application
        // Permission granted if:
        // 1. Recruiter owns the application (represented candidate) - compare with user_id, OR
        // 2. Recruiter has active relationship with candidate (can view direct applications too)
        // Note: applications.recruiter_id references users table (user_id), not network.recruiters.id
        const ownsApplication = application.recruiter_id === recruiter.user_id;
        const hasRelationship = relationship && relationship.status === 'active';

        if (!ownsApplication && !hasRelationship) {
            error = 'You do not have permission to view this application';
        }
    } catch (err: any) {
        console.error('Error fetching application details:', err);
        error = err.message || 'Failed to load application details';
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="alert alert-warning">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>Application not found</span>
                </div>
            </div>
        );
    }

    return (
        <ApplicationDetailClient
            application={application}
            job={job}
            candidate={candidate}
            documents={documents}
            preScreenAnswers={preScreenAnswers}
            questions={questions}
            recruiter={recruiter}
            relationship={relationship}
        />
    );
}
