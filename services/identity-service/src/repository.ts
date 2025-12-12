import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Organization, Membership } from '@splits-network/shared-types';

export class IdentityRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            
        });
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
}




