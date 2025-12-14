import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { ApiClient } from '@/lib/api-client';

interface Placement {
    id: string;
    job_id: string;
    candidate_id: string;
    recruiter_id: string;
    salary: number;
    fee_percentage: number;
    fee_amount: number;
    recruiter_share_amount: number;
    start_date: string;
    created_at: string;
}

async function getPlacements(token: string): Promise<Placement[]> {
    try {
        const client = new ApiClient(undefined, token);
        const response = await client.get('/placements');
        return response.data || [];
    } catch (error) {
        console.error('Failed to fetch placements:', error);
        return [];
    }
}

export default async function PlacementAuditPage() {
    const { getToken } = await auth();
    const token = await getToken();
    
    if (!token) {
        return <div>Unauthorized</div>;
    }
    
    const placements = await getPlacements(token);

    const totalValue = placements.reduce((sum, p) => sum + p.salary, 0);
    const totalFees = placements.reduce((sum, p) => sum + p.fee_amount, 0);
    const totalRecruiterPayout = placements.reduce((sum, p) => sum + p.recruiter_share_amount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href="/admin" className="text-sm text-primary hover:underline mb-2 inline-block">
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    Back to Admin Dashboard
                </Link>
                <h1 className="text-3xl font-bold">Placement Audit</h1>
                <p className="text-base-content/70 mt-1">
                    Review all successful placements and payouts
                </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-title">Total Placements</div>
                    <div className="stat-value text-primary">{placements.length}</div>
                </div>

                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-title">Total Value</div>
                    <div className="stat-value text-2xl">${(totalValue / 1000).toFixed(0)}k</div>
                    <div className="stat-desc">Combined salaries</div>
                </div>

                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-title">Total Fees</div>
                    <div className="stat-value text-2xl text-success">${(totalFees / 1000).toFixed(0)}k</div>
                    <div className="stat-desc">Platform revenue</div>
                </div>

                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-title">Recruiter Payouts</div>
                    <div className="stat-value text-2xl text-warning">${(totalRecruiterPayout / 1000).toFixed(0)}k</div>
                    <div className="stat-desc">Total owed</div>
                </div>
            </div>

            {/* Placements Table */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-0">
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Placement ID</th>
                                    <th>Start Date</th>
                                    <th>Salary</th>
                                    <th>Fee %</th>
                                    <th>Total Fee</th>
                                    <th>Recruiter Share</th>
                                    <th>Platform Share</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {placements.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-base-content/70">
                                            No placements found
                                        </td>
                                    </tr>
                                ) : (
                                    placements.map((placement) => {
                                        const platformShare = placement.fee_amount - placement.recruiter_share_amount;
                                        return (
                                            <tr key={placement.id}>
                                                <td>
                                                    <div className="font-mono text-xs">{placement.id.slice(0, 8)}</div>
                                                </td>
                                                <td>{new Date(placement.start_date).toLocaleDateString()}</td>
                                                <td className="font-semibold">
                                                    ${placement.salary.toLocaleString()}
                                                </td>
                                                <td>{placement.fee_percentage}%</td>
                                                <td className="text-success font-semibold">
                                                    ${placement.fee_amount.toLocaleString()}
                                                </td>
                                                <td className="text-warning">
                                                    ${placement.recruiter_share_amount.toLocaleString()}
                                                </td>
                                                <td className="text-info">
                                                    ${platformShare.toLocaleString()}
                                                </td>
                                                <td className="text-xs text-base-content/70">
                                                    {new Date(placement.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Export & Actions */}
            <div className="flex justify-end gap-2">
                <button className="btn btn-outline" disabled>
                    <i className="fa-solid fa-download"></i>
                    Export CSV
                </button>
                <button className="btn btn-outline" disabled>
                    <i className="fa-solid fa-file-pdf"></i>
                    Export PDF
                </button>
            </div>
        </div>
    );
}
