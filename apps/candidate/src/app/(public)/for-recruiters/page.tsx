import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Recruiters - Applicant Network | Build Your Recruiting Practice',
  description: 'Join Applicant Network as a recruiter and build a thriving practice. Access top talent, manage placements, and earn competitive fees. Sign up to become a verified recruiter today.',
  keywords: 'recruiter platform, recruiting opportunities, placement fees, talent acquisition, recruiting network',
  openGraph: {
    title: 'For Recruiters - Applicant Network',
    description: 'Build your recruiting practice with access to top talent and powerful tools.',
    type: 'website',
  },
};

export default function ForRecruitersPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="badge badge-primary badge-lg mb-4">
          <i className="fa-solid fa-user-tie mr-2"></i>
          For Recruiting Professionals
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Recruiting Practice</span>
        </h1>
        <p className="text-xl md:text-2xl text-base-content/80 max-w-3xl mx-auto">
          Splits Network is the premier platform where recruiters connect with top talent and build successful practices. Access thousands of pre-qualified candidates and manage your placements with powerful tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <a href="https://splits.network" className="btn btn-primary btn-lg" target="_blank" rel="noopener noreferrer">
            <i className="fa-solid fa-rocket mr-2"></i>
            Visit Splits Network
          </a>
          <Link href="#how-it-works" className="btn btn-outline btn-lg">
            <i className="fa-solid fa-circle-info mr-2"></i>
            Learn More
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mb-16" id="benefits">
        <h2 className="text-4xl font-bold text-center mb-12">Why Join Splits Network?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-users text-3xl text-primary"></i>
              </div>
              <h3 className="card-title">Access Top Talent</h3>
              <p className="text-base-content/80">
                Connect with thousands of pre-qualified candidates actively seeking opportunities in your specialized industries.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-sack-dollar text-3xl text-secondary"></i>
              </div>
              <h3 className="card-title">Competitive Fees</h3>
              <p className="text-base-content/80">
                Earn industry-standard placement fees with transparent terms. Get paid quickly when your candidates are hired.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-chart-line text-3xl text-accent"></i>
              </div>
              <h3 className="card-title">Powerful Tools</h3>
              <p className="text-base-content/80">
                Manage your pipeline, track placements, and communicate with candidates—all in one intuitive platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works for Recruiters */}
      <section className="mb-16 bg-base-200 -mx-4 px-4 py-12" id="how-it-works">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                    1
                  </div>
                  <h3 className="text-2xl font-bold">Create Your Profile</h3>
                </div>
                <p className="text-lg text-base-content/80">
                  Sign up and showcase your expertise. Specify your industries, roles, and geographic focus. Complete verification to build trust with candidates.
                </p>
              </div>
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-success"></i>
                      <span className="text-sm">Quick profile setup</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-success"></i>
                      <span className="text-sm">Highlight specializations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-success"></i>
                      <span className="text-sm">Complete verification process</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-success"></i>
                      <span className="text-sm">Set your availability</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1">
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <i className="fa-solid fa-check text-success"></i>
                        <span className="text-sm">Post unlimited job openings</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <i className="fa-solid fa-check text-success"></i>
                        <span className="text-sm">Receive qualified applications</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <i className="fa-solid fa-check text-success"></i>
                        <span className="text-sm">Search candidate database</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <i className="fa-solid fa-check text-success"></i>
                        <span className="text-sm">AI-powered candidate matching</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white text-xl font-bold">
                    2
                  </div>
                  <h3 className="text-2xl font-bold">Post Jobs & Find Candidates</h3>
                </div>
                <p className="text-lg text-base-content/80">
                  Create job postings for your client companies. Browse our talent pool and get matched with candidates based on your specialization.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold">
                    3
                  </div>
                  <h3 className="text-2xl font-bold">Make Placements & Get Paid</h3>
                </div>
                <p className="text-lg text-base-content/80">
                  Guide candidates through the hiring process. When they're hired, submit your placement and receive payment within days.
                </p>
              </div>
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-success"></i>
                      <span className="text-sm">Track all placements in one dashboard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-success"></i>
                      <span className="text-sm">Automated fee calculations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-success"></i>
                      <span className="text-sm">Fast payment processing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <i className="fa-solid fa-check text-success"></i>
                      <span className="text-sm">Build your success metrics</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-12">Platform Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-briefcase text-2xl text-primary"></i>
                <h3 className="card-title text-lg">Job Management</h3>
              </div>
              <p className="text-sm text-base-content/70">
                Create, edit, and manage unlimited job postings with rich descriptions and requirements.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-user-check text-2xl text-secondary"></i>
                <h3 className="card-title text-lg">Candidate Tracking</h3>
              </div>
              <p className="text-sm text-base-content/70">
                Track all candidate interactions, applications, and placement progress in real-time.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-comments text-2xl text-accent"></i>
                <h3 className="card-title text-lg">Direct Messaging</h3>
              </div>
              <p className="text-sm text-base-content/70">
                Communicate directly with candidates through our secure messaging platform.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-file-invoice-dollar text-2xl text-success"></i>
                <h3 className="card-title text-lg">Payment Tracking</h3>
              </div>
              <p className="text-sm text-base-content/70">
                Automated invoicing and payment tracking with transparent fee structures.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-chart-simple text-2xl text-info"></i>
                <h3 className="card-title text-lg">Analytics & Reports</h3>
              </div>
              <p className="text-sm text-base-content/70">
                Track your performance with detailed analytics on placements, earnings, and more.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-mobile-screen text-2xl text-warning"></i>
                <h3 className="card-title text-lg">Mobile Access</h3>
              </div>
              <p className="text-sm text-base-content/70">
                Manage your recruiting business on the go with our mobile-optimized platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="mb-16 bg-base-200 -mx-4 px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p className="text-xl text-base-content/80 mb-8">
            No upfront costs or monthly fees. You only pay when you successfully place a candidate.
          </p>
          <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
            <div className="card-body">
              <h3 className="text-3xl font-bold mb-4">Performance-Based Model</h3>
              <div className="divider"></div>
              <ul className="space-y-4 text-left">
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <div>
                    <strong>Free to Join</strong>
                    <p className="text-sm text-base-content/70">No signup fees or monthly subscriptions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <div>
                    <strong>Competitive Placement Fees</strong>
                    <p className="text-sm text-base-content/70">Earn industry-standard percentages on successful placements</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <div>
                    <strong>Fast Payouts</strong>
                    <p className="text-sm text-base-content/70">Receive payment within 5 business days of placement verification</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-check-circle text-success text-xl mt-1"></i>
                  <div>
                    <strong>No Hidden Fees</strong>
                    <p className="text-sm text-base-content/70">What you see is what you get—100% transparent</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (placeholder) */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-12">What Splits Network Recruiters Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fa-solid fa-star text-warning"></i>
                ))}
              </div>
              <p className="text-base-content/80 italic mb-4">
                "Splits Network has transformed my recruiting practice. The platform is intuitive, and I'm connecting with top candidates every day."
              </p>
              <div className="flex items-center gap-3">
                <div className="avatar avatar-placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-12">
                    <span>JD</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold">Jessica Davis</div>
                  <div className="text-sm text-base-content/60">Tech Recruiter</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fa-solid fa-star text-warning"></i>
                ))}
              </div>
              <p className="text-base-content/80 italic mb-4">
                "Best recruiting platform I've used. The tools are powerful, payments are fast, and candidates are high-quality."
              </p>
              <div className="flex items-center gap-3">
                <div className="avatar avatar-placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-12">
                    <span>MR</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold">Michael Rodriguez</div>
                  <div className="text-sm text-base-content/60">Healthcare Recruiter</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fa-solid fa-star text-warning"></i>
                ))}
              </div>
              <p className="text-base-content/80 italic mb-4">
                "I've tripled my placements since joining Splits Network. The candidate quality and platform features are unmatched."
              </p>
              <div className="flex items-center gap-3">
                <div className="avatar avatar-placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-12">
                    <span>SP</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold">Sarah Park</div>
                  <div className="text-sm text-base-content/60">Finance Recruiter</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Your Practice?</h2>
        <p className="text-xl text-base-content/80 mb-8 max-w-2xl mx-auto">
          Join hundreds of successful recruiters who are building thriving practices on Splits Network.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="https://splits.network" className="btn btn-primary btn-lg" target="_blank" rel="noopener noreferrer">
            <i className="fa-solid fa-rocket mr-2"></i>
            Join Splits Network
          </a>
          <Link href="/contact" className="btn btn-outline btn-lg">
            <i className="fa-solid fa-envelope mr-2"></i>
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
}
