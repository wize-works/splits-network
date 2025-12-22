/**
 * Onboarding Wizard Types
 * Shared types for the onboarding wizard system
 */

export type OnboardingStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export type UserRole = 'recruiter' | 'company_admin';

export interface OnboardingState {
  // From database
  currentStep: number; // 1-4
  status: OnboardingStatus;

  // Wizard state
  isModalOpen: boolean;
  selectedRole: UserRole | null;

  // Form data
  recruiterProfile?: {
    bio?: string;
    phone?: string;
    industries?: string[];
    specialties?: string[];
    teamInviteCode?: string;
  };
  companyInfo?: {
    name: string;
    website?: string;
    industry?: string;
    size?: string;
  };

  // UI state
  submitting: boolean;
  error: string | null;
}

export interface OnboardingContextType {
  state: OnboardingState;
  actions: {
    setStep: (step: number) => void;
    setRole: (role: UserRole) => void;
    setRecruiterProfile: (profile: OnboardingState['recruiterProfile']) => void;
    setCompanyInfo: (info: OnboardingState['companyInfo']) => void;
    submitOnboarding: () => Promise<void>;
    closeModal: () => void;
  };
}
