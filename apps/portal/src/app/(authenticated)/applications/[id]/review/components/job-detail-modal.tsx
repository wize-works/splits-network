'use client';

interface JobDetailModalProps {
    job: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function JobDetailModal({ job, isOpen, onClose }: JobDetailModalProps) {
    if (!isOpen || !job) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-4xl">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{job.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                            {job.company?.name && (
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-building"></i>
                                    <span>{job.company.name}</span>
                                </div>
                            )}
                            {job.location && (
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-location-dot"></i>
                                    <span>{job.location}</span>
                                </div>
                            )}
                            {job.employment_type && (
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-briefcase"></i>
                                    <span className="capitalize">{job.employment_type.replace('_', ' ')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="divider my-4"></div>

                {/* Job Details */}
                <div className="space-y-6">
                    {/* Salary Range */}
                    {(job.salary_min || job.salary_max) && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-dollar-sign text-success"></i>
                                Salary Range
                            </h4>
                            <p className="text-base-content/80">
                                {job.salary_min && job.salary_max
                                    ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
                                    : job.salary_min
                                        ? `$${job.salary_min.toLocaleString()}+`
                                        : `Up to $${job.salary_max.toLocaleString()}`}
                            </p>
                        </div>
                    )}

                    {/* Fee Information */}
                    <div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-percent text-primary"></i>
                            Fee Structure
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-base-content/60">Placement Fee</div>
                                <div className="text-lg font-bold text-primary">{job.fee_percentage}%</div>
                            </div>
                            <div>
                                <div className="text-sm text-base-content/60">Splits Network Fee</div>
                                <div className="text-lg font-bold">{job.splits_fee_percentage}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Description for Recruiter */}
                    {job.recruiter_description && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-file-lines text-info"></i>
                                Position Details (For Recruiters)
                            </h4>
                            <div className="p-4 bg-base-200/50 rounded-lg">
                                <p className="text-base-content/80 whitespace-pre-wrap">{job.recruiter_description}</p>
                            </div>
                        </div>
                    )}

                    {/* Candidate-Facing Description */}
                    {job.candidate_description && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-user-group text-warning"></i>
                                Position Details (For Candidates)
                            </h4>
                            <div className="p-4 bg-base-200/50 rounded-lg">
                                <p className="text-base-content/80 whitespace-pre-wrap">{job.candidate_description}</p>
                            </div>
                        </div>
                    )}

                    {/* Requirements */}
                    {job.requirements && job.requirements.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-list-check text-error"></i>
                                Requirements
                            </h4>
                            <div className="space-y-2">
                                {job.requirements.map((req: any, index: number) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-base-200/50 rounded-lg">
                                        <span className={`badge badge-sm ${req.requirement_type === 'mandatory' ? 'badge-error' : 'badge-warning'}`}>
                                            {req.requirement_type === 'mandatory' ? 'Required' : 'Preferred'}
                                        </span>
                                        <span className="flex-1">{req.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional Details */}
                    <div className="grid grid-cols-2 gap-4">
                        {job.department && (
                            <div>
                                <div className="text-sm font-semibold text-base-content/60 mb-1">Department</div>
                                <div className="text-base-content/80">{job.department}</div>
                            </div>
                        )}
                        <div>
                            <div className="text-sm font-semibold text-base-content/60 mb-1">Open to Relocation</div>
                            <div className="text-base-content/80">
                                {job.open_to_relocation ? (
                                    <span className="badge badge-success badge-sm">Yes</span>
                                ) : (
                                    <span className="badge badge-ghost badge-sm">No</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <div className="text-sm font-semibold text-base-content/60 mb-1">Status</div>
                        <span className={`badge ${job.status === 'open' ? 'badge-success' :
                                job.status === 'paused' ? 'badge-warning' :
                                    'badge-ghost'
                            }`}>
                            {job.status}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-action">
                    <button onClick={onClose} className="btn btn-primary">
                        Close
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop" onClick={onClose}>
                <button>close</button>
            </form>
        </dialog>
    );
}
