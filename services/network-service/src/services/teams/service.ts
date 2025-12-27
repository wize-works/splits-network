/**
 * Team Service (Phase 4B)
 * Business logic for team and agency management
 */

import { randomBytes } from 'crypto';
import type {
  Team,
  TeamMember,
  TeamWithStats,
  TeamMemberWithRecruiter,
  TeamInvitation,
  SplitConfiguration,
  PlacementSplit,
  TeamAnalytics,
  SplitModel,
  TeamMemberRole,
} from '@splits-network/shared-types';

export class TeamService {
  constructor(private repository: any) {} // Will use TeamRepository

  /**
   * Create a new team/agency
   */
  async createTeam(params: {
    name: string;
    owner_user_id: string;
    billing_organization_id?: string;
  }): Promise<Team> {
    // Verify the owner is a recruiter
    const recruiter = await this.repository.getRecruiterByUserId(params.owner_user_id);
    if (!recruiter) {
      throw new Error('Owner must be a registered recruiter');
    }

    // Create team
    const team = await this.repository.createTeam({
      name: params.name,
      owner_user_id: params.owner_user_id,
      billing_organization_id: params.billing_organization_id || null,
      status: 'active',
    });

    // Add owner as team member
    await this.repository.addTeamMember({
      team_id: team.id,
      recruiter_id: recruiter.id,
      role: 'owner',
      status: 'active',
    });

    // Create default split configuration (flat split)
    await this.repository.createSplitConfiguration({
      team_id: team.id,
      model: 'flat_split',
      config: { model: 'flat_split' },
      is_default: true,
    });

    return team;
  }

  /**
   * Get team by ID with stats
   */
  async getTeamWithStats(teamId: string): Promise<TeamWithStats> {
    const team = await this.repository.getTeamById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const stats = await this.repository.getTeamStats(teamId);

    return {
      ...team,
      member_count: stats.member_count,
      active_member_count: stats.active_member_count,
      total_placements: stats.total_placements,
      total_revenue: stats.total_revenue,
    };
  }

  /**
   * List teams for a user
   */
  async listUserTeams(clerkUserId: string): Promise<TeamWithStats[]> {
    const teams = await this.repository.getTeamsByUserId(clerkUserId);
    
    const teamsWithStats = await Promise.all(
      teams.map(async (team: Team) => {
        const stats = await this.repository.getTeamStats(team.id);
        return {
          ...team,
          member_count: stats.member_count,
          active_member_count: stats.active_member_count,
          total_placements: stats.total_placements,
          total_revenue: stats.total_revenue,
        };
      })
    );

    return teamsWithStats;
  }

  /**
   * Update team details
   */
  async updateTeam(
    teamId: string,
    userId: string,
    updates: { name?: string; status?: 'active' | 'suspended' }
  ): Promise<Team> {
    // Verify user is team owner
    const team = await this.repository.getTeamById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    if (team.owner_user_id !== userId) {
      throw new Error('Only team owner can update team details');
    }

    return this.repository.updateTeam(teamId, updates);
  }

  /**
   * Invite member to team
   */
  async inviteMember(params: {
    team_id: string;
    email: string;
    role: Exclude<TeamMemberRole, 'owner'>;
    invited_by: string;
  }): Promise<TeamInvitation> {
    // Verify inviter has permission (owner or admin)
    const member = await this.repository.getTeamMemberByUserId(params.team_id, params.invited_by);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new Error('Only team owners and admins can invite members');
    }

    // Check if email is already a team member
    const existingMember = await this.repository.getTeamMemberByEmail(params.team_id, params.email);
    if (existingMember) {
      throw new Error('User is already a team member');
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    return this.repository.createInvitation({
      team_id: params.team_id,
      email: params.email,
      role: params.role,
      invited_by: params.invited_by,
      token,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
    });
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<TeamMember> {
    const invitation = await this.repository.getInvitationByToken(token);
    
    if (!invitation) {
      throw new Error('Invalid invitation token');
    }
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }
    if (new Date(invitation.expires_at) < new Date()) {
      await this.repository.updateInvitationStatus(invitation.id, 'expired');
      throw new Error('Invitation has expired');
    }

    // Get recruiter for user
    const recruiter = await this.repository.getRecruiterByClerkUserId(userId);
    if (!recruiter) {
      throw new Error('User must be a registered recruiter');
    }

    // Add as team member
    const member = await this.repository.addTeamMember({
      team_id: invitation.team_id,
      recruiter_id: recruiter.id,
      role: invitation.role,
      status: 'active',
    });

    // Mark invitation as accepted
    await this.repository.updateInvitation(invitation.id, {
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    });

    return member;
  }

