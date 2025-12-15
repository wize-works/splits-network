import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    Plan,
    Subscription,
    Payout,
    PayoutSchedule,
    PayoutSplit,
    EscrowHold,
    PayoutAuditLog,
} from '@splits-network/shared-types';

export class BillingRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            
        });
    }

    // Health check
    async healthCheck(): Promise<void> {
        // Simple query to verify database connectivity
        const { error } = await this.supabase
            .schema('billing')
            .from('plans')
            .select('id')
            .limit(1);
        
        if (error) {
            throw new Error(`Database health check failed: ${error.message}`);
        }
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

    // ============================================================================
    // Phase 3: Payout methods
    // ============================================================================

    async findPayoutById(id: string): Promise<Payout | null> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payouts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    }

    async findPayoutsByPlacementId(placementId: string): Promise<Payout[]> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payouts')
            .select('*')
            .eq('placement_id', placementId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async findPayoutsByRecruiterId(recruiterId: string): Promise<Payout[]> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payouts')
            .select('*')
            .eq('recruiter_id', recruiterId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createPayout(payout: Omit<Payout, 'id' | 'created_at' | 'updated_at'>): Promise<Payout> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payouts')
            .insert(payout)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updatePayout(id: string, updates: Partial<Payout>): Promise<Payout> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payouts')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updatePayoutStatus(id: string, status: string): Promise<Payout> {
        const updates: any = {
            status,
            updated_at: new Date(),
        };

        if (status === 'processing') {
            updates.processing_started_at = new Date();
        } else if (status === 'completed') {
            updates.completed_at = new Date();
        } else if (status === 'failed') {
            updates.failed_at = new Date();
        }

        const { data, error } = await this.supabase
            .schema('billing')
            .from('payouts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Payout schedules
    async findScheduledPayoutsDue(): Promise<PayoutSchedule[]> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payout_schedules')
            .select('*')
            .eq('status', 'scheduled')
            .lte('scheduled_date', new Date().toISOString())
            .order('scheduled_date', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async createPayoutSchedule(
        schedule: Omit<PayoutSchedule, 'id' | 'created_at' | 'updated_at'>
    ): Promise<PayoutSchedule> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payout_schedules')
            .insert(schedule)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updatePayoutSchedule(
        id: string,
        updates: Partial<PayoutSchedule>
    ): Promise<PayoutSchedule> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payout_schedules')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Payout splits
    async createPayoutSplit(
        split: Omit<PayoutSplit, 'id' | 'created_at' | 'updated_at'>
    ): Promise<PayoutSplit> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payout_splits')
            .insert(split)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findPayoutSplitsByPayoutId(payoutId: string): Promise<PayoutSplit[]> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payout_splits')
            .select('*')
            .eq('payout_id', payoutId);

        if (error) throw error;
        return data || [];
    }

    // Escrow holds
    async createEscrowHold(
        hold: Omit<EscrowHold, 'id' | 'created_at' | 'updated_at'>
    ): Promise<EscrowHold> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('escrow_holds')
            .insert(hold)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateEscrowHold(id: string, updates: Partial<EscrowHold>): Promise<EscrowHold> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('escrow_holds')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findActiveEscrowHoldsDue(): Promise<EscrowHold[]> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('escrow_holds')
            .select('*')
            .eq('status', 'active')
            .not('release_scheduled_date', 'is', null)
            .lte('release_scheduled_date', new Date().toISOString());

        if (error) throw error;
        return data || [];
    }

    // Payout audit log
    async createPayoutAuditLog(
        log: Omit<PayoutAuditLog, 'id' | 'created_at'>
    ): Promise<PayoutAuditLog> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payout_audit_log')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findPayoutAuditLog(payoutId: string): Promise<PayoutAuditLog[]> {
        const { data, error } = await this.supabase
            .schema('billing')
            .from('payout_audit_log')
            .select('*')
            .eq('payout_id', payoutId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }
}




