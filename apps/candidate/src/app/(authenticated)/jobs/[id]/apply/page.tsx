import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getJob, getPreScreenQuestions, getMyDocuments, getMyApplications } from '@/lib/api-client';
import ApplicationWizard from './application-wizard';

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, getToken } = await auth();
  const { id: jobId } = await params;

  if (!userId) {
    redirect('/sign-in?redirect=' + encodeURIComponent(`/jobs/${jobId}/apply`));
  }

  const token = await getToken();
  if (!token) {
    redirect('/sign-in');
  }

  try {
    // Fetch all necessary data in parallel
    const [jobResponse, questionsResponse, documentsResponse, applicationsResponse] = await Promise.all([
      getJob(jobId, token),
      getPreScreenQuestions(jobId, token),
      getMyDocuments(token),
      getMyApplications(token),
    ]);

    const job = (jobResponse as any).data;
    const questions = (questionsResponse as any).data || [];
    const documents = (documentsResponse as any).data || [];
    const applications = (applicationsResponse as any).data || [];

    // Check for duplicate application
    const hasApplied = applications.some((app: any) => app.job_id === jobId && app.stage !== 'rejected');
    if (hasApplied) {
      redirect(`/applications?duplicate=true&job=${jobId}`);
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ApplicationWizard
          job={job}
          questions={questions}
          documents={documents}
        />
      </div>
    );
  } catch (error) {
    console.error('Failed to load application page:', error);
    redirect(`/jobs/${jobId}?error=load_failed`);
  }
}
