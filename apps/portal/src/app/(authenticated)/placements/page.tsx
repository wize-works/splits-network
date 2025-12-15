import { auth } from '@clerk/nextjs/server';

// Mock placements data
const mockPlacements = [
    {
        id: '1',
        candidate_name: 'Jane Smith',
        job_title: 'Product Manager',
        company_name: 'StartupXYZ',
        hired_at: '2025-11-15',
        salary: 150000,
        fee_percentage: 18,
        fee_amount: 27000,
        recruiter_share: 13500,
        platform_share: 13500,
    },
    {
        id: '2',
        candidate_name: 'Mike Johnson',
        job_title: 'Senior Engineer',
        company_name: 'BigTech Corp',
        hired_at: '2025-10-20',
        salary: 180000,
        fee_percentage: 20,
        fee_amount: 36000,
        recruiter_share: 18000,
        platform_share: 18000,
    },
];

export default async function PlacementsPage() {
    const { userId } = await auth();

    const totalEarnings = mockPlacements.reduce((sum, p) => sum + p.recruiter_share, 0);
    const thisYearEarnings = totalEarnings; // For now, assume all are this year
    const last30DaysEarnings = mockPlacements
        .filter(p => {
            const daysAgo = Math.floor((Date.now() - new Date(p.hired_at).getTime()) / (1000 * 60 * 60 * 24));
            return daysAgo <= 30;
        })
        .reduce((sum, p) => sum + p.recruiter_share, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Placements & Earnings</h1>
                <p className="text-base-content/70 mt-1">
                    Track your successful placements and earnings
                </p>
            </div>

            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stats shadow-sm">
                    <div className="stat">
                        <div className="stat-title">Lifetime Earnings</div>
                        <div className="stat-value text-success">
                            ${(totalEarnings / 1000).toFixed(1)}k
                        </div>
                        <div className="stat-desc">{mockPlacements.length} placements</div>
                    </div>
                </div>

                <div className="stats shadow-sm">
                    <div className="stat">
                        <div className="stat-title">This Year</div>
                        <div className="stat-value text-primary">
                            ${(thisYearEarnings / 1000).toFixed(1)}k
                        </div>
                        <div className="stat-desc">2025 earnings</div>
                    </div>
                </div>

                <div className="stats shadow-sm">
                    <div className="stat">
                        <div className="stat-title">Last 30 Days</div>
                        <div className="stat-value text-secondary">
                            ${(last30DaysEarnings / 1000).toFixed(1)}k
                        </div>
                        <div className="stat-desc">Recent earnings</div>
                    </div>
                </div>
            </div>

            {/* Placements List */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">Placement History</h2>

                    <div className="overflow-x-auto mt-4">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Role</th>
                                    <th>Company</th>
                                    <th>Hired Date</th>
                                    <th>Salary</th>
                                    <th>Fee</th>
                                    <th>Your Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockPlacements.map((placement) => (
                                    <tr key={placement.id} className="hover">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar avatar-placeholder">
                                                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                                                        <span className="text-xs">
                                                            {placement.candidate_name.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="font-medium">{placement.candidate_name}</div>
                                            </div>
                                        </td>
                                        <td>{placement.job_title}</td>
                                        <td>{placement.company_name}</td>
                                        <td>{new Date(placement.hired_at).toLocaleDateString()}</td>
                                        <td className="font-mono">
                                            ${placement.salary.toLocaleString()}
                                        </td>
                                        <td>
                                            <div className="badge badge-ghost">
                                                {placement.fee_percentage}%
                                            </div>
                                        </td>
                                        <td className="font-semibold text-success">
                                            ${placement.recruiter_share.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {mockPlacements.length === 0 && (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-trophy text-6xl text-base-content/20"></i>
                            <h3 className="text-xl font-semibold mt-4">No Placements Yet</h3>
                            <p className="text-base-content/70 mt-2">
                                Your successful placements will appear here
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
