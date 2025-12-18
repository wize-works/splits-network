'use client';

import Link from 'next/link';
import { formatSalary, formatDate } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

// Mock data - will be replaced with API calls
const mockJobs = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
    category: 'engineering',
    salary_min: 150000,
    salary_max: 200000,
    type: 'full-time',
    remote: true,
    posted_at: '2025-12-15',
    description: 'Join our engineering team to build amazing products...',
  },
  {
    id: '2',
    title: 'Product Manager',
    company: 'Startup Inc',
    location: 'New York, NY',
    category: 'product',
    salary_min: 120000,
    salary_max: 160000,
    type: 'full-time',
    remote: false,
    posted_at: '2025-12-14',
    description: 'Lead product strategy and execution...',
  },
  {
    id: '3',
    title: 'UX Designer',
    company: 'Design Studio',
    location: 'Remote',
    category: 'design',
    salary_min: 90000,
    salary_max: 130000,
    type: 'full-time',
    remote: true,
    posted_at: '2025-12-13',
    description: 'Create beautiful and intuitive user experiences...',
  },
  {
    id: '4',
    title: 'Sales Executive',
    company: 'Sales Corp',
    location: 'Chicago, IL',
    category: 'sales',
    salary_min: 80000,
    salary_max: 120000,
    type: 'full-time',
    remote: false,
    posted_at: '2025-12-12',
    description: 'Drive revenue growth through strategic sales...',
  },
  {
    id: '5',
    title: 'Marketing Manager',
    company: 'Marketing Agency',
    location: 'Remote',
    category: 'marketing',
    salary_min: 95000,
    salary_max: 135000,
    type: 'full-time',
    remote: true,
    posted_at: '2025-12-11',
    description: 'Lead marketing campaigns and strategy...',
  },
];

