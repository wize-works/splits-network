-- Migration: Create search_applications_paginated function for fast, ranked search
-- This function provides server-side pagination with multi-term search and relevance scoring

CREATE OR REPLACE FUNCTION ats.search_applications_paginated(
    search_terms TEXT[] DEFAULT NULL,
    filter_recruiter_id UUID DEFAULT NULL,
    filter_job_id UUID DEFAULT NULL,
    filter_candidate_id UUID DEFAULT NULL,
    filter_stage TEXT DEFAULT NULL,
    filter_company_id UUID DEFAULT NULL,
    sort_column TEXT DEFAULT 'created_at',
    sort_direction TEXT DEFAULT 'desc',
    result_limit INT DEFAULT 25,
    result_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    job_id UUID,
    candidate_id UUID,
    recruiter_id UUID,
    stage TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    accepted_by_company BOOLEAN,
    accepted_at TIMESTAMPTZ,
    recruiter_notes TEXT,
    application_source TEXT,
    candidate_name TEXT,
    candidate_email TEXT,
    candidate_linkedin TEXT,
    job_title TEXT,
    job_company_id UUID,
    company_name TEXT,
    recruiter_name TEXT,
    recruiter_email TEXT,
    relevance_score INT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_results AS (
        SELECT 
            a.id,
            a.job_id,
            a.candidate_id,
            a.recruiter_id,
            a.stage,
            a.notes,
            a.created_at,
            a.updated_at,
            a.accepted_by_company,
            a.accepted_at,
            a.recruiter_notes,
            a.application_source,
            c.full_name as candidate_name,
            c.email as candidate_email,
            c.linkedin_url as candidate_linkedin,
            j.title as job_title,
            j.company_id as job_company_id,
            comp.name as company_name,
            u.name as recruiter_name,
            u.email as recruiter_email,
            -- Multi-term search relevance scoring (OR logic - match ANY term)
            CASE 
                WHEN search_terms IS NULL THEN 0
                ELSE (
                    -- For each search term, check if it matches and add weight
                    -- Using ILIKE for case-insensitive matching
                    SELECT COALESCE(SUM(
                        (CASE WHEN c.full_name ILIKE '%' || term || '%' THEN 5 ELSE 0 END) +
                        (CASE WHEN c.email ILIKE '%' || term || '%' THEN 4 ELSE 0 END) +
                        (CASE WHEN j.title ILIKE '%' || term || '%' THEN 3 ELSE 0 END) +
                        (CASE WHEN comp.name ILIKE '%' || term || '%' THEN 2 ELSE 0 END)
                    ), 0)
                    FROM unnest(search_terms) AS term
                )
            END::INT as relevance_score
        FROM ats.applications a
        LEFT JOIN ats.candidates c ON a.candidate_id = c.id
        LEFT JOIN ats.jobs j ON a.job_id = j.id
        LEFT JOIN ats.companies comp ON j.company_id = comp.id
        LEFT JOIN identity.users u ON a.recruiter_id = u.id
        WHERE 
            -- Apply all filters
            (filter_recruiter_id IS NULL OR a.recruiter_id = filter_recruiter_id)
            AND (filter_job_id IS NULL OR a.job_id = filter_job_id)
            AND (filter_candidate_id IS NULL OR a.candidate_id = filter_candidate_id)
            AND (filter_stage IS NULL OR a.stage = filter_stage)
            AND (filter_company_id IS NULL OR j.company_id = filter_company_id)
            -- Apply search: Match if ANY term matches ANY field (OR logic)
            AND (
                search_terms IS NULL 
                OR EXISTS (
                    SELECT 1 
                    FROM unnest(search_terms) AS term
                    WHERE 
                        c.full_name ILIKE '%' || term || '%'
                        OR c.email ILIKE '%' || term || '%'
                        OR j.title ILIKE '%' || term || '%'
                        OR comp.name ILIKE '%' || term || '%'
                )
            )
    ),
    counted_results AS (
        -- Add total count to every row (window function avoids separate COUNT query)
        SELECT *, COUNT(*) OVER() as total_count
        FROM filtered_results
    )
    SELECT *
    FROM counted_results
    ORDER BY 
        -- Sort by relevance when searching, otherwise by specified column
        CASE WHEN search_terms IS NOT NULL THEN relevance_score END DESC,
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'desc' THEN created_at END DESC,
        CASE WHEN sort_column = 'created_at' AND sort_direction = 'asc' THEN created_at END ASC,
        -- Default fallback sort
        created_at DESC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_applications_recruiter_id ON ats.applications (recruiter_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON ats.applications (stage);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON ats.applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON ats.applications (candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON ats.applications (job_id);

-- Trigram indexes for fuzzy text search (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_candidates_name_trgm ON ats.candidates USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_candidates_email_trgm ON ats.candidates USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON ats.jobs USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON ats.companies USING gin (name gin_trgm_ops);
