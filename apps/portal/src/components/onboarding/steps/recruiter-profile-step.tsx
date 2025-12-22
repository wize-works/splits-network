'use client';

/**
 * Step 3a: Recruiter Profile Form
 * Shown when user selects "Recruiter" role
 */

import { useState, FormEvent } from 'react';
import { useOnboarding } from '../onboarding-provider';

export function RecruiterProfileStep() {
    const { state, actions } = useOnboarding();

    const [formData, setFormData] = useState({
        bio: state.recruiterProfile?.bio || '',
        phone: state.recruiterProfile?.phone || '',
        industries: state.recruiterProfile?.industries?.join(', ') || '',
        teamInviteCode: state.recruiterProfile?.teamInviteCode || '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Convert comma-separated industries to array
        const profile = {
            bio: formData.bio,
            phone: formData.phone,
            industries: formData.industries ? formData.industries.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            teamInviteCode: formData.teamInviteCode,
        };
        actions.setRecruiterProfile(profile);
        actions.setStep(4);
    };

    const handleBack = () => {
        actions.setStep(2);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Complete Your Recruiter Profile</h2>
                <p className="text-base-content/70 mt-2">
                    Tell us a bit about yourself and your recruiting experience
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Bio */}
                <div className="fieldset">
                    <label className="label">Bio / About You</label>
                    <textarea
                        className="textarea h-24"
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Share your recruiting experience, specializations, and what makes you great at finding talent..."
                        required
                    />
                    <label className="label">
                        <span className="label-text-alt">Help companies understand your expertise</span>
                    </label>
                </div>

                {/* Phone */}
                <div className="fieldset">
                    <label className="label">Phone Number *</label>
                    <input
                        type="tel"
                        className="input"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        required
                    />
                </div>

                {/* Industries */}
                <div className="fieldset">
                    <label className="label">Industries / Specializations</label>
                    <input
                        type="text"
                        className="input"
                        value={formData.industries}
                        onChange={(e) => handleChange('industries', e.target.value)}
                        placeholder="e.g., Technology, Healthcare, Finance"
                    />
                    <label className="label">
                        <span className="label-text-alt">Comma-separated list of your recruiting focus areas</span>
                    </label>
                </div>

                {/* Team Invite Code (Optional) */}
                <div className="fieldset">
                    <label className="label">Team Invite Code (Optional)</label>
                    <input
                        type="text"
                        className="input"
                        value={formData.teamInviteCode}
                        onChange={(e) => handleChange('teamInviteCode', e.target.value.toUpperCase())}
                        placeholder="TEAM-ABC123"
                    />
                    <label className="label">
                        <span className="label-text-alt">If you were invited by a team, enter the code here</span>
                    </label>
                </div>

                {state.error && (
                    <div className="alert alert-error">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>{state.error}</span>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-2 justify-between">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="btn"
                        disabled={state.submitting}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        Back
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={state.submitting}
                    >
                        {state.submitting ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                Continue
                                <i className="fa-solid fa-arrow-right"></i>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
