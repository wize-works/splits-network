# Pagination Implementation Guide

This document outlines the standard patterns for implementing server-side pagination, filtering, and sorting in the Splits Network application.

## Technology Stack

- **Database**: PostgreSQL with PL/pgSQL functions
- **Backend**: Fastify services with Supabase client
- **Gateway**: API Gateway (proxies pagination parameters)
- **Frontend**: Next.js App Router with URL state persistence

---

## Core Principle

**ALWAYS use server-side pagination, filtering, and sorting.**

Client-side filtering/pagination does NOT scale and will cause performance issues with large datasets. All list views must support:
- Server-side pagination (`page`, `limit`, `offset`)
- Server-side filtering (e.g., `stage`, `status`, `company_id`)
- Server-side search (`search` query parameter)
- Server-side sorting (`sort_by`, `sort_order`)

---

## 1. Database Layer (PostgreSQL Function)

### Pattern: Use Window Functions for Total Count

Always return `total_count` alongside paginated results using `COUNT(*) OVER()` window function. This allows a single query to return both the page data AND the total count.

### Example: Paginated Search Function

```sql
CREATE OR REPLACE FUNCTION ats.search_applications_paginated(
    search_terms text[] DEFAULT NULL,
    filter_recruiter_id uuid DEFAULT NULL,
    filter_job_id uuid DEFAULT NULL,
    filter_stage text DEFAULT NULL,
    filter_company_id uuid DEFAULT NULL,
    sort_column text DEFAULT 'created_at',
    sort_direction text DEFAULT 'desc',
    result_limit int DEFAULT 25,
    result_offset int DEFAULT 0
)
RETURNS TABLE (
    -- All entity columns
    id uuid,
    job_id uuid,
    candidate_id uuid,
    stage text,
    created_at timestamptz,
    updated_at timestamptz,
    -- Enriched/joined data
    candidate_name text,
    candidate_email text,
    job_title text,
    company_name text,
    -- Metadata
    relevance_score int,
    total_count bigint  -- CRITICAL: Total count for pagination
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_results AS (
        SELECT 
            a.id,
            a.job_id,
            a.candidate_id,
            a.stage,
            a.created_at,
            a.updated_at,
            c.full_name as candidate_name,
            c.email as candidate_email,
            j.title as job_title,
            comp.name as company_name,
            -- Search relevance scoring
            CASE 
                WHEN search_terms IS NULL THEN 0
                ELSE 
                    (CASE WHEN c.full_name ILIKE '%' || search_terms[1] || '%' THEN 5 ELSE 0 END) +
                    (CASE WHEN c.email ILIKE '%' || search_terms[1] || '%' THEN 4 ELSE 0 END) +
                    (CASE WHEN j.title ILIKE '%' || search_terms[1] || '%' THEN 3 ELSE 0 END) +
                    (CASE WHEN comp.name ILIKE '%' || search_terms[1] || '%' THEN 2 ELSE 0 END)
            END::INT as relevance_score
        FROM ats.applications a
        LEFT JOIN ats.candidates c ON a.candidate_id = c.id
        LEFT JOIN ats.jobs j ON a.job_id = j.id
        LEFT JOIN ats.companies comp ON j.company_id = comp.id
        WHERE 
            -- Apply all filters
            (filter_recruiter_id IS NULL OR a.recruiter_id = filter_recruiter_id)
            AND (filter_job_id IS NULL OR a.job_id = filter_job_id)
            AND (filter_stage IS NULL OR a.stage = filter_stage)
            AND (filter_company_id IS NULL OR j.company_id = filter_company_id)
            -- Apply search
            AND (
                search_terms IS NULL 
                OR c.full_name ILIKE '%' || search_terms[1] || '%'
                OR c.email ILIKE '%' || search_terms[1] || '%'
                OR j.title ILIKE '%' || search_terms[1] || '%'
                OR comp.name ILIKE '%' || search_terms[1] || '%'
            )
    ),
    counted_results AS (
        -- Add total count to every row (window function)
        SELECT *, COUNT(*) OVER() as total_count
        FROM filtered_results
    )
    SELECT *
    FROM counted_results
    ORDER BY 
        -- Dynamic sorting
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'desc' THEN created_at END DESC,
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'asc' THEN created_at END ASC,
        -- Search relevance (if search is active)
        CASE WHEN search_terms IS NOT NULL THEN relevance_score END DESC,
        -- Default fallback sort
        created_at DESC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Key Points:

1. **Window Function**: `COUNT(*) OVER()` calculates total without separate query
2. **All filters optional**: Use `IS NULL` checks so filters can be omitted
3. **Search array**: Use `text[]` for multi-term search (can expand later)
4. **Dynamic sorting**: CASE statements for sort column/direction
5. **STABLE marker**: Helps PostgreSQL optimize function execution
6. **Relevance scoring**: Weighted scoring for search result ranking

### Required Indexes

```sql
-- Covering index for recruiter queries (most common filter)
CREATE INDEX idx_applications_enriched_recruiter 
ON ats.applications (recruiter_id) 
INCLUDE (id, candidate_id, job_id, stage, created_at);

