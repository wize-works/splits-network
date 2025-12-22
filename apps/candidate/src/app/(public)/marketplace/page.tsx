'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';
import RecruiterCard from './components/recruiter-card';

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

export default function MarketplacePage() {
    const { getToken } = useAuth();
    const [recruiters, setRecruiters] = useState<MarketplaceRecruiter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        industries: [] as string[],
        specialties: [] as string[],
        location: '',
        search: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 24,
        total: 0,
        total_pages: 0,
    });

    useEffect(() => {
        loadRecruiters();
    }, [filters, pagination.page]);

    const loadRecruiters = async () => {
        try {
            setLoading(true);
            setError('');

            // Token is optional for public marketplace browsing
            const token = await getToken().catch(() => null);

            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (filters.industries.length > 0) {
                params.set('industries', filters.industries.join(','));
            }
            if (filters.specialties.length > 0) {
                params.set('specialties', filters.specialties.join(','));
            }
            if (filters.location) {
                params.set('location', filters.location);
            }
            if (filters.search) {
                params.set('search', filters.search);
            }

            const result = await apiClient.get<{
                data: MarketplaceRecruiter[];
                pagination: {
                    total: number;
                    page: number;
                    limit: number;
                    total_pages: number;
                };
            }>(`/marketplace/recruiters?${params}`, token || undefined);

            console.log('API Response:', result);
            console.log('Recruiters data:', result.data);
            console.log('Number of recruiters:', result.data?.length);

            if (!result.data || !Array.isArray(result.data)) {
                console.error('Invalid data structure:', result);
                throw new Error('Invalid response format from API');
            }

            setRecruiters(result.data);
            setPagination(prev => ({
                ...prev,
                total: result.pagination.total,
                total_pages: result.pagination.total_pages,
            }));
        } catch (err) {
            console.error('Failed to load marketplace recruiters:', err);
            setError('Failed to load recruiters. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Find Your Recruiter</h1>
                <p className="text-lg text-base-content/70">
                    Connect with specialized recruiters who can help you land your dream job
                </p>
            </div>

            {/* Search and Filters */}
            <div className="card bg-base-100 shadow-md mb-6">
                <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="fieldset">
                            <label className="label">Search</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="Search recruiters..."
                                value={filters.search}
                                onChange={(e) => {
                                    setFilters({ ...filters, search: e.target.value });
                                    setPagination({ ...pagination, page: 1 });
                                }}
                            />
                        </div>

                        <div className="fieldset">
                            <label className="label">Location</label>
                            <input
                                type="text"
                                className="input w-full"
                                placeholder="City or state..."
                                value={filters.location}
                                onChange={(e) => {
                                    setFilters({ ...filters, location: e.target.value });
                                    setPagination({ ...pagination, page: 1 });
                                }}
                            />
                        </div>

                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error mb-6">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : recruiters.length === 0 ? (
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body text-center py-12">
                        <i className="fa-solid fa-users text-5xl text-base-content/20 mb-4"></i>
                        <h3 className="text-xl font-semibold mb-2">No recruiters available yet</h3>
                        <p className="text-base-content/70 mb-2">
                            {filters.search || filters.location || filters.industries.length > 0 || filters.specialties.length > 0
                                ? 'Try adjusting your search filters or check back soon.'
                                : 'Recruiters will appear here once they enable their marketplace profiles.'}
                        </p>
                        {(filters.search || filters.location || filters.industries.length > 0 || filters.specialties.length > 0) && (
                            <button
                                className="btn btn-sm btn-outline mt-4"
                                onClick={() => {
                                    setFilters({
                                        industries: [],
                                        specialties: [],
                                        location: '',
                                        search: '',
                                    });
                                    setPagination({ ...pagination, page: 1 });
                                }}
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Results Count */}
                    <div className="mb-4 text-sm text-base-content/70">
                        Showing {recruiters.length} of {pagination.total} recruiters
                    </div>

                    {/* Recruiters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {recruiters.map((recruiter) => (
                            <RecruiterCard key={recruiter.id} recruiter={recruiter} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                        <div className="flex justify-center gap-2">
                            <button
                                className="btn btn-sm"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            >
                                <i className="fa-solid fa-chevron-left"></i>
                                Previous
                            </button>
                            <div className="join">
                                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                                    let pageNum: number;
                                    if (pagination.total_pages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.total_pages - 2) {
                                        pageNum = pagination.total_pages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            className={`join-item btn btn-sm ${pagination.page === pageNum ? 'btn-active' : ''
                                                }`}
                                            onClick={() => setPagination({ ...pagination, page: pageNum })}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                className="btn btn-sm"
                                disabled={pagination.page === pagination.total_pages}
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            >
                                Next
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
