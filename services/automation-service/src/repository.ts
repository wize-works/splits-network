import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    AutomationRule,
    DecisionAuditLog,
    CandidateRoleMatch,
    FraudSignal,
} from '@splits-network/shared-types';

export class AutomationRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // Automation Rules
    async findActiveRules(ruleType?: string): Promise<AutomationRule[]> {
        let query = this.supabase
            .schema('platform')
            .from('automation_rules')
            .select('*')
            .eq('status', 'active');

        if (ruleType) {
            query = query.eq('rule_type', ruleType);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>): Promise<AutomationRule> {
        const { data, error } = await this.supabase
            .schema('platform')
            .from('automation_rules')
            .insert(rule)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
        const { data, error } = await this.supabase
            .schema('platform')
            .from('automation_rules')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Decision Audit
    async createDecisionLog(log: Omit<DecisionAuditLog, 'id' | 'created_at'>): Promise<DecisionAuditLog> {
        const { data, error } = await this.supabase
            .schema('platform')
            .from('decision_audit_log')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findDecisionLogs(filters: {
        entity_type?: string;
        entity_id?: string;
        decision_type?: string;
        limit?: number;
    }): Promise<DecisionAuditLog[]> {
        let query = this.supabase
            .schema('platform')
            .from('decision_audit_log')
            .select('*');

        if (filters.entity_type) {
            query = query.eq('entity_type', filters.entity_type);
        }
        if (filters.entity_id) {
            query = query.eq('entity_id', filters.entity_id);
        }
        if (filters.decision_type) {
            query = query.eq('decision_type', filters.decision_type);
        }

        query = query.order('created_at', { ascending: false });

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    }

    // AI Candidate Matching
    async createCandidateMatch(
        match: Omit<CandidateRoleMatch, 'id' | 'created_at'>
    ): Promise<CandidateRoleMatch> {
        const { data, error } = await this.supabase
            .schema('platform')
            .from('candidate_role_matches')
            .insert(match)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findPendingMatches(limit: number = 50): Promise<CandidateRoleMatch[]> {
        const { data, error } = await this.supabase
            .schema('platform')
            .from('candidate_role_matches')
            .select('*')
            .is('reviewed_at', null)
            .order('match_score', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }

    async reviewMatch(
        matchId: string,
        reviewedBy: string,
        accepted: boolean,
        rejectionReason?: string
    ): Promise<CandidateRoleMatch> {
        const { data, error } = await this.supabase
            .schema('platform')
            .from('candidate_role_matches')
            .update({
                reviewed_by: reviewedBy,
                reviewed_at: new Date(),
                accepted,
                rejection_reason: rejectionReason,
            })
            .eq('id', matchId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // Fraud Detection
    async createFraudSignal(signal: Omit<FraudSignal, 'id' | 'created_at' | 'updated_at'>): Promise<FraudSignal> {
        const { data, error } = await this.supabase
            .schema('platform')
            .from('fraud_signals')
            .insert(signal)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findActiveSignals(filters?: {
        severity?: string;
        recruiter_id?: string;
    }): Promise<FraudSignal[]> {
        let query = this.supabase
            .schema('platform')
            .from('fraud_signals')
            .select('*')
            .eq('status', 'active');

        if (filters?.severity) {
            query = query.eq('severity', filters.severity);
        }
        if (filters?.recruiter_id) {
            query = query.eq('recruiter_id', filters.recruiter_id);
        }

        query = query.order('severity', { ascending: false }).order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    }

    async resolveSignal(
        signalId: string,
        reviewedBy: string,
        status: 'resolved' | 'false_positive',
        resolutionNotes?: string,
        actionTaken?: string
    ): Promise<FraudSignal> {
        const { data, error } = await this.supabase
            .schema('platform')
            .from('fraud_signals')
            .update({
                status,
                reviewed_by: reviewedBy,
                reviewed_at: new Date(),
                resolution_notes: resolutionNotes,
                action_taken: actionTaken,
                updated_at: new Date(),
            })
            .eq('id', signalId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
