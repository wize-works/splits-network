'use client';

/**
 * Step 1: Role Selection
 * User chooses between Recruiter or Company Admin
 */

import { useOnboarding } from '../onboarding-provider';
import { UserRole } from '../types';

export function RoleSelectionStep() {
    const { state, actions } = useOnboarding();

    const handleRoleSelect = (role: UserRole) => {
        actions.setRole(role);
        actions.setStep(2);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Choose Your Role</h2>
                <p className="text-base-content/70 mt-2">
                    Select how you'll be using Splits Network
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recruiter Card */}
                <button
                    onClick={() => handleRoleSelect('recruiter')}
                    className="card card-border hover:border-primary hover:shadow-lg transition-all p-6 text-left"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <i className="fa-solid fa-user-tie text-3xl text-primary"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Recruiter</h3>
                            <p className="text-sm text-base-content/70 mt-2">
                                Find candidates, collaborate with other recruiters, and earn referral fees
                            </p>
                        </div>
                        <div className="badge badge-primary badge-outline">Most Popular</div>
                    </div>
                </button>

                {/* Company Admin Card */}
                <button
                    onClick={() => handleRoleSelect('company_admin')}
                    className="card card-border hover:border-primary hover:shadow-lg transition-all p-6 text-left"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                            <i className="fa-solid fa-building text-3xl text-secondary"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Company Admin</h3>
                            <p className="text-sm text-base-content/70 mt-2">
                                Post jobs, manage candidates, and work with recruiters to fill positions
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {state.error && (
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{state.error}</span>
                </div>
            )}
        </div>
    );
}
