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
        specialties: state.recruiterProfile?.specialties?.join(', ') || '',
        location: state.recruiterProfile?.location || '',
        tagline: state.recruiterProfile?.tagline || '',
        years_experience: state.recruiterProfile?.years_experience?.toString() || '',
        teamInviteCode: state.recruiterProfile?.teamInviteCode || '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Convert comma-separated lists to arrays
        const profile = {
            bio: formData.bio,
            phone: formData.phone,
            industries: formData.industries ? formData.industries.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            specialties: formData.specialties ? formData.specialties.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
            location: formData.location,
            tagline: formData.tagline,
            years_experience: formData.years_experience ? parseInt(formData.years_experience) : undefined,
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
                        className="textarea h-24 w-full"
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
                        className="input w-full"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        required
                    />
                </div>

                {/* Industries */}
                <div className="fieldset">
                    <label className="label">Industries</label>
                    <input
                        type="text"
                        className="input w-full"
                        value={formData.industries}
                        onChange={(e) => handleChange('industries', e.target.value)}
                        placeholder="e.g., Technology, Healthcare, Finance"
                    />
                    <label className="label">
                        <span className="label-text-alt">Comma-separated list of industries you recruit in</span>
                    </label>
                </div>

                {/* Specialties */}
                <div className="fieldset">
                    <label className="label">Specialties</label>
                    <input
                        type="text"
                        className="input w-full"
                        value={formData.specialties}
                        onChange={(e) => handleChange('specialties', e.target.value)}
                        placeholder="e.g., Software Engineering, Data Science, Product Management"
                    />
                    <label className="label">
                        <span className="label-text-alt">Comma-separated list of roles/specializations you focus on</span>
                    </label>
                </div>

                {/* Location */}
                <div className="fieldset">
                    <label className="label">Location</label>
                    <input
                        type="text"
                        className="input w-full"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="e.g., New York, NY"
                    />
                    <label className="label">
                        <span className="label-text-alt">Your primary work location</span>
                    </label>
                </div>

                {/* Tagline and Years Experience - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="fieldset">
                        <label className="label">Tagline</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.tagline}
                            onChange={(e) => handleChange('tagline', e.target.value)}
                            placeholder="e.g., Tech Recruiting Expert"
                        />
                        <label className="label">
                            <span className="label-text-alt">Brief headline about your expertise</span>
                        </label>
                    </div>

                    <div className="fieldset">
                        <label className="label">Years of Experience</label>
                        <input
                            type="number"
                            className="input"
                            min="0"
                            value={formData.years_experience}
                            onChange={(e) => handleChange('years_experience', e.target.value)}
                            placeholder="5"
                        />
                        <label className="label">
                            <span className="label-text-alt">Years in recruiting</span>
                        </label>
                    </div>
                </div>

                {/* Team Invite Code (Optional) */}
                <div className="fieldset">
                    <label className="label">Team Invite Code (Optional)</label>
                    <input
                        type="text"
                        className="input w-full"
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
