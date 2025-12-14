/**
 * HTTP clients for calling other services
 */

export class AtsClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.ATS_SERVICE_URL || 'http://ats-service:3002';
    }

    async getApplicationsByRecruiterId(recruiterId: string): Promise<any[]> {
        try {
            const response = await fetch(`${this.baseUrl}/applications?recruiter_id=${recruiterId}`);
            if (!response.ok) {
                throw new Error(`ATS service returned ${response.status}`);
            }
            const result: any = await response.json();
            return result.data || [];
        } catch (error: any) {
            console.error('Error fetching applications from ATS service:', error.message);
            return [];
        }
    }

    async getPlacementsByRecruiterId(recruiterId: string): Promise<any[]> {
        try {
            const response = await fetch(`${this.baseUrl}/placements?recruiter_id=${recruiterId}`);
            if (!response.ok) {
                throw new Error(`ATS service returned ${response.status}`);
            }
            const result: any = await response.json();
            return result.data || [];
        } catch (error: any) {
            console.error('Error fetching placements from ATS service:', error.message);
            return [];
        }
    }
}
