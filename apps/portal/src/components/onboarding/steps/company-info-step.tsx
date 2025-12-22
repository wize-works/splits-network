'use client';

/**
 * Step 3b: Company Info Form
 * Shown when user selects "Company Admin" role
 */

import { useState, FormEvent } from 'react';
import { useOnboarding } from '../onboarding-provider';

export function CompanyInfoStep() {
    const { state, actions } = useOnboarding();

    const [formData, setFormData] = useState({
        name: state.companyInfo?.name || '',
        website: state.companyInfo?.website || '',
        industry: state.companyInfo?.industry || '',
        size: state.companyInfo?.size || '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        actions.setCompanyInfo(formData);
        actions.setStep(4);
    };

    const handleBack = () => {
        actions.setStep(2);
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Tell Us About Your Company</h2>
                <p className="text-base-content/70 mt-2">
                    Help recruiters understand your organization and hiring needs
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Company Name */}
                <div className="fieldset">
                    <label className="label">Company Name *</label>
                    <input
                        type="text"
                        className="input w-full"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Acme Corporation"
                        required
                    />
                </div>

                {/* Website */}
                <div className="fieldset">
                    <label className="label">Company Website *</label>
                    <input
                        type="url"
                        className="input w-full"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://www.example.com"
                        required
                    />
                </div>

                {/* Industry */}
                <div className='flex justify-evenly gap-4'>
                    <div className="fieldset w-full">
                        <label className="label">Industry *</label>
                        <select
                            className="select"
                            value={formData.industry}
                            onChange={(e) => handleChange('industry', e.target.value)}
                            required
                        >
                            <option value="">Select industry...</option>
                            <option value="technology">Technology</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="retail">Retail</option>
                            <option value="education">Education</option>
                            <option value="consulting">Consulting</option>
                            <option value="real_estate">Real Estate</option>
                            <option value="hospitality">Hospitality</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Company Size */}
                    <div className="fieldset w-full">
                        <label className="label">Company Size *</label>
                        <select
                            className="select"
                            value={formData.size}
                            onChange={(e) => handleChange('size', e.target.value)}
                            required
                        >
                            <option value="">Select size...</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501-1000">501-1000 employees</option>
                            <option value="1001-5000">1001-5000 employees</option>
                            <option value="5001+">5001+ employees</option>
                        </select>
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
