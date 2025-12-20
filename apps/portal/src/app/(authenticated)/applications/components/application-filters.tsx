import { forwardRef } from 'react';

interface ApplicationFiltersProps {
    searchQuery: string;
    stageFilter: string;
    viewMode: 'grid' | 'table';
    onSearchChange: (value: string) => void;
    onStageFilterChange: (value: string) => void;
    onViewModeChange: (mode: 'grid' | 'table') => void;
}

/**
 * Application filters component with search input, stage filter, and view mode toggle.
 * Uses forwardRef to maintain focus on search input during data refreshes.
 * Search is debounced in the parent component to avoid excessive API calls.
 */
export const ApplicationFilters = forwardRef<HTMLInputElement, ApplicationFiltersProps>(
    function ApplicationFilters({
        searchQuery,
        stageFilter,
        viewMode,
        onSearchChange,
        onStageFilterChange,
        onViewModeChange,
    }, ref) {
        return (
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Full-text search across candidates, jobs, and companies */}
                        <div className="fieldset flex-1">
                            <label className="label">Search</label>
                            <input
                                ref={ref}
                                type="text"
                                placeholder="Search candidates, jobs, or companies..."
                                className="input w-full"
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                            />
                        </div>

                        {/* Filter by application stage */}
                        <div className="fieldset">
                            <label className="label">Stage</label>
                            <select
                                className="select w-full max-w-xs"
                                value={stageFilter}
                                onChange={(e) => onStageFilterChange(e.target.value)}
                            >
                                <option value="">All Stages</option>
                                <option value="submitted">Submitted</option>
                                <option value="screen">Screen</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        {/* View mode toggle: grid or table */}
                        <div className="join">
                            <button
                                className={`btn join-item ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => onViewModeChange('grid')}
                                title="Grid View"
                                aria-label="Grid View"
                            >
                                <i className="fa-solid fa-grip"></i>
                            </button>
                            <button
                                className={`btn join-item ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => onViewModeChange('table')}
                                title="Table View"
                                aria-label="Table View"
                            >
                                <i className="fa-solid fa-table"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);