-- Stage filtering
CREATE INDEX idx_applications_stage ON ats.applications (stage);

-- Created date sorting
CREATE INDEX idx_applications_created_at ON ats.applications (created_at DESC);

-- Foreign key indexes for JOINs
CREATE INDEX idx_applications_candidate_id ON ats.applications (candidate_id);
CREATE INDEX idx_applications_job_id ON ats.applications (job_id);

-- Text search indexes (trigram for fuzzy matching)
CREATE INDEX idx_candidates_name_trgm ON ats.candidates USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_candidates_email_trgm ON ats.candidates USING gin (email gin_trgm_ops);
CREATE INDEX idx_jobs_title_trgm ON ats.jobs USING gin (title gin_trgm_ops);
```

---

## 2. Service/Repository Layer

### Repository Method

```typescript
async findApplicationsPaginated(params: {
    search?: string;
    recruiter_id?: string;
    job_id?: string;
    candidate_id?: string;
    stage?: string;
    company_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}): Promise<{ data: Application[]; pagination: PaginationInfo }> {
    const page = params.page || 1;
    const limit = params.limit || 25;
    const offset = (page - 1) * limit;
    
    // Parse search into terms array
    const searchTerms = params.search 
        ? params.search.trim().split(/\s+/).filter(term => term.length > 0)
        : null;

    // Call PostgreSQL function
    const { data, error } = await this.supabase
        .schema('ats')
        .rpc('search_applications_paginated', {
            search_terms: searchTerms,
            filter_recruiter_id: params.recruiter_id || null,
            filter_job_id: params.job_id || null,
            filter_candidate_id: params.candidate_id || null,
            filter_stage: params.stage || null,
            filter_company_id: params.company_id || null,
            sort_column: params.sort_by || 'created_at',
            sort_direction: params.sort_order || 'desc',
            result_limit: limit,
            result_offset: offset,
        });

    if (error) throw error;

    // Extract total from first row (all rows have same total due to window function)
    const total = data && data.length > 0 ? data[0].total_count : 0;
    const total_pages = Math.ceil(total / limit);

    // Map database results to domain objects
    const applications: Application[] = (data || []).map((row: any) => ({
        id: row.id,
        job_id: row.job_id,
        candidate_id: row.candidate_id,
        recruiter_id: row.recruiter_id,
        stage: row.stage,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        accepted_by_company: row.accepted_by_company,
        accepted_at: row.accepted_at,
        recruiter_notes: row.recruiter_notes,
        application_source: row.application_source,
        // Enriched data (nested objects)
        candidate: {
            id: row.candidate_id,
            full_name: row.candidate_name,
            email: row.candidate_email,
            linkedin_url: row.candidate_linkedin,
        },
        job: {
            id: row.job_id,
            title: row.job_title,
            company: {
                id: row.company_id,
                name: row.company_name,
            },
        },
    }));

    return {
        data: applications,
        pagination: {
            total,
            page,
            limit,
            total_pages,
        },
    };
}
```

### Service Method

```typescript
async getApplicationsPaginated(params: {
    search?: string;
    recruiter_id?: string;
    job_id?: string;
    candidate_id?: string;
    stage?: string;
    company_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}): Promise<{ data: Application[]; pagination: PaginationInfo }> {
    return await this.repository.findApplicationsPaginated(params);
}
```

### Route Handler

```typescript
app.get(
    '/applications/paginated',
    async (request: FastifyRequest<{ 
        Querystring: { 
            search?: string;
            recruiter_id?: string;
            job_id?: string;
            candidate_id?: string;
            stage?: string;
            company_id?: string;
            sort_by?: string;
            sort_order?: 'asc' | 'desc';
            page?: string;
            limit?: string;
        } 
    }>, reply: FastifyReply) => {
        const params = {
            ...request.query,
            page: request.query.page ? parseInt(request.query.page) : undefined,
            limit: request.query.limit ? parseInt(request.query.limit) : undefined,
        };

        const result = await service.getApplicationsPaginated(params);
        
        // Standard response format
        return reply.send({ 
            data: result.data,
            pagination: result.pagination,
        });
    }
);
```

---

## 3. API Gateway Layer

The API Gateway already handles pagination correctly by **proxying all query parameters** to downstream services.

### Standard Pattern

```typescript
app.get('/api/applications/paginated', {
    schema: {
        description: 'Get paginated applications with filtering',
        tags: ['applications'],
        security: [{ clerkAuth: [] }],
    },
}, async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const atsService = services.get('ats');
    const correlationId = (request as any).correlationId;

    // Build query parameters
    const queryParams = new URLSearchParams(request.query as any);

    // Add RBAC filtering (Gateway's responsibility)
    if (isRecruiter(req.auth)) {
        const recruiterResponse: any = await networkService().get(
            `/recruiters/by-user/${req.auth.userId}`,
            undefined,
            correlationId
        );
        if (recruiterResponse.data?.status === 'active') {
            queryParams.set('recruiter_id', req.auth.userId);
        }
    }

    // Forward to ATS service with all params
    const path = `/applications/paginated?${queryParams.toString()}`;
    const response = await atsService.get(path, undefined, correlationId);
    
    return reply.send(response);
});
```

### Key Points:

1. **Proxy all query params**: Use `new URLSearchParams(request.query as any)`
2. **Add RBAC filters**: Gateway adds user-specific filters (e.g., `recruiter_id`)
3. **Forward to service**: Pass complete query string to downstream service
4. **Return as-is**: Gateway doesn't modify pagination response structure

---

## 4. Client Layer (React/Next.js)

### Pattern: URL State Persistence

Always persist pagination state in the URL for:
- Back button navigation
- Bookmark/share links
- Browser refresh preservation

### Example Component

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export default function ApplicationsListClient() {
    const { getToken } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Initialize state from URL params
    const [applications, setApplications] = useState<Application[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        page: parseInt(searchParams.get('page') || '1'),
        limit: 25,
        total_pages: 0,
    });
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || '');
    const [loading, setLoading] = useState(true);

    // Update URL when state changes (without navigation)
    useEffect(() => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (stageFilter) params.set('stage', stageFilter);
        if (pagination.page > 1) params.set('page', pagination.page.toString());
        
        const newUrl = params.toString() 
            ? `/applications?${params.toString()}` 
            : '/applications';
        router.replace(newUrl, { scroll: false });
    }, [searchQuery, stageFilter, pagination.page, router]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            // Reset to page 1 when search/filter changes
            setPagination(prev => ({ ...prev, page: 1 }));
            loadApplications();
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [searchQuery, stageFilter]);

    // Load when pagination changes
    useEffect(() => {
        if (pagination.page > 0) {
            loadApplications();
        }
    }, [pagination.page]);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);

            // Build query parameters for server-side filtering
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                sort_by: 'created_at',
                sort_order: 'desc',
            });

            if (searchQuery) params.append('search', searchQuery);
            if (stageFilter) params.append('stage', stageFilter);

            // Call API with all params
            const response = await client.get(`/applications/paginated?${params.toString()}`);

            setApplications(response.data || []);
            setPagination(response.pagination || {
                total: 0,
                page: 1,
                limit: 25,
                total_pages: 0,
            });
        } catch (error) {
            console.error('Failed to load applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
                <input
                    type="text"
                    className="input"
                    placeholder="Search candidates, jobs, companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                    className="select"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                >
                    <option value="">All Stages</option>
                    <option value="screen">Screen</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                </select>
            </div>

            {/* Results */}
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div>
                    {applications.map(app => (
                        <ApplicationCard key={app.id} application={app} />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={handlePageChange}
            />
        </div>
    );
}
```

