-- Create invitations table
CREATE TABLE IF NOT EXISTS identity.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES identity.organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    invited_by UUID NOT NULL REFERENCES identity.users(id),
    clerk_invitation_id VARCHAR(255), -- Clerk's invitation ID
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired, revoked
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for lookup by email and organization
CREATE INDEX idx_invitations_email ON identity.invitations(email);
CREATE INDEX idx_invitations_organization ON identity.invitations(organization_id);
CREATE INDEX idx_invitations_status ON identity.invitations(status);
CREATE INDEX idx_invitations_clerk_id ON identity.invitations(clerk_invitation_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION identity.update_invitation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invitations_timestamp
BEFORE UPDATE ON identity.invitations
FOR EACH ROW
EXECUTE FUNCTION identity.update_invitation_timestamp();

COMMENT ON TABLE identity.invitations IS 'Pending invitations to join organizations';
COMMENT ON COLUMN identity.invitations.clerk_invitation_id IS 'Reference to Clerk organization invitation';
COMMENT ON COLUMN identity.invitations.status IS 'pending, accepted, expired, revoked';
