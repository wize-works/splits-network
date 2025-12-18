import Link from 'next/link';

export default function NetworkingGuidePage() {
    const strategies = [
        {
            title: 'Online Networking',
            icon: 'globe',
            color: 'primary',
            tactics: [
                'Optimize your LinkedIn profile with keywords and a professional photo',
                'Engage with industry content by commenting and sharing insights',
                'Join relevant LinkedIn groups and participate in discussions',
                'Connect with 5-10 new people in your industry each week',
                'Share valuable content that demonstrates your expertise',
            ],
        },
        {
            title: 'In-Person Networking',
            icon: 'handshake',
            color: 'secondary',
            tactics: [
                'Attend industry conferences, meetups, and workshops',
                'Join professional associations in your field',
                'Volunteer for industry organizations or events',
                'Attend alumni events from your school or bootcamp',
                'Follow up within 24-48 hours after meeting someone',
            ],
        },
        {
            title: 'Informational Interviews',
            icon: 'comments',
            color: 'accent',
            tactics: [
                'Request 20-30 minute coffee chats, not job interviews',
                'Prepare thoughtful questions about their career path',
                'Show genuine curiosity about their work and insights',
                'Ask for advice, not favors',
                'Send a thank-you note and keep them updated on your progress',
            ],
        },
        {
            title: 'Building Relationships',
            icon: 'users',
            color: 'success',
            tactics: [
                'Focus on giving value before asking for anything',
                'Stay in touch regularly, not just when you need something',
                'Congratulate connections on career milestones',
                'Share relevant opportunities or articles with your network',
                'Introduce people who could benefit from knowing each other',
            ],
        },
    ];

    const tips = [
        {
            title: 'Quality Over Quantity',
            description: 'Focus on building genuine relationships with people you connect with, rather than collecting hundreds of superficial contacts.',
            icon: 'star',
        },
        {
            title: 'Be Authentic',
            description: 'People can sense when you\'re being genuine. Share your real interests, challenges, and goals.',
            icon: 'heart',
        },
        {
            title: 'Follow Up Consistently',
            description: 'The fortune is in the follow-up. Maintain relationships by checking in regularly, even when you don\'t need anything.',
            icon: 'calendar-check',
        },
        {
            title: 'Give Before You Ask',
            description: 'Look for ways to help others before requesting favors. Building goodwill creates lasting relationships.',
            icon: 'gift',
        },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-secondary to-accent text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/resources/career-guides" className="btn btn-ghost btn-sm mb-4">
                            <i className="fa-solid fa-arrow-left"></i> Back to Career Guides
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <i className="fa-solid fa-users text-4xl"></i>
                            <div>
                                <div className="badge badge-neutral mb-2">Networking</div>
                                <h1 className="text-4xl font-bold">Building Your Professional Network</h1>
                            </div>
                        </div>
                        <p className="text-xl opacity-90">
                            Learn strategies to grow and maintain meaningful professional connections that advance your career.
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-sm opacity-80">
                            <span><i className="fa-solid fa-clock"></i> 6 min read</span>
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
                                Your professional network is one of your most valuable career assets. Studies show that up to 85% of jobs are filled through networking, and strong professional connections can open doors to opportunities, mentorship, and career growth.
                            </p>
                            <p>
                                Building a meaningful network isn't about collecting business cards—it's about cultivating genuine relationships with people who can support your career journey, and whom you can support in return.
                            </p>
                        </div>
                    </div>

                    {/* Networking Strategies */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">Effective Networking Strategies</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {strategies.map((strategy, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className={`w-14 h-14 rounded-full bg-${strategy.color}/20 flex items-center justify-center mb-4`}>
                                            <i className={`fa-solid fa-${strategy.icon} text-${strategy.color} text-2xl`}></i>
                                        </div>
                                        <h3 className="card-title text-xl mb-4">{strategy.title}</h3>
                                        <ul className="space-y-2">
                                            {strategy.tactics.map((tactic, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm">
                                                    <i className="fa-solid fa-check text-success mt-1"></i>
                                                    <span>{tactic}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Your Elevator Pitch */}
                    <div className="card bg-base-100 shadow-lg mb-12">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-microphone text-primary"></i>
                                Crafting Your Elevator Pitch
                            </h2>
                            <p className="mb-4 text-base-content/70">
                                Have a clear, concise answer to "What do you do?" that sparks interest and conversation:
                            </p>
                            
                            <div className="bg-base-200 p-6 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <h4 className="font-bold text-sm mb-2">WHO YOU ARE</h4>
                                        <p className="text-sm">Your role/expertise</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm mb-2">WHAT YOU DO</h4>
                                        <p className="text-sm">Key value you provide</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm mb-2">WHY IT MATTERS</h4>
                                        <p className="text-sm">Impact of your work</p>
                                    </div>
                                </div>
                                
                                <div className="divider">Example</div>
                                
                                <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                                    <p className="italic">
                                        "I'm a product manager at a healthcare tech startup. I lead the team building tools that help doctors spend less time on paperwork and more time with patients. We've helped reduce administrative work by 40% at over 200 clinics."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Networking Best Practices */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">Networking Best Practices</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tips.map((tip, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex items-start gap-4">
                                            <i className={`fa-solid fa-${tip.icon} text-3xl text-primary`}></i>
                                            <div>
                                                <h3 className="card-title text-xl mb-2">{tip.title}</h3>
                                                <p className="text-base-content/70">{tip.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Plan */}
                    <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg mb-12">
                        <div className="card-body">
                            <h3 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-list-check"></i>
                                30-Day Networking Action Plan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold mb-3">Week 1-2: Foundation</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li>✓ Optimize LinkedIn profile</li>
                                        <li>✓ List 20 people you'd like to connect with</li>
                                        <li>✓ Join 3 relevant industry groups</li>
                                        <li>✓ Craft your elevator pitch</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-3">Week 3-4: Engagement</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li>✓ Request 3 informational interviews</li>
                                        <li>✓ Attend 1 industry event</li>
                                        <li>✓ Comment on 10 posts from connections</li>
                                        <li>✓ Share 2 pieces of valuable content</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Resources */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title text-xl mb-4">Continue Learning</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/resources/career-guides/switch-careers" className="btn btn-outline">
                                    <i className="fa-solid fa-arrows-turn-right"></i>
                                    Career Transitions
                                </Link>
                                <Link href="/resources/career-guides/personal-branding" className="btn btn-outline">
                                    <i className="fa-solid fa-badge-check"></i>
                                    Personal Branding
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
