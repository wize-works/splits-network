import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us - Applicant Network | Connecting Talent with Opportunity',
  description: 'Learn about Applicant Network\'s mission to connect talented candidates with amazing career opportunities through expert recruiters. Discover our story, values, and commitment to your success.',
  keywords: 'about applicant network, recruiting platform, career opportunities, job search, talent acquisition',
  openGraph: {
    title: 'About Applicant Network',
    description: 'Connecting talented candidates with amazing opportunities through expert recruiters.',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Applicant Network</span>
        </h1>
        <p className="text-xl md:text-2xl text-base-content/80 max-w-3xl mx-auto">
          We're revolutionizing the job search experience by connecting talented candidates with expert recruiters who truly understand their industry.
        </p>
      </section>

      {/* Mission Section */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg mb-4 text-base-content/80">
              At Applicant Network, we believe that finding the right job shouldn't feel like searching for a needle in a haystack. Our mission is to transform the recruiting experience by creating meaningful connections between talented professionals and specialized recruiters.
            </p>
            <p className="text-lg text-base-content/80">
              We empower candidates with transparency, choice, and support throughout their career journey, while helping recruiters showcase their expertise and build lasting relationships.
            </p>
          </div>
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <i className="fa-solid fa-bullseye text-3xl text-primary"></i>
                </div>
                <h3 className="text-2xl font-bold">Our Vision</h3>
              </div>
              <p className="text-base-content/80">
                To become the world's most trusted platform where every candidate finds their perfect career match and every recruiter builds a thriving practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-12">Our Core Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-handshake text-4xl text-primary"></i>
              </div>
              <h3 className="card-title">Transparency</h3>
              <p className="text-base-content/80">
                We believe in open communication and clear processes. No hidden fees, no surprises—just honest partnerships.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-users text-4xl text-secondary"></i>
              </div>
              <h3 className="card-title">Candidate-First</h3>
              <p className="text-base-content/80">
                Your success is our success. We put candidates at the center of everything we do, ensuring your best interests are always protected.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <i className="fa-solid fa-lightbulb text-4xl text-accent"></i>
              </div>
              <h3 className="card-title">Innovation</h3>
              <p className="text-base-content/80">
                We continuously improve our platform with cutting-edge technology to make your job search smarter and more efficient.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section className="mb-16 bg-base-200 -mx-4 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How We're Different</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <i className="fa-solid fa-check text-xl text-success"></i>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Expert Recruiter Network</h3>
                <p className="text-base-content/80">
                  Every recruiter on our platform is vetted and specialized in specific industries, ensuring you get expert guidance.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <i className="fa-solid fa-check text-xl text-success"></i>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Full Transparency</h3>
                <p className="text-base-content/80">
                  See recruiter profiles, specializations, and success rates. Know exactly who's representing you.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <i className="fa-solid fa-check text-xl text-success"></i>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Application Tracking</h3>
                <p className="text-base-content/80">
                  Track every application in real-time with detailed status updates and recruiter communication.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <i className="fa-solid fa-check text-xl text-success"></i>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Always Free for Candidates</h3>
                <p className="text-base-content/80">
                  Job seekers never pay a fee. Our platform is 100% free for candidates, always.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section (placeholder) */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-12">Meet Our Team</h2>
        <p className="text-center text-lg text-base-content/80 max-w-2xl mx-auto mb-8">
          We're a passionate team of recruiting experts, technologists, and career advisors dedicated to transforming the job search experience.
        </p>
        {/* This can be expanded with actual team members */}
        <div className="text-center">
          <Link href="/contact" className="btn btn-primary btn-lg">
            <i className="fa-solid fa-envelope mr-2"></i>
            Get in Touch
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
        <p className="text-xl text-base-content/80 mb-8 max-w-2xl mx-auto">
          Join thousands of candidates who have found their dream jobs through Applicant Network.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/jobs" className="btn btn-primary btn-lg">
            <i className="fa-solid fa-magnifying-glass mr-2"></i>
            Browse Jobs
          </Link>
          <Link href="/sign-up" className="btn btn-outline btn-lg">
            <i className="fa-solid fa-user-plus mr-2"></i>
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
}