function JobsContent() {
  const searchParams = useSearchParams();
  
  // Get initial values from URL params
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [remoteFilter, setRemoteFilter] = useState(false);
  const [salaryFilter, setSalaryFilter] = useState('');
  const [recentFilter, setRecentFilter] = useState(false);

  useEffect(() => {
    // Initialize filters from URL params
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const remote = searchParams.get('remote') === 'true';
    const salary = searchParams.get('salary') || '';
    const recent = searchParams.get('recent') === 'true';

    setSearchQuery(q);
    setCategoryFilter(category);
    setTypeFilter(type);
    setRemoteFilter(remote);
    setSalaryFilter(salary);
    setRecentFilter(recent);
  }, [searchParams]);

  // Filter jobs based on current filters
  const filteredJobs = mockJobs.filter((job) => {
    // Search query filter (title or company)
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !job.company.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (categoryFilter && job.category !== categoryFilter.toLowerCase()) {
      return false;
    }

    // Type filter
    if (typeFilter && job.type !== typeFilter.toLowerCase()) {
      return false;
    }

    // Remote filter
    if (remoteFilter && !job.remote) {
      return false;
    }

    // Salary filter (e.g., "100k+")
    if (salaryFilter) {
      const minSalary = parseInt(salaryFilter.replace(/[^0-9]/g, '')) * 1000;
      if (job.salary_min < minSalary) {
        return false;
      }
    }

    // Recent filter (posted within last 3 days)
    if (recentFilter) {
      const jobDate = new Date(job.posted_at);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      if (jobDate < threeDaysAgo) {
        return false;
      }
    }

    return true;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with current filters
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (locationQuery) params.set('location', locationQuery);
    if (typeFilter) params.set('type', typeFilter);
    if (categoryFilter) params.set('category', categoryFilter);
    if (remoteFilter) params.set('remote', 'true');
    if (salaryFilter) params.set('salary', salaryFilter);
    
    const newUrl = params.toString() ? `/jobs?${params.toString()}` : '/jobs';
    window.history.pushState({}, '', newUrl);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setTypeFilter('');
    setCategoryFilter('');
    setRemoteFilter(false);
    setSalaryFilter('');
    setRecentFilter(false);
    window.history.pushState({}, '', '/jobs');
  };

  const hasActiveFilters = searchQuery || categoryFilter || typeFilter || remoteFilter || salaryFilter || recentFilter;

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
          <div className="grid md:grid-cols-4 gap-4">
            <div className="fieldset md:col-span-2">
              <label className="label">Search</label>
              <input
                type="text"
                placeholder="Job title, keywords..."
                className="input w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="fieldset">
              <label className="label">Category</label>
              <select 
                className="select w-full max-w-xs"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="engineering">Engineering</option>
                <option value="sales">Sales</option>
                <option value="marketing">Marketing</option>
                <option value="design">Design</option>
                <option value="product">Product</option>
                <option value="customer success">Customer Success</option>
              </select>
            </div>

            <div className="fieldset">
              <label className="label">Minimum Salary</label>
              <select 
                className="select w-full max-w-xs"
                value={salaryFilter}
                onChange={(e) => setSalaryFilter(e.target.value)}
              >
                <option value="">Any Salary</option>
                <option value="50k+">$50K+</option>
                <option value="75k+">$75K+</option>
                <option value="100k+">$100K+</option>
                <option value="150k+">$150K+</option>
                <option value="200k+">$200K+</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <input 
                  type="checkbox" 
                  className="checkbox"
                  checked={remoteFilter}
                  onChange={(e) => setRemoteFilter(e.target.checked)}
                />
                <span className="label-text">Remote Only</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <input 
                  type="checkbox" 
                  className="checkbox"
                  checked={recentFilter}
                  onChange={(e) => setRecentFilter(e.target.checked)}
                />
                <span className="label-text">Recent Postings</span>
              </label>
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
          {categoryFilter && (
            <span className="badge badge-primary gap-2">
              Category: {categoryFilter}
              <button onClick={() => setCategoryFilter('')} className="hover:text-error">
                <i className="fa-solid fa-times"></i>
              </button>
            </span>
          )}
          {typeFilter && (
            <span className="badge badge-primary gap-2">
              Type: {typeFilter}
              <button onClick={() => setTypeFilter('')} className="hover:text-error">
                <i className="fa-solid fa-times"></i>
              </button>
            </span>
          )}
          {remoteFilter && (
            <span className="badge badge-primary gap-2">
              Remote
              <button onClick={() => setRemoteFilter(false)} className="hover:text-error">
                <i className="fa-solid fa-times"></i>
              </button>
            </span>
          )}
          {salaryFilter && (
            <span className="badge badge-primary gap-2">
              Salary: {salaryFilter}
              <button onClick={() => setSalaryFilter('')} className="hover:text-error">
                <i className="fa-solid fa-times"></i>
              </button>
            </span>
          )}
          {recentFilter && (
            <span className="badge badge-primary gap-2">
              Recent
              <button onClick={() => setRecentFilter(false)} className="hover:text-error">
                <i className="fa-solid fa-times"></i>
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-base-content/70">
          Showing {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
          {hasActiveFilters && ` (filtered from ${mockJobs.length} total)`}
        </p>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
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
          filteredJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="card-title text-2xl mb-2">{job.title}</h2>
                    <p className="text-lg font-semibold mb-2">{job.company}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-base-content/70 mb-4">
                      <span>
                        <i className="fa-solid fa-location-dot"></i> {job.location}
                      </span>
                      <span>
                        <i className="fa-solid fa-briefcase"></i> {job.type}
                      </span>
                      {job.remote && (
                        <span>
                          <i className="fa-solid fa-house"></i> Remote
                        </span>
                      )}
                      <span>
                        <i className="fa-solid fa-calendar"></i> Posted {formatDate(job.posted_at)}
                      </span>
                    </div>
                    <p className="line-clamp-2 mb-4">{job.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="badge badge-primary badge-lg mb-2">
                      {formatSalary(job.salary_min, job.salary_max)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="join">
            <button className="join-item btn">«</button>
            <button className="join-item btn btn-active">1</button>
            <button className="join-item btn">2</button>
            <button className="join-item btn">3</button>
            <button className="join-item btn">»</button>
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
