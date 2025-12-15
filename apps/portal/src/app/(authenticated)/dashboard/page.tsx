import { auth } from '@clerk/nextjs/server';

// API client helper (we'll expand this)
async function fetchFromGateway(endpoint: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
}

export default async function DashboardPage() {
    const { userId, getToken } = await auth();
    
    // For now, mock data - we'll integrate real API calls
    const stats = {
        activeRoles: 5,
        candidatesInProcess: 12,
        offersThisMonth: 2,
        placementsThisYear: 8,
    };

    const recentActivity = [
        {
            id: '1',
            type: 'application',
            message: 'New candidate submitted to Senior React Developer',
            timestamp: '2 hours ago',
        },
        {
            id: '2',
            type: 'stage_change',
            message: 'John Doe moved to Interview stage',
            timestamp: '5 hours ago',
        },
        {
            id: '3',
            type: 'offer',
            message: 'Offer extended to Jane Smith',
            timestamp: '1 day ago',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title text-2xl">Welcome back!</h2>
                    <p className="text-base-content/70">
                        Here's an overview of your recruiting activity.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stats shadow-sm">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <i className="fa-solid fa-briefcase text-3xl"></i>
                        </div>
                        <div className="stat-title">Active Roles</div>
                        <div className="stat-value text-primary">{stats.activeRoles}</div>
                        <div className="stat-desc">Roles you can work</div>
                    </div>
                </div>

                <div className="stats shadow-sm">
                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <i className="fa-solid fa-users text-3xl"></i>
                        </div>
                        <div className="stat-title">In Process</div>
                        <div className="stat-value text-secondary">{stats.candidatesInProcess}</div>
                        <div className="stat-desc">Active candidates</div>
                    </div>
                </div>

                <div className="stats shadow-sm">
                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <i className="fa-solid fa-file-contract text-3xl"></i>
                        </div>
                        <div className="stat-title">Offers</div>
                        <div className="stat-value text-accent">{stats.offersThisMonth}</div>
                        <div className="stat-desc">This month</div>
                    </div>
                </div>

                <div className="stats shadow-sm">
                    <div className="stat">
                        <div className="stat-figure text-success">
                            <i className="fa-solid fa-trophy text-3xl"></i>
                        </div>
                        <div className="stat-title">Placements</div>
                        <div className="stat-value text-success">{stats.placementsThisYear}</div>
                        <div className="stat-desc">This year</div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title">Recent Activity</h3>
                    <div className="space-y-3 mt-4">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-base-200 transition-colors">
                                <div className="avatar avatar-placeholder">
                                    <div className="bg-primary text-primary-content rounded-full w-10">
                                        <i className={`fa-solid ${
                                            activity.type === 'application' ? 'fa-user-plus' :
                                            activity.type === 'stage_change' ? 'fa-arrow-right' :
                                            'fa-file-contract'
                                        }`}></i>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{activity.message}</p>
                                    <p className="text-sm text-base-content/60">{activity.timestamp}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card-actions justify-end mt-4">
                        <button className="btn btn-ghost btn-sm">View All Activity</button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title">Quick Actions</h3>
                    <div className="flex flex-wrap gap-3 mt-4">
                        <button className="btn btn-primary gap-2">
                            <i className="fa-solid fa-user-plus"></i>
                            Submit Candidate
                        </button>
                        <button className="btn btn-outline gap-2">
                            <i className="fa-solid fa-briefcase"></i>
                            View All Roles
                        </button>
                        <button className="btn btn-outline gap-2">
                            <i className="fa-solid fa-chart-line"></i>
                            View Earnings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
