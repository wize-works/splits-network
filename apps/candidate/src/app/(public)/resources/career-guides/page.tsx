import Link from 'next/link';

export default function CareerGuidesPage() {
    const guides = [
        {
            title: 'How to Switch Careers Successfully',
            description: 'A comprehensive guide to transitioning into a new career path with confidence.',
            category: 'Career Change',
            readTime: '8 min read',
            icon: 'arrows-turn-right',
            href: '/resources/career-guides/switch-careers',
        },
        {
            title: 'Building Your Professional Network',
            description: 'Learn strategies to grow and maintain meaningful professional connections.',
            category: 'Networking',
            readTime: '6 min read',
            icon: 'users',
            href: '/resources/career-guides/networking',
        },
        {
            title: 'Remote Work Best Practices',
            description: 'Tips for staying productive and maintaining work-life balance while remote.',
            category: 'Remote Work',
            readTime: '7 min read',
            icon: 'house-laptop',
            href: '/resources/career-guides/remote-work',
        },
        {
            title: 'Negotiating Your Job Offer',
            description: 'Master the art of salary and benefits negotiation with confidence.',
            category: 'Compensation',
            readTime: '10 min read',
            icon: 'handshake',
            href: '/resources/career-guides/negotiating-offers',
        },
        {
            title: 'First 90 Days in a New Role',
            description: 'Set yourself up for success in your new position from day one.',
            category: 'Career Growth',
            readTime: '9 min read',
            icon: 'rocket',
            href: '/resources/career-guides/first-90-days',
        },
        {
            title: 'Personal Branding Essentials',
            description: 'Build and promote your professional brand across multiple platforms.',
            category: 'Personal Brand',
            readTime: '8 min read',
            icon: 'badge-check',
            href: '/resources/career-guides/personal-branding',
        },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-primary text-primary-content py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <i className="fa-solid fa-book text-3xl"></i>
                            <h1 className="text-4xl font-bold">Career Guides</h1>
                        </div>
                        <p className="text-xl opacity-90">
                            Expert advice and actionable strategies to advance your career at every stage.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guides.map((guide, index) => (
                        <div key={index} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body">
                                <div className="flex items-start justify-between mb-3">
                                    <i className={`fa-solid fa-${guide.icon} text-3xl text-primary`}></i>
                                    <span className="badge badge-ghost">{guide.category}</span>
                                </div>
                                <h2 className="card-title text-xl mb-2">{guide.title}</h2>
                                <p className="text-base-content/70 text-sm flex-grow">
                                    {guide.description}
                                </p>
                                <div className="card-actions justify-between items-center mt-4 pt-4 border-t border-base-300">
                                    <span className="text-xs text-base-content/60">
                                        <i className="fa-solid fa-clock"></i> {guide.readTime}
                                    </span>
                                    <Link href={guide.href} className="btn btn-primary btn-sm">
                                        Read Guide <i className="fa-solid fa-arrow-right"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="mt-16 text-center">
                    <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content max-w-2xl mx-auto">
                        <div className="card-body">
                            <h2 className="card-title text-2xl justify-center mb-2">
                                Ready to take the next step?
                            </h2>
                            <p className="mb-4">
                                Browse thousands of opportunities from top companies.
                            </p>
                            <Link href="/jobs" className="btn btn-neutral">
                                Explore Jobs <i className="fa-solid fa-briefcase"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
