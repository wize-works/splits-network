export default function SuccessStoriesPage() {
    const stories = [
        {
            name: 'Sarah Chen',
            role: 'Software Engineer',
            company: 'TechCorp',
            image: '👩‍💻',
            quote: 'The platform made it easy to find remote opportunities. I landed my dream role within 3 weeks!',
            details: 'Transitioned from bootcamp graduate to senior engineer at a Fortune 500 company',
            salary: '$145K',
            timeline: '3 weeks',
        },
        {
            name: 'Michael Rodriguez',
            role: 'Product Manager',
            company: 'StartupX',
            image: '👨‍💼',
            quote: 'I appreciated the transparency in salary ranges. It helped me negotiate confidently.',
            details: 'Career pivot from sales to product management at a fast-growing startup',
            salary: '$135K + equity',
            timeline: '6 weeks',
        },
        {
            name: 'Emily Watson',
            role: 'UX Designer',
            company: 'DesignHub',
            image: '👩‍🎨',
            quote: 'The resources section was invaluable. I used the interview prep guides extensively.',
            details: 'First design role after self-taught journey, now leading design initiatives',
            salary: '$110K',
            timeline: '4 weeks',
        },
        {
            name: 'James Park',
            role: 'Data Analyst',
            company: 'DataFlow Inc',
            image: '👨‍💻',
            quote: 'Found a company that valued work-life balance. The culture fit is perfect!',
            details: 'Moved from finance to tech, found remote role with flexible hours',
            salary: '$95K',
            timeline: '5 weeks',
        },
        {
            name: 'Priya Patel',
            role: 'Marketing Director',
            company: 'GrowthCo',
            image: '👩‍💼',
            quote: 'The salary insights gave me the confidence to ask for what I deserved.',
            details: 'Negotiated 25% increase over initial offer using platform data',
            salary: '$150K',
            timeline: '8 weeks',
        },
        {
            name: 'David Kim',
            role: 'Sales Manager',
            company: 'CloudSolutions',
            image: '👨‍💼',
            quote: 'The application process was streamlined. I could track everything in one place.',
            details: 'Career change from retail to B2B SaaS sales, exceeded quota in first quarter',
            salary: '$120K + commission',
            timeline: '2 weeks',
        },
    ];

    const stats = [
        { number: '10K+', label: 'Success Stories', icon: 'star' },
        { number: '$125K', label: 'Average Salary', icon: 'dollar-sign' },
        { number: '4 weeks', label: 'Avg. Time to Hire', icon: 'clock' },
        { number: '94%', label: 'Satisfaction Rate', icon: 'heart' },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-warning to-accent text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <i className="fa-solid fa-star text-3xl"></i>
                            <h1 className="text-4xl font-bold">Success Stories</h1>
                        </div>
                        <p className="text-xl opacity-90">
                            Real stories from candidates who found their dream jobs through our platform.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {stats.map((stat, index) => (
                        <div key={index} className="card bg-base-100 shadow-lg">
                            <div className="card-body text-center">
                                <i className={`fa-solid fa-${stat.icon} text-4xl text-primary mb-2`}></i>
                                <div className="text-3xl font-bold text-primary">{stat.number}</div>
                                <div className="text-sm text-base-content/60">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {stories.map((story, index) => (
                        <div key={index} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="card-body">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="text-5xl">{story.image}</div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold">{story.name}</h3>
                                        <div className="text-primary font-medium">{story.role}</div>
                                        <div className="text-sm text-base-content/60">{story.company}</div>
                                    </div>
                                </div>

                                <div className="bg-base-200 p-4 rounded-lg mb-4">
                                    <i className="fa-solid fa-quote-left text-primary opacity-50"></i>
                                    <p className="italic my-2">{story.quote}</p>
                                    <i className="fa-solid fa-quote-right text-primary opacity-50 float-right"></i>
                                </div>

                                <p className="text-sm text-base-content/70 mb-4">
                                    {story.details}
                                </p>

                                <div className="flex gap-4 pt-4 border-t border-base-300">
                                    <div className="badge badge-success badge-lg">
                                        <i className="fa-solid fa-dollar-sign mr-1"></i>
                                        {story.salary}
                                    </div>
                                    <div className="badge badge-info badge-lg">
                                        <i className="fa-solid fa-clock mr-1"></i>
                                        {story.timeline}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content max-w-2xl mx-auto">
                        <div className="card-body">
                            <h2 className="card-title text-2xl justify-center mb-2">
                                Your success story starts here
                            </h2>
                            <p className="mb-4">
                                Join thousands of professionals who found their dream jobs through our platform.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <a href="/jobs" className="btn btn-neutral">
                                    Start Your Search <i className="fa-solid fa-arrow-right"></i>
                                </a>
                                <a href="/sign-up" className="btn btn-outline btn-neutral">
                                    Create Account
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
