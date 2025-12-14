import Link from 'next/link';

export default function FeaturesPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="hero bg-primary text-primary-content py-20">
                <div className="hero-content text-center max-w-5xl">
                    <div>
                        <h1 className="text-5xl font-bold mb-6">
                            Everything You Need for Split Placements
                        </h1>
                        <p className="text-xl opacity-90 max-w-3xl mx-auto">
                            Built from the ground up for collaborative recruiting. No retrofitting, no workarounds—just pure split placement functionality.
                        </p>
                    </div>
                </div>
            </section>

            {/* Core Features Section */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Core Platform Features</h2>
                        <p className="text-lg text-base-content/70">
                            A complete recruiting ecosystem in one platform
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* ATS Foundation */}
                        <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <i className="fa-solid fa-sitemap text-primary text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">ATS Foundation</h3>
                                </div>
                                <p className="text-base-content/70 mb-4">
                                    Full applicant tracking system built for collaborative recruiting.
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Role & job posting management</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Candidate profiles & resumes</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Application tracking & stages</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Notes & activity history</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Split Placement Engine */}
                        <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-secondary/20 flex items-center justify-center">
                                        <i className="fa-solid fa-chart-pie text-secondary text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Split Placement Engine</h3>
                                </div>
                                <p className="text-base-content/70 mb-4">
                                    Automatic fee calculation and transparent split tracking.
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Placement fee calculation</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Recruiter share tracking</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Platform fee transparency</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Placement history & reporting</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Recruiter Network */}
                        <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-accent/20 flex items-center justify-center">
                                        <i className="fa-solid fa-users text-accent text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Recruiter Network</h3>
                                </div>
                                <p className="text-base-content/70 mb-4">
                                    Connect with specialized recruiters across industries.
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Role assignments by niche</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Recruiter profiles & stats</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Access control & permissions</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Performance tracking</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Subscriptions & Plans */}
                        <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <i className="fa-solid fa-crown text-primary text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Flexible Plans</h3>
                                </div>
                                <p className="text-base-content/70 mb-4">
                                    Subscription tiers that grow with your business.
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Starter, Pro & Partner tiers</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Higher payouts on paid plans</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Priority access to roles</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Enhanced features per tier</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Smart Notifications */}
                        <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-secondary/20 flex items-center justify-center">
                                        <i className="fa-solid fa-bell text-secondary text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Smart Notifications</h3>
                                </div>
                                <p className="text-base-content/70 mb-4">
                                    Stay informed with real-time updates via email.
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>New application alerts</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Stage change notifications</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Placement confirmations</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Customizable preferences</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Admin Console */}
                        <div className="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-accent/20 flex items-center justify-center">
                                        <i className="fa-solid fa-shield-halved text-accent text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Admin Console</h3>
                                </div>
                                <p className="text-base-content/70 mb-4">
                                    Comprehensive controls for platform administrators.
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Recruiter approval workflow</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Company management</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Placement oversight</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Analytics & reporting</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Recruiters Features */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">
                                <i className="fa-solid fa-user-tie text-primary"></i> For Recruiters
                            </h2>
                            <p className="text-lg text-base-content/70">
                                Tools designed to maximize your placement success
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl mb-3">
                                        <i className="fa-solid fa-briefcase text-primary"></i>
                                        Role Discovery
                                    </h3>
                                    <p className="text-base-content/70">
                                        Browse curated roles that match your specialties. No more hunting through job boards—opportunities come to you based on your expertise and tier.
                                    </p>
                                </div>
                            </div>
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl mb-3">
                                        <i className="fa-solid fa-users-between-lines text-primary"></i>
                                        Candidate Management
                                    </h3>
                                    <p className="text-base-content/70">
                                        Submit candidates with ease. Track every submission through interview stages, and maintain full visibility into where each candidate stands.
                                    </p>
                                </div>
                            </div>
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl mb-3">
                                        <i className="fa-solid fa-file-invoice-dollar text-primary"></i>
                                        Earnings Dashboard
                                    </h3>
                                    <p className="text-base-content/70">
                                        See exactly what you've earned, what's pending, and your placement history. No mystery math—just transparent fee calculations and clear splits.
                                    </p>
                                </div>
                            </div>
                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl mb-3">
                                        <i className="fa-solid fa-chart-line text-primary"></i>
                                        Performance Insights
                                    </h3>
                                    <p className="text-base-content/70">
                                        Track your placement rate, average time to hire, and other key metrics to optimize your recruiting strategy and grow your business.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Companies Features */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">
                                <i className="fa-solid fa-building text-secondary"></i> For Companies
                            </h2>
                            <p className="text-lg text-base-content/70">
                                Streamline your external recruiting operations
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl mb-3">
                                        <i className="fa-solid fa-bullhorn text-secondary"></i>
                                        Role Posting
                                    </h3>
                                    <p className="text-base-content/70">
                                        Post open positions with clear requirements, compensation, and fee structures. Control which recruiters have access to each role.
                                    </p>
                                </div>
                            </div>
                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl mb-3">
                                        <i className="fa-solid fa-diagram-project text-secondary"></i>
                                        Pipeline Visibility
                                    </h3>
                                    <p className="text-base-content/70">
                                        See all candidates across all external recruiters in one unified pipeline. No more scattered spreadsheets or email chains.
                                    </p>
                                </div>
                            </div>
                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl mb-3">
                                        <i className="fa-solid fa-handshake text-secondary"></i>
                                        Recruiter Coordination
                                    </h3>
                                    <p className="text-base-content/70">
                                        Manage all your external recruiters from one platform. Set fees, track performance, and maintain consistent communication.
                                    </p>
                                </div>
                            </div>
                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl mb-3">
                                        <i className="fa-solid fa-dollar-sign text-secondary"></i>
                                        Cost Management
                                    </h3>
                                    <p className="text-base-content/70">
                                        Track placement costs, analyze ROI by recruiter, and maintain transparency with standardized fee agreements.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technical Features */}
            <section className="py-20 bg-neutral text-neutral-content">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Built on Modern Architecture</h2>
                        <p className="text-lg opacity-80">
                            Enterprise-grade infrastructure with security and scalability
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <div className="text-center">
                            <i className="fa-solid fa-shield-halved text-5xl mb-4 opacity-80"></i>
                            <h3 className="font-bold text-xl mb-2">Secure by Design</h3>
                            <p className="text-sm opacity-70">
                                Enterprise authentication, role-based access control, and encrypted data storage
                            </p>
                        </div>
                        <div className="text-center">
                            <i className="fa-solid fa-gauge-high text-5xl mb-4 opacity-80"></i>
                            <h3 className="font-bold text-xl mb-2">Lightning Fast</h3>
                            <p className="text-sm opacity-70">
                                Microservices architecture with optimized database queries for instant response times
                            </p>
                        </div>
                        <div className="text-center">
                            <i className="fa-solid fa-arrows-spin text-5xl mb-4 opacity-80"></i>
                            <h3 className="font-bold text-xl mb-2">Always Reliable</h3>
                            <p className="text-sm opacity-70">
                                99.9% uptime guarantee with automated backups and redundant systems
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-content">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Experience the Difference?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Join the platform built specifically for split placements. No retrofitting, no compromises.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/sign-up" className="btn btn-lg btn-neutral">
                            <i className="fa-solid fa-user-tie"></i>
                            Join as a Recruiter
                        </Link>
                        <Link href="/sign-up" className="btn btn-lg btn-secondary">
                            <i className="fa-solid fa-building"></i>
                            Post Roles as a Company
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
