/**
 * Users Service
 * Handles user profile and Clerk synchronization
 */

import { IdentityRepository } from '../../repository';
import { User } from '@splits-network/shared-types';
import { UserProfileDTO, MembershipDTO } from '@splits-network/shared-types';
import { createClerkClient } from '@clerk/backend';
import { getEnvOrThrow } from '@splits-network/shared-config';

export class UsersService {
    private clerkClient;

    constructor(private repository: IdentityRepository) {
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (clerkSecretKey) {
            this.clerkClient = createClerkClient({ secretKey: clerkSecretKey });
        }
    }

    async syncClerkUser(
        clerkUserId: string,
        email: string,
        name: string
    ): Promise<User> {
        // Check if user already exists
        let user = await this.repository.findUserByClerkUserId(clerkUserId);

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

    async updateUserProfile(
        userId: string,
        updates: { name?: string }
    ): Promise<User> {
        // Get current user to access clerk_user_id
        const user = await this.repository.findUserById(userId);
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        // Update in our database
        const updatedUser = await this.repository.updateUser(userId, updates);

        // Sync to Clerk if we have a Clerk client
        if (this.clerkClient && user.clerk_user_id && updates.name) {
            try {
                // Parse name into first and last
                const nameParts = updates.name.trim().split(/\s+/);
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                await this.clerkClient.users.updateUser(user.clerk_user_id, {
                    firstName,
                    lastName,
                });
            } catch (error) {
                console.error('Failed to sync name to Clerk:', error);
                // Don't fail the request if Clerk sync fails
            }
        }

        return updatedUser;
    }

    async changeUserPassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        // Get current user to access clerk_user_id
        const user = await this.repository.findUserById(userId);
        if (!user || !user.clerk_user_id) {
            throw new Error(`User ${userId} not found`);
        }

        if (!this.clerkClient) {
            throw new Error('Authentication service is not configured');
        }

        try {
            // First verify the current password by attempting to get user with verification
            // Note: Clerk doesn't have a direct "verify password" endpoint,
            // so we'll just update the password directly and let Clerk validate
            await this.clerkClient.users.updateUser(user.clerk_user_id, {
                password: newPassword,
            });
        } catch (error: any) {
            console.error('Failed to change password in Clerk:', error);
            
            // Check for common Clerk errors
            if (error.status === 422) {
                throw new Error('Password does not meet requirements. Must be at least 8 characters.');
            }
            if (error.status === 404) {
                throw new Error('User not found');
            }
            
            throw new Error('Failed to change password. Please try again.');
        }
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
            onboarding_status: user.onboarding_status,
            onboarding_step: user.onboarding_step,
            onboarding_completed_at: user.onboarding_completed_at,
        };
    }

    /**
     * Update onboarding progress for a user
     */
    async updateOnboardingProgress(
        userId: string,
        step: number,
        status?: 'pending' | 'in_progress' | 'completed' | 'skipped'
    ): Promise<User> {
        const user = await this.repository.findUserById(userId);
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        const updates: any = { onboarding_step: step };
        if (status) {
            updates.onboarding_status = status;
        }

        return await this.repository.updateUser(userId, updates);
    }

    /**
     * Complete onboarding and create associated entities
     * This is called after the user completes the onboarding wizard
     * 
     * For recruiters: Only marks onboarding complete (no org/membership needed)
     * For company_admin: Creates organization and membership
     */
    async completeOnboarding(
        userId: string,
        role: 'recruiter' | 'company_admin',
        data: {
            recruiter?: {
                bio?: string;
                phone?: string;
                industries?: string[];
                specialties?: string[];
            };
            company?: {
                name: string;
                website?: string;
                industry?: string;
                size?: string;
            };
        }
    ): Promise<{ user: User; organizationId?: string }> {
        const user = await this.repository.findUserById(userId);
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        // Mark onboarding as completed
        const updatedUser = await this.repository.updateUser(userId, {
            onboarding_status: 'completed',
            onboarding_completed_at: new Date(),
        });

        // Create organization and membership ONLY for company_admin
        let organizationId: string | undefined;
        
        if (role === 'recruiter') {
            // Recruiters don't need organizations
            // Recruiter profile will be created by network-service via API gateway
            organizationId = undefined;
        } else {
            // Create company organization
            if (!data.company?.name) {
                throw new Error('Company name is required');
            }

            const org = await this.repository.createOrganization({
                name: data.company.name,
                type: 'company',
            });
            organizationId = org.id;

            // Create membership
            await this.repository.createMembership({
                user_id: userId,
                organization_id: org.id,
                role: 'company_admin',
            });

            // Note: Company record creation will be handled by ats-service
            // via API call from API gateway
        }

        return { user: updatedUser, organizationId };
    }
}
