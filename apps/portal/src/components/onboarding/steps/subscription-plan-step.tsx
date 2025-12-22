'use client';

/**
 * Step 2: Subscription Plan Selection
 * Placeholder for future Stripe integration
 */

import { useOnboarding } from '../onboarding-provider';

export function SubscriptionPlanStep() {
    const { state, actions } = useOnboarding();

    const handleContinue = () => {
        actions.setStep(3);
    };

    const handleBack = () => {
        actions.setStep(1);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Choose Your Plan</h2>
                <p className="text-base-content/70 mt-2">
                    Select a subscription plan that fits your needs
                </p>
            </div>

            {/* Placeholder Card */}
            <div className="card card-border p-8 text-center bg-base-200">
                <div className="space-y-4">
                    <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                        <i className="fa-solid fa-construction text-4xl text-warning"></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Coming Soon!</h3>
                        <p className="text-base-content/70 mt-2">
                            Subscription plans are currently being set up. For now, you can continue with full access.
                        </p>
                    </div>
                    <div className="badge badge-warning">Setup In Progress</div>
                </div>
            </div>

            {/* Temporary Info */}
            <div className="alert alert-info">
                <i className="fa-solid fa-circle-info"></i>
                <div className="flex-1">
                    <p className="font-semibold">Free Access During Setup</p>
                    <p className="text-sm">
                        While we're configuring billing, all features are available to you at no cost.
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
                    onClick={handleContinue}
                    className="btn btn-primary"
                    disabled={state.submitting}
                >
                    Continue
                    <i className="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    );
}
