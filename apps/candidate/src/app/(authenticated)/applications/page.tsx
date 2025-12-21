import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getMyApplications } from '@/lib/api-client';

const getStatusColor = (stage: string) => {
    switch (stage) {
        case 'draft':
            return 'badge-ghost';
        case 'ai_review':
            return 'badge-warning';
        case 'screen':
        case 'submitted':
            return 'badge-info';
        case 'interviewing':
            return 'badge-primary';
        case 'offer':
            return 'badge-success';
        case 'rejected':
        case 'withdrawn':
            return 'badge-error';
        default:
            return 'badge-ghost';
    }
};

const formatStage = (stage: string) => {
    switch (stage) {
        case 'draft':
            return 'Draft';
        case 'ai_review':
            return 'AI Review';
        case 'screen':
            return 'Recruiter Review';
        case 'submitted':
            return 'Submitted';
        case 'interviewing':
            return 'Interviewing';
        case 'offer':
            return 'Offer';
        case 'rejected':
            return 'Rejected';
        case 'withdrawn':
            return 'Withdrawn';
        default:
            return stage;
    }
};

export default async function ApplicationsPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string }>;
}) {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // Get authentication token
    const token = await getToken();
    if (!token) {
        redirect('/sign-in');
    }

    // Fetch real applications data
    let applications: any[] = [];
    let error = null;

    try {
        const data = await getMyApplications(token);
        // API returns { data: [...] } wrapper
        applications = (data as any).data || data || [];
    } catch (err) {
        console.error('Error fetching applications:', err);
        error = 'Failed to load applications';
        applications = [];
    }

    // Await searchParams in Next.js 16
    const params = await searchParams;
    const showSuccess = params.success === 'true';

    const activeApps = applications.filter(app =>
        !['rejected', 'withdrawn'].includes(app.stage)
    );
    const inactiveApps = applications.filter(app =>
        ['rejected', 'withdrawn'].includes(app.stage)
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">My Applications</h1>
                <p className="text-lg text-base-content/70">
                    Track the status of all your job applications
                </p>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="alert alert-success mb-6">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Application submitted successfully!</span>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="alert alert-error mb-6">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body py-4">
                        <div className="stat-value text-3xl text-primary">{applications.length}</div>
                        <div className="stat-title">Total Applications</div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body py-4">
                        <div className="stat-value text-3xl text-success">{activeApps.length}</div>
                        <div className="stat-title">Active</div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body py-4">
                        <div className="stat-value text-3xl text-info">
                            {applications.filter(a => a.status === 'Interview Scheduled').length}
                        </div>
                        <div className="stat-title">Interviews</div>
                    </div>
                </div>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body py-4">
                        <div className="stat-value text-3xl text-warning">
                            {applications.filter(a => a.status === 'Offer Received').length}
                        </div>
                        <div className="stat-title">Offers</div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="tabs tabs-boxed mb-6 bg-base-100 shadow-sm">
                <a className="tab tab-active">All Applications</a>
                <a className="tab">Active</a>
                <a className="tab">Interviews</a>
                <a className="tab">Archived</a>
            </div>

            {/* Active Applications */}
            {activeApps.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Active Applications</h2>
                    <div className="space-y-4">
                        {activeApps.map((app) => (
                            <div key={app.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <Link
                                                href={`/jobs/${app.job_id}`}
                                                className="card-title text-2xl hover:text-primary"
                                            >
                                                {app.job?.title || 'Unknown Position'}
                                            </Link>
                                            <p className="text-lg font-semibold mb-2">{app.job?.company?.name || 'Unknown Company'}</p>
                                            <div className="flex flex-wrap gap-3 text-sm text-base-content/70 mb-4">
                                                {app.job?.location && (
                                                    <span>
                                                        <i className="fa-solid fa-location-dot"></i> {app.job.location}
                                                    </span>
                                                )}
                                                <span>
                                                    <i className="fa-solid fa-calendar"></i> Applied {formatDate(app.created_at)}
                                                </span>
                                                <span>
                                                    <i className="fa-solid fa-clock"></i> Updated {formatDate(app.updated_at)}
                                                </span>
                                            </div>
                                            <div className="mb-3">
                                                <span className={`badge badge-lg ${getStatusColor(app.stage)}`}>
                                                    {formatStage(app.stage)}
                                                </span>
                                            </div>
                                            {app.recruiter && (
                                                <div className="text-sm text-base-content/60 mb-2">
                                                    <i className="fa-solid fa-user"></i> Represented by{' '}
                                                    {app.recruiter.first_name} {app.recruiter.last_name}
                                                </div>
                                            )}
                                            {app.recruiter_notes && (
                                                <div className="alert alert-info">
                                                    <i className="fa-solid fa-circle-info"></i>
                                                    <span>{app.recruiter_notes}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Link
                                                href={`/applications/${app.id}`}
                                                className="btn btn-sm btn-primary"
                                            >
                                                <i className="fa-solid fa-eye"></i>
                                                View Details
                                            </Link>
                                            <Link
                                                href={`/jobs/${app.job_id}`}
                                                className="btn btn-sm btn-outline"
                                            >
                                                <i className="fa-solid fa-briefcase"></i>
                                                View Job
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inactive Applications */}
            {inactiveApps.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Archived Applications</h2>
                    <div className="space-y-4">
                        {inactiveApps.map((app) => (
                            <div key={app.id} className="card bg-base-100 shadow-lg opacity-70">
                                <div className="card-body">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="card-title text-xl">{app.job?.title || 'Unknown Position'}</h3>
                                            <p className="font-semibold mb-2">{app.job?.company?.name || 'Unknown Company'}</p>
                                            <div className="flex flex-wrap gap-3 text-sm text-base-content/70 mb-3">
                                                {app.job?.location && (
                                                    <span>
                                                        <i className="fa-solid fa-location-dot"></i> {app.job.location}
                                                    </span>
                                                )}
                                                <span>
                                                    <i className="fa-solid fa-calendar"></i> Applied {formatDate(app.created_at)}
                                                </span>
                                            </div>
                                            <span className={`badge ${getStatusColor(app.stage)}`}>
                                                {formatStage(app.stage)}
                                            </span>
                                            {app.recruiter_notes && (
                                                <p className="text-sm text-base-content/70 mt-2">{app.recruiter_notes}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {applications.length === 0 && (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body text-center py-16">
                        <i className="fa-solid fa-inbox text-6xl text-base-content/30 mb-4"></i>
                        <h3 className="text-2xl font-bold mb-2">No Applications Yet</h3>
                        <p className="text-base-content/70 mb-6">
                            Start applying to jobs to track your applications here
                        </p>
                        <Link href="/jobs" className="btn btn-primary">
                            <i className="fa-solid fa-search"></i>
                            Browse Jobs
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
