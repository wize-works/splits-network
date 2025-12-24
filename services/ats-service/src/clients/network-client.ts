/**
 * Network Service HTTP Client
 * 
 * Provides methods to interact with the Network Service for recruiter data.
 * This allows ATS Service to resolve Clerk user IDs to recruiter IDs internally,
 * keeping business logic out of the API Gateway.
 */

import { createLogger } from '@splits-network/shared-logging';

const logger = createLogger({ serviceName: 'ats-service-network-client' });

export interface RecruiterProfile {
    id: string;
    user_id: string;
    status: string;
    // ... other fields
}

export class NetworkServiceClient {
    private baseURL: string;

    constructor(baseURL?: string) {
        this.baseURL = baseURL || process.env.NETWORK_SERVICE_URL || 'http://network-service:3003';
    }

    /**
     * Get recruiter profile by Clerk user ID
     * Returns null if user is not a recruiter or recruiter is inactive
     */
    async getRecruiterByUserId(userId: string, correlationId?: string): Promise<RecruiterProfile | null> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (correlationId) {
                headers['x-correlation-id'] = correlationId;
            }

            const response = await fetch(
                `${this.baseURL}/api/recruiters/by-user/${userId}`,
                {
                    method: 'GET',
                    headers,
                    signal: AbortSignal.timeout(5000),
                }
            );

            // 404 means user is not a recruiter - this is expected
            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json() as { data: RecruiterProfile };
            const recruiter = result.data;
            
            // Return null if recruiter is inactive
            if (recruiter.status !== 'active') {
                return null;
            }

            return recruiter;
        } catch (error: any) {
            logger.error({
                err: error,
                url: `/api/recruiters/by-user/${userId}`,
            }, 'Network service request failed');
            
            // Don't re-throw on 404
            if (error.message?.includes('404')) {
                return null;
            }
            
            throw error;
        }
    }

    /**
     * Get recruiter profile by recruiter ID
     */
    async getRecruiterById(recruiterId: string, correlationId?: string): Promise<RecruiterProfile | null> {
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (correlationId) {
                headers['x-correlation-id'] = correlationId;
            }

            const response = await fetch(
                `${this.baseURL}/api/recruiters/${recruiterId}`,
                {
                    method: 'GET',
                    headers,
                    signal: AbortSignal.timeout(5000),
                }
            );

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json() as { data: RecruiterProfile };
            return result.data;
        } catch (error: any) {
            logger.error({
                err: error,
                url: `/api/recruiters/${recruiterId}`,
            }, 'Network service request failed');
            
            if (error.message?.includes('404')) {
                return null;
            }
            
            throw error;
        }
    }
}

/**
 * Singleton instance
 */
let networkClient: NetworkServiceClient | null = null;

export function getNetworkClient(): NetworkServiceClient {
    if (!networkClient) {
        networkClient = new NetworkServiceClient();
    }
    return networkClient;
}
