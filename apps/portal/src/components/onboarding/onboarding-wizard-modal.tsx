'use client';

/**
 * Onboarding Wizard Modal
 * Main modal container that orchestrates the 4-step onboarding flow
 */

import { useEffect } from 'react';
import { useOnboarding } from './onboarding-provider';
import { RoleSelectionStep } from './steps/role-selection-step';
import { SubscriptionPlanStep } from './steps/subscription-plan-step';
import { RecruiterProfileStep } from './steps/recruiter-profile-step';
import { CompanyInfoStep } from './steps/company-info-step';
import { CompletionStep } from './steps/completion-step';

export function OnboardingWizardModal() {
    const { state } = useOnboarding();

    // Block body scroll when modal is open
    useEffect(() => {
        if (state.isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [state.isModalOpen]);

    if (!state.isModalOpen) {
        return null;
    }

    return (
        <>
            {/* Modal Backdrop - Non-dismissible, blocks all interaction */}
            <div className="fixed inset-0 bg-black/50 z-[998]" />

            {/* Modal Container */}
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-base-100 rounded-box shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
                    {/* Progress Indicator */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Step {state.currentStep} of 4</span>
                            <span className="text-sm text-base-content/70">
                                {Math.round((state.currentStep / 4) * 100)}% Complete
                            </span>
                        </div>
                        <div className="w-full bg-base-300 rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(state.currentStep / 4) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="py-4">
                        {state.currentStep === 1 && <RoleSelectionStep />}
                        {state.currentStep === 2 && <SubscriptionPlanStep />}
                        {state.currentStep === 3 && state.selectedRole === 'recruiter' && <RecruiterProfileStep />}
                        {state.currentStep === 3 && state.selectedRole === 'company_admin' && <CompanyInfoStep />}
                        {state.currentStep === 4 && <CompletionStep />}
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 pt-4 border-t border-base-300">
                        <p className="text-xs text-center text-base-content/60">
                            Need help? Contact support at <a href="mailto:support@splits.network" className="link link-primary">support@splits.network</a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
