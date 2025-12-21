import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Organization, Membership } from '@splits-network/shared-types';

export class IdentityRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            
        });
    }

    // Health check
    async healthCheck(): Promise<void> {
        // Simple query to verify database connectivity
        const { error } = await this.supabase
            .schema('identity')
            .from('users')
            .select('id')
            .limit(1);
        
        if (error) {
            throw new Error(`Database health check failed: ${error.message}`);
        }
    }

    // User methods
    async findUserByClerkId(clerkUserId: string): Promise<User | null> {
        const { data, error } = await this.supabase
            .schema('identity').from('users')
            .select('*')
            .eq('clerk_user_id', clerkUserId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }
        return data;
    }

    async findUserById(id: string): Promise<User | null> {
        const { data, error } = await this.supabase
            .schema('identity').from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
        const { data, error } = await this.supabase
            .schema('identity').from('users')
            .insert(user)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateUser(id: string, updates: Partial<User>): Promise<User> {
        const { data, error } = await this.supabase
            .schema('identity').from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Organization methods
    async findOrganizationById(id: string): Promise<Organization | null> {
        const { data, error } = await this.supabase
            .schema('identity').from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async createOrganization(
        org: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
    ): Promise<Organization> {
        const { data, error } = await this.supabase
            .schema('identity').from('organizations')
            .insert(org)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Membership methods
    async findMembershipsByUserId(userId: string): Promise<Membership[]> {
        const { data, error } = await this.supabase
            .schema('identity').from('memberships')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    }

    async findMembershipsByOrgId(orgId: string): Promise<Membership[]> {
        const { data, error } = await this.supabase
            .schema('identity').from('memberships')
            .select('*')
            .eq('organization_id', orgId);

        if (error) throw error;
        return data || [];
    }

    async getMembershipsByOrganization(orgId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('identity').from('memberships')
            .select(`
                id,
                role,
                created_at,
                user_id,
                users:user_id (
                    id,
                    email,
                    name
                )
            `)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createMembership(
        membership: Omit<Membership, 'id' | 'created_at' | 'updated_at'>
    ): Promise<Membership> {
        const { data, error } = await this.supabase
            .schema('identity').from('memberships')
            .insert(membership)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteMembership(id: string): Promise<void> {
        const { error } = await this.supabase
            .schema('identity').from('memberships')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // Consent methods
    async findConsentByUserId(userId: string): Promise<any | null> {
        const { data, error } = await this.supabase
            .schema('identity').from('user_consent')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }
        return data;
    }

    async upsertConsent(consent: any): Promise<any> {
        const { data, error } = await this.supabase
            .schema('identity').from('user_consent')
            .upsert(consent, {
                onConflict: 'user_id',
                ignoreDuplicates: false,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteConsent(userId: string): Promise<void> {
        const { error } = await this.supabase
            .schema('identity').from('user_consent')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    }

    // Invitation methods
    async createInvitation(invitation: any): Promise<any> {
        const { data, error } = await this.supabase
            .schema('identity').from('invitations')
            .insert(invitation)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findInvitationById(id: string): Promise<any | null> {
        const { data, error } = await this.supabase
            .schema('identity').from('invitations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findInvitationByClerkId(clerkInvitationId: string): Promise<any | null> {
        const { data, error } = await this.supabase
            .schema('identity').from('invitations')
            .select('*')
            .eq('clerk_invitation_id', clerkInvitationId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findPendingInvitationByEmailAndOrg(email: string, organizationId: string): Promise<any | null> {
        const { data, error } = await this.supabase
            .schema('identity').from('invitations')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('organization_id', organizationId)
            .eq('status', 'pending')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findInvitationsByOrganization(organizationId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('identity').from('invitations')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async findPendingInvitationsByEmail(email: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .schema('identity').from('invitations')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async updateInvitation(id: string, updates: any): Promise<any> {
        const { data, error } = await this.supabase
            .schema('identity').from('invitations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteInvitation(id: string): Promise<void> {
        const { error } = await this.supabase
            .schema('identity').from('invitations')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async deleteExpiredInvitations(): Promise<number> {
        const { data, error } = await this.supabase
            .schema('identity').from('invitations')
            .delete()
            .eq('status', 'pending')
            .lt('expires_at', new Date().toISOString())
            .select('id');

        if (error) throw error;
        return data?.length || 0;
    }
}




