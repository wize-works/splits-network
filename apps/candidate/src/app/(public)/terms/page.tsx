import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - Applicant Network | User Agreement',
  description: 'Read the Terms of Service for Applicant Network. Understand your rights and responsibilities when using our job search and recruiting platform.',
  robots: 'index, follow',
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
        <p className="text-base-content/60 text-lg mb-8">
          <strong>Last Updated:</strong> December 18, 2025
        </p>

        <div className="alert alert-warning mb-8">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>
            Please read these Terms of Service carefully before using Applicant Network. By accessing or using our services, you agree to be bound by these terms.
          </span>
        </div>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
          <p className="text-base-content/80">
            These Terms of Service ("Terms") govern your access to and use of Applicant Network (the "Platform"), operated by Splits Network, Inc. ("we," "us," or "our"). By creating an account, accessing, or using our Platform, you agree to be bound by these Terms and our <Link href="/privacy" className="link link-primary">Privacy Policy</Link>.
          </p>
          <p className="text-base-content/80 mt-4">
            If you do not agree to these Terms, you may not access or use our Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">2. Eligibility</h2>
          <p className="text-base-content/80 mb-4">
            To use Applicant Network, you must:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li>Be at least 18 years of age</li>
            <li>Have the legal capacity to enter into binding contracts</li>
            <li>Not be prohibited from using our services under applicable law</li>
            <li>Provide accurate and complete registration information</li>
          </ul>
          <p className="text-base-content/80 mt-4">
            By using our Platform, you represent and warrant that you meet these eligibility requirements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">3. Account Registration and Security</h2>
          
          <h3 className="text-2xl font-semibold mb-3">3.1 Account Creation</h3>
          <p className="text-base-content/80 mb-4">
            To access certain features, you must create an account. You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information to keep it accurate</li>
            <li>Keep your password secure and confidential</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>

          <h3 className="text-2xl font-semibold mb-3 mt-6">3.2 Account Responsibility</h3>
          <p className="text-base-content/80">
            You are responsible for all activities that occur under your account. We are not liable for any loss or damage arising from unauthorized use of your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">4. User Conduct</h2>
          <p className="text-base-content/80 mb-4">
            When using our Platform, you agree NOT to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li>Provide false, misleading, or fraudulent information</li>
            <li>Impersonate any person or entity</li>
            <li>Use automated systems (bots, scrapers) to access the Platform</li>
            <li>Interfere with or disrupt the Platform's operation</li>
            <li>Upload viruses, malware, or other harmful code</li>
            <li>Collect or harvest user information without consent</li>
            <li>Use the Platform for illegal or unauthorized purposes</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Post discriminatory, defamatory, or obscene content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">5. For Candidates</h2>
          
          <h3 className="text-2xl font-semibold mb-3">5.1 Profile and Applications</h3>
          <p className="text-base-content/80">
            You grant us permission to share your profile and application materials with recruiters when you apply to jobs. You warrant that all information provided is accurate and that you have the right to share any documents uploaded to the Platform.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">5.2 No Fee for Candidates</h3>
          <p className="text-base-content/80">
            Applicant Network is free for candidates. You will never be charged to create a profile, browse jobs, or apply to positions.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">5.3 Direct Hiring Relationships</h3>
          <p className="text-base-content/80">
            Recruiters on our Platform facilitate connections between candidates and employers. Any employment relationship is between you and the hiring company, not with Applicant Network or the recruiter.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">6. For Recruiters</h2>
          
          <h3 className="text-2xl font-semibold mb-3">6.1 Subscription and Fees</h3>
          <p className="text-base-content/80">
            Recruiters must maintain an active subscription to access the Platform. You agree to pay all applicable fees as outlined in your subscription plan. Fees are non-refundable except as required by law.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">6.2 Placement Fees</h3>
          <p className="text-base-content/80">
            When you successfully place a candidate, you agree to our placement fee structure. Fees are earned upon candidate placement and verified employment start date. You must accurately report all placements and related information.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">6.3 Professional Conduct</h3>
          <p className="text-base-content/80 mb-4">
            As a recruiter, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li>Represent yourself and your services honestly</li>
            <li>Respect candidate privacy and confidentiality</li>
            <li>Comply with all employment and recruiting laws</li>
            <li>Provide accurate job descriptions and company information</li>
            <li>Respond to candidates in a timely and professional manner</li>
          </ul>

          <h3 className="text-2xl font-semibold mb-3 mt-6">6.4 Verification</h3>
          <p className="text-base-content/80">
            We reserve the right to verify your identity, credentials, and business information. Failure to provide requested verification may result in account suspension or termination.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">7. Intellectual Property</h2>
          
          <h3 className="text-2xl font-semibold mb-3">7.1 Our Rights</h3>
          <p className="text-base-content/80">
            The Platform and its content (text, graphics, logos, features) are owned by Splits Network, Inc. and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">7.2 User Content</h3>
          <p className="text-base-content/80">
            You retain ownership of content you submit (resumes, profiles, job postings). By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display that content solely for operating and improving the Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">8. Third-Party Services</h2>
          <p className="text-base-content/80">
            Our Platform may integrate with third-party services (authentication, payments, analytics). We are not responsible for the content, policies, or practices of these third parties. Your use of third-party services is subject to their respective terms and policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">9. Disclaimers and Limitations of Liability</h2>
          
          <h3 className="text-2xl font-semibold mb-3">9.1 Platform "As Is"</h3>
          <p className="text-base-content/80">
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">9.2 No Guarantee of Results</h3>
          <p className="text-base-content/80">
            We do not guarantee that candidates will find employment or that recruiters will successfully place candidates. Success depends on many factors outside our control.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">9.3 Limitation of Liability</h3>
          <p className="text-base-content/80">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPLITS NETWORK, INC. SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">10. Indemnification</h2>
          <p className="text-base-content/80">
            You agree to indemnify, defend, and hold harmless Splits Network, Inc., its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Platform, violation of these Terms, or infringement of any rights of another party.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">11. Termination</h2>
          <p className="text-base-content/80 mb-4">
            We reserve the right to suspend or terminate your account and access to the Platform at any time, with or without notice, for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base-content/80">
            <li>Violation of these Terms</li>
            <li>Fraudulent, abusive, or illegal activity</li>
            <li>Non-payment of fees (for recruiters)</li>
            <li>Any reason at our sole discretion</li>
          </ul>
          <p className="text-base-content/80 mt-4">
            You may terminate your account at any time through your account settings. Upon termination, your right to use the Platform will cease immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">12. Dispute Resolution</h2>
          
          <h3 className="text-2xl font-semibold mb-3">12.1 Informal Resolution</h3>
          <p className="text-base-content/80">
            If you have a dispute, please contact us first at <a href="mailto:legal@applicant.network" className="link link-primary">legal@applicant.network</a>. We'll work with you to resolve the issue informally.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">12.2 Arbitration Agreement</h3>
          <p className="text-base-content/80">
            Any dispute arising from these Terms or your use of the Platform shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, rather than in court. You waive your right to a jury trial and to participate in class actions.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">12.3 Governing Law</h3>
          <p className="text-base-content/80">
            These Terms shall be governed by and construed in accordance with the laws of the State of [Your State], without regard to its conflict of law principles.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">13. Changes to Terms</h2>
          <p className="text-base-content/80">
            We may modify these Terms at any time. If we make material changes, we will notify you by email or through the Platform. Your continued use of the Platform after changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">14. General Provisions</h2>
          
          <h3 className="text-2xl font-semibold mb-3">14.1 Entire Agreement</h3>
          <p className="text-base-content/80">
            These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and Splits Network, Inc. regarding your use of the Platform.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">14.2 Severability</h3>
          <p className="text-base-content/80">
            If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">14.3 Waiver</h3>
          <p className="text-base-content/80">
            Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.
          </p>

          <h3 className="text-2xl font-semibold mb-3 mt-6">14.4 Assignment</h3>
          <p className="text-base-content/80">
            You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-3xl font-bold mb-4">15. Contact Information</h2>
          <p className="text-base-content/80 mb-4">
            If you have questions about these Terms, please contact us:
          </p>
          <div className="card bg-base-200">
            <div className="card-body">
              <p className="mb-2"><strong>Email:</strong> <a href="mailto:legal@applicant.network" className="link link-primary">legal@applicant.network</a></p>
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
