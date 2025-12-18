import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How It Works - Applicant Network | Simple 3-Step Job Search Process',
  description: 'Discover how Applicant Network works. Create your profile, get matched with expert recruiters, and land your dream job in 3 simple steps. Start your career journey today.',
  keywords: 'how it works, job search process, recruiter matching, career opportunities, application tracking',
  openGraph: {
    title: 'How Applicant Network Works',
    description: 'Land your dream job in 3 simple steps with expert recruiters by your side.',
    type: 'website',
  },
};

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="badge badge-primary badge-lg mb-4">
          <i className="fa-solid fa-route mr-2"></i>
          Your Path to Success
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          How <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">It Works</span>
        </h1>
        <p className="text-xl md:text-2xl text-base-content/80 max-w-3xl mx-auto">
          Finding your dream job is easier than you think. Follow our simple 3-step process to connect with expert recruiters and land the perfect opportunity.
        </p>
      </section>

      {/* Process Steps */}
      <section className="mb-16">
        <div className="space-y-16">
          {/* Step 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                  1
                </div>
                <h2 className="text-4xl font-bold">Create Your Profile</h2>
              </div>
              <p className="text-lg text-base-content/80 mb-6">
                Sign up for free and build your professional profile. Upload your resume, add your skills, experience, and career preferences. Tell us what you're looking for in your next role.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">Quick 5-minute profile setup</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">Import your resume automatically</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">Set your job preferences and requirements</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">100% private until you apply</span>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="text-center py-8">
                    <i className="fa-solid fa-user-circle text-9xl text-primary opacity-20"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="text-center py-8">
                    <i className="fa-solid fa-magnifying-glass-plus text-9xl text-secondary opacity-20"></i>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-white text-2xl font-bold">
                  2
                </div>
                <h2 className="text-4xl font-bold">Browse & Apply</h2>
              </div>
              <p className="text-lg text-base-content/80 mb-6">
                Explore thousands of opportunities from top companies. When you find a role you love, apply with one click. Our expert recruiters specialize in those specific roles and industries.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">Advanced search filters by industry, location, and more</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">See recruiter profiles and specializations</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">One-click applications with your profile</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">Matched with specialized recruiters automatically</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold">
                  3
                </div>
                <h2 className="text-4xl font-bold">Get Hired</h2>
              </div>
              <p className="text-lg text-base-content/80 mb-6">
                Your dedicated recruiter will guide you through the entire hiring process. They'll advocate for you, provide interview prep, negotiate on your behalf, and celebrate when you land the job.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">Real-time application tracking and updates</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">Expert interview preparation and coaching</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">Salary negotiation support</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <span className="text-base-content/80">Direct communication with your recruiter</span>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2">
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="text-center py-8">
                    <i className="fa-solid fa-trophy text-9xl text-accent opacity-20"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="mb-16 bg-base-200 -mx-4 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">What Makes Us Different</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-shield-halved text-3xl text-primary"></i>
                </div>
                <h3 className="card-title justify-center text-lg">100% Free</h3>
                <p className="text-sm text-base-content/70">
                  No hidden fees. Ever. Candidates never pay to use our platform.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-user-tie text-3xl text-secondary"></i>
                </div>
                <h3 className="card-title justify-center text-lg">Expert Recruiters</h3>
                <p className="text-sm text-base-content/70">
                  Work with specialized recruiters who know your industry inside out.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-chart-line text-3xl text-accent"></i>
                </div>
                <h3 className="card-title justify-center text-lg">Track Progress</h3>
                <p className="text-sm text-base-content/70">
                  See exactly where you are in the hiring process at all times.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-comments text-3xl text-success"></i>
                </div>
                <h3 className="card-title justify-center text-lg">Direct Communication</h3>
                <p className="text-sm text-base-content/70">
                  Message your recruiter directly through our platform anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="collapse collapse-plus bg-base-200">
            <input type="radio" name="faq-accordion" defaultChecked />
            <div className="collapse-title text-xl font-medium">
              Is Applicant Network really free for candidates?
            </div>
            <div className="collapse-content">
              <p className="text-base-content/80">
                Yes! Applicant Network is 100% free for all job seekers. You'll never pay a fee to create a profile, browse jobs, apply, or work with recruiters. Recruiters pay a fee only when they successfully place a candidate.
              </p>
            </div>
          </div>
          <div className="collapse collapse-plus bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div className="collapse-title text-xl font-medium">
              How do recruiters get paid?
            </div>
            <div className="collapse-content">
              <p className="text-base-content/80">
                Recruiters earn a placement fee from the hiring company when you're successfully hired. This means they're motivated to find you the best possible match and support you throughout the process.
              </p>
            </div>
          </div>
          <div className="collapse collapse-plus bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div className="collapse-title text-xl font-medium">
              Can I apply to multiple jobs at once?
            </div>
            <div className="collapse-content">
              <p className="text-base-content/80">
                Absolutely! Apply to as many positions as you'd like. Each application is reviewed by a specialized recruiter who will reach out if you're a good fit for the role.
              </p>
            </div>
          </div>
          <div className="collapse collapse-plus bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div className="collapse-title text-xl font-medium">
              What if I don't hear back from a recruiter?
            </div>
            <div className="collapse-content">
              <p className="text-base-content/80">
                You'll receive status updates on your applications through your dashboard. If a recruiter doesn't reach out within a few days, it usually means the role isn't the right match, but you can always apply to other opportunities.
              </p>
            </div>
          </div>
          <div className="collapse collapse-plus bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div className="collapse-title text-xl font-medium">
              Is my information private and secure?
            </div>
            <div className="collapse-content">
              <p className="text-base-content/80">
                Your privacy is our top priority. Your profile is private until you apply to a job. We use industry-standard encryption and never share your information without your explicit permission.
              </p>
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href="/help" className="btn btn-outline">
            <i className="fa-solid fa-circle-question mr-2"></i>
            Visit Help Center
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-base-content/80 mb-8 max-w-2xl mx-auto">
          Join thousands of candidates who are finding their dream jobs with Applicant Network today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up" className="btn btn-primary btn-lg">
            <i className="fa-solid fa-user-plus mr-2"></i>
            Create Free Account
          </Link>
          <Link href="/jobs" className="btn btn-outline btn-lg">
            <i className="fa-solid fa-magnifying-glass mr-2"></i>
            Browse Jobs
          </Link>
        </div>
      </section>
    </div>
  );
}
