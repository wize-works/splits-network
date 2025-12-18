/**
 * User Consent Service
 * Handles cookie and privacy consent for GDPR/CCPA compliance
 */

import { IdentityRepository } from '../../repository';

export interface ConsentPreferences {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
}

export interface ConsentRecord extends ConsentPreferences {
    id: string;
    user_id: string;
    ip_address?: string;
    user_agent?: string;
    consent_source: string;
    created_at: string;
    updated_at: string;
}

export interface SaveConsentRequest {
    preferences: ConsentPreferences;
    ip_address?: string;
    user_agent?: string;
    consent_source?: string;
}

export class ConsentService {
    constructor(private repository: IdentityRepository) {}

    /**
     * Get user's current consent preferences
     */
    async getConsent(userId: string): Promise<ConsentRecord | null> {
        const data = await this.repository.findConsentByUserId(userId);
        return data as ConsentRecord | null;
    }

    /**
     * Save or update user's consent preferences
     */
    async saveConsent(
        userId: string,
        request: SaveConsentRequest
    ): Promise<ConsentRecord> {
        const consentData = {
            user_id: userId,
            necessary: true, // Always true
            functional: request.preferences.functional,
            analytics: request.preferences.analytics,
            marketing: request.preferences.marketing,
            ip_address: request.ip_address,
            user_agent: request.user_agent,
            consent_source: request.consent_source || 'web',
        };

        const data = await this.repository.upsertConsent(consentData);
        return data as ConsentRecord;
    }

    /**
     * Delete user's consent record (for GDPR right to be forgotten)
     */
    async deleteConsent(userId: string): Promise<void> {
        await this.repository.deleteConsent(userId);
    }
}
