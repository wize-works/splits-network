'use client';

interface RecruiterReputationBadgeProps {
    reputation: {
        recruiter_user_id: string;
        total_submissions: number;
        total_hires: number;
        total_completions: number;
        total_failures: number;
        hire_rate: number;
        completion_rate: number;
        avg_time_to_hire_days?: number;
        avg_response_time_hours?: number;
        quality_score?: number;
    };
    showDetails?: boolean;
    compact?: boolean;
}

export default function RecruiterReputationBadge({
    reputation,
    showDetails = false,
    compact = false
}: RecruiterReputationBadgeProps) {
    const getReputationTier = (hireRate: number, completionRate: number) => {
        const avgRate = (hireRate + completionRate) / 2;
        
        if (avgRate >= 75) return { tier: 'Elite', color: 'badge-success', icon: 'fa-crown' };
        if (avgRate >= 50) return { tier: 'Pro', color: 'badge-primary', icon: 'fa-star' };
        if (avgRate >= 25) return { tier: 'Active', color: 'badge-secondary', icon: 'fa-circle-check' };
        return { tier: 'New', color: 'badge-ghost', icon: 'fa-seedling' };
    };

    const tier = getReputationTier(reputation.hire_rate, reputation.completion_rate);

    if (compact) {
        return (
            <div className={`badge ${tier.color} gap-1`} title={`${tier.tier} Recruiter`}>
                <i className={`fa-solid ${tier.icon}`}></i>
                {tier.tier}
            </div>
        );
    }

    if (!showDetails) {
        return (
            <div className={`badge ${tier.color} gap-2 px-3 py-3`}>
                <i className={`fa-solid ${tier.icon} text-sm`}></i>
                <div className="text-left">
                    <div className="font-semibold">{tier.tier} Recruiter</div>
                    <div className="text-xs opacity-70">{reputation.hire_rate}% hire rate</div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 border border-base-300">
            <div className="card-body p-4">
                <div className="flex items-start gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-full ${tier.color.replace('badge-', 'bg-')} flex items-center justify-center`}>
                        <i className={`fa-solid ${tier.icon} text-white text-xl`}></i>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{tier.tier} Recruiter</span>
                            <span className={`badge ${tier.color} badge-sm`}>{tier.tier.toUpperCase()}</span>
                        </div>
                        <p className="text-sm text-base-content/60 mt-1">
                            {reputation.quality_score ? `Quality Score: ${reputation.quality_score.toFixed(1)}` : 'Building reputation...'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="stat bg-base-200 rounded-lg p-3">
                        <div className="stat-title text-xs">Hire Rate</div>
                        <div className="stat-value text-2xl">{reputation.hire_rate.toFixed(1)}%</div>
                        <div className="stat-desc text-xs">
                            {reputation.total_hires} of {reputation.total_submissions}
                        </div>
                    </div>

                    <div className="stat bg-base-200 rounded-lg p-3">
                        <div className="stat-title text-xs">Completion Rate</div>
                        <div className="stat-value text-2xl">{reputation.completion_rate.toFixed(1)}%</div>
                        <div className="stat-desc text-xs">
                            {reputation.total_completions} completed
                        </div>
                    </div>

                    {reputation.avg_time_to_hire_days !== undefined && (
                        <div className="stat bg-base-200 rounded-lg p-3">
                            <div className="stat-title text-xs">Avg Time to Hire</div>
                            <div className="stat-value text-2xl">{reputation.avg_time_to_hire_days.toFixed(0)}</div>
                            <div className="stat-desc text-xs">days</div>
                        </div>
                    )}

                    {reputation.avg_response_time_hours !== undefined && (
                        <div className="stat bg-base-200 rounded-lg p-3">
                            <div className="stat-title text-xs">Response Time</div>
                            <div className="stat-value text-2xl">{reputation.avg_response_time_hours.toFixed(0)}</div>
                            <div className="stat-desc text-xs">hours avg</div>
                        </div>
                    )}
                </div>

                {reputation.total_failures > 0 && (
                    <div className="alert alert-warning py-2 mt-3">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span className="text-xs">
                            {reputation.total_failures} placement{reputation.total_failures !== 1 ? 's' : ''} failed
                        </span>
                    </div>
                )}

                <div className="text-xs text-base-content/60 mt-3 text-center">
                    Based on {reputation.total_submissions} total submissions
                </div>
            </div>
        </div>
    );
}
