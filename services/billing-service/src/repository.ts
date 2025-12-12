import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Plan, Subscription } from '@splits-network/shared-types';

export class BillingRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            
        });
    }

    // Plan methods
    async findPlanById(id: string): Promise<Plan | null> {
        const { data, error } = await this.supabase
            .schema('billing').from('plans')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findAllPlans(): Promise<Plan[]> {
        const { data, error } = await this.supabase
            .schema('billing').from('plans')
            .select('*')
            .order('price_monthly', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async createPlan(plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<Plan> {
        const { data, error } = await this.supabase
            .schema('billing').from('plans')
            .insert(plan)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Subscription methods
    async findSubscriptionById(id: string): Promise<Subscription | null> {
        const { data, error } = await this.supabase
            .schema('billing').from('subscriptions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findSubscriptionByRecruiterId(recruiterId: string): Promise<Subscription | null> {
        const { data, error } = await this.supabase
            .schema('billing').from('subscriptions')
            .select('*')
            .eq('recruiter_id', recruiterId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
        const { data, error } = await this.supabase
            .schema('billing').from('subscriptions')
            .select('*')
            .eq('stripe_subscription_id', stripeSubscriptionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async createSubscription(
        subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
    ): Promise<Subscription> {
        const { data, error } = await this.supabase
            .schema('billing').from('subscriptions')
            .insert(subscription)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateSubscription(id: string, updates: Partial<Subscription>): Promise<Subscription> {
        const { data, error } = await this.supabase
            .schema('billing').from('subscriptions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}




