import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface AdminStats {
    totalRecruiters: number;
    activeRecruiters: number;
    pendingRecruiters: number;
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalPlacements: number;
}

async function getAdminStats(): Promise<AdminStats> {
    try {
        // Fetch recruiters
        const recruitersResponse = await apiClient.get('/recruiters');
        const recruiters = recruitersResponse.data || [];
        
        // Fetch jobs
        const jobsResponse = await apiClient.get('/jobs');
        const jobs = jobsResponse.data || [];
        
        // Fetch placements
        const placementsResponse = await apiClient.get('/placements');
        const placements = placementsResponse.data || [];

        return {
            totalRecruiters: recruiters.length,
            activeRecruiters: recruiters.filter((r: any) => r.status === 'active').length,
            pendingRecruiters: recruiters.filter((r: any) => r.status === 'pending').length,
            totalJobs: jobs.length,
            activeJobs: jobs.filter((j: any) => j.status === 'active').length,
            totalApplications: 0, // TODO: Add when applications list endpoint available
            totalPlacements: placements.length,
        };
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        return {
            totalRecruiters: 0,
            activeRecruiters: 0,
            pendingRecruiters: 0,
            totalJobs: 0,
            activeJobs: 0,
            totalApplications: 0,
            totalPlacements: 0,
        };
    }
}

export default async function AdminPage() {
    const stats = await getAdminStats();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-base-content/70 mt-1">
                    Platform administration and management
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Recruiters */}
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-primary">
                        <i className="fa-solid fa-users text-3xl"></i>
                    </div>
                    <div className="stat-title">Total Recruiters</div>
                    <div className="stat-value text-primary">{stats.totalRecruiters}</div>
                    <div className="stat-desc">
                        {stats.activeRecruiters} active, {stats.pendingRecruiters} pending
                    </div>
                </div>

                {/* Active Jobs */}
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-secondary">
                        <i className="fa-solid fa-briefcase text-3xl"></i>
                    </div>
                    <div className="stat-title">Active Jobs</div>
                    <div className="stat-value text-secondary">{stats.activeJobs}</div>
                    <div className="stat-desc">{stats.totalJobs} total jobs</div>
                </div>

                {/* Applications */}
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-accent">
                        <i className="fa-solid fa-file-lines text-3xl"></i>
                    </div>
                    <div className="stat-title">Applications</div>
                    <div className="stat-value text-accent">{stats.totalApplications}</div>
                    <div className="stat-desc">All time</div>
                </div>

                {/* Placements */}
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-success">
                        <i className="fa-solid fa-handshake text-3xl"></i>
                    </div>
                    <div className="stat-title">Placements</div>
                    <div className="stat-value text-success">{stats.totalPlacements}</div>
                    <div className="stat-desc">Successful hires</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Recruiter Management */}
                <Link href="/admin/recruiters" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="card-body">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                                <i className="fa-solid fa-user-check text-2xl text-primary"></i>
                            </div>
                            <div>
                                <h3 className="card-title text-lg">Recruiter Management</h3>
                                <p className="text-sm text-base-content/70">
                                    Approve and manage recruiters
                                </p>
                            </div>
                        </div>
                        {stats.pendingRecruiters > 0 && (
                            <div className="badge badge-warning gap-2 mt-2">
                                <i className="fa-solid fa-clock"></i>
                                {stats.pendingRecruiters} pending approval
                            </div>
                        )}
                    </div>
                </Link>

                {/* Role Assignments */}
                <Link href="/admin/assignments" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="card-body">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-secondary/10 rounded-lg">
                                <i className="fa-solid fa-link text-2xl text-secondary"></i>
                            </div>
                            <div>
                                <h3 className="card-title text-lg">Role Assignments</h3>
                                <p className="text-sm text-base-content/70">
                                    Assign recruiters to roles
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Placement Audit */}
                <Link href="/admin/placements" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="card-body">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success/10 rounded-lg">
                                <i className="fa-solid fa-chart-line text-2xl text-success"></i>
                            </div>
                            <div>
                                <h3 className="card-title text-lg">Placement Audit</h3>
                                <p className="text-sm text-base-content/70">
                                    Review all placements
                                </p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
