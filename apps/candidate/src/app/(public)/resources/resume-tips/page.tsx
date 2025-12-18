export default function ResumeTipsPage() {
    const tips = [
        {
            title: 'Start with a Strong Summary',
            description: 'Begin with a compelling professional summary that highlights your key qualifications and career goals in 2-3 sentences.',
            icon: 'pen-fancy',
            dos: [
                'Tailor it to the specific role',
                'Include relevant keywords',
                'Highlight your unique value proposition',
            ],
            donts: [
                'Use generic statements',
                'Make it too long',
                'Include personal information',
            ],
        },
        {
            title: 'Quantify Your Achievements',
            description: 'Use numbers, percentages, and metrics to demonstrate the impact of your work.',
            icon: 'chart-line',
            dos: [
                'Use specific numbers and percentages',
                'Show before-and-after comparisons',
                'Include timeframes',
            ],
            donts: [
                'List vague responsibilities',
                'Exaggerate your contributions',
                'Forget context',
            ],
        },
        {
            title: 'Use Action Verbs',
            description: 'Start each bullet point with strong action verbs to make your experience more dynamic.',
            icon: 'bolt',
            dos: [
                'Led, managed, developed, implemented',
                'Optimized, increased, reduced',
                'Collaborated, coordinated, facilitated',
            ],
            donts: [
                'Responsible for...',
                'Helped with...',
                'Worked on...',
            ],
        },
        {
            title: 'Tailor for Each Application',
            description: 'Customize your resume for each position by emphasizing relevant skills and experiences.',
            icon: 'bullseye',
            dos: [
                'Match keywords from job description',
                'Prioritize relevant experience',
                'Adjust your summary',
            ],
            donts: [
                'Send the same resume everywhere',
                'Include irrelevant information',
                'Keyword stuff',
            ],
        },
    ];

    const sections = [
        {
            title: 'Contact Information',
            icon: 'address-card',
            content: 'Name, phone, email, LinkedIn, portfolio/website (if relevant)',
        },
        {
            title: 'Professional Summary',
            icon: 'user',
            content: '2-3 sentences highlighting your experience and value proposition',
        },
        {
            title: 'Work Experience',
            icon: 'briefcase',
            content: 'Listed in reverse chronological order with quantified achievements',
        },
        {
            title: 'Education',
            icon: 'graduation-cap',
            content: 'Degrees, certifications, and relevant coursework',
        },
        {
            title: 'Skills',
            icon: 'code',
            content: 'Technical skills, tools, and relevant competencies',
        },
        {
            title: 'Additional (Optional)',
            icon: 'star',
            content: 'Projects, publications, volunteer work, awards',
        },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-info to-primary text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <i className="fa-solid fa-file-alt text-3xl"></i>
                            <h1 className="text-4xl font-bold">Resume Tips</h1>
                        </div>
                        <p className="text-xl opacity-90">
                            Expert guidance to create a resume that stands out and gets you interviews.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                {/* Essential Sections */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">Essential Resume Sections</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sections.map((section, index) => (
                            <div key={index} className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="flex items-center gap-3 mb-3">
                                        <i className={`fa-solid fa-${section.icon} text-2xl text-primary`}></i>
                                        <h3 className="card-title text-lg">{section.title}</h3>
                                    </div>
                                    <p className="text-sm text-base-content/70">{section.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detailed Tips */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">Best Practices</h2>
                    
                    <div className="space-y-8">
                        {tips.map((tip, index) => (
                            <div key={index} className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                            <i className={`fa-solid fa-${tip.icon} text-primary text-xl`}></i>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold mb-2">{tip.title}</h3>
                                            <p className="text-base-content/70">{tip.description}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div className="bg-success/10 p-4 rounded-lg border border-success/30">
                                            <h4 className="font-bold text-success mb-3 flex items-center gap-2">
                                                <i className="fa-solid fa-check-circle"></i>
                                                DO:
                                            </h4>
                                            <ul className="space-y-2">
                                                {tip.dos.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <i className="fa-solid fa-check text-success mt-0.5"></i>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-error/10 p-4 rounded-lg border border-error/30">
                                            <h4 className="font-bold text-error mb-3 flex items-center gap-2">
                                                <i className="fa-solid fa-times-circle"></i>
                                                DON'T:
                                            </h4>
                                            <ul className="space-y-2">
                                                {tip.donts.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <i className="fa-solid fa-times text-error mt-0.5"></i>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Checklist */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">Final Checklist</h2>
                    
                    <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title text-2xl mb-4">Before You Submit</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    'Proofread for typos and grammar',
                                    'Ensure consistent formatting',
                                    'Check that contact info is current',
                                    'Verify all dates are accurate',
                                    'Keep it to 1-2 pages',
                                    'Use a professional font',
                                    'Save as PDF format',
                                    'Use a clear filename (FirstName_LastName_Resume.pdf)',
                                ].map((item, index) => (
                                    <label key={index} className="flex items-start gap-3 cursor-pointer hover:bg-base-100/10 p-3 rounded-lg transition-colors">
                                        <input type="checkbox" className="checkbox checkbox-neutral" />
                                        <span>{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <div className="card bg-base-100 shadow-lg max-w-2xl mx-auto">
                        <div className="card-body">
                            <h2 className="card-title text-2xl justify-center mb-2">
                                Resume ready? Start applying!
                            </h2>
                            <p className="mb-4 text-base-content/70">
                                Browse thousands of opportunities and submit your polished resume.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <a href="/jobs" className="btn btn-primary">
                                    Browse Jobs <i className="fa-solid fa-briefcase"></i>
                                </a>
                                <a href="/resources/interview-prep" className="btn btn-outline">
                                    Interview Prep
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