### Pagination Controls Component

```tsx
interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function PaginationControls({ 
    currentPage, 
    totalPages, 
    onPageChange 
}: PaginationControlsProps) {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Show ellipsis and pages around current page
    if (currentPage > 3) {
        pages.push('...');
    }
    
    // Pages around current
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
    }
    
    // Show ellipsis and last page
    if (currentPage < totalPages - 2) {
        pages.push('...');
    }
    if (totalPages > 1) {
        pages.push(totalPages);
    }

    return (
        <div className="flex justify-center gap-2">
            <button
                className="btn btn-sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <i className="fa-solid fa-chevron-left"></i>
            </button>

            {pages.map((page, idx) => (
                typeof page === 'number' ? (
                    <button
                        key={page}
                        className={`btn btn-sm ${page === currentPage ? 'btn-primary' : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={`ellipsis-${idx}`} className="px-2">...</span>
                )
            ))}

            <button
                className="btn btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <i className="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    );
}
```

---

## 5. Standard Response Format

All paginated endpoints MUST return this format:

```typescript
{
    data: T[],           // Array of items for current page
    pagination: {
        total: number,        // Total number of items (all pages)
        page: number,         // Current page number (1-indexed)
        limit: number,        // Items per page
        total_pages: number   // Total number of pages
    }
}
```

See `docs/guidance/api-response-format.md` for complete API response standards.

---

## 6. Performance Optimization

### Database Level

1. **Use covering indexes** to avoid table lookups
2. **Avoid correlated subqueries** in relevance scoring
3. **Use STABLE functions** to enable query optimization
4. **Limit JOIN depth** to 2-3 tables maximum

### Service Level

1. **Default page size**: 25 items
2. **Max page size**: 100 items (enforce limit)
3. **Cache user context**: Don't re-query user/role on every request (Gateway handles this)

### Client Level

1. **Debounce search**: 300ms delay before querying
2. **Use `router.replace()`**: Don't add to browser history on filter changes
3. **Show loading states**: Provide feedback during data fetch
4. **Preserve scroll position**: Use `{ scroll: false }` on URL updates

---

## 7. Scalability Considerations

When query performance degrades (>200-300ms consistently):

### Option A: Denormalization (Recommended)

Add snapshot columns to avoid JOINs:

```sql
ALTER TABLE ats.applications 
ADD COLUMN candidate_name_snapshot TEXT,
ADD COLUMN job_title_snapshot TEXT,
ADD COLUMN company_name_snapshot TEXT;

