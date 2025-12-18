-- Create documents schema for document management service
-- Migration: 012_create_documents_schema
-- Date: 2025-12-18

-- Create schema
CREATE SCHEMA IF NOT EXISTS documents;

-- Grant usage permissions
GRANT USAGE ON SCHEMA documents TO postgres, anon, authenticated, service_role;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,           -- 'candidate', 'job', 'company', 'application', etc.
    entity_id UUID NOT NULL,              -- ID of the related entity
    document_type TEXT NOT NULL,          -- 'resume', 'cover_letter', 'contract', 'id_verification', etc.
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,           -- Path in storage bucket
    bucket_name TEXT NOT NULL DEFAULT 'documents',
    content_type TEXT NOT NULL,           -- MIME type
    file_size BIGINT NOT NULL,            -- Size in bytes
    uploaded_by_user_id UUID,             -- User who uploaded the document
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,   -- Additional metadata (e.g., OCR results, parsed data)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,               -- Soft delete

    -- Indexes
    CONSTRAINT documents_entity_type_check CHECK (entity_type IN ('candidate', 'job', 'company', 'application', 'placement', 'recruiter'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS documents_entity_type_id_idx ON documents.documents(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS documents_document_type_idx ON documents.documents(document_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS documents_uploaded_by_user_id_idx ON documents.documents(uploaded_by_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS documents_processing_status_idx ON documents.documents(processing_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents.documents(created_at DESC) WHERE deleted_at IS NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION documents.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents.documents
    FOR EACH ROW EXECUTE FUNCTION documents.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON documents.documents TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON documents.documents TO authenticated;
GRANT SELECT ON documents.documents TO anon;

-- Enable RLS
ALTER TABLE documents.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can do everything
CREATE POLICY documents_service_role_all ON documents.documents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can view documents for entities they have access to
-- (This will need to be refined based on actual authorization logic)
CREATE POLICY documents_authenticated_select ON documents.documents
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Authenticated users can insert documents
CREATE POLICY documents_authenticated_insert ON documents.documents
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Users can update documents they uploaded
CREATE POLICY documents_authenticated_update_own ON documents.documents
    FOR UPDATE
    TO authenticated
    USING (uploaded_by_user_id = auth.uid()::uuid)
    WITH CHECK (uploaded_by_user_id = auth.uid()::uuid);

COMMENT ON SCHEMA documents IS 'Document management schema for storing metadata about uploaded files';
COMMENT ON TABLE documents.documents IS 'Stores metadata for documents uploaded to the platform (resumes, contracts, verification documents, etc.)';
