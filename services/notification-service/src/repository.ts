import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface NotificationLog {
    id: string;
    event_type: string;
    recipient_user_id?: string;
    recipient_email: string;
    subject: string;
    template: string;
    payload?: Record<string, any>;
    sent_at: Date;
    status: 'sent' | 'failed' | 'pending';
    error_message?: string;
    resend_message_id?: string;
    created_at: Date;
}

export class NotificationRepository {
    private supabase: SupabaseClient;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
            
        });
    }

    async createNotificationLog(
        log: Omit<NotificationLog, 'id' | 'sent_at' | 'created_at'>
    ): Promise<NotificationLog> {
        const { data, error } = await this.supabase
            .schema('notifications').from('notification_log')
            .insert(log)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateNotificationLog(
        id: string,
        updates: Partial<NotificationLog>
    ): Promise<NotificationLog> {
        const { data, error } = await this.supabase
            .schema('notifications').from('notification_log')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findNotificationsByUserId(userId: string, limit = 50): Promise<NotificationLog[]> {
        const { data, error } = await this.supabase
            .schema('notifications').from('notification_log')
            .select('*')
            .eq('recipient_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }
}




