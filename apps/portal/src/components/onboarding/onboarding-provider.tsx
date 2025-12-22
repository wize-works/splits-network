'use client';

/**
 * Onboarding Context Provider
 * Manages state for the onboarding wizard across components
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { OnboardingState, OnboardingContextType, UserRole } from './types';

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const { getToken } = useAuth();
    const [state, setState] = useState<OnboardingState>({
        currentStep: 1,
        status: 'pending',
        isModalOpen: false,
        selectedRole: null,
        submitting: false,
        error: null,
    });

    // Fetch user's onboarding status on mount
    useEffect(() => {
        if (!user) return;

        const fetchOnboardingStatus = async () => {
            try {
                const token = await getToken();
                if (!token) throw new Error('No authentication token');

                const response = await fetch(`${API_URL}/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) throw new Error('Failed to fetch user data');

                const { data } = await response.json();

                // Show modal if onboarding is pending or in progress
                const shouldShowModal = data.onboarding_status === 'pending' || data.onboarding_status === 'in_progress';

                setState(prev => ({
                    ...prev,
                    currentStep: data.onboarding_step || 1,
                    status: data.onboarding_status || 'pending',
                    isModalOpen: shouldShowModal,
                }));
            } catch (error) {
                console.error('Failed to fetch onboarding status:', error);
            }
        };

        fetchOnboardingStatus();
    }, [user, getToken]);

    const actions = {
        setStep: async (step: number) => {
            setState(prev => ({
                ...prev,
                currentStep: step,
                status: step === 2 ? 'in_progress' : prev.status
            }));

            // Update backend with new step
            try {
                const token = await getToken();
                if (!token) return;

                const meResponse = await fetch(`${API_URL}/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (meResponse.ok) {
                    const { data: userData } = await meResponse.json();

                    await fetch(`${API_URL}/users/${userData.id}/onboarding`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ step }),
                    });
                }
            } catch (error) {
                console.error('Failed to update onboarding step:', error);
            }
        },

        setRole: (role: UserRole) => {
            setState(prev => ({ ...prev, selectedRole: role }));
        },

        setRecruiterProfile: (profile: OnboardingState['recruiterProfile']) => {
            setState(prev => ({ ...prev, recruiterProfile: profile }));
        },

        setCompanyInfo: (info: OnboardingState['companyInfo']) => {
            setState(prev => ({ ...prev, companyInfo: info }));
        },

        submitOnboarding: async () => {
            const { selectedRole, recruiterProfile, companyInfo } = state;

            if (!selectedRole) {
                setState(prev => ({ ...prev, error: 'Please select a role' }));
                return;
            }

            if (selectedRole === 'company_admin' && !companyInfo?.name) {
                setState(prev => ({ ...prev, error: 'Company name is required' }));
                return;
            }

            setState(prev => ({ ...prev, submitting: true, error: null }));

            try {
                const token = await getToken();
                if (!token) throw new Error('No authentication token');

                const payload: any = { role: selectedRole };
                if (selectedRole === 'recruiter') {
                    payload.profile = recruiterProfile;
                } else {
                    payload.company = companyInfo;
                }

                // Call completion endpoint - need to get internal user ID first from /me
                const meResponse = await fetch(`${API_URL}/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!meResponse.ok) throw new Error('Failed to get user data');
                const { data: userData } = await meResponse.json();

                const response = await fetch(`${API_URL}/users/${userData.id}/complete-onboarding`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Failed to complete onboarding');
                }

                // Move to completion step
                setState(prev => ({
                    ...prev,
                    currentStep: 4,
                    status: 'completed',
                    submitting: false,
                }));

                // Close modal after 2 seconds
                setTimeout(() => {
                    setState(prev => ({ ...prev, isModalOpen: false }));
                    // Reload to refresh user data
                    window.location.reload();
                }, 2000);

            } catch (error: any) {
                setState(prev => ({
                    ...prev,
                    error: error.message || 'Failed to complete onboarding',
                    submitting: false,
                }));
            }
        },

        closeModal: () => {
            // Only allow closing if completed
            if (state.status === 'completed') {
                setState(prev => ({ ...prev, isModalOpen: false }));
            }
        },
    };

    return (
        <OnboardingContext.Provider value={{ state, actions }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
}
