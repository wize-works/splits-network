'use client';

interface OwnershipBadgeProps {
    sourcer: {
        sourcer_user_id: string;
        sourcer_type: 'recruiter' | 'tsn';
        sourced_at: string;
        protection_expires_at?: string;
        notes?: string;
    } | null;
    compact?: boolean;
}

export default function OwnershipBadge({ sourcer, compact = false }: OwnershipBadgeProps) {
    if (!sourcer) {
        return null;
    }

    const isProtected = sourcer.protection_expires_at 
        ? new Date(sourcer.protection_expires_at) > new Date() 
        : false;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (compact) {
        return (
            <div className="badge badge-primary gap-1">
                <i className="fa-solid fa-shield-halved"></i>
                {sourcer.sourcer_type === 'tsn' ? 'TSN Sourced' : 'Sourced'}
            </div>
        );
    }

    return (
        <div className="card bg-primary/10 border border-primary/20">
            <div className="card-body p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <i className="fa-solid fa-shield-halved text-primary-content"></i>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                                {sourcer.sourcer_type === 'tsn' ? 'TSN Sourced' : 'Sourced by Recruiter'}
                            </span>
                            {isProtected && (
                                <span className="badge badge-success badge-sm">Protected</span>
                            )}
                        </div>
                        <div className="text-xs text-base-content/70 space-y-1">
                            <div>
                                <i className="fa-solid fa-calendar-plus mr-1"></i>
                                Sourced {formatDate(sourcer.sourced_at)}
                            </div>
                            {sourcer.protection_expires_at && (
                                <div>
                                    <i className="fa-solid fa-clock mr-1"></i>
                                    {isProtected ? 'Protected until' : 'Protection expired'} {formatDate(sourcer.protection_expires_at)}
                                </div>
                            )}
                        </div>
                        {sourcer.notes && (
                            <div className="text-xs text-base-content/60 mt-2 italic">
                                "{sourcer.notes}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
