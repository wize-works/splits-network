import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - Applicant Network | Your Data Privacy & Security',
  description: 'Read Applicant Network\'s Privacy Policy to understand how we collect, use, protect, and manage your personal information and data.',
  robots: 'index, follow',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-base-content/60 text-lg mb-8">
          <strong>Last Updated:</strong> December 18, 2025
        </p>

        <div className="alert alert-info mb-8">
          <i className="fa-solid fa-circle-info"></i>
          <span>
            Your privacy is important to us. This policy explains how we collect, use, and protect your information when you use Applicant Network.
          </span>
        </div>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">1. Information We Collect</h2>
          
          <h3 className="text-2xl font-semibold mb-3">1.1 Information You Provide</h3>
          <p className="text-base-content/80 mb-4">
            When you create an account or use our services, you may provide us with:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li><strong>Profile Information:</strong> Name, email address, phone number, location, resume, work experience, education, skills, and career preferences</li>
            <li><strong>Application Information:</strong> Job applications, cover letters, and related documents</li>
            <li><strong>Communication Data:</strong> Messages sent through our platform, feedback, and support inquiries</li>
            <li><strong>Payment Information:</strong> For recruiters only—billing address and payment details (processed securely through Stripe)</li>
          </ul>

          <h3 className="text-2xl font-semibold mb-3 mt-6">1.2 Information We Collect Automatically</h3>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
            <li><strong>Cookies and Similar Technologies:</strong> See our <Link href="/cookies" className="link link-primary">Cookie Policy</Link> for details</li>
          </ul>

          <h3 className="text-2xl font-semibold mb-3 mt-6">1.3 Information From Third Parties</h3>
          <p className="text-base-content/80">
            We may receive information from authentication providers (like Clerk), analytics services, and other business partners in accordance with their privacy policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">2. How We Use Your Information</h2>
          <p className="text-base-content/80 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li><strong>Provide Services:</strong> Enable job search, applications, recruiter matching, and communication</li>
            <li><strong>Improve Platform:</strong> Analyze usage patterns, fix bugs, and develop new features</li>
            <li><strong>Personalization:</strong> Recommend relevant jobs and customize your experience</li>
            <li><strong>Communication:</strong> Send important updates, notifications, and marketing (with your consent)</li>
            <li><strong>Safety & Security:</strong> Prevent fraud, protect accounts, and enforce our terms</li>
            <li><strong>Legal Compliance:</strong> Meet legal obligations and respond to lawful requests</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">3. How We Share Your Information</h2>
          
          <h3 className="text-2xl font-semibold mb-3">3.1 With Recruiters</h3>
          <p className="text-base-content/80 mb-4">
            When you apply to a job, we share your profile and application materials with the recruiter managing that position. Your information remains private until you choose to apply.
          </p>

          <h3 className="text-2xl font-semibold mb-3">3.2 With Service Providers</h3>
          <p className="text-base-content/80 mb-4">
            We work with trusted third-party service providers who help us operate our platform:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li>Authentication services (Clerk)</li>
            <li>Cloud infrastructure and hosting</li>
            <li>Email delivery services (Resend)</li>
            <li>Payment processing (Stripe)</li>
            <li>Analytics and performance monitoring</li>
          </ul>

          <h3 className="text-2xl font-semibold mb-3 mt-6">3.3 Legal Requirements</h3>
          <p className="text-base-content/80">
            We may disclose information when required by law, such as in response to court orders, subpoenas, or other legal processes.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">3.4 Business Transfers</h3>
          <p className="text-base-content/80">
            In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">4. Your Rights and Choices</h2>
          <p className="text-base-content/80 mb-4">
            You have the following rights regarding your personal information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails at any time</li>
            <li><strong>Objection:</strong> Object to certain processing activities</li>
          </ul>
          <p className="text-base-content/80 mt-4">
            To exercise these rights, contact us at <a href="mailto:privacy@applicant.network" className="link link-primary">privacy@applicant.network</a> or through your account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">5. Data Security</h2>
          <p className="text-base-content/80 mb-4">
            We implement industry-standard security measures to protect your information:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure data centers and infrastructure</li>
            <li>Employee training on data protection</li>
          </ul>
          <p className="text-base-content/80 mt-4">
            While we strive to protect your information, no method of transmission over the internet is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">6. Data Retention</h2>
          <p className="text-base-content/80">
            We retain your information for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will delete or anonymize your personal data within 30 days, except where we must retain information for legal or business purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">7. International Data Transfers</h2>
          <p className="text-base-content/80">
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">8. Children's Privacy</h2>
          <p className="text-base-content/80">
            Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">9. California Privacy Rights (CCPA)</h2>
          <p className="text-base-content/80 mb-4">
            California residents have additional rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li>Right to know what personal information is collected</li>
            <li>Right to know if personal information is sold or shared</li>
            <li>Right to opt-out of the sale of personal information</li>
            <li>Right to deletion of personal information</li>
            <li>Right to non-discrimination for exercising CCPA rights</li>
          </ul>
          <p className="text-base-content/80 mt-4">
            <strong>Note:</strong> We do not sell your personal information to third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">10. European Privacy Rights (GDPR)</h2>
          <p className="text-base-content/80">
            If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR), including the right to lodge a complaint with a supervisory authority if you believe your data has been mishandled.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">11. Changes to This Policy</h2>
          <p className="text-base-content/80">
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last Updated" date. Your continued use of our services after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">12. Contact Us</h2>
          <p className="text-base-content/80 mb-4">
            If you have questions about this Privacy Policy or how we handle your information, please contact us:
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
          <Link href="/terms" className="btn btn-outline">
            <i className="fa-solid fa-file-contract mr-2"></i>
            Terms of Service
          </Link>
          <Link href="/cookies" className="btn btn-outline">
            <i className="fa-solid fa-cookie mr-2"></i>
            Cookie Policy
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
