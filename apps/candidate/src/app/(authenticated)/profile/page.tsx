'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { MyRecruitersSection } from '@/components/recruiters/my-recruiters-section';
import { getMyProfile, updateMyProfile, CandidateProfile } from '@/lib/api';

export default function ProfilePage() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [candidateId, setCandidateId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        current_title: '',
        current_company: '',
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',
        bio: '',
        skills: '',
    });

    useEffect(() => {
        async function loadProfile() {
            if (!user?.primaryEmailAddress?.emailAddress) return;

            try {
                setLoading(true);
                setError(null);
                const token = await getToken();
                if (!token) {
                    throw new Error('Not authenticated');
                }

                const profile = await getMyProfile(token);
                if (profile) {
                    setCandidateId(profile.id);
                    setFormData({
                        full_name: profile.full_name || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        location: profile.location || '',
                        current_title: profile.current_title || '',
                        current_company: profile.current_company || '',
                        linkedin_url: profile.linkedin_url || '',
                        github_url: profile.github_url || '',
                        portfolio_url: profile.portfolio_url || '',
                        bio: profile.bio || '',
                        skills: profile.skills || '',
                    });
                }
            } catch (err: any) {
                console.error('Failed to load profile:', err);
                // Handle 404 as "no profile yet" - not an error
                if (err.name === 'ApiError' && err.status === 404) {
                    // No profile exists yet - show empty form
                    console.log('No candidate profile found - showing empty form');
                    setError(null);
                } else {
                    // Real error - show it
                    if (err.name === 'ApiError') {
                        setError(`${err.message} (Status: ${err.status}${err.code ? `, Code: ${err.code}` : ''})`);
                    } else {
                        setError(err.message || 'Failed to load profile');
                    }
                }
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [user, getToken]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setSaving(true);
        setError(null);
        setSaveSuccess(false);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            await updateMyProfile(token, formData);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            console.error('Failed to save profile:', err);
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center py-12">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">My Profile</h1>
                <p className="text-lg text-base-content/70">
                    Keep your profile up to date to attract the right opportunities
                </p>
            </div>

            {error && (
                <div className="alert alert-error mb-6">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {saveSuccess && (
                <div className="alert alert-success mb-6">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Profile saved successfully!</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className='grid gap-6 grid-cols-1 sm:grid-cols-2'>
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">
                            <h2 className="card-title mb-4">
                                <i className="fa-solid fa-user"></i>
                                Basic Information
                            </h2>

                            <div className="fieldset">
                                <label className="label">Full Name *</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.full_name}
                                    onChange={(e) => updateField('full_name', e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="fieldset">
                                    <label className="label">Email *</label>
                                    <input
                                        type="email"
                                        className="input w-full"
                                        value={formData.email}
                                        disabled
                                        title="Email cannot be changed"
                                    />
                                    <label className="label">
                                        <span className="label-text-alt">Email is managed by your account settings</span>
                                    </label>
                                </div>

                                <div className="fieldset">
                                    <label className="label">Phone</label>
                                    <input
                                        type="tel"
                                        className="input w-full"
                                        value={formData.phone}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div className="fieldset">
                                <label className="label">Location</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.location}
                                    onChange={(e) => updateField('location', e.target.value)}
                                    placeholder="City, State"
                                />
                            </div>
                        </div>
                    </div>
                    <MyRecruitersSection />
                </div>

                {/* Current Position & Professional Info */}
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title mb-4">
                            <i className="fa-solid fa-briefcase"></i>
                            Current Position
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="fieldset">
                                <label className="label">Current Title</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.current_title}
                                    onChange={(e) => updateField('current_title', e.target.value)}
                                    placeholder="e.g., Senior Software Engineer"
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Current Company</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.current_company}
                                    onChange={(e) => updateField('current_company', e.target.value)}
                                    placeholder="e.g., Tech Company Inc."
                                />
                            </div>
                        </div>

                        <div className="fieldset">
                            <label className="label">Professional Bio</label>
                            <textarea
                                className="textarea w-full h-32"
                                value={formData.bio}
                                onChange={(e) => updateField('bio', e.target.value)}
                                placeholder="Tell employers about your experience, skills, and career goals..."
                            />
                        </div>

                        <div className="fieldset">
                            <label className="label">Skills</label>
                            <textarea
                                className="textarea w-full h-24"
                                value={formData.skills}
                                onChange={(e) => updateField('skills', e.target.value)}
                                placeholder="List your key skills separated by commas"
                            />
                            <label className="label">
                                <span className="label-text-alt">Separate skills with commas</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Professional Links */}
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title mb-4">
                            <i className="fa-solid fa-link"></i>
                            Professional Links
                        </h2>

                        <div className="fieldset">
                            <label className="label">LinkedIn Profile</label>
                            <input
                                type="url"
                                className="input w-full"
                                value={formData.linkedin_url}
                                onChange={(e) => updateField('linkedin_url', e.target.value)}
                                placeholder="https://linkedin.com/in/username"
                            />
                        </div>

                        <div className="fieldset">
                            <label className="label">GitHub Profile</label>
                            <input
                                type="url"
                                className="input w-full"
                                value={formData.github_url}
                                onChange={(e) => updateField('github_url', e.target.value)}
                                placeholder="https://github.com/username"
                            />
                        </div>

                        <div className="fieldset">
                            <label className="label">Portfolio Website</label>
                            <input
                                type="url"
                                className="input w-full"
                                value={formData.portfolio_url}
                                onChange={(e) => updateField('portfolio_url', e.target.value)}
                                placeholder="https://yoursite.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Recruiter Relationships - Moved from basic info grid */}

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                    <button type="button" className="btn">
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-save"></i>
                                Save Profile
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
