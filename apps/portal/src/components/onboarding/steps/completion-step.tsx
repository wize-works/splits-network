'use client';

/**
 * Step 4: Completion Step
 * Shows confirmation and submits the onboarding data
 */

import { useOnboarding } from '../onboarding-provider';

export function CompletionStep() {
    const { state, actions } = useOnboarding();

    const handleComplete = async () => {
        await actions.submitOnboarding();
    };

    const handleBack = () => {
        actions.setStep(3);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Review & Complete</h2>
                <p className="text-base-content/70 mt-2">
                    Confirm your information and complete your setup
                </p>
            </div>

            {/* Summary Card */}
            <div className="card card-border p-6 space-y-4">
                {/* Role Summary */}
                <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <i className={`fa-solid ${state.selectedRole === 'recruiter' ? 'fa-user-tie' : 'fa-building'} text-xl text-primary`}></i>
                    </div>
                    <div>
                        <p className="text-sm text-base-content/70">Role</p>
                        <p className="font-semibold">
                            {state.selectedRole === 'recruiter' ? 'Recruiter' : 'Company Admin'}
                        </p>
                    </div>
                </div>

                {/* Recruiter Profile Summary */}
                {state.selectedRole === 'recruiter' && state.recruiterProfile && (
                    <div className="space-y-2">
                        <div>
                            <p className="text-sm text-base-content/70">Phone</p>
                            <p className="font-medium">{state.recruiterProfile.phone}</p>
                        </div>
                        {state.recruiterProfile.industries && (
                            <div>
                                <p className="text-sm text-base-content/70">Industries</p>
                                <p className="font-medium">{state.recruiterProfile.industries?.join(', ')}</p>
                            </div>
                        )}
                        {state.recruiterProfile.teamInviteCode && (
                            <div>
                                <p className="text-sm text-base-content/70">Team Invite Code</p>
                                <p className="font-medium">{state.recruiterProfile.teamInviteCode}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-base-content/70">Bio</p>
                            <p className="font-medium line-clamp-3">{state.recruiterProfile.bio}</p>
                        </div>
                    </div>
                )}

                {/* Company Info Summary */}
                {state.selectedRole === 'company_admin' && state.companyInfo && (
                    <div className="space-y-2">
                        <div>
                            <p className="text-sm text-base-content/70">Company Name</p>
                            <p className="font-semibold text-lg">{state.companyInfo.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-base-content/70">Website</p>
                            <p className="font-medium">{state.companyInfo.website}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-base-content/70">Industry</p>
                                <p className="font-medium capitalize">{state.companyInfo.industry?.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-base-content/70">Size</p>
                                <p className="font-medium">{state.companyInfo.size} employees</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Alert */}
            <div className="alert alert-info">
                <i className="fa-solid fa-circle-info"></i>
                <div className="flex-1">
                    <p className="font-semibold">What happens next?</p>
                    <p className="text-sm">
                        {state.selectedRole === 'recruiter'
                            ? "You'll be taken to your dashboard where you can start browsing jobs and submitting candidates."
                            : "You'll be taken to your dashboard where you can post jobs and manage applications."}
                    </p>
                </div>
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
                    type="button"
                    onClick={handleComplete}
                    className="btn btn-primary"
                    disabled={state.submitting}
                >
                    {state.submitting ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Completing Setup...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-check"></i>
                            Complete Setup
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
