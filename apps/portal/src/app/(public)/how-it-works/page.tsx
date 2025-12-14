import Link from 'next/link';

export default function HowItWorksPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="hero bg-accent text-accent-content py-20">
                <div className="hero-content text-center max-w-5xl">
                    <div>
                        <h1 className="text-5xl font-bold mb-6">
                            How Splits Network Works
                        </h1>
                        <p className="text-xl opacity-90 max-w-3xl mx-auto">
                            A simple, transparent process for companies and recruiters to work together on placements
                        </p>
                    </div>
                </div>
            </section>

            {/* Overview Section */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto text-center mb-16">
                        <h2 className="text-3xl font-bold mb-6">The Split Placement Model</h2>
                        <p className="text-lg text-base-content/70 max-w-3xl mx-auto">
                            Splits Network connects companies who need talent with specialized recruiters who know where to find it. 
                            When a hire is made, everyone gets their fair share—transparently and automatically.
                        </p>
                    </div>

                    {/* Visual Flow */}
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-6xl mx-auto">
                        <div className="card bg-primary text-primary-content shadow-xl w-full lg:w-64">
                            <div className="card-body items-center text-center p-6">
                                <i className="fa-solid fa-building text-5xl mb-3"></i>
                                <h3 className="card-title text-lg">Company Posts Role</h3>
                                <p className="text-sm opacity-90">Lists job with fee structure</p>
                            </div>
                        </div>
                        
                        <i className="fa-solid fa-arrow-right text-4xl text-primary rotate-90 lg:rotate-0"></i>
                        
                        <div className="card bg-secondary text-secondary-content shadow-xl w-full lg:w-64">
                            <div className="card-body items-center text-center p-6">
                                <i className="fa-solid fa-user-tie text-5xl mb-3"></i>
                                <h3 className="card-title text-lg">Recruiter Submits</h3>
                                <p className="text-sm opacity-90">Presents qualified candidate</p>
                            </div>
                        </div>
                        
                        <i className="fa-solid fa-arrow-right text-4xl text-secondary rotate-90 lg:rotate-0"></i>
                        
                        <div className="card bg-success text-success-content shadow-xl w-full lg:w-64">
                            <div className="card-body items-center text-center p-6">
                                <i className="fa-solid fa-handshake text-5xl mb-3"></i>
                                <h3 className="card-title text-lg">Hire & Pay</h3>
                                <p className="text-sm opacity-90">Everyone gets their split</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Recruiters Process */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-4">
                                <i className="fa-solid fa-user-tie text-primary"></i> For Recruiters
                            </h2>
                            <p className="text-lg text-base-content/70">
                                Your journey from joining to earning
                            </p>
                        </div>

                        <div className="space-y-12">
                            {/* Step 1 */}
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-primary">1</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Sign Up & Choose Your Plan</h3>
                                            <p className="text-base-content/70 mb-4">
                                                Create your account and select the subscription tier that matches your business. 
                                                Higher tiers unlock better payout percentages and priority access to roles.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-primary">Quick signup</span>
                                                <span className="badge badge-primary">Starter: 65% share</span>
                                                <span className="badge badge-primary">Pro: 75% share</span>
                                                <span className="badge badge-primary">Partner: 85% share</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-primary">2</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Browse Available Roles</h3>
                                            <p className="text-base-content/70 mb-4">
                                                View all open positions that match your expertise. See job details, compensation ranges, 
                                                placement fee percentages, and company information—all upfront and transparent.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-secondary">Filter by industry</span>
                                                <span className="badge badge-secondary">See fee structures</span>
                                                <span className="badge badge-secondary">Priority access for Pro+</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-primary">3</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Submit Qualified Candidates</h3>
                                            <p className="text-base-content/70 mb-4">
                                                Upload candidate information, including resume and profile details. Your submissions 
                                                go directly into the company's pipeline, and you can track their progress in real-time.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-accent">Simple submission form</span>
                                                <span className="badge badge-accent">Real-time status updates</span>
                                                <span className="badge badge-accent">Communication tools</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-primary">4</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Track Candidate Progress</h3>
                                            <p className="text-base-content/70 mb-4">
                                                Monitor your candidates through each stage of the hiring process. Get notified when 
                                                they move forward, and see exactly where they stand in the company's pipeline.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-info">Stage tracking</span>
                                                <span className="badge badge-info">Email notifications</span>
                                                <span className="badge badge-info">Activity history</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 5 */}
                            <div className="card bg-success text-success-content shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-success-content/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold">5</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Get Paid on Placement</h3>
                                            <p className="opacity-90 mb-4">
                                                When your candidate is hired, the placement is logged and your share is calculated automatically. 
                                                See transparent breakdowns of the fee, your percentage, and earnings history.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-success-content">Automatic calculation</span>
                                                <span className="badge badge-success-content">Transparent splits</span>
                                                <span className="badge badge-success-content">Earnings dashboard</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Companies Process */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-4">
                                <i className="fa-solid fa-building text-secondary"></i> For Companies
                            </h2>
                            <p className="text-lg text-base-content/70">
                                From posting to hiring in five simple steps
                            </p>
                        </div>

                        <div className="space-y-12">
                            {/* Step 1 */}
                            <div className="card bg-base-200 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-secondary">1</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Create Your Company Account</h3>
                                            <p className="text-base-content/70 mb-4">
                                                Sign up for free and set up your company profile. No credit card required—you only 
                                                pay when you make a successful hire.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-secondary">Free forever</span>
                                                <span className="badge badge-secondary">No credit card</span>
                                                <span className="badge badge-secondary">5-minute setup</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="card bg-base-200 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-secondary">2</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Post Your Open Roles</h3>
                                            <p className="text-base-content/70 mb-4">
                                                Create job postings with clear requirements, compensation ranges, and set your placement 
                                                fee percentage (typically 15-25%). Control which recruiters can see each role.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-primary">Unlimited postings</span>
                                                <span className="badge badge-primary">Set your own fees</span>
                                                <span className="badge badge-primary">Control visibility</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="card bg-base-200 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-secondary">3</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Receive Candidate Submissions</h3>
                                            <p className="text-base-content/70 mb-4">
                                                Specialized recruiters submit qualified candidates directly into your ATS pipeline. 
                                                All submissions are organized by role with recruiter information attached.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-accent">Vetted recruiters</span>
                                                <span className="badge badge-accent">Organized pipeline</span>
                                                <span className="badge badge-accent">Quality candidates</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="card bg-base-200 shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-secondary">4</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Manage Your Hiring Pipeline</h3>
                                            <p className="text-base-content/70 mb-4">
                                                Review candidates, schedule interviews, and move them through stages—all within the platform. 
                                                Recruiters stay informed automatically as candidates progress.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-info">Full ATS functionality</span>
                                                <span className="badge badge-info">Stage management</span>
                                                <span className="badge badge-info">Auto notifications</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 5 */}
                            <div className="card bg-success text-success-content shadow-xl">
                                <div className="card-body">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 rounded-full bg-success-content/20 flex items-center justify-center">
                                                <span className="text-3xl font-bold">5</span>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-3">Hire & Pay on Success</h3>
                                            <p className="opacity-90 mb-4">
                                                When you hire a candidate, log the placement with salary details. The platform calculates 
                                                the fee automatically, and splits are tracked transparently. Pay only on successful hires.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="badge badge-success-content">Pay only on hire</span>
                                                <span className="badge badge-success-content">Transparent fees</span>
                                                <span className="badge badge-success-content">Easy tracking</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Money Flow Section */}
            <section className="py-20 bg-neutral text-neutral-content">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4">Understanding the Money Flow</h2>
                            <p className="text-lg opacity-80">
                                Crystal clear fee structure with no hidden surprises
                            </p>
                        </div>

                        {/* Example Calculation */}
                        <div className="card bg-base-100 text-base-content shadow-2xl">
                            <div className="card-body p-8">
                                <h3 className="text-2xl font-bold mb-6 text-center">Example Placement Breakdown</h3>
                                
                                <div className="grid md:grid-cols-4 gap-6 mb-8">
                                    <div className="text-center p-4 bg-base-200 rounded-lg">
                                        <div className="text-3xl font-bold text-primary mb-2">$120,000</div>
                                        <div className="text-sm text-base-content/70">Candidate Salary</div>
                                    </div>
                                    <div className="text-center p-4 bg-base-200 rounded-lg">
                                        <div className="text-3xl font-bold text-secondary mb-2">20%</div>
                                        <div className="text-sm text-base-content/70">Placement Fee</div>
                                    </div>
                                    <div className="text-center p-4 bg-base-200 rounded-lg">
                                        <div className="text-3xl font-bold text-accent mb-2">$24,000</div>
                                        <div className="text-sm text-base-content/70">Total Fee Amount</div>
                                    </div>
                                    <div className="text-center p-4 bg-base-200 rounded-lg">
                                        <div className="text-3xl font-bold text-success mb-2">75%</div>
                                        <div className="text-sm text-base-content/70">Recruiter Share (Pro)</div>
                                    </div>
                                </div>

                                <div className="divider">SPLIT</div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="text-center p-6 bg-success/10 rounded-lg border-2 border-success">
                                        <i className="fa-solid fa-user-tie text-4xl text-success mb-3"></i>
                                        <div className="text-3xl font-bold text-success mb-2">$18,000</div>
                                        <div className="text-sm">Recruiter Receives</div>
                                    </div>
                                    <div className="text-center p-6 bg-secondary/10 rounded-lg border-2 border-secondary">
                                        <i className="fa-solid fa-handshake text-4xl text-secondary mb-3"></i>
                                        <div className="text-3xl font-bold text-secondary mb-2">$6,000</div>
                                        <div className="text-sm">Platform Share</div>
                                    </div>
                                </div>

                                <div className="alert alert-info mt-6">
                                    <i className="fa-solid fa-info-circle"></i>
                                    <span className="text-sm">
                                        Platform share covers infrastructure, support, payment processing, and continued development. 
                                        Your percentage increases with higher subscription tiers.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-content">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Join the platform that makes split placements simple, transparent, and profitable for everyone.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/sign-up" className="btn btn-lg btn-neutral">
                            <i className="fa-solid fa-user-tie"></i>
                            I'm a Recruiter
                        </Link>
                        <Link href="/sign-up" className="btn btn-lg btn-secondary">
                            <i className="fa-solid fa-building"></i>
                            I'm a Company
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