  /**
   * Remove team member
   */
  async removeMember(
    teamId: string,
    memberId: string,
    removedBy: string
  ): Promise<void> {
    // Verify remover has permission
    const remover = await this.repository.getTeamMemberByUserId(teamId, removedBy);
    if (!remover || !['owner', 'admin'].includes(remover.role)) {
      throw new Error('Only team owners and admins can remove members');
    }

    // Can't remove owner
    const memberToRemove = await this.repository.getTeamMemberById(memberId);
    if (!memberToRemove) {
      throw new Error('Member not found');
    }
    if (memberToRemove.role === 'owner') {
      throw new Error('Cannot remove team owner');
    }

    await this.repository.updateTeamMemberStatus(memberId, 'removed');
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    teamId: string,
    memberId: string,
    newRole: TeamMemberRole,
    updatedBy: string
  ): Promise<TeamMember> {
    // Verify updater is owner
    const updater = await this.repository.getTeamMemberByUserId(teamId, updatedBy);
    if (!updater || updater.role !== 'owner') {
      throw new Error('Only team owner can update member roles');
    }

    // Can't change owner role
    const member = await this.repository.getTeamMemberById(memberId);
    if (!member) {
      throw new Error('Member not found');
    }
    if (member.role === 'owner' || newRole === 'owner') {
      throw new Error('Cannot change owner role');
    }

    return this.repository.updateTeamMemberRole(memberId, newRole);
  }

  /**
   * List team members
   */
  async listTeamMembers(teamId: string): Promise<TeamMemberWithRecruiter[]> {
    return this.repository.getTeamMembersWithRecruiter(teamId);
  }

  /**
   * Configure split model
   */
  async configureSplitModel(params: {
    team_id: string;
    model: SplitModel;
    config: any;
    is_default: boolean;
    user_id: string;
  }): Promise<SplitConfiguration> {
    // Verify user is owner or admin
    const member = await this.repository.getTeamMemberByUserId(params.team_id, params.user_id);
    if (!member || !['owner', 'admin'].includes(member.role)) {
      throw new Error('Only team owners and admins can configure split models');
    }

    // Validate config based on model
    this.validateSplitConfig(params.model, params.config);

    // If setting as default, unset other defaults
    if (params.is_default) {
      await this.repository.unsetDefaultSplitConfiguration(params.team_id);
    }

    return this.repository.createSplitConfiguration({
      team_id: params.team_id,
      model: params.model,
      config: params.config,
      is_default: params.is_default,
    });
  }

  /**
   * Calculate placement splits for a team
   */
  async calculatePlacementSplits(params: {
    placement_id: string;
    team_id: string;
    placement_fee: number;
    split_configuration_id?: string;
  }): Promise<PlacementSplit[]> {
    // Get split configuration
    let config: SplitConfiguration;
    if (params.split_configuration_id) {
      config = await this.repository.getSplitConfigurationById(params.split_configuration_id);
    } else {
      config = await this.repository.getDefaultSplitConfiguration(params.team_id);
    }

    if (!config) {
      throw new Error('No split configuration found');
    }

    // Get active team members
    const members = await this.repository.getActiveTeamMembers(params.team_id);
    
    // Calculate splits based on model
    const splits = this.applySplitModel(
      config.model,
      config.config,
      members,
      params.placement_fee
    );

    // Save splits
    const placementSplits = await Promise.all(
      splits.map((split) =>
        this.repository.createPlacementSplit({
          placement_id: params.placement_id,
          team_id: params.team_id,
          recruiter_id: split.recruiter_id,
          split_percentage: split.percentage,
          split_amount: split.amount,
          split_configuration_id: config.id,
          notes: split.notes,
        })
      )
    );

    return placementSplits;
  }

