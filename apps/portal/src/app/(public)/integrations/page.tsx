import Link from 'next/link';

export default function IntegrationsPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="hero bg-info text-info-content py-20">
                <div className="hero-content text-center max-w-5xl">
                    <div>
                        <h1 className="text-5xl font-bold mb-6">
                            Integrations & Ecosystem
                        </h1>
                        <p className="text-xl opacity-90 max-w-3xl mx-auto">
                            Connect Splits Network with your existing tools and workflows to create a seamless recruiting experience
                        </p>
                    </div>
                </div>
            </section>

            {/* Coming Soon Notice */}
            <section className="py-12 bg-warning text-warning-content">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <i className="fa-solid fa-wrench text-5xl mb-4"></i>
                        <h2 className="text-2xl font-bold mb-3">Integrations Coming in Phase 2</h2>
                        <p className="text-lg opacity-90">
                            We're building a robust integration ecosystem. In Phase 1, we're focused on delivering 
                            the core split placement platform. Stay tuned for these integrations!
                        </p>
                    </div>
                </div>
            </section>

            {/* Planned Integrations Section */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Planned Integrations</h2>
                        <p className="text-lg text-base-content/70">
                            Connect with the tools you already use
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Email & Communication */}
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <i className="fa-solid fa-envelope text-primary text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Email & Communication</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-base-content/70">
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Gmail</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Outlook</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Slack</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Microsoft Teams</span>
                                    </li>
                                </ul>
                                <div className="badge badge-warning mt-4">Coming Soon</div>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-secondary/20 flex items-center justify-center">
                                        <i className="fa-solid fa-calendar text-secondary text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Calendar & Scheduling</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-base-content/70">
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Google Calendar</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Outlook Calendar</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Calendly</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Acuity Scheduling</span>
                                    </li>
                                </ul>
                                <div className="badge badge-warning mt-4">Coming Soon</div>
                            </div>
                        </div>

                        {/* Job Boards */}
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-accent/20 flex items-center justify-center">
                                        <i className="fa-solid fa-briefcase text-accent text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Job Boards</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-base-content/70">
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">LinkedIn</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Indeed</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">ZipRecruiter</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Monster</span>
                                    </li>
                                </ul>
                                <div className="badge badge-warning mt-4">Coming Soon</div>
                            </div>
                        </div>

                        {/* ATS Systems */}
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <i className="fa-solid fa-sitemap text-primary text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">External ATS</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-base-content/70">
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Greenhouse</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Lever</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Workday</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">iCIMS</span>
                                    </li>
                                </ul>
                                <div className="badge badge-warning mt-4">Coming Soon</div>
                            </div>
                        </div>

                        {/* Payments */}
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-success/20 flex items-center justify-center">
                                        <i className="fa-solid fa-credit-card text-success text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Payment Processing</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-base-content/70">
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-success">Stripe</span>
                                        <span className="text-xs">(Active)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">PayPal</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Wire Transfer</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">ACH</span>
                                    </li>
                                </ul>
                                <div className="badge badge-info mt-4">Phase 2</div>
                            </div>
                        </div>

                        {/* Background Checks */}
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 rounded-lg bg-secondary/20 flex items-center justify-center">
                                        <i className="fa-solid fa-shield-halved text-secondary text-2xl"></i>
                                    </div>
                                    <h3 className="card-title">Background Checks</h3>
                                </div>
                                <ul className="space-y-2 text-sm text-base-content/70">
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Checkr</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">Sterling</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">HireRight</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="badge badge-sm badge-ghost">GoodHire</span>
                                    </li>
                                </ul>
                                <div className="badge badge-warning mt-4">Coming Soon</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* API Section */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="badge badge-primary mb-4">FOR DEVELOPERS</div>
                                <h2 className="text-4xl font-bold mb-6">RESTful API Access</h2>
                                <p className="text-lg text-base-content/70 mb-6">
                                    Build custom integrations and automate your recruiting workflow with our comprehensive API. 
                                    Available on Partner tier plans.
                                </p>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Full REST API with OpenAPI documentation</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Webhook support for real-time events</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>OAuth 2.0 authentication</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>SDKs for popular languages</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Rate limiting and sandbox environment</span>
                                    </li>
                                </ul>
                                <Link href="/pricing" className="btn btn-primary">
                                    View Partner Plans
                                </Link>
                            </div>
                            <div className="mockup-code bg-neutral text-neutral-content">
                                <pre data-prefix="$"><code>curl -X POST https://api.splits.network/v1/candidates \</code></pre>
                                <pre data-prefix=""><code>  -H "Authorization: Bearer YOUR_API_KEY" \</code></pre>
                                <pre data-prefix=""><code>  -H "Content-Type: application/json" \</code></pre>
                                <pre data-prefix=""><code>  -d '{`{`}</code></pre>
                                <pre data-prefix=""><code>    "role_id": "role_123",</code></pre>
                                <pre data-prefix=""><code>    "name": "Jane Smith",</code></pre>
                                <pre data-prefix=""><code>    "email": "jane@example.com",</code></pre>
                                <pre data-prefix=""><code>    "resume_url": "https://..."</code></pre>
                                <pre data-prefix=""><code>  {`}`}'</code></pre>
                                <pre data-prefix=">" className="text-success"><code>201 Created</code></pre>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Zapier & Automation */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="card bg-base-200 shadow-xl">
                                    <div className="card-body">
                                        <h3 className="card-title text-2xl mb-4">
                                            <i className="fa-solid fa-bolt text-warning"></i>
                                            Automation Examples
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3 p-3 bg-base-100 rounded-lg">
                                                <i className="fa-solid fa-arrow-right text-primary mt-1"></i>
                                                <div>
                                                    <div className="font-bold">New Candidate Alert</div>
                                                    <div className="text-sm text-base-content/60">
                                                        Send Slack notification when recruiter submits candidate
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-base-100 rounded-lg">
                                                <i className="fa-solid fa-arrow-right text-primary mt-1"></i>
                                                <div>
                                                    <div className="font-bold">CRM Sync</div>
                                                    <div className="text-sm text-base-content/60">
                                                        Add new placements to Salesforce automatically
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 p-3 bg-base-100 rounded-lg">
                                                <i className="fa-solid fa-arrow-right text-primary mt-1"></i>
                                                <div>
                                                    <div className="font-bold">Invoice Generation</div>
                                                    <div className="text-sm text-base-content/60">
                                                        Create invoice in QuickBooks when placement logged
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <div className="badge badge-accent mb-4">AUTOMATION</div>
                                <h2 className="text-4xl font-bold mb-6">Zapier & Make Integration</h2>
                                <p className="text-lg text-base-content/70 mb-6">
                                    Connect Splits Network to 5,000+ apps with no-code automation platforms. 
                                    Build custom workflows that fit your unique process.
                                </p>
                                <div className="flex flex-wrap gap-3 mb-8">
                                    <span className="badge badge-lg">Zapier</span>
                                    <span className="badge badge-lg">Make (Integromat)</span>
                                    <span className="badge badge-lg">n8n</span>
                                    <span className="badge badge-lg">Automate.io</span>
                                </div>
                                <div className="badge badge-warning">Phase 2 - Coming Soon</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Webhooks Section */}
            <section className="py-20 bg-neutral text-neutral-content">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Webhook Events</h2>
                            <p className="text-lg opacity-80">
                                Real-time notifications for important platform events
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="card bg-base-100 text-base-content">
                                <div className="card-body p-4">
                                    <div className="font-mono text-sm text-primary">application.created</div>
                                    <p className="text-xs text-base-content/70">New candidate submission</p>
                                </div>
                            </div>
                            <div className="card bg-base-100 text-base-content">
                                <div className="card-body p-4">
                                    <div className="font-mono text-sm text-primary">application.stage_changed</div>
                                    <p className="text-xs text-base-content/70">Candidate moves to new stage</p>
                                </div>
                            </div>
                            <div className="card bg-base-100 text-base-content">
                                <div className="card-body p-4">
                                    <div className="font-mono text-sm text-success">placement.created</div>
                                    <p className="text-xs text-base-content/70">Successful hire logged</p>
                                </div>
                            </div>
                            <div className="card bg-base-100 text-base-content">
                                <div className="card-body p-4">
                                    <div className="font-mono text-sm text-secondary">role.published</div>
                                    <p className="text-xs text-base-content/70">New job posted</p>
                                </div>
                            </div>
                            <div className="card bg-base-100 text-base-content">
                                <div className="card-body p-4">
                                    <div className="font-mono text-sm text-accent">recruiter.approved</div>
                                    <p className="text-xs text-base-content/70">Recruiter joins network</p>
                                </div>
                            </div>
                            <div className="card bg-base-100 text-base-content">
                                <div className="card-body p-4">
                                    <div className="font-mono text-sm text-info">payment.processed</div>
                                    <p className="text-xs text-base-content/70">Payment completed</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-8">
                            <div className="badge badge-warning badge-lg">Available in Phase 2</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Request Integration Section */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body text-center p-12">
                                <i className="fa-solid fa-lightbulb text-6xl text-warning mb-6"></i>
                                <h2 className="text-3xl font-bold mb-4">Don't See What You Need?</h2>
                                <p className="text-lg text-base-content/70 mb-8">
                                    We're actively building our integration ecosystem. Let us know which tools are 
                                    most important to your workflow, and we'll prioritize them in our roadmap.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a href="mailto:integrations@splits.network" className="btn btn-primary btn-lg">
                                        <i className="fa-solid fa-envelope"></i>
                                        Request an Integration
                                    </a>
                                    <Link href="/updates" className="btn btn-outline btn-lg">
                                        <i className="fa-solid fa-rss"></i>
                                        View Roadmap
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-content">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Build on Splits Network</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Whether you need simple automation or custom integrations, we've got you covered.
                    </p>
                    <Link href="/sign-up" className="btn btn-lg btn-neutral">
                        <i className="fa-solid fa-code"></i>
                        Get Started
                    </Link>
                </div>
            </section>
        </>
    );
}
