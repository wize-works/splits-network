import Link from 'next/link';

export default function PricingPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="hero bg-secondary text-secondary-content py-20">
                <div className="hero-content text-center max-w-5xl">
                    <div>
                        <h1 className="text-5xl font-bold mb-6">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-xl opacity-90 max-w-3xl mx-auto">
                            Choose the plan that fits your recruiting business. Higher tiers unlock better payouts and priority access to roles.
                        </p>
                    </div>
                </div>
            </section>

            {/* Pricing Cards Section */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Starter Plan */}
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="badge badge-primary mb-4">STARTER</div>
                                <h3 className="card-title text-3xl mb-2">
                                    $99<span className="text-lg font-normal text-base-content/60">/month</span>
                                </h3>
                                <p className="text-base-content/70 mb-6">
                                    Perfect for recruiters getting started with split placements
                                </p>
                                <div className="divider"></div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Access to open roles</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Submit unlimited candidates</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Full ATS access</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Email notifications</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span><strong>65% recruiter share</strong> of placement fee</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-base-content/50">
                                        <i className="fa-solid fa-x mt-1 text-sm"></i>
                                        <span>Priority role access</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-base-content/50">
                                        <i className="fa-solid fa-x mt-1 text-sm"></i>
                                        <span>Performance analytics</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-base-content/50">
                                        <i className="fa-solid fa-x mt-1 text-sm"></i>
                                        <span>API access</span>
                                    </li>
                                </ul>
                                <Link href="/sign-up" className="btn btn-primary btn-block">
                                    Get Started
                                </Link>
                            </div>
                        </div>

                        {/* Pro Plan */}
                        <div className="card bg-primary text-primary-content shadow-2xl border-4 border-primary scale-105">
                            <div className="card-body">
                                <div className="badge badge-secondary mb-4">MOST POPULAR</div>
                                <h3 className="card-title text-3xl mb-2">
                                    $249<span className="text-lg font-normal opacity-80">/month</span>
                                </h3>
                                <p className="opacity-90 mb-6">
                                    For established recruiters who want better payouts and priority access
                                </p>
                                <div className="divider"></div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-secondary mt-1"></i>
                                        <span><strong>Everything in Starter</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-secondary mt-1"></i>
                                        <span><strong>75% recruiter share</strong> of placement fee</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-secondary mt-1"></i>
                                        <span>Priority access to new roles</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-secondary mt-1"></i>
                                        <span>Performance analytics dashboard</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-secondary mt-1"></i>
                                        <span>Advanced reporting</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-secondary mt-1"></i>
                                        <span>Dedicated support</span>
                                    </li>
                                    <li className="flex items-start gap-2 opacity-50">
                                        <i className="fa-solid fa-x mt-1 text-sm"></i>
                                        <span>API access</span>
                                    </li>
                                    <li className="flex items-start gap-2 opacity-50">
                                        <i className="fa-solid fa-x mt-1 text-sm"></i>
                                        <span>White-label options</span>
                                    </li>
                                </ul>
                                <Link href="/sign-up" className="btn btn-secondary btn-block">
                                    Start Pro Trial
                                </Link>
                            </div>
                        </div>

                        {/* Partner Plan */}
                        <div className="card bg-base-200 shadow-xl">
                            <div className="card-body">
                                <div className="badge badge-accent mb-4">PARTNER</div>
                                <h3 className="card-title text-3xl mb-2">
                                    $499<span className="text-lg font-normal text-base-content/60">/month</span>
                                </h3>
                                <p className="text-base-content/70 mb-6">
                                    For recruiting firms and power users who need the best
                                </p>
                                <div className="divider"></div>
                                <ul className="space-y-3 mb-6">
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span><strong>Everything in Pro</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span><strong>85% recruiter share</strong> of placement fee</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Exclusive early access to roles</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Full API access</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>White-label options</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Multi-recruiter team management</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Priority support & account manager</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <i className="fa-solid fa-check text-success mt-1"></i>
                                        <span>Custom integrations</span>
                                    </li>
                                </ul>
                                <Link href="/sign-up" className="btn btn-accent btn-block">
                                    Contact Sales
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* For Companies Pricing */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4">
                            <i className="fa-solid fa-building text-secondary"></i> For Companies
                        </h2>
                        <p className="text-lg text-base-content/70">
                            Post roles for free, pay only on successful hires
                        </p>
                    </div>
                    <div className="max-w-4xl mx-auto">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-4">Free to Post</h3>
                                        <p className="text-base-content/70 mb-6">
                                            Companies pay nothing to post roles and access our network of specialized recruiters.
                                        </p>
                                        <ul className="space-y-3">
                                            <li className="flex items-start gap-2">
                                                <i className="fa-solid fa-check text-success mt-1"></i>
                                                <span>Unlimited role postings</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <i className="fa-solid fa-check text-success mt-1"></i>
                                                <span>Access to recruiter network</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <i className="fa-solid fa-check text-success mt-1"></i>
                                                <span>Full ATS pipeline visibility</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <i className="fa-solid fa-check text-success mt-1"></i>
                                                <span>Candidate management tools</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <i className="fa-solid fa-check text-success mt-1"></i>
                                                <span>Communication & notifications</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-4">Pay on Hire</h3>
                                        <p className="text-base-content/70 mb-6">
                                            Only pay when you successfully hire a candidate. Set your fee percentage upfront.
                                        </p>
                                        <div className="card bg-secondary text-secondary-content shadow-lg mb-4">
                                            <div className="card-body p-6">
                                                <div className="text-center">
                                                    <div className="text-3xl font-bold mb-2">15-25%</div>
                                                    <div className="text-sm opacity-90">Typical placement fee range</div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-base-content/60">
                                            Example: For a $120,000 salary with 20% fee = $24,000 placement fee.
                                            The platform takes a small percentage, and the recruiter receives the majority.
                                        </p>
                                    </div>
                                </div>
                                <div className="divider"></div>
                                <div className="text-center">
                                    <Link href="/sign-up" className="btn btn-secondary btn-lg">
                                        <i className="fa-solid fa-building"></i>
                                        Post Your First Role
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Comparison Table */}
            <section className="py-20 bg-base-100">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Feature Comparison</h2>
                        <p className="text-lg text-base-content/70">
                            See what's included in each plan
                        </p>
                    </div>
                    <div className="overflow-x-auto max-w-6xl mx-auto">
                        <table className="table table-lg">
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th className="text-center">Starter</th>
                                    <th className="text-center bg-primary/10">Pro</th>
                                    <th className="text-center">Partner</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Recruiter Share</td>
                                    <td className="text-center">65%</td>
                                    <td className="text-center bg-primary/10 font-bold">75%</td>
                                    <td className="text-center font-bold">85%</td>
                                </tr>
                                <tr>
                                    <td>Access to Roles</td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                    <td className="text-center bg-primary/10"><i className="fa-solid fa-check text-success"></i></td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>Priority Role Access</td>
                                    <td className="text-center"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center bg-primary/10"><i className="fa-solid fa-check text-success"></i></td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>Exclusive Early Access</td>
                                    <td className="text-center"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center bg-primary/10"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>Unlimited Submissions</td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                    <td className="text-center bg-primary/10"><i className="fa-solid fa-check text-success"></i></td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>Full ATS Access</td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                    <td className="text-center bg-primary/10"><i className="fa-solid fa-check text-success"></i></td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>Performance Analytics</td>
                                    <td className="text-center"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center bg-primary/10"><i className="fa-solid fa-check text-success"></i></td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>API Access</td>
                                    <td className="text-center"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center bg-primary/10"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>Team Management</td>
                                    <td className="text-center"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center bg-primary/10"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>White-Label Options</td>
                                    <td className="text-center"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center bg-primary/10"><i className="fa-solid fa-x text-error text-sm"></i></td>
                                    <td className="text-center"><i className="fa-solid fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>Support Level</td>
                                    <td className="text-center">Email</td>
                                    <td className="text-center bg-primary/10">Priority</td>
                                    <td className="text-center">Account Manager</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Pricing FAQs</h2>
                    </div>
                    <div className="max-w-4xl mx-auto space-y-4">
                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="pricing-faq" defaultChecked /> 
                            <div className="collapse-title text-xl font-medium">
                                How does the recruiter share percentage work?
                            </div>
                            <div className="collapse-content"> 
                                <p className="text-base-content/70">
                                    When a placement is made, the company pays a placement fee (e.g., 20% of salary). 
                                    Your recruiter share percentage determines how much of that fee you receive. For example, 
                                    with a 75% share on a $24,000 fee, you receive $18,000. The remaining goes to the platform.
                                </p>
                            </div>
                        </div>
                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="pricing-faq" /> 
                            <div className="collapse-title text-xl font-medium">
                                Can I switch plans at any time?
                            </div>
                            <div className="collapse-content"> 
                                <p className="text-base-content/70">
                                    Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, 
                                    and you'll be charged a prorated amount. Downgrades take effect at the start of your next billing cycle.
                                </p>
                            </div>
                        </div>
                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="pricing-faq" /> 
                            <div className="collapse-title text-xl font-medium">
                                Is there a free trial?
                            </div>
                            <div className="collapse-content"> 
                                <p className="text-base-content/70">
                                    Pro and Partner plans include a 14-day free trial. You can explore all features risk-free 
                                    and cancel anytime before the trial ends without being charged.
                                </p>
                            </div>
                        </div>
                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="pricing-faq" /> 
                            <div className="collapse-title text-xl font-medium">
                                What happens if I don't make any placements?
                            </div>
                            <div className="collapse-content"> 
                                <p className="text-base-content/70">
                                    Your monthly subscription gives you access to the platform and roles, regardless of placements. 
                                    You only earn when you successfully place candidates, but there's no penalty for quieter months.
                                </p>
                            </div>
                        </div>
                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="pricing-faq" /> 
                            <div className="collapse-title text-xl font-medium">
                                Are there any additional fees?
                            </div>
                            <div className="collapse-content"> 
                                <p className="text-base-content/70">
                                    No hidden fees. The monthly subscription is your only recurring cost. All placement earnings 
                                    follow the transparent split model shown in your plan—no surprise deductions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-primary-content">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Earn More Per Placement?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Join Splits Network today and start maximizing your recruiting revenue with transparent, fair fee splits.
                    </p>
                    <Link href="/sign-up" className="btn btn-lg btn-neutral">
                        <i className="fa-solid fa-user-tie"></i>
                        Start Your Free Trial
                    </Link>
                    <p className="mt-6 text-sm opacity-75">
                        No credit card required • Cancel anytime
                    </p>
                </div>
            </section>
        </>
    );
}
