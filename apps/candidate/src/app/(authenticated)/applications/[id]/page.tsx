import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { formatDate } from '@/lib/utils';
import WithdrawButton from '@/components/withdraw-button';

const getStatusColor = (stage: string) => {
    switch (stage) {
        case 'draft':
            return 'badge-ghost';
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
        case 'screen':
            return 'Recruiter Review';
        case 'submitted':
            return 'Submitted to Company';
        case 'interviewing':
            return 'Interviewing';
        case 'offer':
            return 'Offer Received';
        case 'rejected':
            return 'Not Selected';
        case 'withdrawn':
            return 'Withdrawn';
        default:
            return stage;
    }
};

export default async function ApplicationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const token = await getToken();
    if (!token) {
        redirect('/sign-in');
    }

    // Await params in Next.js 15+
    const { id } = await params;

    // Fetch application data server-side
    let application: any = null;

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/applications/${id}/full`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            if (response.status === 404) {
                notFound();
            }
            throw new Error(`Failed to fetch application: ${response.status}`);
        }

        const data = await response.json();
        application = data.data || data;
    } catch (err) {
        console.error('Error fetching application:', err);
        notFound();
    }

    if (!application) {
        notFound();
    }

    const job = application.job || {};
    const company = job.company || {};
    const recruiter = application.recruiter;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <div className="text-sm breadcrumbs mb-6">
                <ul>
                    <li><Link href="/dashboard">Dashboard</Link></li>
                    <li><Link href="/applications">Applications</Link></li>
                    <li>Application Details</li>
                </ul>
            </div>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{job.title || 'Position'}</h1>
                        <p className="text-xl text-base-content/70">{company.name || 'Company'}</p>
                    </div>
                    <span className={`badge badge-lg ${getStatusColor(application.stage)}`}>
                        {formatStage(application.stage)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Job Details */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title mb-4">
                                <i className="fa-solid fa-briefcase"></i>
                                Job Details
                            </h2>

                            <div className="space-y-4">
                                {job.location && (
                                    <div>
                                        <div className="text-sm text-base-content/60 mb-1">Location</div>
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-location-dot"></i>
                                            {job.location}
                                        </div>
                                    </div>
                                )}

                                {job.employment_type && (
                                    <div>
                                        <div className="text-sm text-base-content/60 mb-1">Employment Type</div>
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-clock"></i>
                                            {job.employment_type}
                                        </div>
                                    </div>
                                )}

                                {job.salary_min && job.salary_max && (
                                    <div>
                                        <div className="text-sm text-base-content/60 mb-1">Salary Range</div>
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-dollar-sign"></i>
                                            ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                                            {job.salary_currency && ` ${job.salary_currency}`}
                                        </div>
                                    </div>
                                )}

                                {job.description && (
                                    <div>
                                        <div className="text-sm text-base-content/60 mb-1">Description</div>
                                        <div className="prose max-w-none">
                                            {job.description}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="card-actions justify-end mt-4">
                                <Link href={`/jobs/${job.id}`} className="btn btn-outline">
                                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                    View Full Job Posting
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Application Notes */}
                    {(application.notes || application.recruiter_notes) && (
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title mb-4">
                                    <i className="fa-solid fa-note-sticky"></i>
                                    Notes
                                </h2>

                                {application.notes && (
                                    <div className="mb-4">
                                        <div className="text-sm text-base-content/60 mb-2">Your Notes</div>
                                        <div className="alert">
                                            <i className="fa-solid fa-user"></i>
                                            <span>{application.notes}</span>
                                        </div>
                                    </div>
                                )}

                                {application.recruiter_notes && (
                                    <div>
                                        <div className="text-sm text-base-content/60 mb-2">Recruiter Notes</div>
                                        <div className="alert alert-info">
                                            <i className="fa-solid fa-circle-info"></i>
                                            <span>{application.recruiter_notes}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    {application.documents && application.documents.length > 0 && (
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title mb-4">
                                    <i className="fa-solid fa-file"></i>
                                    Documents
                                </h2>

                                <div className="space-y-2">
                                    {application.documents.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <i className={`fa-solid ${doc.document_type === 'resume' ? 'fa-file-text' :
                                                    doc.document_type === 'cover_letter' ? 'fa-file-lines' :
                                                        'fa-file'
                                                    } text-primary`}></i>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{doc.filename}</div>
                                                    <div className="text-sm text-base-content/60">
                                                        {doc.document_type.replace('_', ' ').toUpperCase()}
                                                        {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                                                    </div>
                                                </div>
                                            </div>
                                            {doc.metadata?.is_primary && (
                                                <span className="badge badge-primary badge-sm">Primary</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pre-screen Answers */}
                    {application.pre_screen_answers && application.pre_screen_answers.length > 0 && (
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title mb-4">
                                    <i className="fa-solid fa-clipboard-question"></i>
                                    Pre-screen Answers
                                </h2>

                                <div className="space-y-4">
                                    {application.pre_screen_answers.map((answer: any, index: number) => (
                                        <div key={index}>
                                            <div className="font-medium mb-1">{answer.question}</div>
                                            <div className="text-base-content/70">{answer.answer}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Application Info */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title mb-4">
                                <i className="fa-solid fa-info-circle"></i>
                                Application Info
                            </h2>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm text-base-content/60">Application Date</div>
                                    <div>{formatDate(application.created_at)}</div>
                                </div>

                                {application.updated_at !== application.created_at && (
                                    <div>
                                        <div className="text-sm text-base-content/60">Last Updated</div>
                                        <div>{formatDate(application.updated_at)}</div>
                                    </div>
                                )}

                                <div>
                                    <div className="text-sm text-base-content/60">Status</div>
                                    <div className="mt-1">
                                        <span className={`badge ${getStatusColor(application.stage)}`}>
                                            {formatStage(application.stage)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recruiter Info */}
                    {recruiter && (
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title mb-4">
                                    <i className="fa-solid fa-user-tie"></i>
                                    Your Recruiter
                                </h2>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm text-base-content/60">Name</div>
                                        <div className="font-medium">
                                            {recruiter.first_name} {recruiter.last_name}
                                        </div>
                                    </div>

                                    {recruiter.email && (
                                        <div>
                                            <div className="text-sm text-base-content/60">Email</div>
                                            <a href={`mailto:${recruiter.email}`} className="link link-primary">
                                                {recruiter.email}
                                            </a>
                                        </div>
                                    )}

                                    {recruiter.phone && (
                                        <div>
                                            <div className="text-sm text-base-content/60">Phone</div>
                                            <a href={`tel:${recruiter.phone}`} className="link link-primary">
                                                {recruiter.phone}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title mb-4">
                                <i className="fa-solid fa-ellipsis"></i>
                                Actions
                            </h2>

                            <div className="space-y-2">
                                {application.stage !== 'withdrawn' && application.stage !== 'rejected' && (
                                    <WithdrawButton
                                        applicationId={application.id}
                                        jobTitle={job.title || 'this position'}
                                    />
                                )}

                                <Link href="/applications" className="btn btn-outline w-full">
                                    <i className="fa-solid fa-arrow-left"></i>
                                    Back to Applications
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