-- Update on INSERT/UPDATE via triggers
CREATE TRIGGER trg_application_snapshots
BEFORE INSERT OR UPDATE ON ats.applications
FOR EACH ROW EXECUTE FUNCTION update_application_snapshots();
```

### Option B: Materialized View

```sql
CREATE MATERIALIZED VIEW ats.applications_enriched AS
SELECT a.*, c.full_name, j.title, comp.name as company_name
FROM ats.applications a
LEFT JOIN ats.candidates c ON a.candidate_id = c.id
LEFT JOIN ats.jobs j ON a.job_id = j.id  
LEFT JOIN ats.companies comp ON j.company_id = comp.id;

-- Refresh every 5 minutes (concurrently to avoid locks)
REFRESH MATERIALIZED VIEW CONCURRENTLY ats.applications_enriched;
```

### Option C: Search Service

Move full-text search to Elasticsearch or similar for complex search requirements.

---

## 8. Testing Checklist

When implementing pagination, verify:

- [ ] Database function returns correct `total_count`
- [ ] Service correctly calculates `total_pages`
- [ ] API Gateway proxies all query params
- [ ] Client initializes state from URL params
- [ ] Client updates URL on state changes
- [ ] Search is debounced (300ms)
- [ ] Page resets to 1 on search/filter change
- [ ] Back button returns to previous state
- [ ] Bookmarked URLs work correctly
- [ ] Empty results display appropriate message
- [ ] Loading states show during fetch
- [ ] Error states handle gracefully

---

## 9. Common Mistakes to Avoid

❌ **Client-side filtering**: Never filter/paginate data in React  
✅ **Server-side everything**: Always pass filters to database

❌ **Separate count query**: `SELECT COUNT(*) FROM ...`  
✅ **Window function**: `COUNT(*) OVER()` in same query

❌ **Forgetting URL state**: State lives only in React  
✅ **URL persistence**: State in URL, React reads from it

❌ **No debouncing**: Query on every keystroke  
✅ **300ms debounce**: Reduce database load

❌ **Correlated subqueries**: `(SELECT ... FROM ... WHERE ...)`  
✅ **Simple CASE statements**: Inline logic where possible

❌ **Missing indexes**: Slow queries without covering indexes  
✅ **Covering indexes**: Include commonly selected columns

---

## Summary

**Flow:**
1. User changes filter/page → URL updates
2. React detects URL change → Calls API with query params
3. Gateway adds RBAC filters → Forwards to service
4. Service calls PostgreSQL function → Returns data + total_count
5. React updates state → Displays results

**Key Files:**
- Database: `services/{service}/migrations/*.sql`
- Repository: `services/{service}/src/repository.ts`
- Routes: `services/{service}/src/routes/*.ts`
- Gateway: `services/api-gateway/src/routes/{domain}/routes.ts`
- Client: `apps/portal/src/app/(authenticated)/{page}/components/*.tsx`

---

**Last Updated**: December 20, 2025  
**Version**: 1.0
