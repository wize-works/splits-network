import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAuthenticatedClient } from '@/lib/api-client';
import ReviewForm from './components/review-form';
import Link from 'next/link';

export default async function ApplicationReviewPage({
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
    const { id: applicationId } = await params;

    let application: any = null;
    let job: any = null;
    let candidate: any = null;
    let documents: any[] = [];
    let preScreenAnswers: any[] = [];
    let questions: any[] = [];
    let recruiter: any = null;
    let error: string | null = null;

    try {
        // Get recruiter profile first
        const recruiterResponse: any = await client.getRecruiterProfile();
        recruiter = recruiterResponse.data || recruiterResponse;

        // Get application full details
        const appResponse: any = await client.getApplicationFullDetails(applicationId);
        const appData = appResponse.data || appResponse;

        application = appData.application || appData;
        job = appData.job || application.job;
        candidate = appData.candidate || application.candidate;
        documents = appData.documents || [];
        preScreenAnswers = appData.pre_screen_answers || [];
        questions = appData.questions || [];

        // Verify recruiter owns this application
        if (application.recruiter_id !== recruiter.id) {
            error = 'You do not have permission to review this application';
        }

        // Verify application is in screen stage
        if (application.stage !== 'screen') {
            error = `This application is in ${application.stage} stage and cannot be reviewed`;
        }
    } catch (err: any) {
        console.error('Error loading application:', err);
        error = err.message || 'Failed to load application details';
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="alert alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                        <div className="card-actions justify-start mt-4">
                            <Link href="/applications/pending" className="btn">
                                <i className="fa-solid fa-arrow-left"></i>
                                Back to Pending Applications
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
                <Link href="/applications/pending" className="hover:text-primary">
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    Pending Applications
                </Link>
            </div>

            {/* Page Header */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h1 className="text-3xl font-bold">
                        <i className="fa-solid fa-clipboard-check text-primary mr-3"></i>
                        Review Application
                    </h1>
                    <p className="text-base-content/70">
                        Review the candidate's application and submit it to the company
                    </p>
                </div>
            </div>

            <ReviewForm
                application={application}
                job={job}
                candidate={candidate}
                documents={documents}
                preScreenAnswers={preScreenAnswers}
                questions={questions}
            />
        </div>
    );
}
