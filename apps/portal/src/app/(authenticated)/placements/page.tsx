'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useViewMode } from '@/hooks/useViewMode';

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

export default function PlacementsPage() {
    const { userId } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useViewMode('placementsViewMode');

    const totalEarnings = mockPlacements.reduce((sum, p) => sum + p.recruiter_share, 0);
    const thisYearEarnings = totalEarnings; // For now, assume all are this year
    const last30DaysEarnings = mockPlacements
        .filter(p => {
            const daysAgo = Math.floor((Date.now() - new Date(p.hired_at).getTime()) / (1000 * 60 * 60 * 24));
            return daysAgo <= 30;
        })
        .reduce((sum, p) => sum + p.recruiter_share, 0);

    const filteredPlacements = mockPlacements.filter(placement =>
        searchQuery === '' ||
        placement.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        placement.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        placement.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

            {/* Filters and View Toggle */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="fieldset flex-1">
                            <label className="label">Search</label>
                            <input
                                type="text"
                                placeholder="Search by candidate, role, or company..."
                                className="input w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="join">
                            <button 
                                className={`btn join-item ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <i className="fa-solid fa-grip"></i>
                            </button>
                            <button 
                                className={`btn join-item ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <i className="fa-solid fa-table"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Placements List - Grid View */}
            {viewMode === 'grid' && filteredPlacements.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredPlacements.map((placement) => (
                        <div key={placement.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="card-body">
                                <div className="flex items-start gap-3">
                                    <div className="avatar avatar-placeholder">
                                        <div className="bg-success/10 text-success rounded-full w-12">
                                            <span className="text-lg">
                                                {placement.candidate_name.split(' ').map(n => n[0]).join('')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="card-title text-xl">{placement.candidate_name}</h3>
                                        <div className="text-sm text-base-content/70 mt-1">
                                            {placement.job_title}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <i className="fa-solid fa-building text-base-content/60"></i>
                                        <span>{placement.company_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <i className="fa-solid fa-calendar text-base-content/60"></i>
                                        <span>Hired {new Date(placement.hired_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-mono">
                                        <i className="fa-solid fa-dollar-sign text-base-content/60"></i>
                                        <span>${placement.salary.toLocaleString()} salary</span>
                                    </div>
                                </div>

                                <div className="divider my-3"></div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-xs text-base-content/60">Your Earnings</div>
                                        <div className="text-2xl font-bold text-success">
                                            ${(placement.recruiter_share / 1000).toFixed(1)}k
                                        </div>
                                    </div>
                                    <div className="badge badge-ghost">
                                        {placement.fee_percentage}% fee
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Placements List - Table View */}
            {viewMode === 'table' && filteredPlacements.length > 0 && (
                <div className="card bg-base-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Role</th>
                                    <th>Company</th>
                                    <th>Hired Date</th>
                                    <th>Salary</th>
                                    <th>Fee</th>
                                    <th className="text-right">Your Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlacements.map((placement) => (
                                    <tr key={placement.id} className="hover">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar avatar-placeholder">
                                                    <div className="bg-success/10 text-success rounded-full w-10">
                                                        <span className="text-xs">
                                                            {placement.candidate_name.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="font-semibold">{placement.candidate_name}</div>
                                            </div>
                                        </td>
                                        <td>{placement.job_title}</td>
                                        <td>{placement.company_name}</td>
                                        <td className="text-sm">
                                            {new Date(placement.hired_at).toLocaleDateString()}
                                        </td>
                                        <td className="font-mono text-sm">
                                            ${placement.salary.toLocaleString()}
                                        </td>
                                        <td>
                                            <div className="badge badge-ghost">
                                                {placement.fee_percentage}%
                                            </div>
                                        </td>
                                        <td className="text-right font-semibold text-success">
                                            ${placement.recruiter_share.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredPlacements.length === 0 && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body text-center py-12">
                        <i className="fa-solid fa-trophy text-6xl text-base-content/20"></i>
                        <h3 className="text-xl font-semibold mt-4">No Placements Found</h3>
                        <p className="text-base-content/70 mt-2">
                            {searchQuery ? 'Try adjusting your search' : 'Your successful placements will appear here'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
