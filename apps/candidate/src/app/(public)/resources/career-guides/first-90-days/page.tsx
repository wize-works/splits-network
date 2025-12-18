import Link from 'next/link';

export default function First90DaysGuidePage() {
    const phases = [
        {
            title: 'Days 1-30: Learn & Listen',
            subtitle: 'Focus on understanding before acting',
            icon: 'ear-listen',
            color: 'primary',
            goals: [
                'Understand the company culture and team dynamics',
                'Learn the tools, processes, and systems',
                'Build relationships with key stakeholders',
                'Identify quick wins and longer-term opportunities',
            ],
            actions: [
                {
                    category: 'Learning',
                    tasks: [
                        'Review all onboarding materials thoroughly',
                        'Schedule 1-on-1s with team members and cross-functional partners',
                        'Document processes and ask lots of questions',
                        'Find and study past projects for context',
                    ],
                },
                {
                    category: 'Relationships',
                    tasks: [
                        'Set up coffee chats with 8-10 colleagues',
                        'Join team channels and observe communication patterns',
                        'Attend team events and social gatherings',
                        'Find a mentor or buddy within the organization',
                    ],
                },
                {
                    category: 'Quick Wins',
                    tasks: [
                        'Identify low-hanging fruit you can tackle immediately',
                        'Volunteer for small tasks to contribute early',
                        'Fix obvious inefficiencies you notice',
                        'Share relevant expertise from past experience',
                    ],
                },
            ],
        },
        {
            title: 'Days 31-60: Contribute & Build',
            subtitle: 'Start delivering value and building momentum',
            icon: 'rocket',
            color: 'secondary',
            goals: [
                'Take ownership of meaningful projects',
                'Demonstrate your value and capabilities',
                'Deepen key relationships',
                'Establish your working style and communication preferences',
            ],
            actions: [
                {
                    category: 'Execution',
                    tasks: [
                        'Lead your first significant project or initiative',
                        'Contribute meaningfully to team meetings',
                        'Start proposing ideas and improvements',
                        'Deliver high-quality work consistently',
                    ],
                },
                {
                    category: 'Visibility',
                    tasks: [
                        'Share progress updates with your manager regularly',
                        'Present your work to broader teams',
                        'Write documentation for processes you\'ve learned',
                        'Celebrate team wins and give credit generously',
                    ],
                },
                {
                    category: 'Growth',
                    tasks: [
                        'Identify skill gaps and create a learning plan',
                        'Seek feedback on your performance',
                        'Set clear goals with your manager for the coming months',
                        'Start building your reputation in specific areas',
                    ],
                },
            ],
        },
        {
            title: 'Days 61-90: Optimize & Lead',
            subtitle: 'Solidify your role and look ahead',
            icon: 'chart-line',
            color: 'accent',
            goals: [
                'Establish yourself as a trusted contributor',
                'Take on more strategic responsibilities',
                'Identify long-term growth opportunities',
                'Set yourself up for continued success',
            ],
            actions: [
                {
                    category: 'Leadership',
                    tasks: [
                        'Mentor newer team members',
                        'Lead initiatives that align with company goals',
                        'Present ideas to leadership',
                        'Take on stretch assignments',
                    ],
                },
                {
                    category: 'Reflection',
                    tasks: [
                        'Conduct a 90-day self-review',
                        'Schedule a formal check-in with your manager',
                        'Celebrate your wins and learnings',
                        'Identify what\'s working and what to adjust',
                    ],
                },
                {
                    category: 'Planning',
                    tasks: [
                        'Set goals for the next 6-12 months',
                        'Identify projects you want to lead',
                        'Create a professional development plan',
                        'Build your long-term career path at the company',
                    ],
                },
            ],
        },
    ];

    const relationshipTips = [
        {
            person: 'Your Manager',
            icon: 'user-tie',
            tips: [
                'Schedule regular 1-on-1s and come prepared',
                'Understand their priorities and how you can help',
                'Ask for feedback early and often',
                'Clarify expectations and success metrics',
            ],
        },
        {
            person: 'Your Team',
            icon: 'users',
            tips: [
                'Learn everyone\'s role and expertise',
                'Offer help without being asked',
                'Be a good listener and collaborator',
                'Respect existing processes before suggesting changes',
            ],
        },
        {
            person: 'Cross-Functional Partners',
            icon: 'handshake',
            tips: [
                'Understand how your role intersects with theirs',
                'Build rapport early through informational chats',
                'Be responsive and reliable in joint projects',
                'Proactively communicate and set expectations',
            ],
        },
        {
            person: 'Senior Leadership',
            icon: 'crown',
            tips: [
                'Observe from a distance at first',
                'Contribute intelligently in any direct interactions',
                'Understand company strategy and priorities',
                'Look for natural opportunities to add value',
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-accent to-info text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/resources/career-guides" className="btn btn-ghost btn-sm mb-4">
                            <i className="fa-solid fa-arrow-left"></i> Back to Career Guides
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <i className="fa-solid fa-rocket text-4xl"></i>
                            <div>
                                <div className="badge badge-neutral mb-2">Career Growth</div>
                                <h1 className="text-4xl font-bold">First 90 Days in a New Role</h1>
                            </div>
                        </div>
                        <p className="text-xl opacity-90">
                            Set yourself up for long-term success in your new position from day one.
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-sm opacity-80">
                            <span><i className="fa-solid fa-clock"></i> 9 min read</span>
                            <span><i className="fa-solid fa-user"></i> Career Coaches</span>
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
                                The first 90 days in a new role are critical. This is when you form first impressions, establish your reputation, and lay the foundation for your future success at the company. Get it right, and you'll set yourself up for a long and successful tenure.
                            </p>
                            <p>
                                This guide breaks down the first three months into clear phases with specific actions you can take to make an immediate impact while building for the long term.
                            </p>
                        </div>
                    </div>

                    {/* The 90-Day Framework */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">The 90-Day Framework</h2>
                        
                        <div className="space-y-8">
                            {phases.map((phase, phaseIndex) => (
                                <div key={phaseIndex} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={`w-16 h-16 rounded-full bg-${phase.color}/20 flex items-center justify-center flex-shrink-0`}>
                                                <i className={`fa-solid fa-${phase.icon} text-${phase.color} text-2xl`}></i>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold">{phase.title}</h3>
                                                <p className="text-base-content/70">{phase.subtitle}</p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <h4 className="font-bold mb-3">Key Goals:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {phase.goals.map((goal, goalIndex) => (
                                                    <div key={goalIndex} className="flex items-start gap-2">
                                                        <i className="fa-solid fa-target text-primary mt-1"></i>
                                                        <span className="text-sm">{goal}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {phase.actions.map((action, actionIndex) => (
                                                <div key={actionIndex} className="bg-base-200 p-4 rounded-lg">
                                                    <h5 className="font-bold mb-3">
                                                        <i className="fa-solid fa-circle-check text-success mr-2"></i>
                                                        {action.category}
                                                    </h5>
                                                    <ul className="space-y-2">
                                                        {action.tasks.map((task, taskIndex) => (
                                                            <li key={taskIndex} className="flex items-start gap-2 text-sm">
                                                                <i className="fa-solid fa-chevron-right text-base-content/40 mt-1"></i>
                                                                <span>{task}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Building Key Relationships */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">Building Key Relationships</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {relationshipTips.map((relationship, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex items-center gap-3 mb-4">
                                            <i className={`fa-solid fa-${relationship.icon} text-2xl text-primary`}></i>
                                            <h3 className="card-title text-lg">{relationship.person}</h3>
                                        </div>
                                        <ul className="space-y-2">
                                            {relationship.tips.map((tip, tipIndex) => (
                                                <li key={tipIndex} className="flex items-start gap-2 text-sm">
                                                    <i className="fa-solid fa-check text-success mt-1"></i>
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Questions to Ask */}
                    <div className="card bg-base-100 shadow-lg mb-12">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-6">
                                <i className="fa-solid fa-circle-question text-primary"></i>
                                Important Questions to Ask
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold mb-3">Week 1-2:</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li>• What does success look like in this role?</li>
                                        <li>• What are the biggest challenges the team is facing?</li>
                                        <li>• Who are the key stakeholders I should meet?</li>
                                        <li>• What projects should I prioritize first?</li>
                                        <li>• How do you prefer to communicate?</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-3">Week 3-4:</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li>• What metrics define success for our team?</li>
                                        <li>• How can I best support the team's goals?</li>
                                        <li>• What skills should I develop in this role?</li>
                                        <li>• Are there any landmines I should be aware of?</li>
                                        <li>• What's the best way to propose new ideas?</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Red Flags to Avoid */}
                    <div className="card bg-warning/10 border border-warning/30 shadow-lg mb-12">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4 text-warning">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                Common Mistakes to Avoid
                            </h2>
                            <ul className="space-y-3">
                                {[
                                    'Trying to change everything immediately without understanding context',
                                    'Not asking enough questions or pretending to know more than you do',
                                    'Isolating yourself instead of building relationships',
                                    'Missing opportunities to deliver quick wins',
                                    'Not seeking regular feedback from your manager',
                                    'Comparing everything to "how we did it at my last company"',
                                    'Being invisible—not communicating your progress and wins',
                                    'Burning out by trying to prove yourself too hard',
                                ].map((mistake, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <i className="fa-solid fa-xmark text-warning text-lg mt-0.5"></i>
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
                                    <span>Focus on learning and listening before trying to make changes</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Build strong relationships across the organization early</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Deliver quick wins while laying groundwork for bigger impact</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Seek regular feedback and adjust your approach accordingly</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Related Resources */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title text-xl mb-4">Next Steps</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/resources/career-guides/networking" className="btn btn-outline">
                                    <i className="fa-solid fa-users"></i>
                                    Build Your Network
                                </Link>
                                <Link href="/resources/career-guides/negotiating-offers" className="btn btn-outline">
                                    <i className="fa-solid fa-handshake"></i>
                                    Negotiate Offers
                                </Link>
                                <Link href="/jobs" className="btn btn-primary">
                                    <i className="fa-solid fa-briefcase"></i>
                                    Find Your Next Role
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
