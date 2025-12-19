/**
 * Identity Service - Main Coordinator
 * Delegates to domain-specific services
 */

import { IdentityRepository } from './repository';
import { EventPublisher } from './events';
import { UsersService } from './services/users/service';
import { OrganizationsService } from './services/organizations/service';
import { MembershipsService } from './services/memberships/service';
import { InvitationsService } from './services/invitations/service';
import { WebhooksService } from './services/webhooks/service';
import { ConsentService } from './services/consent/service';
import { User, Organization, Membership } from '@splits-network/shared-types';
import { UserProfileDTO } from '@splits-network/shared-types';

export class IdentityService {
    public readonly users: UsersService;
    public readonly organizations: OrganizationsService;
    public readonly memberships: MembershipsService;
    public readonly invitations: InvitationsService;
    public readonly webhooks: WebhooksService;
    public readonly consent: ConsentService;

    constructor(private repository: IdentityRepository, eventPublisher?: EventPublisher) {
        this.users = new UsersService(repository);
        this.organizations = new OrganizationsService(repository);
        this.memberships = new MembershipsService(repository);
        this.invitations = new InvitationsService(repository, eventPublisher);
        this.webhooks = new WebhooksService(repository);
        this.consent = new ConsentService(repository);
    }

    // Convenience delegation methods for backward compatibility
    async syncClerkUser(
        clerkUserId: string,
        email: string,
        name: string
    ): Promise<User> {
        return this.users.syncClerkUser(clerkUserId, email, name);
    }

    async getUserProfile(userId: string): Promise<UserProfileDTO> {
        return this.users.getUserProfile(userId);
    }

    async createOrganization(
        name: string,
        type: 'company' | 'platform'
    ): Promise<Organization> {
        return this.organizations.createOrganization(name, type);
    }

    async addMembership(
        userId: string,
        organizationId: string,
        role: 'recruiter' | 'company_admin' | 'hiring_manager' | 'platform_admin'
    ): Promise<Membership> {
        return this.memberships.addMembership(userId, organizationId, role);
    }

    async removeMembership(membershipId: string): Promise<void> {
        return this.memberships.removeMembership(membershipId);
    }
}
