'use client';

/**
 * Client Wrapper for Authenticated Layout
 * Provides onboarding context and modal
 */

import { OnboardingProvider, OnboardingWizardModal } from '@/components/onboarding';

export function AuthenticatedLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <OnboardingProvider>
            {children}
            <OnboardingWizardModal />
        </OnboardingProvider>
    );
}
