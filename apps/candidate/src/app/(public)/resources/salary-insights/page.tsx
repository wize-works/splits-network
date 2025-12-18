export default function SalaryInsightsPage() {
    const insights = [
        {
            role: 'Software Engineer',
            avgSalary: '$125,000',
            range: '$95K - $170K',
            growth: '+8%',
            icon: 'code',
            color: 'primary',
        },
        {
            role: 'Product Manager',
            avgSalary: '$135,000',
            range: '$105K - $180K',
            growth: '+12%',
            icon: 'lightbulb',
            color: 'secondary',
        },
        {
            role: 'Sales Director',
            avgSalary: '$145,000',
            range: '$110K - $200K',
            growth: '+6%',
            icon: 'handshake',
            color: 'accent',
        },
        {
            role: 'UX Designer',
            avgSalary: '$105,000',
            range: '$80K - $140K',
            growth: '+10%',
            icon: 'palette',
            color: 'info',
        },
        {
            role: 'Marketing Manager',
            avgSalary: '$95,000',
            range: '$75K - $130K',
            growth: '+7%',
            icon: 'bullhorn',
            color: 'warning',
        },
        {
            role: 'Data Analyst',
            avgSalary: '$90,000',
            range: '$70K - $120K',
            growth: '+15%',
            icon: 'chart-simple',
            color: 'success',
        },
    ];

    const factors = [
        {
            title: 'Location',
            description: 'Geographic location significantly impacts salary. Major tech hubs often pay 20-40% more.',
            icon: 'location-dot',
        },
        {
            title: 'Experience',
            description: 'Years of experience and expertise level are key drivers of compensation.',
            icon: 'briefcase',
        },
        {
            title: 'Company Size',
            description: 'Startups vs. enterprises offer different comp structures and equity opportunities.',
            icon: 'building',
        },
        {
            title: 'Industry',
            description: 'Tech, finance, and healthcare sectors typically offer higher compensation.',
            icon: 'industry',
        },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-success to-accent text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <i className="fa-solid fa-chart-line text-3xl"></i>
                            <h1 className="text-4xl font-bold">Salary Insights</h1>
                        </div>
                        <p className="text-xl opacity-90">
                            Real salary data and compensation trends to help you know your worth.
                        </p>
                    </div>
                </div>
            </div>

            {/* Salary Data */}
            <div className="container mx-auto px-4 py-12">
                <h2 className="text-3xl font-bold mb-8">Average Salaries by Role</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {insights.map((insight, index) => (
                        <div key={index} className={`card bg-base-100 shadow-lg border-t-4 border-${insight.color}`}>
                            <div className="card-body">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-full bg-${insight.color}/20 flex items-center justify-center`}>
                                        <i className={`fa-solid fa-${insight.icon} text-${insight.color} text-xl`}></i>
                                    </div>
                                    <h3 className="card-title text-lg">{insight.role}</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm text-base-content/60 mb-1">Average Salary</div>
                                        <div className="text-3xl font-bold text-success">{insight.avgSalary}</div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-3 border-t border-base-300">
                                        <div>
                                            <div className="text-xs text-base-content/60">Range</div>
                                            <div className="font-semibold">{insight.range}</div>
                                        </div>
                                        <div className="badge badge-success badge-lg">
                                            <i className="fa-solid fa-arrow-trend-up mr-1"></i>
                                            {insight.growth}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Factors Affecting Salary */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">What Affects Your Salary?</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {factors.map((factor, index) => (
                            <div key={index} className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="flex items-start gap-4">
                                        <i className={`fa-solid fa-${factor.icon} text-3xl text-primary`}></i>
                                        <div>
                                            <h3 className="card-title text-xl mb-2">{factor.title}</h3>
                                            <p className="text-base-content/70">{factor.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content max-w-2xl mx-auto">
                        <div className="card-body">
                            <h2 className="card-title text-2xl justify-center mb-2">
                                Find your next opportunity
                            </h2>
                            <p className="mb-4">
                                Browse jobs with transparent salary information and competitive compensation.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <a href="/jobs" className="btn btn-neutral">
                                    Browse Jobs <i className="fa-solid fa-briefcase"></i>
                                </a>
                                <a href="/resources/career-guides" className="btn btn-outline btn-neutral">
                                    Career Guides
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
