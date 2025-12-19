/**
 * Organizations Service
 * Handles organization management
 */

import { IdentityRepository } from '../../repository';
import { Organization } from '@splits-network/shared-types';

export class OrganizationsService {
    constructor(private repository: IdentityRepository) {}

    async createOrganization(
        name: string,
        type: 'company' | 'platform'
    ): Promise<Organization> {
        return await this.repository.createOrganization({ name, type });
    }

    async getOrganizationMemberships(organizationId: string) {
        return await this.repository.getMembershipsByOrganization(organizationId);
    }
}
