import Link from 'next/link';

export default function SwitchCareersGuidePage() {
    const steps = [
        {
            number: '01',
            title: 'Self-Assessment',
            description: 'Identify your transferable skills, interests, and values to determine the right career path.',
            tips: [
                'List your current skills and accomplishments',
                'Identify what you enjoy and what drains you',
                'Consider your long-term career goals',
                'Research potential career paths that align with your values',
            ],
        },
        {
            number: '02',
            title: 'Research & Exploration',
            description: 'Learn about your target industry, required skills, and typical career paths.',
            tips: [
                'Conduct informational interviews with people in your target field',
                'Join industry-specific online communities and forums',
                'Attend webinars, conferences, and networking events',
                'Read industry publications and follow thought leaders',
            ],
        },
        {
            number: '03',
            title: 'Skill Development',
            description: 'Bridge the gap between your current skills and those required in your new career.',
            tips: [
                'Take online courses or bootcamps in your target field',
                'Work on personal projects to build a portfolio',
                'Seek volunteer opportunities or side projects',
                'Obtain relevant certifications if needed',
            ],
        },
        {
            number: '04',
            title: 'Build Your Story',
            description: 'Craft a compelling narrative that connects your past experience to your future goals.',
            tips: [
                'Highlight transferable skills in your resume',
                'Explain your career transition in your cover letter',
                'Update your LinkedIn to reflect your new direction',
                'Practice your elevator pitch for networking',
            ],
        },
        {
            number: '05',
            title: 'Strategic Job Search',
            description: 'Target opportunities that value your unique combination of skills and experience.',
            tips: [
                'Look for roles that value your transferable skills',
                'Consider entry-level or junior positions in your new field',
                'Leverage your existing network for referrals',
                'Be open to contract or freelance work to gain experience',
            ],
        },
        {
            number: '06',
            title: 'Make the Transition',
            description: 'Successfully navigate the move to your new career with confidence.',
            tips: [
                'Negotiate a start date that allows proper notice',
                'Continue learning and building skills before you start',
                'Connect with future colleagues on LinkedIn',
                'Stay positive and embrace the learning curve',
            ],
        },
    ];

    const commonChallenges = [
        {
            challenge: 'Financial concerns',
            solution: 'Build a 6-12 month emergency fund before making the switch. Consider part-time work or consulting in your current field during the transition.',
        },
        {
            challenge: 'Lack of experience',
            solution: 'Build a portfolio through personal projects, volunteer work, or freelance opportunities. Emphasize transferable skills from your previous career.',
        },
        {
            challenge: 'Age discrimination',
            solution: 'Focus on the value and unique perspective you bring. Network extensively and consider companies known for diverse, experienced teams.',
        },
        {
            challenge: 'Imposter syndrome',
            solution: 'Remember that career changers bring valuable diverse perspectives. Everyone starts somewhere. Focus on continuous learning and progress.',
        },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-secondary text-primary-content py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/resources/career-guides" className="btn btn-ghost btn-sm mb-4">
                            <i className="fa-solid fa-arrow-left"></i> Back to Career Guides
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <i className="fa-solid fa-arrows-turn-right text-4xl"></i>
                            <div>
                                <div className="badge badge-neutral mb-2">Career Change</div>
                                <h1 className="text-4xl font-bold">How to Switch Careers Successfully</h1>
                            </div>
                        </div>
                        <p className="text-xl opacity-90">
                            A comprehensive guide to transitioning into a new career path with confidence and strategic planning.
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-sm opacity-80">
                            <span><i className="fa-solid fa-clock"></i> 8 min read</span>
                            <span><i className="fa-solid fa-user"></i> Career Experts</span>
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
                                Changing careers can feel daunting, but with the right approach and preparation, it can be one of the most rewarding decisions you make. Whether you're seeking better work-life balance, higher earning potential, or simply following your passion, a successful career transition requires careful planning and execution.
                            </p>
                            <p>
                                This guide will walk you through the essential steps to make your career switch smooth and successful.
                            </p>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">The 6-Step Framework</h2>
                        
                        <div className="space-y-6">
                            {steps.map((step, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex items-start gap-6">
                                            <div className="text-5xl font-bold text-primary/20">{step.number}</div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                                                <p className="text-base-content/70 mb-4">{step.description}</p>
                                                
                                                <div className="bg-base-200 p-4 rounded-lg">
                                                    <h4 className="font-bold mb-2">Key Actions:</h4>
                                                    <ul className="space-y-2">
                                                        {step.tips.map((tip, i) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <i className="fa-solid fa-check text-success mt-1"></i>
                                                                <span>{tip}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Common Challenges */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">Overcoming Common Challenges</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {commonChallenges.map((item, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg text-error">
                                            <i className="fa-solid fa-triangle-exclamation"></i>
                                            {item.challenge}
                                        </h3>
                                        <p className="text-sm text-base-content/70">
                                            <span className="font-bold text-success">Solution: </span>
                                            {item.solution}
                                        </p>
                                    </div>
                                </div>
                            ))}
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
                                    <span>Start with thorough self-assessment and research before making any moves</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Focus on building transferable skills that bridge your old and new careers</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Network extensively in your target industry before applying to jobs</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Be patient and persistent - career transitions typically take 6-12 months</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Related Resources */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title text-xl mb-4">Continue Your Journey</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/resources/career-guides/networking" className="btn btn-outline">
                                    <i className="fa-solid fa-users"></i>
                                    Building Your Network
                                </Link>
                                <Link href="/resources/salary-insights" className="btn btn-outline">
                                    <i className="fa-solid fa-chart-line"></i>
                                    Salary Insights
                                </Link>
                                <Link href="/jobs" className="btn btn-primary">
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
