import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAuthenticatedClient } from '@/lib/api-client';
import ReviewForm from './review-form';
import Link from 'next/link';

export default async function ApplicationReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  const client = createAuthenticatedClient(token);
  const applicationId = params.id;

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="alert alert-error mb-6">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
        <Link href="/applications/pending" className="btn">
          <i className="fa-solid fa-arrow-left"></i>
          Back to Pending Applications
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-base-content/60 mb-2">
          <Link href="/applications/pending" className="hover:text-primary">
            Pending Applications
          </Link>
          <i className="fa-solid fa-chevron-right text-xs"></i>
          <span>Review Application</span>
        </div>
        <h1 className="text-4xl font-bold mb-2">Review Application</h1>
        <p className="text-lg text-base-content/70">
          Review the candidate's application and submit it to the company
        </p>
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
