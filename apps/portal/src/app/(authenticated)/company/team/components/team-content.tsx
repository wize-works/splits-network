'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import Link from 'next/link';

interface TeamMember {
    id: string;
    user_id: string;
    organization_id: string;
    role: string;
    user?: {
        id: string;
        name?: string;
        email: string;
    };
    created_at: string;
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
}

interface TeamManagementContentProps {
    organizationId: string;
}

export default function TeamManagementContent({ organizationId }: TeamManagementContentProps) {
    const auth = useAuth();
    const { getToken } = auth;
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('hiring_manager');
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTeamMembers();
        fetchInvitations();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            const response: any = await client.get(`/organizations/${organizationId}/memberships`);
            setMembers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            const response: any = await client.get(`/organizations/${organizationId}/invitations`);
            setInvitations(response.data || []);
        } catch (error) {
            console.error('Failed to fetch invitations:', error);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setInviting(true);

        try {
            const token = await getToken();
            if (!token) {
                setError('Authentication required');
                setInviting(false);
                return;
            }

            // Get current user ID from auth
            const { userId } = auth;
            if (!userId) {
                setError('User ID not found');
                setInviting(false);
                return;
            }

            const client = createAuthenticatedClient(token);

            // Create invitation in our system
            await client.post('/invitations', {
                email: inviteEmail.toLowerCase(),
                organization_id: organizationId,
                role: inviteRole,
                invited_by: userId,
            });

            setSuccess(`Invitation sent to ${inviteEmail}. They will receive an email with instructions to join.`);
            setInviteEmail('');
            setInviteRole('hiring_manager');

            // Refresh invitations list
            fetchInvitations();
        } catch (error: any) {
            console.error('Failed to send invitation:', error);
            setError(error.message || 'Failed to send invitation');
        } finally {
            setInviting(false);
        }
    };

    const handleRevokeInvitation = async (invitationId: string, email: string) => {
        if (!confirm(`Are you sure you want to revoke the invitation for ${email}?`)) {
            return;
        }

        try {
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            await client.delete(`/invitations/${invitationId}`);

            setSuccess(`Revoked invitation for ${email}`);
            fetchInvitations();
        } catch (error: any) {
            console.error('Failed to revoke invitation:', error);
            setError(error.message || 'Failed to revoke invitation');
        }
    };

    const handleRemoveMember = async (membershipId: string, memberName: string) => {
        if (!confirm(`Are you sure you want to remove ${memberName} from your team?`)) {
            return;
        }

        try {
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            await client.delete(`/memberships/${membershipId}`);

            setSuccess(`Removed ${memberName} from team`);
            fetchTeamMembers();
        } catch (error: any) {
            console.error('Failed to remove member:', error);
            setError(error.message || 'Failed to remove team member');
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'company_admin':
                return 'badge-primary';
            case 'hiring_manager':
                return 'badge-secondary';
            default:
                return 'badge-ghost';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'company_admin':
                return 'Admin';
            case 'hiring_manager':
                return 'Hiring Manager';
            default:
                return role;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="btn btn-sm btn-ghost">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} className="btn btn-sm btn-ghost">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}

            {/* Invite New Member */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">
                        <i className="fa-solid fa-user-plus"></i>
                        Invite Team Member
                    </h2>

                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="fieldset">
                                <label className="label">Email Address</label>
                                <input
                                    type="email"
                                    className="input w-full"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    required
                                    disabled={inviting}
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Role</label>
                                <select
                                    className="select w-full"
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    disabled={inviting}
                                >
                                    <option value="hiring_manager">Hiring Manager</option>
                                    <option value="company_admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={inviting || !inviteEmail.trim()}
                            >
                                {inviting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-paper-plane"></i>
                                        Send Invitation
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title">
                            <i className="fa-solid fa-clock"></i>
                            Pending Invitations ({invitations.filter(inv => inv.status === 'pending').length})
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Sent</th>
                                        <th>Expires</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invitations.filter(inv => inv.status === 'pending').map((invitation) => (
                                        <tr key={invitation.id}>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <i className="fa-solid fa-envelope text-warning"></i>
                                                    {invitation.email}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${getRoleBadge(invitation.role)}`}>
                                                    {getRoleLabel(invitation.role)}
                                                </span>
                                            </td>
                                            <td className="text-sm text-base-content/70">
                                                {new Date(invitation.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="text-sm text-base-content/70">
                                                {new Date(invitation.expires_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleRevokeInvitation(invitation.id, invitation.email)}
                                                    className="btn btn-sm btn-ghost btn-error"
                                                    title="Revoke invitation"
                                                >
                                                    <i className="fa-solid fa-ban"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Members List */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">
                        <i className="fa-solid fa-users"></i>
                        Team Members ({members.length})
                    </h2>

                    {members.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member) => (
                                        <tr key={member.id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar avatar-placeholder">
                                                        <div className="bg-neutral text-neutral-content rounded-full w-10">
                                                            <span className="text-xs">
                                                                {(member.user?.name || member.user?.email || 'U')
                                                                    .substring(0, 2)
                                                                    .toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">
                                                            {member.user?.name || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{member.user?.email}</td>
                                            <td>
                                                <span className={`badge ${getRoleBadge(member.role)}`}>
                                                    {getRoleLabel(member.role)}
                                                </span>
                                            </td>
                                            <td>{new Date(member.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {member.role !== 'company_admin' && (
                                                    <button
                                                        className="btn btn-ghost btn-xs text-error"
                                                        onClick={() =>
                                                            handleRemoveMember(
                                                                member.id,
                                                                member.user?.name || member.user?.email || 'user'
                                                            )
                                                        }
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                        Remove
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-users text-6xl text-base-content/20"></i>
                            <h3 className="text-xl font-semibold mt-4">No Team Members Yet</h3>
                            <p className="text-base-content/70 mt-2">
                                Invite colleagues to join your hiring team
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Role Descriptions */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">
                        <i className="fa-solid fa-circle-info"></i>
                        Role Permissions
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <span className="badge badge-primary">Admin</span>
                                Company Admin
                            </h3>
                            <ul className="list-disc list-inside text-sm text-base-content/70 mt-2 space-y-1">
                                <li>Full access to all features</li>
                                <li>Manage team members</li>
                                <li>Create and manage roles</li>
                                <li>View all candidates and applications</li>
                                <li>Manage company settings</li>
                                <li>Approve placements and fees</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold flex items-center gap-2">
                                <span className="badge badge-secondary">Hiring Manager</span>
                                Hiring Manager
                            </h3>
                            <ul className="list-disc list-inside text-sm text-base-content/70 mt-2 space-y-1">
                                <li>View assigned roles and candidates</li>
                                <li>Review applications</li>
                                <li>Schedule interviews</li>
                                <li>Move candidates through pipeline</li>
                                <li>Request pre-screens</li>
                                <li>Cannot manage team or settings</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
