import Link from 'next/link';

export default function UpdatesPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="hero bg-gradient-to-r from-primary to-secondary text-primary-content py-20">
                <div className="hero-content text-center max-w-5xl">
                    <div>
                        <h1 className="text-5xl font-bold mb-6">
                            Platform Updates & Roadmap
                        </h1>
                        <p className="text-xl opacity-90 max-w-3xl mx-auto">
                            Stay informed about new features, improvements, and what's coming next for Splits Network
                        </p>
                    </div>
                </div>
            </section>

            {/* Current Phase Banner */}
            <section className="py-12 bg-info text-info-content">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="badge badge-lg badge-success mb-4">NOW LIVE</div>
                        <h2 className="text-3xl font-bold mb-3">Phase 1: Core Platform</h2>
                        <p className="text-lg opacity-90">
                            The foundation is here! Essential ATS, split tracking, and recruiter network features are now available.
                        </p>
                    </div>
                </div>
            </section>

            {/* Recent Updates Timeline */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Recent Updates</h2>
                        <p className="text-lg text-base-content/70">
                            What we've shipped recently
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto">
                        <div className="space-y-8">
                            {/* Update Item - December 2025 */}
                            <div className="card bg-base-200 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="badge badge-primary badge-lg">DEC 2025</div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">
                                                <i className="fa-solid fa-rocket text-primary"></i> Platform Launch
                                            </h3>
                                            <p className="text-base-content/70 mb-4">
                                                Splits Network Phase 1 is officially live! Core features include:
                                            </p>
                                            <ul className="grid md:grid-cols-2 gap-2 mb-4">
                                                <li className="flex items-center gap-2">
                                                    <i className="fa-solid fa-check text-success"></i>
                                                    <span className="text-sm">Full ATS with roles, candidates, stages</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <i className="fa-solid fa-check text-success"></i>
                                                    <span className="text-sm">Split placement tracking</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <i className="fa-solid fa-check text-success"></i>
                                                    <span className="text-sm">Recruiter network management</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <i className="fa-solid fa-check text-success"></i>
                                                    <span className="text-sm">Three-tier subscription model</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <i className="fa-solid fa-check text-success"></i>
                                                    <span className="text-sm">Email notifications</span>
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <i className="fa-solid fa-check text-success"></i>
                                                    <span className="text-sm">Admin console</span>
                                                </li>
                                            </ul>
                                            <Link href="/sign-up" className="btn btn-primary btn-sm">
                                                Get Started Today
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Update Item - Beta */}
                            <div className="card bg-base-200 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="badge badge-secondary badge-lg">NOV 2025</div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">
                                                <i className="fa-solid fa-flask text-secondary"></i> Beta Testing Phase
                                            </h3>
                                            <p className="text-base-content/70 mb-4">
                                                Selected recruiters and companies helped us refine the platform:
                                            </p>
                                            <ul className="space-y-2 text-sm">
                                                <li className="flex items-start gap-2">
                                                    <i className="fa-solid fa-arrow-right text-secondary mt-1"></i>
                                                    <span>10+ beta recruiters submitted 50+ candidates</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <i className="fa-solid fa-arrow-right text-secondary mt-1"></i>
                                                    <span>5 companies posted real roles</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <i className="fa-solid fa-arrow-right text-secondary mt-1"></i>
                                                    <span>Feedback incorporated into UX improvements</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Update Item - Alpha */}
                            <div className="card bg-base-200 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="badge badge-accent badge-lg">OCT 2025</div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">
                                                <i className="fa-solid fa-hammer text-accent"></i> Alpha Development
                                            </h3>
                                            <p className="text-base-content/70">
                                                Core architecture built and internal testing completed. Microservices deployed, 
                                                authentication configured, and foundational features validated.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roadmap Section */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">What's Coming Next</h2>
                        <p className="text-lg text-base-content/70">
                            Our product roadmap for the next 6-12 months
                        </p>
                    </div>

                    <div className="max-w-6xl mx-auto">
                        {/* Phase 2 */}
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="badge badge-lg badge-warning">Q1 2026</div>
                                <h3 className="text-3xl font-bold">Phase 2: Enhanced Functionality</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h4 className="card-title">
                                            <i className="fa-solid fa-money-bill-transfer text-success"></i>
                                            Payment Processing
                                        </h4>
                                        <p className="text-base-content/70 text-sm">
                                            Integrated payment flows with Stripe Connect. Companies pay platform, 
                                            automatic splits distributed to recruiters.
                                        </p>
                                    </div>
                                </div>
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h4 className="card-title">
                                            <i className="fa-solid fa-plug text-info"></i>
                                            Integrations Marketplace
                                        </h4>
                                        <p className="text-base-content/70 text-sm">
                                            Connect with Gmail, Outlook, Calendly, LinkedIn, and other essential tools. 
                                            Zapier integration for custom workflows.
                                        </p>
                                    </div>
                                </div>
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h4 className="card-title">
                                            <i className="fa-solid fa-chart-line text-primary"></i>
                                            Advanced Analytics
                                        </h4>
                                        <p className="text-base-content/70 text-sm">
                                            Detailed performance metrics, ROI tracking, conversion rates, and 
                                            custom reporting dashboards for both recruiters and companies.
                                        </p>
                                    </div>
                                </div>
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h4 className="card-title">
                                            <i className="fa-solid fa-mobile-screen text-secondary"></i>
                                            Mobile Apps
                                        </h4>
                                        <p className="text-base-content/70 text-sm">
                                            Native iOS and Android apps for recruiters to manage candidates 
                                            and track placements on the go.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Phase 3 */}
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="badge badge-lg badge-info">Q2-Q3 2026</div>
                                <h3 className="text-3xl font-bold">Phase 3: Scale & Automation</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h4 className="card-title">
                                            <i className="fa-solid fa-brain text-accent"></i>
                                            AI-Powered Matching
                                        </h4>
                                        <p className="text-base-content/70 text-sm">
                                            Smart candidate-to-role matching using machine learning. 
                                            Automatic recruiter recommendations based on specialties.
                                        </p>
                                    </div>
                                </div>
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h4 className="card-title">
                                            <i className="fa-solid fa-users-gear text-primary"></i>
                                            Multi-Recruiter Splits
                                        </h4>
                                        <p className="text-base-content/70 text-sm">
                                            Support for multiple recruiters collaborating on a single placement 
                                            with configurable split percentages.
                                        </p>
                                    </div>
                                </div>
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h4 className="card-title">
                                            <i className="fa-solid fa-code text-secondary"></i>
                                            Public API
                                        </h4>
                                        <p className="text-base-content/70 text-sm">
                                            Full REST API with webhooks, OAuth 2.0, and comprehensive documentation 
                                            for custom integrations.
                                        </p>
                                    </div>
                                </div>
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h4 className="card-title">
                                            <i className="fa-solid fa-tags text-success"></i>
                                            White-Label Options
                                        </h4>
                                        <p className="text-base-content/70 text-sm">
                                            Recruiting firms can customize branding, domain, and certain features 
                                            for their own recruiter networks.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Future Vision */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="badge badge-lg">2027+</div>
                                <h3 className="text-3xl font-bold">Future Vision</h3>
                            </div>
                            <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl">
                                <div className="card-body">
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-2">
                                            <i className="fa-solid fa-globe mt-1"></i>
                                            <span>International expansion with multi-currency support</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <i className="fa-solid fa-building-columns mt-1"></i>
                                            <span>Enterprise features for large recruiting firms and staffing agencies</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <i className="fa-solid fa-graduation-cap mt-1"></i>
                                            <span>Training and certification programs for recruiters</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <i className="fa-solid fa-trophy mt-1"></i>
                                            <span>Gamification and leaderboards to foster healthy competition</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <i className="fa-solid fa-handshake mt-1"></i>
                                            <span>Marketplace for specialized recruiting services and consulting</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Voting Section */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="card bg-primary text-primary-content shadow-2xl">
                            <div className="card-body text-center p-12">
                                <i className="fa-solid fa-lightbulb text-6xl mb-6 opacity-80"></i>
                                <h2 className="text-3xl font-bold mb-4">Help Shape Our Roadmap</h2>
                                <p className="text-lg opacity-90 mb-8">
                                    Your feedback drives our development priorities. Share what features matter 
                                    most to you, and vote on what we should build next.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a href="mailto:feedback@splits.network" className="btn btn-lg btn-neutral">
                                        <i className="fa-solid fa-comment"></i>
                                        Submit Feedback
                                    </a>
                                    <a href="mailto:support@splits.network" className="btn btn-lg btn-outline btn-neutral">
                                        <i className="fa-solid fa-heart"></i>
                                        Request a Feature
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Newsletter Signup */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
                        <p className="text-lg text-base-content/70 mb-8">
                            Get notified when we ship new features and updates
                        </p>
                        <div className="join w-full max-w-md mx-auto">
                            <input 
                                type="email" 
                                placeholder="your@email.com" 
                                className="input input-bordered join-item flex-grow" 
                            />
                            <button className="btn btn-primary join-item">
                                <i className="fa-solid fa-envelope"></i>
                                Subscribe
                            </button>
                        </div>
                        <p className="text-sm text-base-content/60 mt-4">
                            Monthly updates. No spam. Unsubscribe anytime.
                        </p>
                    </div>
                </div>
            </section>

            {/* Changelog Link */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid md:grid-cols-3 gap-6">
                            <Link href="/status" className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body text-center">
                                    <i className="fa-solid fa-heartbeat text-4xl text-success mb-3"></i>
                                    <h3 className="card-title justify-center">System Status</h3>
                                    <p className="text-sm text-base-content/70">
                                        Check platform health and uptime
                                    </p>
                                </div>
                            </Link>
                            <a href="https://docs.splits.network" className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body text-center">
                                    <i className="fa-solid fa-book text-4xl text-info mb-3"></i>
                                    <h3 className="card-title justify-center">Documentation</h3>
                                    <p className="text-sm text-base-content/70">
                                        Read detailed guides and API docs
                                    </p>
                                </div>
                            </a>
                            <a href="https://github.com/splits-network/splits" target="_blank" rel="noopener noreferrer" className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body text-center">
                                    <i className="fa-brands fa-github text-4xl mb-3"></i>
                                    <h3 className="card-title justify-center">Open Source</h3>
                                    <p className="text-sm text-base-content/70">
                                        View our public repositories
                                    </p>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-content">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Join Us on This Journey</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Be part of the platform that's redefining split-fee recruiting. Early users help shape the future.
                    </p>
                    <Link href="/sign-up" className="btn btn-lg btn-neutral">
                        <i className="fa-solid fa-rocket"></i>
                        Get Started Today
                    </Link>
                </div>
            </section>
        </>
    );
}
