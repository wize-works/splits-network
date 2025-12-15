'use client';

interface PlacementLifecycleProps {
    status: 'hired' | 'active' | 'completed' | 'failed';
    hiredAt: string;
    startDate?: string;
    endDate?: string;
    failureDate?: string;
    failureReason?: string;
    guaranteeDays?: number;
    compact?: boolean;
}

export default function PlacementLifecycle({
    status,
    hiredAt,
    startDate,
    endDate,
    failureDate,
    failureReason,
    guaranteeDays = 90,
    compact = false
}: PlacementLifecycleProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'hired': return 'fa-user-check';
            case 'active': return 'fa-briefcase';
            case 'completed': return 'fa-circle-check';
            case 'failed': return 'fa-triangle-exclamation';
            default: return 'fa-circle';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'hired': return 'badge-info';
            case 'active': return 'badge-primary';
            case 'completed': return 'badge-success';
            case 'failed': return 'badge-error';
            default: return 'badge-ghost';
        }
    };

    const getStatusBgColor = (status: string) => {
        switch (status) {
            case 'hired': return 'bg-info/10 border-info/20';
            case 'active': return 'bg-primary/10 border-primary/20';
            case 'completed': return 'bg-success/10 border-success/20';
            case 'failed': return 'bg-error/10 border-error/20';
            default: return 'bg-base-200';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getDaysInStatus = () => {
        const referenceDate = failureDate || endDate || startDate || hiredAt;
        const days = Math.floor((Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    const isWithinGuarantee = () => {
        if (status !== 'failed') return null;
        if (!failureDate) return null;
        
        const daysSinceHire = Math.floor((new Date(failureDate).getTime() - new Date(hiredAt).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceHire <= guaranteeDays;
    };

    if (compact) {
        return (
            <span className={`badge ${getStatusColor(status)} gap-1`}>
                <i className={`fa-solid ${getStatusIcon(status)}`}></i>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    }

    return (
        <div className={`card border ${getStatusBgColor(status)}`}>
            <div className="card-body p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full ${getStatusColor(status).replace('badge-', 'bg-')} flex items-center justify-center`}>
                            <i className={`fa-solid ${getStatusIcon(status)} text-white text-lg`}></i>
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">
                                {status === 'hired' && 'Hired'}
                                {status === 'active' && 'Active Placement'}
                                {status === 'completed' && 'Completed Successfully'}
                                {status === 'failed' && 'Placement Failed'}
                            </span>
                            <span className={`badge badge-sm ${getStatusColor(status)}`}>
                                {status.toUpperCase()}
                            </span>
                        </div>

                        <div className="space-y-2 text-sm text-base-content/70">
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-calendar-check w-4"></i>
                                <span>Hired: {formatDate(hiredAt)}</span>
                            </div>

                            {startDate && (
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-calendar-day w-4"></i>
                                    <span>Started: {formatDate(startDate)}</span>
                                </div>
                            )}

                            {status === 'active' && (
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-clock w-4"></i>
                                    <span>{getDaysInStatus()} days active</span>
                                </div>
                            )}

                            {endDate && status === 'completed' && (
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-calendar-check w-4"></i>
                                    <span>Completed: {formatDate(endDate)}</span>
                                </div>
                            )}

                            {status === 'failed' && failureDate && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-calendar-xmark w-4"></i>
                                        <span>Failed: {formatDate(failureDate)}</span>
                                    </div>
                                    
                                    {isWithinGuarantee() !== null && (
                                        <div className={`alert ${isWithinGuarantee() ? 'alert-warning' : 'alert-info'} py-2 mt-2`}>
                                            <i className={`fa-solid ${isWithinGuarantee() ? 'fa-shield-halved' : 'fa-info-circle'}`}></i>
                                            <span className="text-xs">
                                                {isWithinGuarantee() 
                                                    ? `Within ${guaranteeDays}-day guarantee period - replacement eligible`
                                                    : `Outside ${guaranteeDays}-day guarantee period`
                                                }
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}

                            {failureReason && (
                                <div className="bg-base-200 rounded p-2 mt-2">
                                    <div className="text-xs font-semibold text-base-content/60 mb-1">Failure Reason</div>
                                    <div className="text-xs">{failureReason}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
