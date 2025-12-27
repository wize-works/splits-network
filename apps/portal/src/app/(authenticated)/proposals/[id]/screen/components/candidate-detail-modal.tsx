'use client';

interface CandidateDetailModalProps {
    candidate: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function CandidateDetailModal({ candidate, isOpen, onClose }: CandidateDetailModalProps) {
    if (!isOpen || !candidate) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-3xl">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{candidate.full_name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-envelope"></i>
                                <a href={`mailto:${candidate.email}`} className="hover:text-primary">
                                    {candidate.email}
                                </a>
                            </div>
                            {candidate.phone && (
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-phone"></i>
                                    <a href={`tel:${candidate.phone}`} className="hover:text-primary">
                                        {candidate.phone}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="divider my-4"></div>

                {/* Candidate Details */}
                <div className="space-y-6">
                    {/* Current Position */}
                    {(candidate.current_title || candidate.current_company) && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-briefcase text-primary"></i>
                                Current Position
                            </h4>
                            <div className="p-4 bg-base-200/50 rounded-lg">
                                {candidate.current_title && (
                                    <div className="font-semibold text-lg mb-1">{candidate.current_title}</div>
                                )}
                                {candidate.current_company && (
                                    <div className="text-base-content/70">{candidate.current_company}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    {candidate.location && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-location-dot text-info"></i>
                                Location
                            </h4>
                            <p className="text-base-content/80">{candidate.location}</p>
                        </div>
                    )}

                    {/* Bio */}
                    {candidate.bio && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-user text-success"></i>
                                About
                            </h4>
                            <div className="p-4 bg-base-200/50 rounded-lg">
                                <p className="text-base-content/80 whitespace-pre-wrap">{candidate.bio}</p>
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {candidate.skills && (
                        <div>
                            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-code text-warning"></i>
                                Skills
                            </h4>
                            <div className="p-4 bg-base-200/50 rounded-lg">
                                <p className="text-base-content/80">{candidate.skills}</p>
                            </div>
                        </div>
                    )}

                    {/* Online Profiles */}
                    <div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-link text-secondary"></i>
                            Online Profiles
                        </h4>
                        <div className="space-y-2">
                            {candidate.linkedin_url && (
                                <a
                                    href={candidate.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors"
                                >
                                    <i className="fa-brands fa-linkedin text-2xl text-[#0077b5]"></i>
                                    <span className="flex-1">LinkedIn Profile</span>
                                    <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                                </a>
                            )}
                            {candidate.github_url && (
                                <a
                                    href={candidate.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors"
                                >
                                    <i className="fa-brands fa-github text-2xl"></i>
                                    <span className="flex-1">GitHub Profile</span>
                                    <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                                </a>
                            )}
                            {candidate.portfolio_url && (
                                <a
                                    href={candidate.portfolio_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors"
                                >
                                    <i className="fa-solid fa-globe text-2xl text-primary"></i>
                                    <span className="flex-1">Portfolio / Website</span>
                                    <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                                </a>
                            )}
                            {!candidate.linkedin_url && !candidate.github_url && !candidate.portfolio_url && (
                                <div className="text-center py-4 text-base-content/60">
                                    No online profiles available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timestamps */}
                    {candidate.created_at && (
                        <div className="text-sm text-base-content/60">
                            <i className="fa-solid fa-calendar mr-2"></i>
                            Added on {new Date(candidate.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    )}
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
