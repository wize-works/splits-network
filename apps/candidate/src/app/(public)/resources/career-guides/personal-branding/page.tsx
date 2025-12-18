import Link from 'next/link';

export default function PersonalBrandingGuidePage() {
    const pillars = [
        {
            title: 'Define Your Brand',
            icon: 'compass',
            color: 'primary',
            description: 'Clarify what you want to be known for',
            steps: [
                {
                    title: 'Identify Your Unique Value',
                    points: [
                        'What skills and expertise set you apart?',
                        'What problems do you solve uniquely well?',
                        'What\'s your career story and journey?',
                        'What values drive your work?',
                    ],
                },
                {
                    title: 'Define Your Target Audience',
                    points: [
                        'Who needs to know about your expertise?',
                        'What industries or roles are you targeting?',
                        'Where does your audience spend time online?',
                        'What content would they find valuable?',
                    ],
                },
                {
                    title: 'Craft Your Positioning',
                    points: [
                        'Write a clear one-sentence positioning statement',
                        'Develop your elevator pitch',
                        'Identify 3-5 key topics you\'ll focus on',
                        'Choose the tone and personality of your brand',
                    ],
                },
            ],
        },
        {
            title: 'Build Your Online Presence',
            icon: 'globe',
            color: 'secondary',
            description: 'Create a consistent presence across platforms',
            steps: [
                {
                    title: 'Optimize LinkedIn',
                    points: [
                        'Professional photo and compelling headline',
                        'Comprehensive, keyword-rich profile',
                        'Featured section showcasing your best work',
                        'Recommendations from colleagues and clients',
                    ],
                },
                {
                    title: 'Consider Additional Platforms',
                    points: [
                        'Twitter/X for industry commentary and networking',
                        'GitHub for developers to showcase projects',
                        'Medium or personal blog for longer content',
                        'YouTube or podcast for audio/video content',
                    ],
                },
                {
                    title: 'Create a Portfolio',
                    points: [
                        'Personal website showcasing your work',
                        'Case studies of major projects',
                        'Testimonials and results',
                        'Contact information and CTA',
                    ],
                },
            ],
        },
        {
            title: 'Share Valuable Content',
            icon: 'share-nodes',
            color: 'accent',
            description: 'Demonstrate expertise through content creation',
            steps: [
                {
                    title: 'Content Strategy',
                    points: [
                        'Share insights from your daily work',
                        'Comment on industry trends and news',
                        'Create how-to guides and tutorials',
                        'Tell stories about challenges and lessons learned',
                    ],
                },
                {
                    title: 'Content Mix',
                    points: [
                        'Original posts and articles (60%)',
                        'Curated content with your insights (25%)',
                        'Engagement with others\' content (15%)',
                        'Maintain consistent posting schedule',
                    ],
                },
                {
                    title: 'Engage Authentically',
                    points: [
                        'Respond thoughtfully to comments',
                        'Support others in your network',
                        'Join relevant conversations',
                        'Be helpful, not self-promotional',
                    ],
                },
            ],
        },
        {
            title: 'Network & Collaborate',
            icon: 'users',
            color: 'success',
            description: 'Expand your reach through relationships',
            steps: [
                {
                    title: 'Strategic Networking',
                    points: [
                        'Connect with industry leaders and peers',
                        'Join professional groups and communities',
                        'Attend conferences and events',
                        'Participate in online discussions',
                    ],
                },
                {
                    title: 'Collaboration Opportunities',
                    points: [
                        'Guest post on established blogs',
                        'Appear on podcasts and webinars',
                        'Co-create content with others',
                        'Speak at industry events',
                    ],
                },
                {
                    title: 'Give Before You Ask',
                    points: [
                        'Introduce people who should know each other',
                        'Share others\' content generously',
                        'Offer help without expecting return',
                        'Be a connector in your community',
                    ],
                },
            ],
        },
    ];

    const contentIdeas = [
        { type: 'Lessons Learned', icon: 'lightbulb', example: 'Share a mistake you made and what you learned' },
        { type: 'How-To Guides', icon: 'list-ol', example: 'Step-by-step process for solving a common problem' },
        { type: 'Industry Commentary', icon: 'newspaper', example: 'Your take on recent news or trends' },
        { type: 'Behind the Scenes', icon: 'camera', example: 'Day in the life or how you approach your work' },
        { type: 'Tool Reviews', icon: 'wrench', example: 'Tools and resources you find valuable' },
        { type: 'Career Advice', icon: 'graduation-cap', example: 'Tips for others in your field' },
        { type: 'Project Showcases', icon: 'folder-open', example: 'Deep dive into a project you\'re proud of' },
        { type: 'Personal Stories', icon: 'book', example: 'Your career journey and pivotal moments' },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-warning to-secondary text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/resources/career-guides" className="btn btn-ghost btn-sm mb-4">
                            <i className="fa-solid fa-arrow-left"></i> Back to Career Guides
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <i className="fa-solid fa-badge-check text-4xl"></i>
                            <div>
                                <div className="badge badge-neutral mb-2">Personal Brand</div>
                                <h1 className="text-4xl font-bold">Personal Branding Essentials</h1>
                            </div>
                        </div>
                        <p className="text-xl opacity-90">
                            Build and promote your professional brand to stand out and advance your career.
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-sm opacity-80">
                            <span><i className="fa-solid fa-clock"></i> 8 min read</span>
                            <span><i className="fa-solid fa-user"></i> Brand Strategists</span>
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
                                In today's digital age, your personal brand is your reputation—it's what people say about you when you're not in the room. A strong personal brand can open doors to new opportunities, help you stand out in a crowded market, and accelerate your career growth.
                            </p>
                            <p>
                                Building a personal brand isn't about self-promotion—it's about clearly communicating your unique value, sharing your expertise generously, and building authentic relationships.
                            </p>
                        </div>
                    </div>

                    {/* The 4 Pillars */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">The 4 Pillars of Personal Branding</h2>
                        
                        <div className="space-y-8">
                            {pillars.map((pillar, pillarIndex) => (
                                <div key={pillarIndex} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={`w-16 h-16 rounded-full bg-${pillar.color}/20 flex items-center justify-center flex-shrink-0`}>
                                                <i className={`fa-solid fa-${pillar.icon} text-${pillar.color} text-2xl`}></i>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold">{pillar.title}</h3>
                                                <p className="text-base-content/70">{pillar.description}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {pillar.steps.map((step, stepIndex) => (
                                                <div key={stepIndex} className="bg-base-200 p-4 rounded-lg">
                                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                                        <i className="fa-solid fa-circle-check text-success"></i>
                                                        {step.title}
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {step.points.map((point, pointIndex) => (
                                                            <li key={pointIndex} className="flex items-start gap-2 text-sm">
                                                                <i className="fa-solid fa-chevron-right text-base-content/40 mt-1"></i>
                                                                <span>{point}</span>
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

                    {/* Content Ideas */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">Content Ideas to Get Started</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {contentIdeas.map((idea, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex items-center gap-3 mb-3">
                                            <i className={`fa-solid fa-${idea.icon} text-2xl text-primary`}></i>
                                            <h3 className="card-title text-lg">{idea.type}</h3>
                                        </div>
                                        <p className="text-sm text-base-content/70 italic">"{idea.example}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Example Brand Statement */}
                    <div className="card bg-base-100 shadow-lg mb-12">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-6">
                                <i className="fa-solid fa-quote-left text-primary"></i>
                                Example Brand Statement
                            </h2>
                            
                            <div className="bg-primary/10 p-6 rounded-lg border-l-4 border-primary mb-6">
                                <p className="font-bold mb-2">Before (Generic):</p>
                                <p className="italic mb-4">"Experienced marketing professional with 10 years in the industry."</p>
                                
                                <div className="divider"></div>
                                
                                <p className="font-bold mb-2 text-success">After (Branded):</p>
                                <p className="italic">
                                    "I help B2B SaaS companies turn complex technical features into compelling stories that drive pipeline. As a product marketing leader, I've launched 15+ products and generated over $50M in new revenue."
                                </p>
                            </div>
                            
                            <div className="alert alert-info">
                                <i className="fa-solid fa-lightbulb"></i>
                                <span>Notice how the "After" version is specific, value-focused, and memorable</span>
                            </div>
                        </div>
                    </div>

                    {/* 30-Day Action Plan */}
                    <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg mb-12">
                        <div className="card-body">
                            <h3 className="card-title text-2xl mb-6">
                                <i className="fa-solid fa-calendar-days"></i>
                                30-Day Personal Branding Plan
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold mb-3">Week 1: Foundation</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li>✓ Define your unique value and positioning</li>
                                        <li>✓ Write your brand statement and elevator pitch</li>
                                        <li>✓ Audit your current online presence</li>
                                        <li>✓ Update LinkedIn profile completely</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-3">Week 2: Setup</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li>✓ Get professional headshots taken</li>
                                        <li>✓ Create content calendar for next month</li>
                                        <li>✓ Join 3-5 relevant online communities</li>
                                        <li>✓ Start following industry leaders</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-3">Week 3: Content</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li>✓ Publish first piece of original content</li>
                                        <li>✓ Engage with 10 posts from your network</li>
                                        <li>✓ Share 3 pieces of curated content</li>
                                        <li>✓ Request recommendations on LinkedIn</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-3">Week 4: Growth</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li>✓ Publish second piece of content</li>
                                        <li>✓ Connect with 15 new people</li>
                                        <li>✓ Comment on industry discussions</li>
                                        <li>✓ Evaluate metrics and adjust strategy</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dos and Don'ts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="card bg-success/10 border border-success/30 shadow-lg">
                            <div className="card-body">
                                <h3 className="card-title text-success mb-4">
                                    <i className="fa-solid fa-check-circle"></i>
                                    Do This
                                </h3>
                                <ul className="space-y-2">
                                    {[
                                        'Be authentic and true to yourself',
                                        'Focus on providing value to others',
                                        'Stay consistent in your messaging',
                                        'Engage genuinely with your network',
                                        'Share both wins and lessons learned',
                                        'Be patient—building takes time',
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <i className="fa-solid fa-check text-success mt-1"></i>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="card bg-error/10 border border-error/30 shadow-lg">
                            <div className="card-body">
                                <h3 className="card-title text-error mb-4">
                                    <i className="fa-solid fa-times-circle"></i>
                                    Avoid This
                                </h3>
                                <ul className="space-y-2">
                                    {[
                                        'Being inauthentic or copying others',
                                        'Only self-promoting without giving value',
                                        'Posting inconsistently or disappearing',
                                        'Engaging in controversial arguments',
                                        'Oversharing personal information',
                                        'Expecting overnight results',
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <i className="fa-solid fa-times text-error mt-1"></i>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Related Resources */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title text-xl mb-4">Continue Building Your Career</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/resources/career-guides/networking" className="btn btn-outline">
                                    <i className="fa-solid fa-users"></i>
                                    Networking Guide
                                </Link>
                                <Link href="/resources/success-stories" className="btn btn-outline">
                                    <i className="fa-solid fa-star"></i>
                                    Success Stories
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
