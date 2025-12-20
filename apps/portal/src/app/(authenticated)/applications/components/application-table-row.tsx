import Link from 'next/link';

interface ApplicationTableRowProps {
    application: {
        id: string;
        stage: string;
        accepted_by_company: boolean;
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
        recruiter?: {
            name: string;
        };
    };
    canAccept: boolean;
    isAccepting: boolean;
    onAccept: () => void;
    getStageColor: (stage: string) => string;
    formatDate: (date: string) => string;
}

export function ApplicationTableRow({
    application,
    canAccept,
    isAccepting,
    onAccept,
    getStageColor,
    formatDate,
}: ApplicationTableRowProps) {
    const candidate = application.candidate;
    const isMasked = candidate._masked;

    return (
        <tr className="hover">
            <td>
                <div className="flex items-center gap-3">
                    <div className="avatar avatar-placeholder">
                        <div className="bg-primary/10 text-primary rounded-full w-10">
                            <span className="text-sm">
                                {isMasked ? <i className="fa-solid fa-user-secret"></i> : candidate.full_name[0]}
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="font-bold flex items-center gap-2">
                            {isMasked && (
                                <i className="fa-solid fa-eye-slash text-warning" title="Anonymous"></i>
                            )}
                            {candidate.full_name}
                        </div>
                        <div className="text-sm text-base-content/70">
                            {!isMasked && candidate.email}
                            {isMasked && <span className="italic">{candidate.email}</span>}
                        </div>
                    </div>
                </div>
            </td>
            <td>
                {application.job ? (
                    <div className="text-sm font-medium">
                        {application.job.title}
                    </div>
                ) : (
                    <span className="text-base-content/40">—</span>
                )}
            </td>
            <td>
                {application.company ? (
                    <div className="text-sm">
                        {application.company.name}
                    </div>
                ) : (
                    <span className="text-base-content/40">—</span>
                )}
            </td>
            <td>
                {application.recruiter ? (
                    <div className="text-sm">
                        {application.recruiter.name}
                    </div>
                ) : (
                    <span className="text-base-content/40">—</span>
                )}
            </td>
            <td>
                <span className={`badge ${getStageColor(application.stage)}`}>
                    {application.stage}
                </span>
            </td>
            <td>
                {application.accepted_by_company ? (
                    <span className="badge badge-success gap-2">
                        <i className="fa-solid fa-check"></i>
                        Accepted
                    </span>
                ) : (
                    <span className="badge badge-warning gap-2">
                        <i className="fa-solid fa-clock"></i>
                        Pending
                    </span>
                )}
            </td>
            <td>
                <div className="text-sm">{formatDate(application.created_at)}</div>
            </td>
            <td className="text-right">
                <div className="flex gap-2 justify-end">
                    {canAccept && (
                        <button
                            onClick={onAccept}
                            className="btn btn-success btn-sm"
                            disabled={isAccepting}
                        >
                            {isAccepting ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                                <i className="fa-solid fa-check"></i>
                            )}
                        </button>
                    )}
                    <Link
                        href={`/applications/${application.id}`}
                        className="btn btn-primary btn-sm"
                    >
                        <i className="fa-solid fa-arrow-right"></i>
                    </Link>
                </div>
            </td>
        </tr>
    );
}
