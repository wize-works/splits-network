import Link from 'next/link';

export default function AboutPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="hero bg-gradient-to-r from-primary to-accent text-primary-content py-20">
                <div className="hero-content text-center max-w-5xl">
                    <div>
                        <h1 className="text-5xl font-bold mb-6">
                            About Splits Network
                        </h1>
                        <p className="text-xl opacity-90 max-w-3xl mx-auto">
                            We're building the future of collaborative recruiting—a platform where transparency, 
                            fair splits, and quality placements drive everything we do.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12 mb-16">
                            <div className="card bg-primary text-primary-content shadow-xl">
                                <div className="card-body p-8">
                                    <h2 className="card-title text-3xl mb-4">
                                        <i className="fa-solid fa-bullseye"></i>
                                        Our Mission
                                    </h2>
                                    <p className="text-lg opacity-90">
                                        To create a transparent, fair marketplace where specialized recruiters and 
                                        companies collaborate seamlessly on placements—eliminating the chaos of 
                                        spreadsheets, email chains, and unclear fee structures.
                                    </p>
                                </div>
                            </div>
                            <div className="card bg-secondary text-secondary-content shadow-xl">
                                <div className="card-body p-8">
                                    <h2 className="card-title text-3xl mb-4">
                                        <i className="fa-solid fa-telescope"></i>
                                        Our Vision
                                    </h2>
                                    <p className="text-lg opacity-90">
                                        A world where every specialized recruiter can build a sustainable business 
                                        through split placements, and every company has instant access to the 
                                        perfect recruiting talent for their needs.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Story */}
                        <div className="prose lg:prose-xl max-w-4xl mx-auto">
                            <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
                            <p className="text-lg text-base-content/80">
                                Splits Network was born from years of frustration with the split placement process. 
                                As recruiters ourselves, we experienced firsthand the pain of managing splits across 
                                spreadsheets, losing track of candidates, and dealing with unclear fee agreements.
                            </p>
                            <p className="text-lg text-base-content/80">
                                We saw talented recruiters avoiding split placements entirely—not because they didn't 
                                want to collaborate, but because the tools didn't exist to make it work smoothly. 
                                Companies were equally frustrated, struggling to manage multiple external recruiters 
                                without a unified system.
                            </p>
                            <p className="text-lg text-base-content/80">
                                So we built Splits Network: a platform designed specifically for split placements, 
                                not retrofitted from general-purpose ATS systems. We built it with transparency, 
                                fairness, and simplicity at its core.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
                        <p className="text-lg text-base-content/70">
                            The principles that guide everything we build
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-eye text-primary text-3xl"></i>
                                </div>
                                <h3 className="card-title justify-center text-2xl mb-3">Transparency</h3>
                                <p className="text-base-content/70">
                                    Every fee, every split, every transaction is crystal clear. No hidden percentages, 
                                    no mystery math, no surprise deductions.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-scale-balanced text-secondary text-3xl"></i>
                                </div>
                                <h3 className="card-title justify-center text-2xl mb-3">Fairness</h3>
                                <p className="text-base-content/70">
                                    Recruiters deserve the lion's share of placement fees. We take only what we need 
                                    to run a sustainable platform.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-lightbulb text-accent text-3xl"></i>
                                </div>
                                <h3 className="card-title justify-center text-2xl mb-3">Simplicity</h3>
                                <p className="text-base-content/70">
                                    Complex processes should feel simple. We hide the complexity so you can focus 
                                    on what matters: making great placements.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <div className="w-20 h-20 rounded-full bg-info/20 flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-users text-info text-3xl"></i>
                                </div>
                                <h3 className="card-title justify-center text-2xl mb-3">Community</h3>
                                <p className="text-base-content/70">
                                    We're building more than a platform—we're creating a network of recruiters 
                                    who support and collaborate with each other.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-chart-line text-success text-3xl"></i>
                                </div>
                                <h3 className="card-title justify-center text-2xl mb-3">Growth</h3>
                                <p className="text-base-content/70">
                                    Your success is our success. We're invested in helping recruiters build 
                                    sustainable, growing businesses.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center">
                                <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                                    <i className="fa-solid fa-rocket text-warning text-3xl"></i>
                                </div>
                                <h3 className="card-title justify-center text-2xl mb-3">Innovation</h3>
                                <p className="text-base-content/70">
                                    We're constantly improving, listening to feedback, and building features 
                                    that solve real problems.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why We're Different */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-4xl font-bold text-center mb-12">Why We're Different</h2>
                        <div className="space-y-6">
                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl">
                                        <i className="fa-solid fa-hammer text-primary"></i>
                                        Built for Splits, Not Adapted
                                    </h3>
                                    <p className="text-base-content/70">
                                        Most ATS systems treat split placements as an afterthought. We built Splits Network 
                                        from the ground up with collaborative recruiting as the core use case.
                                    </p>
                                </div>
                            </div>
                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl">
                                        <i className="fa-solid fa-handshake text-secondary"></i>
                                        Recruiter-First Philosophy
                                    </h3>
                                    <p className="text-base-content/70">
                                        We're recruiters building for recruiters. Every feature, every workflow, every decision 
                                        is made with your success in mind.
                                    </p>
                                </div>
                            </div>
                            <div className="card bg-base-200 shadow-lg">
                                <div className="card-body">
                                    <h3 className="card-title text-xl">
                                        <i className="fa-solid fa-code text-accent"></i>
                                        Modern Technology Stack
                                    </h3>
                                    <p className="text-base-content/70">
                                        We use enterprise-grade, modern technology that's fast, reliable, and scales with your business. 
                                        No legacy systems holding you back.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-20 bg-neutral text-neutral-content">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4">Meet the Team</h2>
                        <p className="text-lg opacity-80">
                            The people building the future of split placements
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="card bg-base-100 text-base-content shadow-xl">
                            <div className="card-body text-center">
                                <div className="avatar avatar-placeholder mx-auto mb-4">
                                    <div className="bg-primary text-primary-content rounded-full w-24">
                                        <span className="text-3xl">FN</span>
                                    </div>
                                </div>
                                <h3 className="card-title justify-center">Founder Name</h3>
                                <p className="text-sm text-base-content/60 mb-2">Co-Founder & CEO</p>
                                <p className="text-sm text-base-content/70">
                                    15 years in recruiting and technology. Previously built recruiting teams at Fortune 500 companies.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 text-base-content shadow-xl">
                            <div className="card-body text-center">
                                <div className="avatar avatar-placeholder mx-auto mb-4">
                                    <div className="bg-secondary text-secondary-content rounded-full w-24">
                                        <span className="text-3xl">TN</span>
                                    </div>
                                </div>
                                <h3 className="card-title justify-center">Tech Name</h3>
                                <p className="text-sm text-base-content/60 mb-2">Co-Founder & CTO</p>
                                <p className="text-sm text-base-content/70">
                                    Former engineering leader at SaaS companies. Passionate about building scalable platforms.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 text-base-content shadow-xl">
                            <div className="card-body text-center">
                                <div className="avatar avatar-placeholder mx-auto mb-4">
                                    <div className="bg-accent text-accent-content rounded-full w-24">
                                        <span className="text-3xl">ON</span>
                                    </div>
                                </div>
                                <h3 className="card-title justify-center">Operations Name</h3>
                                <p className="text-sm text-base-content/60 mb-2">Head of Operations</p>
                                <p className="text-sm text-base-content/70">
                                    Recruiting operations expert. Ensures every recruiter and company has a great experience.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-12">
                        <Link href="/careers" className="btn btn-primary btn-lg">
                            <i className="fa-solid fa-user-plus"></i>
                            Join Our Team
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-content">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Join the Movement?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Be part of the platform that's changing how split placements work.
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