  /**
   * Get team analytics
   */
  async getTeamAnalytics(
    teamId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<TeamAnalytics> {
    return this.repository.getTeamAnalytics(teamId, periodStart, periodEnd);
  }

  // Private helper methods

  private validateSplitConfig(model: SplitModel, config: any): void {
    switch (model) {
      case 'flat_split':
        // No additional config needed
        break;
      case 'tiered_split':
        if (typeof config.owner_percentage !== 'number' || config.owner_percentage <= 0 || config.owner_percentage >= 100) {
          throw new Error('Invalid owner_percentage for tiered_split model');
        }
        break;
      case 'individual_credit':
        // No additional config needed
        break;
      case 'hybrid':
        if (typeof config.team_overhead_fee !== 'number' || config.team_overhead_fee < 0 || config.team_overhead_fee >= 100) {
          throw new Error('Invalid team_overhead_fee for hybrid model');
        }
        break;
      default:
        throw new Error('Invalid split model');
    }
  }

  private applySplitModel(
    model: SplitModel,
    config: any,
    members: Array<{ recruiter_id: string; role: string }>,
    placementFee: number
  ): Array<{ recruiter_id: string; percentage: number; amount: number; notes?: string }> {
    const splits: Array<{ recruiter_id: string; percentage: number; amount: number; notes?: string }> = [];

    switch (model) {
      case 'flat_split': {
        const splitPercentage = 100 / members.length;
        const splitAmount = placementFee / members.length;
        members.forEach((member) => {
          splits.push({
            recruiter_id: member.recruiter_id,
            percentage: splitPercentage,
            amount: splitAmount,
            notes: 'Equal flat split',
          });
        });
        break;
      }

      case 'tiered_split': {
        const owner = members.find((m) => m.role === 'owner');
        if (!owner) {
          throw new Error('Team owner not found');
        }
        
        const ownerPercentage = config.owner_percentage;
        const ownerAmount = (placementFee * ownerPercentage) / 100;
        splits.push({
          recruiter_id: owner.recruiter_id,
          percentage: ownerPercentage,
          amount: ownerAmount,
          notes: 'Owner tiered split',
        });

        const remainingMembers = members.filter((m) => m.role !== 'owner');
        const remainingPercentage = 100 - ownerPercentage;
        const remainingAmount = placementFee - ownerAmount;
        const memberSplitPercentage = remainingPercentage / remainingMembers.length;
        const memberSplitAmount = remainingAmount / remainingMembers.length;

        remainingMembers.forEach((member) => {
          splits.push({
            recruiter_id: member.recruiter_id,
            percentage: memberSplitPercentage,
            amount: memberSplitAmount,
            notes: 'Member tiered split',
          });
        });
        break;
      }

      case 'individual_credit': {
        // This would require additional placement-level data about who contributed what
        // For now, throw an error as this needs more context
        throw new Error(
          'individual_credit model requires placement-specific contribution data'
        );
      }

      case 'hybrid': {
        const teamOverheadFee = config.team_overhead_fee || 0;
        const overheadAmount = (placementFee * teamOverheadFee) / 100;
        const distributionAmount = placementFee - overheadAmount;

        const owner = members.find((m) => m.role === 'owner');
        if (owner && teamOverheadFee > 0) {
          splits.push({
            recruiter_id: owner.recruiter_id,
            percentage: teamOverheadFee,
            amount: overheadAmount,
            notes: 'Team overhead fee',
          });
        }

        // Distribute remaining among all members
        const splitPercentage = (100 - teamOverheadFee) / members.length;
        const splitAmount = distributionAmount / members.length;
        members.forEach((member) => {
          splits.push({
            recruiter_id: member.recruiter_id,
            percentage: splitPercentage,
            amount: splitAmount,
            notes: 'Hybrid distribution split',
          });
        });
        break;
      }
    }

    return splits;
  }
}
