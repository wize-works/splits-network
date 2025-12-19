'use client';

import { useState, FormEvent } from 'react';

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    github_url: 'https://github.com/johndoe',
    portfolio_url: 'https://johndoe.com',
    headline: 'Senior Software Engineer',
    summary: 'Experienced software engineer with 8+ years building scalable web applications...',
    skills: 'JavaScript, TypeScript, React, Node.js, Python, AWS',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // TODO: API call to save profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSaving(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Profile</h1>
        <p className="text-lg text-base-content/70">
          Keep your profile up to date to attract the right opportunities
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">
              <i className="fa-solid fa-user"></i>
              Basic Information
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="fieldset">
                <label className="label">First Name *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.first_name}
                  onChange={(e) => updateField('first_name', e.target.value)}
                  required
                />
              </div>

              <div className="fieldset">
                <label className="label">Last Name *</label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.last_name}
                  onChange={(e) => updateField('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="fieldset">
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input w-full"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                />
              </div>

              <div className="fieldset">
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input w-full"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="fieldset">
              <label className="label">Location</label>
              <input
                type="text"
                className="input w-full"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="City, State"
              />
            </div>
          </div>
        </div>

        {/* Professional Links */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">
              <i className="fa-solid fa-link"></i>
              Professional Links
            </h2>

            <div className="fieldset">
              <label className="label">LinkedIn Profile</label>
              <input
                type="url"
                className="input w-full"
                value={formData.linkedin_url}
                onChange={(e) => updateField('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className="fieldset">
              <label className="label">GitHub Profile</label>
              <input
                type="url"
                className="input w-full"
                value={formData.github_url}
                onChange={(e) => updateField('github_url', e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>

            <div className="fieldset">
              <label className="label">Portfolio Website</label>
              <input
                type="url"
                className="input w-full"
                value={formData.portfolio_url}
                onChange={(e) => updateField('portfolio_url', e.target.value)}
                placeholder="https://yoursite.com"
              />
            </div>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">
              <i className="fa-solid fa-file-lines"></i>
              Professional Summary
            </h2>

            <div className="fieldset">
              <label className="label">Professional Headline *</label>
              <input
                type="text"
                className="input w-full"
                value={formData.headline}
                onChange={(e) => updateField('headline', e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>

            <div className="fieldset">
              <label className="label">About Me</label>
              <textarea
                className="textarea w-full h-32"
                value={formData.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder="Tell employers about your experience, skills, and career goals..."
              />
            </div>

            <div className="fieldset">
              <label className="label">Skills</label>
              <textarea
                className="textarea w-full h-24"
                value={formData.skills}
                onChange={(e) => updateField('skills', e.target.value)}
                placeholder="List your key skills separated by commas"
              />
              <label className="label">
                <span className="label-text-alt">Separate skills with commas</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button type="button" className="btn">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-save"></i>
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
