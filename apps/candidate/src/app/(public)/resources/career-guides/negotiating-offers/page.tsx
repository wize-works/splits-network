import Link from 'next/link';

export default function NegotiatingOffersGuidePage() {
    const negotiationSteps = [
        {
            phase: 'Preparation',
            icon: 'clipboard-list',
            steps: [
                {
                    title: 'Research Market Rates',
                    description: 'Know what similar roles pay in your market and industry',
                    actions: [
                        'Check salary data on Glassdoor, Levels.fyi, and PayScale',
                        'Talk to recruiters about typical comp ranges',
                        'Use our Salary Insights tool for real market data',
                        'Factor in location, experience, and company size',
                    ],
                },
                {
                    title: 'Know Your Worth',
                    description: 'Calculate your walk-away number and ideal target',
                    actions: [
                        'Calculate your minimum acceptable salary',
                        'Determine your target salary (15-20% above minimum)',
                        'Consider total compensation, not just base salary',
                        'Factor in your unique skills and experience',
                    ],
                },
            ],
        },
        {
            phase: 'Initial Offer',
            icon: 'envelope',
            steps: [
                {
                    title: 'Receive with Grace',
                    description: 'Express appreciation regardless of the numbers',
                    actions: [
                        'Thank them for the offer enthusiastically',
                        'Ask for the offer in writing if verbal',
                        'Request 24-48 hours to review',
                        'Avoid accepting or declining immediately',
                    ],
                },
                {
                    title: 'Evaluate Thoroughly',
                    description: 'Look at the complete compensation package',
                    actions: [
                        'Review base salary, bonus, and equity',
                        'Understand benefits, PTO, and perks',
                        'Calculate total compensation value',
                        'Compare against your research and requirements',
                    ],
                },
            ],
        },
        {
            phase: 'Negotiation',
            icon: 'comments-dollar',
            steps: [
                {
                    title: 'Make Your Counter',
                    description: 'Present your case confidently and professionally',
                    actions: [
                        'Start with specific numbers backed by research',
                        'Focus on your value and market data',
                        'Be prepared to discuss each component',
                        'Stay positive and collaborative',
                    ],
                },
                {
                    title: 'Handle Objections',
                    description: 'Work through concerns and find creative solutions',
                    actions: [
                        'Listen carefully to their constraints',
                        'Propose alternative solutions',
                        'Consider non-salary benefits',
                        'Be willing to compromise strategically',
                    ],
                },
            ],
        },
        {
            phase: 'Closing',
            icon: 'handshake',
            steps: [
                {
                    title: 'Reach Agreement',
                    description: 'Finalize terms and get everything in writing',
                    actions: [
                        'Confirm all agreed-upon terms',
                        'Get a revised offer letter',
                        'Review carefully before signing',
                        'Ask questions about anything unclear',
                    ],
                },
                {
                    title: 'Accept Professionally',
                    description: 'Close out your job search on a high note',
                    actions: [
                        'Sign and return offer letter promptly',
                        'Provide proper notice to current employer',
                        'Withdraw from other interview processes gracefully',
                        'Prepare for your new role',
                    ],
                },
            ],
        },
    ];

    const whatToNegotiate = [
        {
            category: 'Base Salary',
            icon: 'dollar-sign',
            description: 'Your fixed annual compensation',
            negotiable: 'High',
            tips: 'Easiest to negotiate upfront. Use market data to support your ask.',
        },
        {
            category: 'Signing Bonus',
            icon: 'gift',
            description: 'One-time payment upon joining',
            negotiable: 'Medium',
            tips: 'Great if base salary is capped. Often used to offset lost bonuses.',
        },
        {
            category: 'Equity/Stock',
            icon: 'chart-line',
            description: 'Company ownership through options or RSUs',
            negotiable: 'Medium-High',
            tips: 'More negotiable at startups. Understand vesting schedule.',
        },
        {
            category: 'Annual Bonus',
            icon: 'trophy',
            description: 'Performance-based yearly payment',
            negotiable: 'Low-Medium',
            tips: 'Often tied to company policy. Focus on target percentage.',
        },
        {
            category: 'Vacation/PTO',
            icon: 'umbrella-beach',
            description: 'Paid time off for vacation and sick days',
            negotiable: 'Medium',
            tips: 'More flexible at smaller companies. Specify in offer letter.',
        },
        {
            category: 'Remote Work',
            icon: 'house-laptop',
            description: 'Flexibility to work from home',
            negotiable: 'Medium-High',
            tips: 'Increasingly negotiable post-pandemic. Define expectations clearly.',
        },
        {
            category: 'Start Date',
            icon: 'calendar',
            description: 'When you begin your new role',
            negotiable: 'High',
            tips: 'Almost always negotiable. Give proper notice to current employer.',
        },
        {
            category: 'Professional Development',
            icon: 'graduation-cap',
            description: 'Budget for courses, conferences, certifications',
            negotiable: 'Medium',
            tips: 'Show how it benefits the company. Get specific commitments.',
        },
    ];

    const scripts = [
        {
            scenario: 'Initial Counter Offer',
            script: '"Thank you so much for the offer! I\'m very excited about the opportunity. Based on my research of similar roles in this market and my X years of experience in [specific skill], I was hoping we could discuss a base salary of $[target]. Does that work within your budget?"',
        },
        {
            scenario: 'When Salary is Non-Negotiable',
            script: '"I understand the base salary is fixed. Would there be flexibility in other areas like the signing bonus, equity package, or additional PTO? I want to make sure the total compensation aligns with my expectations."',
        },
        {
            scenario: 'Negotiating Multiple Components',
            script: '"I\'d like to discuss a few components: bringing the base to $[X], increasing the signing bonus to $[Y] to offset my current year-end bonus, and confirming I can work remotely 3 days per week. Is this package feasible?"',
        },
        {
            scenario: 'Declining Politely',
            script: '"I really appreciate the offer and your time throughout this process. Unfortunately, after careful consideration, I don\'t think I can accept at this compensation level. If you\'re able to move to $[X], I\'d love to join the team. Otherwise, I\'ll need to respectfully decline."',
        },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-success to-warning text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/resources/career-guides" className="btn btn-ghost btn-sm mb-4">
                            <i className="fa-solid fa-arrow-left"></i> Back to Career Guides
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <i className="fa-solid fa-handshake text-4xl"></i>
                            <div>
                                <div className="badge badge-neutral mb-2">Compensation</div>
                                <h1 className="text-4xl font-bold">Negotiating Your Job Offer</h1>
                            </div>
                        </div>
                        <p className="text-xl opacity-90">
                            Master the art of salary and benefits negotiation to get the compensation you deserve.
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-sm opacity-80">
                            <span><i className="fa-solid fa-clock"></i> 10 min read</span>
                            <span><i className="fa-solid fa-user"></i> Compensation Experts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Introduction */}
                    <div className="card bg-base-100 shadow-lg mb-12">
                        <div className="card-body prose max-w-none">
                            <p className="text-lg">
                                Negotiating your job offer is one of the highest-leverage activities you can do in your career. A successful negotiation can result in tens of thousands of dollars in additional compensation—and set the baseline for future raises.
                            </p>
                            <p>
                                Yet many candidates skip this crucial step, leaving money on the table out of fear or uncertainty. This guide will give you the confidence and tactics to negotiate effectively.
                            </p>
                        </div>
                    </div>

                    {/* The Negotiation Process */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">The Complete Negotiation Process</h2>
                        
                        <div className="space-y-8">
                            {negotiationSteps.map((phase, phaseIndex) => (
                                <div key={phaseIndex}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <i className={`fa-solid fa-${phase.icon} text-2xl text-primary`}></i>
                                        <h3 className="text-2xl font-bold">{phase.phase}</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {phase.steps.map((step, stepIndex) => (
                                            <div key={stepIndex} className="card bg-base-100 shadow-lg">
                                                <div className="card-body">
                                                    <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                                                    <p className="text-base-content/70 mb-4">{step.description}</p>
                                                    <ul className="space-y-2">
                                                        {step.actions.map((action, actionIndex) => (
                                                            <li key={actionIndex} className="flex items-start gap-2">
                                                                <i className="fa-solid fa-check text-success mt-1"></i>
                                                                <span className="text-sm">{action}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* What You Can Negotiate */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">What You Can Negotiate</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {whatToNegotiate.map((item, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <i className={`fa-solid fa-${item.icon} text-2xl text-primary`}></i>
                                                <h3 className="card-title text-lg">{item.category}</h3>
                                            </div>
                                            <span className={`badge ${
                                                item.negotiable.includes('High') ? 'badge-success' :
                                                item.negotiable.includes('Medium') ? 'badge-warning' :
                                                'badge-error'
                                            }`}>
                                                {item.negotiable}
                                            </span>
                                        </div>
                                        <p className="text-sm text-base-content/70 mb-2">{item.description}</p>
                                        <p className="text-sm bg-base-200 p-3 rounded-lg">
                                            <span className="font-bold">Tip: </span>{item.tips}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Negotiation Scripts */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">What to Say: Sample Scripts</h2>
                        
                        <div className="space-y-6">
                            {scripts.map((script, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg mb-3">
                                            <i className="fa-solid fa-quote-left text-primary"></i>
                                            {script.scenario}
                                        </h3>
                                        <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                                            <p className="italic">{script.script}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Common Mistakes */}
                    <div className="card bg-error/10 border border-error/30 shadow-lg mb-12">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4 text-error">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                Common Mistakes to Avoid
                            </h2>
                            <ul className="space-y-3">
                                {[
                                    'Accepting the first offer without negotiating',
                                    'Not knowing your market value before negotiating',
                                    'Negotiating before receiving a written offer',
                                    'Being aggressive or making ultimatums',
                                    'Only focusing on salary and ignoring other benefits',
                                    'Lying about competing offers or current compensation',
                                    'Negotiating via email when a call would be better',
                                    'Accepting/declining before getting everything in writing',
                                ].map((mistake, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <i className="fa-solid fa-xmark text-error text-lg mt-0.5"></i>
                                        <span>{mistake}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Key Takeaways */}
                    <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg mb-12">
                        <div className="card-body">
                            <h3 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-lightbulb"></i>
                                Key Takeaways
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Always negotiate—most employers expect it and respect candidates who do</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Do your research and know your market value before any conversation</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Focus on the total compensation package, not just base salary</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Stay positive, professional, and collaborative throughout the process</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Related Resources */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title text-xl mb-4">Continue Learning</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/resources/salary-insights" className="btn btn-primary">
                                    <i className="fa-solid fa-chart-line"></i>
                                    Salary Insights
                                </Link>
                                <Link href="/resources/career-guides/interview-prep" className="btn btn-outline">
                                    <i className="fa-solid fa-user-tie"></i>
                                    Interview Prep
                                </Link>
                                <Link href="/jobs" className="btn btn-outline">
                                    <i className="fa-solid fa-briefcase"></i>
                                    Browse Jobs
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
