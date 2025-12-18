export default function IndustryTrendsPage() {
    const trends = [
        {
            title: 'Remote Work Revolution',
            description: 'Remote and hybrid work models continue to dominate, with 74% of companies offering flexible work arrangements.',
            icon: 'house-laptop',
            color: 'primary',
            impact: 'High',
            growth: '+45%',
        },
        {
            title: 'AI & Automation',
            description: 'AI integration across industries is creating new roles while transforming existing ones. Demand for AI skills up 200%.',
            icon: 'robot',
            color: 'secondary',
            impact: 'Very High',
            growth: '+200%',
        },
        {
            title: 'Skills-Based Hiring',
            description: 'Companies prioritizing skills over degrees, focusing on practical abilities and project portfolios.',
            icon: 'graduation-cap',
            color: 'accent',
            impact: 'High',
            growth: '+60%',
        },
        {
            title: 'Mental Health Focus',
            description: 'Companies investing in employee well-being programs, mental health support, and work-life balance initiatives.',
            icon: 'heart-pulse',
            color: 'success',
            impact: 'Medium',
            growth: '+35%',
        },
        {
            title: 'Gig Economy Growth',
            description: 'Rise of contract and freelance work, with 36% of workers participating in the gig economy.',
            icon: 'handshake',
            color: 'warning',
            impact: 'High',
            growth: '+28%',
        },
        {
            title: 'Diversity & Inclusion',
            description: 'Increased focus on diverse hiring practices and inclusive workplace cultures across all industries.',
            icon: 'users',
            color: 'info',
            impact: 'High',
            growth: '+52%',
        },
    ];

    const sectors = [
        {
            name: 'Technology',
            growth: 'Strong',
            hotRoles: ['AI Engineer', 'Cloud Architect', 'Data Scientist'],
            icon: 'laptop-code',
            color: 'primary',
        },
        {
            name: 'Healthcare',
            growth: 'Very Strong',
            hotRoles: ['Nurse Practitioner', 'Health Informatics', 'Telehealth Specialist'],
            icon: 'briefcase-medical',
            color: 'error',
        },
        {
            name: 'Green Energy',
            growth: 'Explosive',
            hotRoles: ['Solar Engineer', 'Sustainability Consultant', 'EV Technician'],
            icon: 'leaf',
            color: 'success',
        },
        {
            name: 'E-commerce',
            growth: 'Strong',
            hotRoles: ['UX Designer', 'Digital Marketing', 'Supply Chain Manager'],
            icon: 'cart-shopping',
            color: 'warning',
        },
    ];

    const skills = [
        { name: 'AI/Machine Learning', demand: 95, icon: 'brain' },
        { name: 'Cloud Computing', demand: 90, icon: 'cloud' },
        { name: 'Cybersecurity', demand: 88, icon: 'shield-halved' },
        { name: 'Data Analysis', demand: 85, icon: 'chart-line' },
        { name: 'Digital Marketing', demand: 80, icon: 'bullhorn' },
        { name: 'Project Management', demand: 75, icon: 'list-check' },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-accent to-secondary text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <i className="fa-solid fa-trending-up text-3xl"></i>
                            <h1 className="text-4xl font-bold">Industry Trends</h1>
                        </div>
                        <p className="text-xl opacity-90">
                            Stay ahead of the curve with insights into the evolving job market and emerging opportunities.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                {/* Major Trends */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">Major Trends Shaping 2025</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trends.map((trend, index) => (
                            <div key={index} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body">
                                    <div className={`w-14 h-14 rounded-full bg-${trend.color}/20 flex items-center justify-center mb-4`}>
                                        <i className={`fa-solid fa-${trend.icon} text-${trend.color} text-2xl`}></i>
                                    </div>
                                    
                                    <h3 className="card-title text-xl mb-2">{trend.title}</h3>
                                    <p className="text-sm text-base-content/70 flex-grow">
                                        {trend.description}
                                    </p>
                                    
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-base-300">
                                        <div className="badge badge-outline">{trend.impact} Impact</div>
                                        <div className="badge badge-success">{trend.growth}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hot Sectors */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">Fastest Growing Sectors</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {sectors.map((sector, index) => (
                            <div key={index} className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-16 h-16 rounded-full bg-${sector.color}/20 flex items-center justify-center`}>
                                            <i className={`fa-solid fa-${sector.icon} text-${sector.color} text-3xl`}></i>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold">{sector.name}</h3>
                                            <div className="badge badge-success">{sector.growth} Growth</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-bold mb-2">Hot Roles:</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {sector.hotRoles.map((role, i) => (
                                                <span key={i} className="badge badge-outline">{role}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* In-Demand Skills */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">Most In-Demand Skills</h2>
                    
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="space-y-6">
                                {skills.map((skill, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <i className={`fa-solid fa-${skill.icon} text-primary text-xl`}></i>
                                                <span className="font-semibold">{skill.name}</span>
                                            </div>
                                            <span className="text-sm text-base-content/60">{skill.demand}% demand</span>
                                        </div>
                                        <div className="w-full bg-base-300 rounded-full h-3">
                                            <div 
                                                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                                                style={{ width: `${skill.demand}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insights Card */}
                <div className="mb-16">
                    <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title text-2xl mb-4">
                                <i className="fa-solid fa-lightbulb"></i>
                                Key Takeaways
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Invest in continuous learning and skill development to stay competitive</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Focus on building both technical and soft skills for career resilience</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Consider emerging fields and industries with strong growth potential</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Embrace flexibility and adaptability as core career competencies</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <div className="card bg-base-100 shadow-lg max-w-2xl mx-auto">
                        <div className="card-body">
                            <h2 className="card-title text-2xl justify-center mb-2">
                                Find opportunities in growing industries
                            </h2>
                            <p className="mb-4 text-base-content/70">
                                Explore jobs in the sectors and roles that are shaping the future of work.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <a href="/jobs" className="btn btn-primary">
                                    Browse Jobs <i className="fa-solid fa-briefcase"></i>
                                </a>
                                <a href="/resources/salary-insights" className="btn btn-outline">
                                    Salary Insights
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
