/**
 * Team Repository (Phase 4B)
 * Data access layer for team and agency operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Team,
  TeamMember,
  TeamMemberWithRecruiter,
  TeamInvitation,
  SplitConfiguration,
  PlacementSplit,
  TeamAnalytics,
} from '@splits-network/shared-types';

export class TeamRepository {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // Team operations

  async createTeam(data: Omit<Team, 'id' | 'created_at' | 'updated_at'>): Promise<Team> {
    const { data: team, error } = await this.supabase
      .from('network.teams')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create team: ${error.message}`);
    return team;
  }

  async getTeamById(teamId: string): Promise<Team | null> {
    const { data, error } = await this.supabase
      .from('network.teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get team: ${error.message}`);
    }
    return data;
  }

  async getTeamsByUserId(userId: string): Promise<Team[]> {
    // Get teams where user is owner
    const { data: ownedTeams, error: ownedError } = await this.supabase
      .from('network.teams')
      .select('*')
      .eq('owner_user_id', userId);

    if (ownedError) throw new Error(`Failed to get owned teams: ${ownedError.message}`);

    // Get teams where user is member
    const { data: memberTeams, error: memberError } = await this.supabase
      .from('network.team_members')
      .select(`
        team:network.teams!inner(*)
      `)
      .eq('recruiter.user_id', userId)
      .eq('status', 'active');

    if (memberError) throw new Error(`Failed to get member teams: ${memberError.message}`);

    // Combine and deduplicate
    const allTeams = [...(ownedTeams || [])];
    if (memberTeams) {
      memberTeams.forEach((mt: any) => {
        if (mt.team && !allTeams.find((t) => t.id === mt.team.id)) {
          allTeams.push(mt.team);
        }
      });
    }

    return allTeams;
  }

  async updateTeam(
    teamId: string,
    updates: Partial<Pick<Team, 'name' | 'status'>>
  ): Promise<Team> {
    const { data, error } = await this.supabase
      .from('network.teams')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update team: ${error.message}`);
    return data;
  }

  async getTeamStats(teamId: string): Promise<{
    member_count: number;
    active_member_count: number;
    total_placements: number;
    total_revenue: number;
  }> {
    // Get member counts
    const { count: memberCount } = await this.supabase
      .from('network.team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId);

    const { count: activeMemberCount } = await this.supabase
      .from('network.team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', 'active');

    // Get placement stats
    const { data: placementStats } = await this.supabase
      .from('network.placement_splits')
      .select('placement_id, split_amount')
      .eq('team_id', teamId);

    const uniquePlacements = new Set(placementStats?.map((p) => p.placement_id) || []);
    const totalRevenue = placementStats?.reduce((sum, p) => sum + (p.split_amount || 0), 0) || 0;

    return {
      member_count: memberCount || 0,
      active_member_count: activeMemberCount || 0,
      total_placements: uniquePlacements.size,
      total_revenue: totalRevenue,
    };
  }

  // Team member operations

  async addTeamMember(
    data: Omit<TeamMember, 'id' | 'joined_at'>
  ): Promise<TeamMember> {
    const { data: member, error } = await this.supabase
      .from('network.team_members')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to add team member: ${error.message}`);
    return member;
  }

  async getTeamMemberById(memberId: string): Promise<TeamMember | null> {
    const { data, error } = await this.supabase
      .from('network.team_members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get team member: ${error.message}`);
    }
    return data;
  }

  async getTeamMemberByUserId(teamId: string, userId: string): Promise<TeamMember | null> {
    // First get recruiter by user_id
    const { data: recruiter, error: recruiterError } = await this.supabase
      .from('network.recruiters')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (recruiterError || !recruiter) return null;

    // Then get team member by recruiter_id
    const { data, error } = await this.supabase
      .from('network.team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('recruiter_id', recruiter.id)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get team member by user: ${error.message}`);
    }
    return data;
  }

  async getTeamMemberByEmail(teamId: string, email: string): Promise<TeamMember | null> {
    // First get user by email
    const { data: user, error: userError } = await this.supabase
      .from('identity.users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) return null;

    // Then get recruiter by user_id
    const { data: recruiter, error: recruiterError } = await this.supabase
      .from('network.recruiters')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (recruiterError || !recruiter) return null;

    // Finally get team member
    const { data, error } = await this.supabase
      .from('network.team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('recruiter_id', recruiter.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw new Error(`Failed to get team member by email: ${error.message}`);
    return data;
  }

  async getTeamMembersWithRecruiter(teamId: string): Promise<TeamMemberWithRecruiter[]> {
    const { data, error } = await this.supabase
      .from('network.team_members')
      .select(`
        *,
        recruiter:network.recruiters!inner(
          id,
          user_id,
          user:identity.users!inner(name, email)
        )
      `)
      .eq('team_id', teamId)
      .neq('status', 'removed')
      .order('joined_at', { ascending: true });

    if (error) throw new Error(`Failed to get team members: ${error.message}`);
    
    return data.map((member: any) => ({
      ...member,
      recruiter: {
        id: member.recruiter.id,
        user_id: member.recruiter.user_id,
        name: member.recruiter.user.name,
        email: member.recruiter.user.email,
      },
    }));
  }

  async getActiveTeamMembers(teamId: string): Promise<Array<{ recruiter_id: string; role: string }>> {
    const { data, error } = await this.supabase
      .from('network.team_members')
      .select('recruiter_id, role')
      .eq('team_id', teamId)
      .eq('status', 'active');

    if (error) throw new Error(`Failed to get active team members: ${error.message}`);
    return data;
  }

  async updateTeamMemberStatus(memberId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('network.team_members')
      .update({ status })
      .eq('id', memberId);

    if (error) throw new Error(`Failed to update team member status: ${error.message}`);
  }

  async updateTeamMemberRole(memberId: string, role: string): Promise<TeamMember> {
    const { data, error } = await this.supabase
      .from('network.team_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update team member role: ${error.message}`);
    return data;
  }

  // Invitation operations

  async createInvitation(
    data: Omit<TeamInvitation, 'id' | 'created_at' | 'accepted_at'>
  ): Promise<TeamInvitation> {
    const { data: invitation, error } = await this.supabase
      .from('network.team_invitations')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create invitation: ${error.message}`);
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<TeamInvitation | null> {
    const { data, error } = await this.supabase
      .from('network.team_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get invitation: ${error.message}`);
    }
    return data;
  }

  async updateInvitationStatus(invitationId: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('network.team_invitations')
      .update({ status })
      .eq('id', invitationId);

    if (error) throw new Error(`Failed to update invitation status: ${error.message}`);
  }

  async updateInvitation(
    invitationId: string,
    updates: Partial<TeamInvitation>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('network.team_invitations')
      .update(updates)
      .eq('id', invitationId);

    if (error) throw new Error(`Failed to update invitation: ${error.message}`);
  }

  // Split configuration operations

  async createSplitConfiguration(
    data: Omit<SplitConfiguration, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SplitConfiguration> {
    const { data: config, error } = await this.supabase
      .from('network.split_configurations')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create split configuration: ${error.message}`);
    return config;
  }

  async getSplitConfigurationById(configId: string): Promise<SplitConfiguration | null> {
    const { data, error } = await this.supabase
      .from('network.split_configurations')
      .select('*')
      .eq('id', configId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get split configuration: ${error.message}`);
    }
    return data;
  }

  async getDefaultSplitConfiguration(teamId: string): Promise<SplitConfiguration | null> {
    const { data, error } = await this.supabase
      .from('network.split_configurations')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get default split configuration: ${error.message}`);
    }
    return data;
  }

  async unsetDefaultSplitConfiguration(teamId: string): Promise<void> {
    const { error } = await this.supabase
      .from('network.split_configurations')
      .update({ is_default: false })
      .eq('team_id', teamId)
      .eq('is_default', true);

    if (error) throw new Error(`Failed to unset default split configuration: ${error.message}`);
  }

  // Placement split operations

  async createPlacementSplit(
    data: Omit<PlacementSplit, 'id' | 'created_at'>
  ): Promise<PlacementSplit> {
    const { data: split, error } = await this.supabase
      .from('network.placement_splits')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create placement split: ${error.message}`);
    return split;
  }

  async getPlacementSplits(placementId: string): Promise<PlacementSplit[]> {
    const { data, error } = await this.supabase
      .from('network.placement_splits')
      .select('*')
      .eq('placement_id', placementId)
      .order('split_percentage', { ascending: false });

    if (error) throw new Error(`Failed to get placement splits: ${error.message}`);
    return data;
  }

  // Analytics operations

  async getTeamAnalytics(
    teamId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<TeamAnalytics> {
    // Get placements for period
    const { data: placements, error: placementsError } = await this.supabase
      .from('network.placement_splits')
      .select(`
        placement_id,
        recruiter_id,
        split_amount,
        placement:ats.placements!inner(
          id,
          created_at,
          role:ats.roles!inner(id, title)
        ),
        recruiter:network.recruiters!inner(
          user:identity.users!inner(name)
        )
      `)
      .eq('team_id', teamId)
      .gte('placement.created_at', periodStart)
      .lte('placement.created_at', periodEnd);

    if (placementsError) throw new Error(`Failed to get placements: ${placementsError.message}`);

    // Calculate totals
    const uniquePlacements = new Set(placements.map((p: any) => p.placement_id));
    const totalPlacements = uniquePlacements.size;
    const totalRevenue = placements.reduce((sum: number, p: any) => sum + (p.split_amount || 0), 0);

    // Calculate member performance
    const memberMap = new Map<string, any>();
    placements.forEach((p: any) => {
      if (!memberMap.has(p.recruiter_id)) {
        memberMap.set(p.recruiter_id, {
          recruiter_id: p.recruiter_id,
          recruiter_name: p.recruiter.user.name,
          placements: new Set(),
          revenue: 0,
        });
      }
      const member = memberMap.get(p.recruiter_id);
      member.placements.add(p.placement_id);
      member.revenue += p.split_amount || 0;
    });

    const memberPerformance = Array.from(memberMap.values()).map((m) => ({
      recruiter_id: m.recruiter_id,
      recruiter_name: m.recruiter_name,
      placements: m.placements.size,
      revenue: m.revenue,
      avg_time_to_placement_days: 30, // TODO: Calculate from application dates
    }));

    // Calculate top roles
    const roleMap = new Map<string, any>();
    placements.forEach((p: any) => {
      if (!roleMap.has(p.placement.role.id)) {
        roleMap.set(p.placement.role.id, {
          role_id: p.placement.role.id,
          role_title: p.placement.role.title,
          placements: new Set(),
          revenue: 0,
        });
      }
      const role = roleMap.get(p.placement.role.id);
      role.placements.add(p.placement_id);
      role.revenue += p.split_amount || 0;
    });

    const topRoles = Array.from(roleMap.values())
      .map((r) => ({
        role_id: r.role_id,
        role_title: r.role_title,
        placements: r.placements.size,
        revenue: r.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate conversion rate (TODO: Need submissions data)
    const conversionRate = 0.25; // Placeholder

    return {
      team_id: teamId,
      period_start: periodStart,
      period_end: periodEnd,
      total_placements: totalPlacements,
      total_revenue: totalRevenue,
      member_performance: memberPerformance,
      top_roles: topRoles,
      conversion_rate: conversionRate,
    };
  }

  // Utility methods

  async getRecruiterByClerkUserId(clerkUserId: string): Promise<{ id: string; user_id: string } | null> {
    const { data, error } = await this.supabase
      .from('network.recruiters')
      .select('id, user_id')
      .eq('user_id', clerkUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get recruiter: ${error.message}`);
    }
    return data;
  }
}
