import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAuthenticatedClient } from '@/lib/api-client';
import Link from 'next/link';

export default async function PendingApplicationsPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token) {
    redirect('/sign-in');
  }

  const client = createAuthenticatedClient(token);

  // Get recruiter profile
  let recruiter: any = null;
  let applications: any[] = [];
  let error: string | null = null;
  const showSuccess = searchParams.success === 'true';

  try {
    const recruiterResponse: any = await client.getRecruiterProfile();
    recruiter = recruiterResponse.data || recruiterResponse;

    // Get pending applications
    const appsResponse: any = await client.getPendingApplications(recruiter.id);
    applications = (appsResponse.data || appsResponse) || [];
  } catch (err: any) {
    console.error('Error loading pending applications:', err);
    error = err.message || 'Failed to load pending applications';
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pending Applications</h1>
        <p className="text-lg text-base-content/70">
          Review and submit applications from your candidates
        </p>
      </div>

      {showSuccess && (
        <div className="alert alert-success mb-6">
          <i className="fa-solid fa-circle-check"></i>
          <span>Application successfully submitted to company!</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-6">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {!error && applications.length === 0 && (
        <div className="card bg-base-200">
          <div className="card-body text-center py-12">
            <i className="fa-solid fa-inbox text-6xl text-base-content/30 mb-4"></i>
            <h2 className="text-2xl font-semibold mb-2">No Pending Applications</h2>
            <p className="text-base-content/60">
              You don't have any applications awaiting review at the moment.
            </p>
          </div>
        </div>
      )}

      {applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <div key={app.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="card-title text-2xl mb-2">
                      {app.candidate?.full_name || 'Unknown Candidate'}
                    </h3>
                    <div className="flex items-center gap-2 text-lg font-semibold text-primary mb-3">
                      <i className="fa-solid fa-briefcase"></i>
                      <span>{app.job?.title || 'Unknown Position'}</span>
                    </div>
                    <p className="text-base-content/70 mb-3">
                      {app.job?.company?.name || 'Unknown Company'}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-base-content/60 mb-4">
                      {app.job?.location && (
                        <span>
                          <i className="fa-solid fa-location-dot"></i> {app.job.location}
                        </span>
                      )}
                      <span>
                        <i className="fa-solid fa-calendar"></i> Submitted {new Date(app.created_at).toLocaleDateString()}
                      </span>
                      {app.document_count && (
                        <span>
                          <i className="fa-solid fa-file"></i> {app.document_count} document{app.document_count !== 1 ? 's' : ''}
                        </span>
                      )}
                      {app.pre_screen_answer_count > 0 && (
                        <span>
                          <i className="fa-solid fa-clipboard-question"></i> {app.pre_screen_answer_count} question{app.pre_screen_answer_count !== 1 ? 's' : ''} answered
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info">
                        <i className="fa-solid fa-clock mr-1"></i>
                        Awaiting Review
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/applications/${app.id}/review`}
                      className="btn btn-primary"
                    >
                      <i className="fa-solid fa-eye"></i>
                      Review & Submit
                    </Link>
                    <Link
                      href={`/candidates/${app.candidate_id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      <i className="fa-solid fa-user"></i>
                      View Candidate
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
