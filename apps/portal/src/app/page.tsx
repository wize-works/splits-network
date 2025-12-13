import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
    const { userId } = await auth();

    // Redirect authenticated users to dashboard
    if (userId) {
        redirect('/dashboard');
    }

    return (
        <>
            {/* Hero Section */}
            <section className="hero min-h-[80vh] bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10">
                <div className="hero-content text-center max-w-5xl">
                    <div>
                        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Split-Fee Recruiting,
                            <br />
                            Reimagined
                        </h1>
                        <p className="text-xl mb-8 text-base-content/80 max-w-3xl mx-auto">
                            Connect with a nationwide network of specialized recruiters. Share placements, split fees, and grow your business without the overhead.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/sign-up" className="btn btn-primary btn-lg">
                                <i className="fa-solid fa-rocket"></i>
                                Start Free Trial
                            </Link>
                            <Link href="#how-it-works" className="btn btn-outline btn-lg">
                                <i className="fa-solid fa-circle-play"></i>
                                See How It Works
                            </Link>
                        </div>
                        <div className="mt-8 flex gap-8 justify-center text-sm text-base-content/60">
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-check-circle text-success"></i>
                                No setup fees
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-check-circle text-success"></i>
                                Cancel anytime
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-check-circle text-success"></i>
                                First placement free
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-primary">
                <div className="container mx-auto px-4">
                    <div className="stats stats-vertical bg-base-100 lg:stats-horizontal shadow w-full">
                        <div className="stat place-items-center">
                            <div className="stat-title">Active Recruiters</div>
                            <div className="stat-value text-primary">1,200+</div>
                            <div className="stat-desc">Across all industries</div>
                        </div>
                        <div className="stat place-items-center">
                            <div className="stat-title">Successful Placements</div>
                            <div className="stat-value text-secondary">8,400+</div>
                            <div className="stat-desc">And counting</div>
                        </div>
                        <div className="stat place-items-center">
                            <div className="stat-title">Average Fee Split</div>
                            <div className="stat-value">50/50</div>
                            <div className="stat-desc">Fair and transparent</div>
                        </div>
                        <div className="stat place-items-center">
                            <div className="stat-title">Time to Match</div>
                            <div className="stat-value text-accent">24hrs</div>
                            <div className="stat-desc">Average response time</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-lg text-base-content/70">
                            Three simple steps to grow your recruiting business
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                                    <i className="fa-solid fa-briefcase text-3xl text-primary"></i>
                                </div>
                                <h3 className="card-title text-2xl">1. Post Your Role</h3>
                                <p className="text-base-content/70">
                                    Companies post open positions with fee structures. Specify requirements, location, and split terms.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                                    <i className="fa-solid fa-handshake text-3xl text-secondary"></i>
                                </div>
                                <h3 className="card-title text-2xl">2. Match & Collaborate</h3>
                                <p className="text-base-content/70">
                                    Recruiters join roles that match their expertise. Work together to find the perfect candidate.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                                    <i className="fa-solid fa-trophy text-3xl text-accent"></i>
                                </div>
                                <h3 className="card-title text-2xl">3. Place & Get Paid</h3>
                                <p className="text-base-content/70">
                                    Candidate gets hired, fees are split automatically. Track everything in your dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
                        <p className="text-lg text-base-content/70">
                            Built for recruiters, by recruiters
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body">
                                <h3 className="card-title">
                                    <i className="fa-solid fa-users text-primary"></i>
                                    Network of Specialists
                                </h3>
                                <p className="text-base-content/70">
                                    Access recruiters with deep expertise in every industry and role type.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body">
                                <h3 className="card-title">
                                    <i className="fa-solid fa-chart-line text-secondary"></i>
                                    Real-Time Tracking
                                </h3>
                                <p className="text-base-content/70">
                                    Monitor candidate progress through every stage of the hiring pipeline.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body">
                                <h3 className="card-title">
                                    <i className="fa-solid fa-shield-halved text-accent"></i>
                                    Secure & Compliant
                                </h3>
                                <p className="text-base-content/70">
                                    Enterprise-grade security with full GDPR and data protection compliance.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body">
                                <h3 className="card-title">
                                    <i className="fa-solid fa-credit-card text-primary"></i>
                                    Automated Billing
                                </h3>
                                <p className="text-base-content/70">
                                    Seamless invoicing and payment processing through Stripe integration.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body">
                                <h3 className="card-title">
                                    <i className="fa-solid fa-bell text-secondary"></i>
                                    Smart Notifications
                                </h3>
                                <p className="text-base-content/70">
                                    Stay updated with email alerts for applications, stages, and placements.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body">
                                <h3 className="card-title">
                                    <i className="fa-solid fa-mobile-screen text-accent"></i>
                                    Mobile Ready
                                </h3>
                                <p className="text-base-content/70">
                                    Manage your placements on the go with our responsive design.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Trusted by Recruiters</h2>
                        <p className="text-lg text-base-content/70">
                            See what our community has to say
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rating">
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                    </div>
                                </div>
                                <p className="mb-4">
                                    "Splits Network helped me triple my placement rate. The collaboration tools make working with other recruiters seamless."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="avatar placeholder">
                                        <div className="bg-primary text-primary-content rounded-full w-12">
                                            <span>SJ</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold">Sarah Johnson</div>
                                        <div className="text-sm text-base-content/60">Tech Recruiter</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rating">
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                    </div>
                                </div>
                                <p className="mb-4">
                                    "As a company, this platform gave us access to specialized recruiters we couldn't afford to hire full-time. Game changer."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="avatar placeholder">
                                        <div className="bg-secondary text-secondary-content rounded-full w-12">
                                            <span>MC</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold">Michael Chen</div>
                                        <div className="text-sm text-base-content/60">Head of Talent</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rating">
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                        <i className="fa-solid fa-star text-warning"></i>
                                    </div>
                                </div>
                                <p className="mb-4">
                                    "The transparency and fair fee splits make this the only platform I use for split placements now. Highly recommended!"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="avatar placeholder">
                                        <div className="bg-accent text-accent-content rounded-full w-12">
                                            <span>ER</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold">Emily Rodriguez</div>
                                        <div className="text-sm text-base-content/60">Healthcare Recruiter</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="pricing" className="py-20 bg-gradient-to-br from-primary to-secondary text-primary-content">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Grow Your Recruiting Business?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Join thousands of recruiters who are already collaborating and closing more placements with Splits Network.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/sign-up" className="btn btn-lg bg-base-100 text-primary hover:bg-base-200 border-0">
                            <i className="fa-solid fa-rocket"></i>
                            Start Your Free Trial
                        </Link>
                        <Link href="/sign-in" className="btn btn-lg btn-outline border-2 border-base-100 text-base-100 hover:bg-base-100 hover:text-primary">
                            Sign In
                        </Link>
                    </div>
                    <p className="mt-6 text-sm opacity-75">
                        No credit card required • 14-day free trial • Cancel anytime
                    </p>
                </div>
            </section>
        </>
    );
}
