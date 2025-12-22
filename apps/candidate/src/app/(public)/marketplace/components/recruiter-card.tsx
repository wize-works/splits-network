import { useRouter } from 'next/navigation';

interface MarketplaceRecruiter {
    id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    marketplace_tagline?: string;
    marketplace_industries?: string[];
    marketplace_specialties?: string[];
    marketplace_location?: string;
    marketplace_years_experience?: number;
    marketplace_profile?: Record<string, any>;
    bio?: string;
    contact_available?: boolean;
    total_placements?: number;
    success_rate?: number;
    reputation_score?: number;
    created_at: string;
}

interface RecruiterCardProps {
    recruiter: MarketplaceRecruiter;
}

export default function RecruiterCard({ recruiter }: RecruiterCardProps) {
    const router = useRouter();

    // Debug logging
    console.log('RecruiterCard received:', recruiter);

    const viewRecruiter = () => {
        router.push(`/marketplace/${recruiter.id}`);
    };

    return (
        <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
            <div className="card-body">
                <div className="flex items-start justify-between mb-2">
                    <div className="avatar avatar-placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-12">
                            <span className="text-xl">
                                {recruiter.user_name?.charAt(0)?.toUpperCase() || recruiter.user_id?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                        </div>
                    </div>
                    {recruiter.marketplace_years_experience && (
                        <div className="badge badge-outline">
                            {recruiter.marketplace_years_experience}+ years
                        </div>
                    )}
                </div>

                {recruiter.user_name && (
                    <h3 className="card-title text-lg">{recruiter.user_name}</h3>
                )}

                {recruiter.marketplace_tagline && (
                    <p className="text-sm text-base-content/70">{recruiter.marketplace_tagline}</p>
                )}

                {recruiter.marketplace_location && (
                    <p className="text-sm text-base-content/70 flex items-center gap-1">
                        <i className="fa-solid fa-location-dot"></i>
                        {recruiter.marketplace_location}
                    </p>
                )}

                {recruiter.marketplace_industries && recruiter.marketplace_industries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {recruiter.marketplace_industries.slice(0, 3).map(industry => (
                            <span key={industry} className="badge badge-sm">
                                {industry}
                            </span>
                        ))}
                        {recruiter.marketplace_industries.length > 3 && (
                            <span className="badge badge-sm">
                                +{recruiter.marketplace_industries.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {recruiter.marketplace_specialties && recruiter.marketplace_specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {recruiter.marketplace_specialties.slice(0, 3).map(specialty => (
                            <span key={specialty} className="badge badge-sm badge-outline">
                                {specialty}
                            </span>
                        ))}
                        {recruiter.marketplace_specialties.length > 3 && (
                            <span className="badge badge-sm badge-outline">
                                +{recruiter.marketplace_specialties.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {recruiter.total_placements !== undefined && (
                    <div className="stats stats-horizontal shadow-sm mt-3">
                        <div className="stat px-2 py-2">
                            <div className="stat-title text-xs">Placements</div>
                            <div className="stat-value text-lg">{recruiter.total_placements}</div>
                        </div>
                        {recruiter.success_rate !== undefined && (
                            <div className="stat px-2 py-2">
                                <div className="stat-title text-xs">Success Rate</div>
                                <div className="stat-value text-lg">{Math.round(recruiter.success_rate * 100)}%</div>
                            </div>
                        )}
                    </div>
                )}

                <div className="card-actions justify-end mt-4">
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={viewRecruiter}
                    >
                        View Profile
                        <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}
