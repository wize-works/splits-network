export default function InterviewPrepPage() {
    const tips = [
        {
            title: 'Research the Company',
            description: 'Understand the company\'s mission, products, culture, and recent news before your interview.',
            icon: 'magnifying-glass',
            color: 'primary',
        },
        {
            title: 'Practice Common Questions',
            description: 'Prepare thoughtful answers to behavioral and technical questions using the STAR method.',
            icon: 'comments',
            color: 'secondary',
        },
        {
            title: 'Prepare Questions to Ask',
            description: 'Have 3-5 insightful questions ready to ask about the role, team, and company.',
            icon: 'circle-question',
            color: 'accent',
        },
        {
            title: 'Dress Appropriately',
            description: 'Choose professional attire that matches the company culture and role.',
            icon: 'user-tie',
            color: 'info',
        },
        {
            title: 'Test Your Tech Setup',
            description: 'For virtual interviews, test your camera, microphone, and internet connection ahead of time.',
            icon: 'video',
            color: 'warning',
        },
        {
            title: 'Follow Up Professionally',
            description: 'Send a thank-you email within 24 hours expressing gratitude and reiterating interest.',
            icon: 'envelope',
            color: 'success',
        },
    ];

    const commonQuestions = [
        'Tell me about yourself',
        'Why are you interested in this role?',
        'What are your greatest strengths and weaknesses?',
        'Describe a challenge you faced and how you overcame it',
        'Where do you see yourself in 5 years?',
        'Why should we hire you?',
        'Tell me about a time you worked in a team',
        'How do you handle stress and pressure?',
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-secondary to-accent text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <i className="fa-solid fa-user-tie text-3xl"></i>
                            <h1 className="text-4xl font-bold">Interview Preparation</h1>
                        </div>
                        <p className="text-xl opacity-90">
                            Everything you need to ace your next interview and land your dream job.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12">
                {/* Essential Tips */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">Essential Interview Tips</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tips.map((tip, index) => (
                            <div key={index} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                                <div className="card-body">
                                    <div className={`w-14 h-14 rounded-full bg-${tip.color}/20 flex items-center justify-center mb-4`}>
                                        <i className={`fa-solid fa-${tip.icon} text-${tip.color} text-2xl`}></i>
                                    </div>
                                    <h3 className="card-title text-xl mb-2">{tip.title}</h3>
                                    <p className="text-base-content/70">
                                        {tip.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Common Questions */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">Common Interview Questions</h2>
                    
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <p className="mb-4 text-base-content/70">
                                Practice answering these frequently asked questions to feel confident and prepared:
                            </p>
                            <ul className="space-y-3">
                                {commonQuestions.map((question, index) => (
                                    <li key={index} className="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg transition-colors">
                                        <i className="fa-solid fa-circle-check text-success text-lg mt-0.5"></i>
                                        <span className="font-medium">{question}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* STAR Method */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8">The STAR Method</h2>
                    
                    <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg">
                        <div className="card-body">
                            <p className="text-lg mb-6">
                                Use the STAR method to structure your answers to behavioral questions:
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-base-100/10 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className="fa-solid fa-s text-2xl"></i>
                                        <h3 className="text-xl font-bold">Situation</h3>
                                    </div>
                                    <p>Describe the context or background</p>
                                </div>
                                
                                <div className="bg-base-100/10 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className="fa-solid fa-t text-2xl"></i>
                                        <h3 className="text-xl font-bold">Task</h3>
                                    </div>
                                    <p>Explain your responsibility or goal</p>
                                </div>
                                
                                <div className="bg-base-100/10 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className="fa-solid fa-a text-2xl"></i>
                                        <h3 className="text-xl font-bold">Action</h3>
                                    </div>
                                    <p>Detail the steps you took</p>
                                </div>
                                
                                <div className="bg-base-100/10 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className="fa-solid fa-r text-2xl"></i>
                                        <h3 className="text-xl font-bold">Result</h3>
                                    </div>
                                    <p>Share the outcomes and impact</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <div className="card bg-base-100 shadow-lg max-w-2xl mx-auto">
                        <div className="card-body">
                            <h2 className="card-title text-2xl justify-center mb-2">
                                Ready to put your skills to work?
                            </h2>
                            <p className="mb-4 text-base-content/70">
                                Start applying to opportunities that match your experience and career goals.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <a href="/jobs" className="btn btn-primary">
                                    Browse Jobs <i className="fa-solid fa-briefcase"></i>
                                </a>
                                <a href="/resources/career-guides" className="btn btn-outline">
                                    More Resources
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
