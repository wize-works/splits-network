'use client';

import Link from 'next/link';
import { formatSalary, formatDate } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { apiClient } from '@/lib/api-client';

interface Job {
  id: string;
  title: string;
  company?: { name: string };
  location?: string;
  category?: string;
  salary_min?: number;
  salary_max?: number;
  employment_type?: string;
  open_to_relocation?: boolean;
  posted_at?: string;
  description?: string;
}

interface JobsResponse {
  data: Job[];
  total: number;
  limit?: number;
  offset: number;
}

const JOBS_PER_PAGE = 20;

function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get initial values from URL params
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [locationQuery, setLocationQuery] = useState(() => searchParams.get('location') || '');
  const [typeFilter, setTypeFilter] = useState(() => searchParams.get('employment_type') || '');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page, 10) : 1;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state when URL changes from external navigation (e.g., clicking links)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlLocation = searchParams.get('location') || '';
    const urlType = searchParams.get('employment_type') || '';
    const urlPage = searchParams.get('page');
    const urlPageNum = urlPage ? parseInt(urlPage, 10) : 1;

    // Only update if different to avoid infinite loops
    if (urlQuery !== searchQuery) setSearchQuery(urlQuery);
    if (urlLocation !== locationQuery) setLocationQuery(urlLocation);
    if (urlType !== typeFilter) setTypeFilter(urlType);
    if (urlPageNum !== currentPage) setCurrentPage(urlPageNum);
  }, [searchParams]);

  // Sync URL with current state changes (from user input)
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (locationQuery) params.set('location', locationQuery);
    if (typeFilter) params.set('employment_type', typeFilter);
    if (currentPage > 1) params.set('page', currentPage.toString());
    
    const newUrl = params.toString() ? `/jobs?${params.toString()}` : '/jobs';
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, locationQuery, typeFilter, currentPage, router]);

  // Fetch jobs from API with server-side filtering
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        
        // Build query params for server-side filtering
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (locationQuery) params.set('location', locationQuery);
        if (typeFilter) params.set('employment_type', typeFilter);
        
        // Pagination
        const offset = (currentPage - 1) * JOBS_PER_PAGE;
        params.set('limit', JOBS_PER_PAGE.toString());
        params.set('offset', offset.toString());
        
        const response = await apiClient.get<JobsResponse>(`/api/public/jobs?${params.toString()}`);
        setJobs(response.data || []);
        setTotal(response.total || 0);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setError('Failed to load jobs. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [searchQuery, locationQuery, typeFilter, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setTypeFilter('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / JOBS_PER_PAGE);
  const hasActiveFilters = searchQuery || locationQuery || typeFilter;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Browse Jobs</h1>
        <p className="text-lg text-base-content/70">
          Explore thousands of opportunities from top employers
        </p>
      </div>

      {/* Search and Filters */}
      <form onSubmit={handleSearch} className="card bg-base-200 shadow-lg mb-8">
        <div className="card-body">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="fieldset">
              <label className="label">Search</label>
              <input
                type="text"
                placeholder="director 100000 remote..." 
                className="input w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <label className="label">
                <span className="label-text-alt text-xs">Separate terms with spaces for better results</span>
              </label>
            </div>
            <div className="fieldset">
              <label className="label">Location</label>
              <input
                type="text"
                placeholder="City, state, or remote"
                className="input w-full"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            <div className="fieldset">
              <label className="label">Job Type</label>
              <select 
                className="select w-full"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="full_time">Full-time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            {hasActiveFilters && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <i className="fa-solid fa-times"></i>
                Clear Filters
              </button>
            )}
            <button type="submit" className="btn btn-primary ml-auto">
              <i className="fa-solid fa-search"></i>
              Search Jobs
            </button>
          </div>
        </div>
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm font-semibold">Active Filters:</span>
          {searchQuery && (
            <span className="badge badge-primary gap-2">
              Search: {searchQuery}
              <button onClick={() => setSearchQuery('')} className="hover:text-error">
                <i className="fa-solid fa-times"></i>
              </button>
            </span>
          )}
          {locationQuery && (
            <span className="badge badge-primary gap-2">
              Location: {locationQuery}
              <button onClick={() => setLocationQuery('')} className="hover:text-error">
                <i className="fa-solid fa-times"></i>
              </button>
            </span>
          )}
          {typeFilter && (
            <span className="badge badge-primary gap-2">
              Type: {typeFilter.replace('_', ' ')}
              <button onClick={() => setTypeFilter('')} className="hover:text-error">
                <i className="fa-solid fa-times"></i>
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-base-content/70">
          {loading ? (
            'Loading jobs...'
          ) : (
            <>
              Showing {((currentPage - 1) * JOBS_PER_PAGE) + 1}-{Math.min(currentPage * JOBS_PER_PAGE, total)} of {total} {total === 1 ? 'job' : 'jobs'}
              {hasActiveFilters && ' (filtered)'}
            </>
          )}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error mb-4">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Job Listings */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center py-12">
              <i className="fa-solid fa-briefcase text-6xl text-base-content/20 mb-4"></i>
              <h3 className="text-xl font-bold mb-2">No jobs found</h3>
              <p className="text-base-content/70 mb-4">
                Try adjusting your filters or search criteria
              </p>
              {hasActiveFilters && (
                <button className="btn btn-primary" onClick={clearFilters}>
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="card-title text-2xl mb-2">{job.title}</h2>
                    <p className="text-lg font-semibold mb-2">{job.company?.name || 'Company'}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-base-content/70 mb-4">
                      {job.location && (
                        <span>
                          <i className="fa-solid fa-location-dot"></i> {job.location}
                        </span>
                      )}
                      {job.employment_type && (
                        <span>
                          <i className="fa-solid fa-briefcase"></i> {job.employment_type.replace('_', '-')}
                        </span>
                      )}
                      {job.open_to_relocation && (
                        <span>
                          <i className="fa-solid fa-house"></i> Remote
                        </span>
                      )}
                      {job.posted_at && (
                        <span>
                          <i className="fa-solid fa-calendar"></i> Posted {formatDate(job.posted_at)}
                        </span>
                      )}
                    </div>
                    {job.description && (
                      <p className="line-clamp-2 mb-4">{job.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {job.salary_min && job.salary_max && (
                      <div className="badge badge-primary badge-lg mb-2">
                        {formatSalary(job.salary_min, job.salary_max)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && jobs.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="text-sm text-base-content/70">
            Page {currentPage} of {totalPages}
          </div>
          <div className="join">
            <button 
              className="join-item btn"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
            >
              «
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`join-item btn ${currentPage === pageNum ? 'btn-active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button 
              className="join-item btn"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
}
