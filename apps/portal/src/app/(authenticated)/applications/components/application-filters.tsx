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
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="flex-1 min-w-[250px]">
                            <div className="relative">
                                <input
                                    ref={ref}
                                    type="text"
                                    placeholder="Search applications..."
                                    className="input w-full pl-10"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"></i>
                            </div>
                        </div>

                        {/* Stage Filter */}
                        <select
                            className="select min-w-[180px]"
                            value={stageFilter}
                            onChange={(e) => onStageFilterChange(e.target.value)}
                        >
                            <option value="">All Stages</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="screen">Screen</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Offer</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                            <option value="withdrawn">Withdrawn</option>
                        </select>

                        {/* View Mode Toggle */}
                        <div className="join">
                            <button
                                className={`btn btn-sm join-item ${viewMode === 'table' ? 'btn-active' : ''}`}
                                onClick={() => onViewModeChange('table')}
                                title="Table View"
                            >
                                <i className="fa-solid fa-table"></i>
                            </button>
                            <button
                                className={`btn btn-sm join-item ${viewMode === 'grid' ? 'btn-active' : ''}`}
                                onClick={() => onViewModeChange('grid')}
                                title="Card View"
                            >
                                <i className="fa-solid fa-grip"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

ApplicationFilters.displayName = 'ApplicationFilters';
