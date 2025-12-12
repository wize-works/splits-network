import { IdentityRepository } from './repository';
import { User, Organization, Membership } from '@splits-network/shared-types';
import { UserProfileDTO, MembershipDTO } from '@splits-network/shared-types';

export class IdentityService {
    constructor(private repository: IdentityRepository) { }

    async syncClerkUser(
        clerkUserId: string,
        email: string,
        name: string
    ): Promise<User> {
        // Check if user already exists
        let user = await this.repository.findUserByClerkId(clerkUserId);

        if (user) {
            // Update if email or name changed
            if (user.email !== email || user.name !== name) {
                user = await this.repository.updateUser(user.id, { email, name });
            }
            return user;
        }

        // Create new user
        return await this.repository.createUser({
            clerk_user_id: clerkUserId,
            email,
            name,
        });
    }

    async getUserProfile(userId: string): Promise<UserProfileDTO> {
        const user = await this.repository.findUserById(userId);
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        const memberships = await this.repository.findMembershipsByUserId(userId);

        const membershipDTOs: MembershipDTO[] = [];
        for (const membership of memberships) {
            const org = await this.repository.findOrganizationById(
                membership.organization_id
            );
            if (org) {
                membershipDTOs.push({
                    id: membership.id,
                    organization_id: org.id,
                    organization_name: org.name,
                    role: membership.role,
                });
            }
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            memberships: membershipDTOs,
        };
    }

    async createOrganization(
        name: string,
        type: 'company' | 'platform'
    ): Promise<Organization> {
        return await this.repository.createOrganization({ name, type });
    }

    async addMembership(
        userId: string,
        organizationId: string,
        role: 'recruiter' | 'company_admin' | 'hiring_manager' | 'platform_admin'
    ): Promise<Membership> {
        return await this.repository.createMembership({
            user_id: userId,
            organization_id: organizationId,
            role,
        });
    }

    async removeMembership(membershipId: string): Promise<void> {
        await this.repository.deleteMembership(membershipId);
    }
}
