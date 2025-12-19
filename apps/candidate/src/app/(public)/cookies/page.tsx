import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy - Applicant Network | How We Use Cookies',
  description: 'Learn about how Applicant Network uses cookies and similar technologies to improve your experience and provide our services.',
  robots: 'index, follow',
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-5xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-base-content/60 text-lg mb-8">
          <strong>Last Updated:</strong> December 18, 2025
        </p>

        <div className="alert alert-info mb-8">
          <i className="fa-solid fa-cookie-bite"></i>
          <span>
            This Cookie Policy explains how Applicant Network uses cookies and similar technologies when you visit our website.
          </span>
        </div>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">1. What Are Cookies?</h2>
          <p className="text-base-content/80">
            Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) when you visit a website. They help the website remember your actions and preferences over time, so you don't have to re-enter information when you return to the site or browse from one page to another.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">2. How We Use Cookies</h2>
          <p className="text-base-content/80 mb-4">
            Applicant Network uses cookies to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li><strong>Enable Essential Features:</strong> Allow you to log in, navigate the site, and use core functionality</li>
            <li><strong>Remember Your Preferences:</strong> Store settings like language, theme, and display preferences</li>
            <li><strong>Improve Performance:</strong> Help us understand how you use the site so we can make it better</li>
            <li><strong>Analyze Usage:</strong> Collect data about site traffic and user behavior</li>
            <li><strong>Enhance Security:</strong> Detect and prevent fraudulent activity and security threats</li>
            <li><strong>Personalize Content:</strong> Show you relevant job recommendations and content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">3. Types of Cookies We Use</h2>
          
          <div className="space-y-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-lock text-primary"></i>
                  Strictly Necessary Cookies
                </h3>
                <p className="text-base-content/80 mb-3">
                  These cookies are essential for the website to function properly. Without them, you won't be able to use basic features like logging in or submitting applications.
                </p>
                <p className="text-base-content/80"><strong>Examples:</strong></p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-base-content/70">
                  <li>Authentication and session management</li>
                  <li>Security and fraud prevention</li>
                  <li>Load balancing</li>
                </ul>
                <div className="badge badge-success mt-3">Cannot be disabled</div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-sliders text-secondary"></i>
                  Functionality Cookies
                </h3>
                <p className="text-base-content/80 mb-3">
                  These cookies remember your preferences and choices to provide a more personalized experience.
                </p>
                <p className="text-base-content/80"><strong>Examples:</strong></p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-base-content/70">
                  <li>Theme and display preferences (dark/light mode)</li>
                  <li>Language selection</li>
                  <li>Search filters and job preferences</li>
                  <li>Recent job views</li>
                </ul>
                <div className="badge badge-warning mt-3">Optional</div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-chart-line text-accent"></i>
                  Analytics Cookies
                </h3>
                <p className="text-base-content/80 mb-3">
                  These cookies help us understand how visitors interact with our website by collecting anonymous information.
                </p>
                <p className="text-base-content/80"><strong>Examples:</strong></p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-base-content/70">
                  <li>Page views and navigation patterns</li>
                  <li>Time spent on pages</li>
                  <li>Error tracking and debugging</li>
                  <li>Performance metrics</li>
                </ul>
                <p className="text-sm text-base-content/70 mt-2">
                  <strong>Services we use:</strong> Google Analytics (anonymized IP)
                </p>
                <div className="badge badge-warning mt-3">Optional</div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-bullseye text-info"></i>
                  Marketing Cookies
                </h3>
                <p className="text-base-content/80 mb-3">
                  These cookies track your activity across websites to deliver relevant advertising and measure campaign effectiveness.
                </p>
                <p className="text-base-content/80"><strong>Examples:</strong></p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-base-content/70">
                  <li>Targeted advertising</li>
                  <li>Social media integration</li>
                  <li>Conversion tracking</li>
                  <li>Remarketing campaigns</li>
                </ul>
                <div className="badge badge-warning mt-3">Optional</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">4. Third-Party Cookies</h2>
          <p className="text-base-content/80 mb-4">
            We use services from trusted third-party providers that may set their own cookies on your device. These include:
          </p>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Purpose</th>
                  <th>Privacy Policy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Clerk</strong></td>
                  <td>Authentication and user management</td>
                  <td><a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="link link-primary">clerk.com/privacy</a></td>
                </tr>
                <tr>
                  <td><strong>Google Analytics</strong></td>
                  <td>Website analytics and performance tracking</td>
                  <td><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="link link-primary">google.com/privacy</a></td>
                </tr>
                <tr>
                  <td><strong>Stripe</strong></td>
                  <td>Payment processing (recruiters only)</td>
                  <td><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="link link-primary">stripe.com/privacy</a></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-base-content/80 mt-4">
            We do not control these third-party cookies. Please review the privacy policies of these services to learn how they use cookies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">5. Managing Your Cookie Preferences</h2>
          
          <h3 className="text-2xl font-semibold mb-3">5.1 Cookie Consent</h3>
          <p className="text-base-content/80 mb-4">
            When you first visit Applicant Network, you'll see a cookie banner where you can choose to accept or decline non-essential cookies. You can change your preferences at any time using the button below:
          </p>
          <button className="btn btn-primary mb-6">
            <i className="fa-solid fa-cookie mr-2"></i>
            Manage Cookie Preferences
          </button>

          <h3 className="text-2xl font-semibold mb-3">5.2 Browser Settings</h3>
          <p className="text-base-content/80 mb-4">
            Most web browsers allow you to control cookies through their settings. You can:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li>View what cookies are stored on your device</li>
            <li>Delete existing cookies</li>
            <li>Block cookies from specific websites</li>
            <li>Block all third-party cookies</li>
            <li>Clear all cookies when you close your browser</li>
          </ul>
          <p className="text-base-content/80 mt-4">
            <strong>Note:</strong> Disabling cookies may affect your ability to use certain features of our website.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">5.3 Browser-Specific Instructions</h3>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold mb-2"><i className="fa-brands fa-chrome text-xl mr-2"></i>Google Chrome</h4>
                <p className="text-sm text-base-content/70">Settings → Privacy and security → Cookies and other site data</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold mb-2"><i className="fa-brands fa-firefox text-xl mr-2"></i>Mozilla Firefox</h4>
                <p className="text-sm text-base-content/70">Settings → Privacy & Security → Cookies and Site Data</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold mb-2"><i className="fa-brands fa-safari text-xl mr-2"></i>Safari</h4>
                <p className="text-sm text-base-content/70">Preferences → Privacy → Manage Website Data</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold mb-2"><i className="fa-brands fa-edge text-xl mr-2"></i>Microsoft Edge</h4>
                <p className="text-sm text-base-content/70">Settings → Cookies and site permissions → Manage and delete cookies</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">6. Do Not Track</h2>
          <p className="text-base-content/80">
            Some browsers have a "Do Not Track" feature that signals to websites that you don't want your online activity tracked. Currently, there is no universal standard for how websites should respond to Do Not Track signals. We do not currently respond to Do Not Track signals, but you can manage cookies as described above.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">7. Mobile Devices</h2>
          <p className="text-base-content/80 mb-4">
            Our website uses cookies on mobile devices just as it does on desktop computers. You can manage cookies on mobile devices through your browser settings, similar to desktop browsers.
          </p>
          <p className="text-base-content/80">
            On mobile apps (if applicable), you can manage tracking preferences through your device settings:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80 mt-4">
            <li><strong>iOS:</strong> Settings → Privacy → Tracking</li>
            <li><strong>Android:</strong> Settings → Google → Ads → Opt out of Ads Personalization</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">8. Changes to This Cookie Policy</h2>
          <p className="text-base-content/80">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date at the top.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">9. Contact Us</h2>
          <p className="text-base-content/80 mb-4">
            If you have questions about how we use cookies, please contact us:
          </p>
          <div className="card bg-base-200">
            <div className="card-body">
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:privacy@applicant.network" className="link link-primary">privacy@applicant.network</a></p>
              <p className="mb-2"><strong>Support:</strong> <Link href="/contact" className="link link-primary">Contact Form</Link></p>
              <p><strong>Address:</strong> Splits Network, Inc. [Full Address]</p>
            </div>
          </div>
        </section>

        <div className="divider my-8"></div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/privacy" className="btn btn-outline">
            <i className="fa-solid fa-shield-halved mr-2"></i>
            Privacy Policy
          </Link>
          <Link href="/terms" className="btn btn-outline">
            <i className="fa-solid fa-file-contract mr-2"></i>
            Terms of Service
          </Link>
          <Link href="/contact" className="btn btn-primary">
            <i className="fa-solid fa-envelope mr-2"></i>
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
