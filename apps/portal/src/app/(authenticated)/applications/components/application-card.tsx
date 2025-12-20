import Link from 'next/link';

interface ApplicationCardProps {
    application: {
        id: string;
        stage: string;
        accepted_by_company: boolean;
        accepted_at?: string;
        created_at: string;
        candidate: {
            full_name: string;
            email: string;
            _masked?: boolean;
        };
        job?: {
            title: string;
        };
        company?: {
            name: string;
        };
    };
    canAccept: boolean;
    isAccepting: boolean;
    onAccept: () => void;
    getStageColor: (stage: string) => string;
    formatDate: (date: string) => string;
}

export function ApplicationCard({
    application,
    canAccept,
    isAccepting,
    onAccept,
    getStageColor,
    formatDate,
}: ApplicationCardProps) {
    const candidate = application.candidate;
    const isMasked = candidate._masked;

    return (
        <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="avatar avatar-placeholder">
                            <div className="bg-primary/10 text-primary rounded-full w-12">
                                <span className="text-lg">
                                    {isMasked ? <i className="fa-solid fa-user-secret"></i> : candidate.full_name[0]}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="card-title text-xl">
                                {isMasked && (
                                    <i className="fa-solid fa-eye-slash text-warning mr-1" title="Anonymous"></i>
                                )}
                                {candidate.full_name}
                            </h3>
                            <div className="text-sm text-base-content/70 mt-1">
                                {!isMasked && (
                                    <a href={`mailto:${candidate.email}`} className="link link-hover">
                                        {candidate.email}
                                    </a>
                                )}
                                {isMasked && (
                                    <span className="italic">{candidate.email}</span>
                                )}
                            </div>
                            {application.job && (
                                <div className="text-sm mt-2 flex items-center gap-2">
                                    <i className="fa-solid fa-briefcase text-base-content/40"></i>
                                    <span className="font-medium text-base-content">{application.job.title}</span>
                                </div>
                            )}
                            {application.company && (
                                <div className="text-sm mt-1 flex items-center gap-2">
                                    <i className="fa-solid fa-building text-base-content/40"></i>
                                    <span className="text-base-content/70">{application.company.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <span className={`badge ${getStageColor(application.stage)}`}>
                        {application.stage}
                    </span>
                </div>

                {isMasked && !application.accepted_by_company && (
                    <div className="alert alert-info text-xs mt-3">
                        <i className="fa-solid fa-info-circle"></i>
                        <span className="text-xs">Accept to view full details</span>
                    </div>
                )}

                {application.accepted_by_company && (
                    <div className="badge badge-success gap-2 mt-3">
                        <i className="fa-solid fa-check"></i>
                        Accepted {application.accepted_at && `on ${formatDate(application.accepted_at)}`}
                    </div>
                )}

                <div className="card-actions justify-between items-center mt-4">
                    <span className="text-sm text-base-content/60">
                        Submitted {formatDate(application.created_at)}
                    </span>
                    <div className="flex gap-2">
                        {canAccept && (
                            <button
                                onClick={onAccept}
                                className="btn btn-success btn-sm gap-2"
                                disabled={isAccepting}
                            >
                                {isAccepting ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Accepting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check"></i>
                                        Accept
                                    </>
                                )}
                            </button>
                        )}
                        <Link
                            href={`/applications/${application.id}`}
                            className="btn btn-primary btn-sm gap-2"
                        >
                            View Details
                            <i className="fa-solid fa-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
