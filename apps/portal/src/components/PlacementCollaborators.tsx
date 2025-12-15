'use client';

interface Collaborator {
    id: string;
    recruiter_user_id: string;
    role: 'sourcer' | 'submitter' | 'closer' | 'support';
    split_percentage: number;
    split_amount: number;
    notes?: string;
}

interface PlacementCollaboratorsProps {
    collaborators: Collaborator[];
    totalFee: number;
    compact?: boolean;
}

export default function PlacementCollaborators({ 
    collaborators, 
    totalFee,
    compact = false 
}: PlacementCollaboratorsProps) {
    if (!collaborators || collaborators.length === 0) {
        return null;
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'sourcer': return 'fa-magnifying-glass';
            case 'submitter': return 'fa-paper-plane';
            case 'closer': return 'fa-handshake';
            case 'support': return 'fa-hands-helping';
            default: return 'fa-user';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'sourcer': return 'badge-primary';
            case 'submitter': return 'badge-secondary';
            case 'closer': return 'badge-success';
            case 'support': return 'badge-info';
            default: return 'badge-ghost';
        }
    };

    const getRoleLabel = (role: string) => {
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (compact) {
        return (
            <div className="flex flex-wrap gap-2">
                {collaborators.map((collab) => (
                    <div key={collab.id} className={`badge ${getRoleColor(collab.role)} gap-1`}>
                        <i className={`fa-solid ${getRoleIcon(collab.role)}`}></i>
                        {getRoleLabel(collab.role)} ({collab.split_percentage}%)
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="card bg-base-100 border border-base-300">
            <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-3">
                    <i className="fa-solid fa-users text-base-content/70"></i>
                    <h3 className="font-semibold">Recruiter Collaboration</h3>
                </div>
                
                <div className="space-y-3">
                    {collaborators.map((collab) => (
                        <div key={collab.id} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center`}>
                                    <i className={`fa-solid ${getRoleIcon(collab.role)} text-primary`}></i>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Recruiter {collab.recruiter_user_id.slice(0, 8)}</span>
                                        <span className={`badge badge-sm ${getRoleColor(collab.role)}`}>
                                            {getRoleLabel(collab.role)}
                                        </span>
                                    </div>
                                    {collab.notes && (
                                        <p className="text-xs text-base-content/60 mt-1">{collab.notes}</p>
                                    )}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold text-lg">
                                    {formatCurrency(collab.split_amount)}
                                </div>
                                <div className="text-xs text-base-content/60">
                                    {collab.split_percentage.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="divider my-2"></div>

                <div className="flex items-center justify-between text-sm">
                    <span className="text-base-content/70">Total Split</span>
                    <div className="text-right">
                        <div className="font-semibold">
                            {formatCurrency(collaborators.reduce((sum, c) => sum + c.split_amount, 0))}
                        </div>
                        <div className="text-xs text-base-content/60">
                            {collaborators.reduce((sum, c) => sum + c.split_percentage, 0).toFixed(1)}% of {formatCurrency(totalFee)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
