'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ATSPlatform = 'greenhouse' | 'lever' | 'workable' | 'ashby' | 'generic';

interface PlatformConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
  fields: {
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    helpText?: string;
  }[];
}

const PLATFORMS: Record<ATSPlatform, PlatformConfig> = {
  greenhouse: {
    name: 'Greenhouse',
    description: 'Popular ATS used by fast-growing companies',
    icon: 'fa-leaf',
    color: 'success',
    fields: [
      {
        name: 'api_key',
        label: 'Harvest API Key',
        type: 'password',
        required: true,
        placeholder: 'Enter your Greenhouse Harvest API key',
        helpText: 'Found in Greenhouse Settings → Dev Center → API Credential Management',
      },
      {
        name: 'harvest_api_key',
        label: 'Board API Key (Optional)',
        type: 'password',
        required: false,
        placeholder: 'Enter your Board API key for public job listings',
        helpText: 'Only needed if you want to sync public job postings',
      },
    ],
  },
  lever: {
    name: 'Lever',
    description: 'Modern ATS with powerful recruiting tools',
    icon: 'fa-sliders',
    color: 'primary',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Enter your Lever API key',
        helpText: 'Found in Lever Settings → Integrations → API',
      },
      {
        name: 'environment',
        label: 'Environment',
        type: 'select',
        required: true,
        helpText: 'Select sandbox for testing or production for live data',
      },
    ],
  },
  workable: {
    name: 'Workable',
    description: 'Complete recruiting platform for small businesses',
    icon: 'fa-briefcase',
    color: 'info',
    fields: [
      {
        name: 'api_key',
        label: 'Access Token',
        type: 'password',
        required: true,
        placeholder: 'Enter your Workable access token',
        helpText: 'Found in Workable Settings → Integrations → API Access',
      },
      {
        name: 'subdomain',
        label: 'Subdomain',
        type: 'text',
        required: true,
        placeholder: 'your-company',
        helpText: 'Your Workable subdomain (e.g., company-name.workable.com)',
      },
    ],
  },
  ashby: {
    name: 'Ashby',
    description: 'Next-generation ATS for modern recruiting teams',
    icon: 'fa-building',
    color: 'warning',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Enter your Ashby API key',
        helpText: 'Found in Ashby Settings → Integrations → API Keys',
      },
    ],
  },
  generic: {
    name: 'Generic / Custom',
    description: 'Connect any ATS with a REST API',
    icon: 'fa-plug',
    color: 'neutral',
    fields: [
      {
        name: 'api_key',
        label: 'API Key / Token',
        type: 'password',
        required: true,
        placeholder: 'Enter your API key or bearer token',
      },
      {
        name: 'api_base_url',
        label: 'API Base URL',
        type: 'url',
        required: true,
        placeholder: 'https://api.example.com/v1',
        helpText: 'The base URL for your ATS API',
      },
    ],
  },
};

export default function NewIntegrationPage() {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<ATSPlatform | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlatformSelect = (platform: ATSPlatform) => {
    setSelectedPlatform(platform);
    setStep('configure');
    // Initialize form data
    const initialData: Record<string, string> = {};
    PLATFORMS[platform].fields.forEach((field) => {
      initialData[field.name] = '';
    });
    setFormData(initialData);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlatform) return;

    try {
      setSubmitting(true);
      setError(null);

      // Get company ID (from context/session in real app)
      const companyId = localStorage.getItem('selected_company_id');
      
      if (!companyId) {
        throw new Error('No company selected');
      }

      // Build config object from additional fields
      const config: Record<string, any> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'api_key' && key !== 'api_base_url' && value) {
          config[key] = value;
        }
      });

      const payload = {
        platform: selectedPlatform,
        api_key: formData.api_key,
        api_base_url: formData.api_base_url || undefined,
        config: Object.keys(config).length > 0 ? config : undefined,
      };

      const response = await fetch(`/api/companies/${companyId}/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create integration');
      }

      const integration = await response.json();
      router.push(`/integrations/${integration.id}`);
    } catch (err: any) {
      console.error('Failed to create integration:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const platformConfig = selectedPlatform ? PLATFORMS[selectedPlatform] : null;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/integrations" className="btn btn-ghost btn-circle">
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add ATS Integration</h1>
          <p className="text-base-content/70 mt-1">
            Connect your ATS platform to sync jobs and candidates
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error mb-6">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Select Platform */}
      {step === 'select' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Your ATS Platform</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(PLATFORMS) as ATSPlatform[]).map((platform) => {
              const config = PLATFORMS[platform];
              return (
                <button
                  key={platform}
                  className="card bg-base-100 shadow hover:shadow-lg transition-all text-left"
                  onClick={() => handlePlatformSelect(platform)}
                >
                  <div className="card-body">
                    <div className="flex items-start gap-4">
                      <div className={`avatar avatar-placeholder`}>
                        <div className={`bg-${config.color} text-${config.color}-content rounded-full w-12`}>
                          <i className={`fa-solid ${config.icon} text-xl`}></i>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="card-title text-lg">{config.name}</h3>
                        <p className="text-sm text-base-content/70 mt-1">{config.description}</p>
                      </div>
                      <i className="fa-solid fa-chevron-right text-base-content/30"></i>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 'configure' && platformConfig && (
        <div className="card bg-base-100 shadow">
          <form onSubmit={handleSubmit} className="card-body">
            {/* Platform Header */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-base-300">
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm"
                onClick={() => setStep('select')}
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <div className={`avatar avatar-placeholder`}>
                <div className={`bg-${platformConfig.color} text-${platformConfig.color}-content rounded-full w-12`}>
                  <i className={`fa-solid ${platformConfig.icon} text-xl`}></i>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{platformConfig.name}</h2>
                <p className="text-base-content/70">{platformConfig.description}</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {platformConfig.fields.map((field) => (
                <div key={field.name} className="fieldset">
                  <label className="label">
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  
                  {field.type === 'select' && field.name === 'environment' ? (
                    <select
                      className="select"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required={field.required}
                    >
                      <option value="">Select environment...</option>
                      <option value="sandbox">Sandbox (Testing)</option>
                      <option value="production">Production (Live)</option>
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      className="input"
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                  
                  {field.helpText && (
                    <label className="label">
                      <span className="label-text-alt">{field.helpText}</span>
                    </label>
                  )}
                </div>
              ))}

              {/* Sync Options */}
              <div className="divider">Default Sync Settings</div>

              <div className="space-y-3">
                <div className="fieldset">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" className="checkbox" defaultChecked />
                    <div>
                      <span className="label-text font-medium">Sync Jobs</span>
                      <p className="text-sm text-base-content/60">Import open positions</p>
                    </div>
                  </label>
                </div>

                <div className="fieldset">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" className="checkbox" defaultChecked />
                    <div>
                      <span className="label-text font-medium">Sync Candidates</span>
                      <p className="text-sm text-base-content/60">Export submitted candidates</p>
                    </div>
                  </label>
                </div>

                <div className="fieldset">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input type="checkbox" className="checkbox" defaultChecked />
                    <div>
                      <span className="label-text font-medium">Sync Applications</span>
                      <p className="text-sm text-base-content/60">Keep application status in sync</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card-actions justify-end mt-6">
              <Link href="/integrations" className="btn">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus"></i>
                    Create Integration
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
