import Link from 'next/link';

export default function CandidateHomePage() {
    return (
        <>
            {/* Hero Section with Video Background */}
            <section className="hero min-h-[85vh] relative overflow-hidden">
                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-15"
                >
                    <source src="/candidate-hero.mp4" type="video/mp4" />
                </video>

                {/* Overlay */}

                {/* Content */}
                <div className="hero-content text-center max-w-6xl relative z-10 py-20">
                    <div className="space-y-8">
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                            Find Your Dream Job,
                            <br />
                            <span className="text-secondary">
                                Powered by Expert Recruiters
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-base-content/80 max-w-3xl mx-auto leading-relaxed">
                            Browse thousands of opportunities from top companies. Get matched with specialized recruiters who advocate for you throughout the hiring process.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                            <Link href="/jobs" className="btn btn-primary btn-lg gap-2 shadow-lg hover:shadow-xl transition-all">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                Explore Jobs
                            </Link>
                            <Link href="/sign-up" className="btn btn-outline btn-lg gap-2">
                                <i className="fa-solid fa-user-plus"></i>
                                Create Your Profile
                            </Link>
                        </div>
                        <div className="flex items-center justify-center gap-8 pt-8 text-sm opacity-70">
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-check-circle text-success"></i>
                                <span>Free to use</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-check-circle text-success"></i>
                                <span>Expert guidance</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-check-circle text-success"></i>
                                <span>Top companies</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-neutral text-neutral-content">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">10K+</div>
                            <div className="text-sm md:text-base opacity-70">Active Jobs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">500+</div>
                            <div className="text-sm md:text-base opacity-70">Companies Hiring</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-accent mb-2">2K+</div>
                            <div className="text-sm md:text-base opacity-70">Expert Recruiters</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-success mb-2">95%</div>
                            <div className="text-sm md:text-base opacity-70">Satisfaction Rate</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Your Path to Success</h2>
                        <p className="text-lg md:text-xl text-base-content/70 max-w-2xl mx-auto">
                            Simple steps to land your next role with expert support
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
                            <div className="card-body items-center text-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-primary">1</span>
                                </div>
                                <i className="fa-solid fa-user-circle text-5xl text-primary"></i>
                                <h3 className="card-title text-2xl">Create Your Profile</h3>
                                <p className="text-base-content/70">
                                    Build a comprehensive profile showcasing your skills, experience, and career goals. Upload your resume and portfolio.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
                            <div className="card-body items-center text-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-secondary">2</span>
                                </div>
                                <i className="fa-solid fa-magnifying-glass-chart text-5xl text-secondary"></i>
                                <h3 className="card-title text-2xl">Browse & Apply</h3>
                                <p className="text-base-content/70">
                                    Search thousands of jobs from top companies. Apply with one click and get matched with specialized recruiters.
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
                            <div className="card-body items-center text-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-accent">3</span>
                                </div>
                                <i className="fa-solid fa-rocket text-5xl text-accent"></i>
                                <h3 className="card-title text-2xl">Land Your Dream Job</h3>
                                <p className="text-base-content/70">
                                    Get expert guidance through interviews, negotiate offers, and start your new career with confidence.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Why Candidates Love Us</h2>
                        <p className="text-lg text-base-content/70">
                            Tools and support designed to accelerate your job search
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
                            <div className="card-body">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-users text-2xl text-primary"></i>
                                    </div>
                                    <div>
                                        <h3 className="card-title text-lg mb-2">Expert Recruiter Network</h3>
                                        <p className="text-sm text-base-content/70">
                                            Get matched with specialized recruiters who know your industry and advocate for you.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
                            <div className="card-body">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-bolt text-2xl text-secondary"></i>
                                    </div>
                                    <div>
                                        <h3 className="card-title text-lg mb-2">One-Click Apply</h3>
                                        <p className="text-sm text-base-content/70">
                                            Apply to multiple jobs instantly with your saved profile and documents.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
                            <div className="card-body">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-bell text-2xl text-accent"></i>
                                    </div>
                                    <div>
                                        <h3 className="card-title text-lg mb-2">Real-Time Updates</h3>
                                        <p className="text-sm text-base-content/70">
                                            Track your application status and get instant notifications on progress.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
                            <div className="card-body">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-shield-halved text-2xl text-success"></i>
                                    </div>
                                    <div>
                                        <h3 className="card-title text-lg mb-2">Privacy First</h3>
                                        <p className="text-sm text-base-content/70">
                                            Your information is secure and only shared with your explicit consent.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
                            <div className="card-body">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-chart-line text-2xl text-warning"></i>
                                    </div>
                                    <div>
                                        <h3 className="card-title text-lg mb-2">Career Insights</h3>
                                        <p className="text-sm text-base-content/70">
                                            Get salary data, market trends, and personalized recommendations.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all">
                            <div className="card-body">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-hands-helping text-2xl text-info"></i>
                                    </div>
                                    <div>
                                        <h3 className="card-title text-lg mb-2">Interview Prep</h3>
                                        <p className="text-sm text-base-content/70">
                                            Access resources and guidance to ace your interviews with confidence.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Success Stories</h2>
                        <p className="text-lg text-base-content/70">
                            Hear from candidates who found their dream jobs
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="avatar avatar-placeholder">
                                        <div className="bg-primary text-primary-content rounded-full w-12">
                                            <span className="text-xl">SJ</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold">Sarah Johnson</div>
                                        <div className="text-sm opacity-70">Software Engineer</div>
                                    </div>
                                </div>
                                <div className="rating rating-sm mb-2">
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                </div>
                                <p className="text-base-content/70">
                                    "Found my dream job in just 2 weeks! The recruiter assigned to me really understood my goals and connected me with the perfect company."
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="avatar avatar-placeholder">
                                        <div className="bg-secondary text-secondary-content rounded-full w-12">
                                            <span className="text-xl">MC</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold">Michael Chen</div>
                                        <div className="text-sm opacity-70">Product Manager</div>
                                    </div>
                                </div>
                                <div className="rating rating-sm mb-2">
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                </div>
                                <p className="text-base-content/70">
                                    "The platform is so easy to use! I loved being able to track all my applications in one place and the recruiter support was invaluable."
                                </p>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="avatar avatar-placeholder">
                                        <div className="bg-accent text-accent-content rounded-full w-12">
                                            <span className="text-xl">EP</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold">Emily Parker</div>
                                        <div className="text-sm opacity-70">UX Designer</div>
                                    </div>
                                </div>
                                <div className="rating rating-sm mb-2">
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                    <input type="radio" className="mask mask-star-2 bg-warning" checked readOnly />
                                </div>
                                <p className="text-base-content/70">
                                    "Got 3 interviews in my first week! The quality of jobs and companies on this platform is outstanding. Highly recommend!"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-white relative overflow-hidden">
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                            Ready to Take the Next Step?
                        </h2>
                        <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
                            Join thousands of candidates who are finding better opportunities with expert guidance
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                            <Link href="/sign-up" className="btn btn-lg bg-white text-primary hover:bg-gray-100 border-none shadow-xl">
                                <i className="fa-solid fa-user-plus"></i>
                                Create Free Account
                            </Link>
                            <Link href="/jobs" className="btn btn-lg btn-outline text-white border-white hover:bg-white hover:text-primary">
                                <i className="fa-solid fa-search"></i>
                                Browse Jobs First
                            </Link>
                        </div>
                        <div className="pt-4 text-sm opacity-75">
                            No credit card required • Takes less than 2 minutes • Free forever
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
