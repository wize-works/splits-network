'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Delay showing banner slightly for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const saveConsent = async (preferences: any) => {
    const consentData = {
      necessary: true,
      functional: preferences.functional ?? false,
      analytics: preferences.analytics ?? false,
      marketing: preferences.marketing ?? false,
      timestamp: new Date().toISOString()
    };

    // Always save to localStorage
    localStorage.setItem('cookie-consent', JSON.stringify(consentData));

    // If user is authenticated, sync to database via API Gateway
    if (isSignedIn) {
      try {
        const token = await getToken();
        const response = await fetch('/api/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            preferences: {
              functional: consentData.functional,
              analytics: consentData.analytics,
              marketing: consentData.marketing
            }
          })
        });

        if (!response.ok) {
          console.error('Failed to sync consent to database');
        }
      } catch (error) {
        console.error('Error syncing consent:', error);
      }
    }
  };

  const handleAcceptAll = async () => {
    await saveConsent({
      functional: true,
      analytics: true,
      marketing: true
    });
    setShowBanner(false);
    setShowPreferences(false);
    // Initialize analytics/tracking here if needed
  };

  const handleAcceptNecessary = async () => {
    await saveConsent({
      functional: false,
      analytics: false,
      marketing: false
    });
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = async (preferences: any) => {
    await saveConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  if (!showBanner) return null;

  if (showPreferences) {
    return <CookiePreferences onSave={handleSavePreferences} onClose={() => setShowPreferences(false)} />;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-base-100 shadow-2xl border-t-4 border-primary animate-slide-up">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <i className="fa-solid fa-cookie-bite text-3xl text-primary flex-shrink-0 mt-1"></i>
              <div>
                <h3 className="font-bold text-lg mb-1">We Value Your Privacy</h3>
                <p className="text-sm text-base-content/80">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                  By clicking "Accept All", you consent to our use of cookies. Learn more in our{' '}
                  <Link href="/cookies" className="link link-primary">Cookie Policy</Link> and{' '}
                  <Link href="/privacy" className="link link-primary">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowPreferences(true)}
              className="btn btn-ghost btn-sm"
            >
              <i className="fa-solid fa-sliders mr-2"></i>
              Preferences
            </button>
            <button
              onClick={handleAcceptNecessary}
              className="btn btn-outline btn-sm"
            >
              Necessary Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="btn btn-primary btn-sm"
            >
              <i className="fa-solid fa-check mr-2"></i>
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CookiePreferences({ onSave, onClose }: { onSave: (prefs: any) => void; onClose: () => void }) {
  const [preferences, setPreferences] = useState({
    functional: true,
    analytics: true,
    marketing: false,
  });

  const handleSave = () => {
    onSave(preferences);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title text-2xl">
              <i className="fa-solid fa-cookie-bite text-primary"></i>
              Cookie Preferences
            </h2>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <p className="text-sm text-base-content/80 mb-6">
            Manage your cookie preferences below. Necessary cookies are always enabled as they are required for the website to function properly.
          </p>

          <div className="space-y-4">
            {/* Necessary Cookies - Always On */}
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-lock text-primary"></i>
                      <h3 className="font-semibold">Strictly Necessary Cookies</h3>
                    </div>
                    <p className="text-sm text-base-content/70">
                      Essential for the website to function. These cannot be disabled.
                    </p>
                  </div>
                  <div className="badge badge-success">Always On</div>
                </div>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-sliders text-secondary"></i>
                      <h3 className="font-semibold">Functionality Cookies</h3>
                    </div>
                    <p className="text-sm text-base-content/70">
                      Remember your preferences and settings for a personalized experience.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-chart-line text-accent"></i>
                      <h3 className="font-semibold">Analytics Cookies</h3>
                    </div>
                    <p className="text-sm text-base-content/70">
                      Help us understand how visitors use our website to improve performance.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  />
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-bullseye text-info"></i>
                      <h3 className="font-semibold">Marketing Cookies</h3>
                    </div>
                    <p className="text-sm text-base-content/70">
                      Track your activity to deliver relevant advertising and measure effectiveness.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card-actions justify-end mt-6 gap-2">
            <button onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              <i className="fa-solid fa-check mr-2"></i>
              Save Preferences
            </button>
          </div>

          <p className="text-xs text-base-content/60 mt-4">
            For more information, read our{' '}
            <Link href="/cookies" className="link link-primary" onClick={onClose}>Cookie Policy</Link>
            {' '}and{' '}
            <Link href="/privacy" className="link link-primary" onClick={onClose}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
