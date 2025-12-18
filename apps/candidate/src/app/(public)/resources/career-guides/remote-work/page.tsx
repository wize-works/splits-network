import Link from 'next/link';

export default function RemoteWorkGuidePage() {
    const bestPractices = [
        {
            title: 'Create a Dedicated Workspace',
            description: 'Establish clear boundaries between work and personal life',
            icon: 'house-laptop',
            tips: [
                'Set up a specific area in your home exclusively for work',
                'Invest in ergonomic furniture and proper lighting',
                'Minimize distractions with noise-canceling headphones',
                'Keep your workspace organized and clutter-free',
            ],
        },
        {
            title: 'Maintain a Routine',
            description: 'Structure your day for maximum productivity',
            icon: 'clock',
            tips: [
                'Wake up and start work at consistent times',
                'Get dressed as if going to an office',
                'Schedule regular breaks throughout the day',
                'End your workday at a specific time',
            ],
        },
        {
            title: 'Communicate Effectively',
            description: 'Over-communicate to bridge the distance gap',
            icon: 'comments',
            tips: [
                'Use video calls for important discussions',
                'Provide regular updates to your team and manager',
                'Be responsive and acknowledge messages promptly',
                'Document decisions and action items clearly',
            ],
        },
        {
            title: 'Manage Your Time',
            description: 'Stay productive without overworking',
            icon: 'list-check',
            tips: [
                'Use time-blocking to structure your day',
                'Prioritize tasks using the Eisenhower Matrix',
                'Take advantage of your peak productivity hours',
                'Use tools like Pomodoro technique for focus',
            ],
        },
        {
            title: 'Stay Connected',
            description: 'Combat isolation and build relationships',
            icon: 'users',
            tips: [
                'Schedule regular virtual coffee chats with colleagues',
                'Participate actively in team meetings',
                'Join company social channels and events',
                'Work from cafes or coworking spaces occasionally',
            ],
        },
        {
            title: 'Maintain Work-Life Balance',
            description: 'Protect your personal time and wellbeing',
            icon: 'scale-balanced',
            tips: [
                'Close your laptop at the end of the day',
                'Use separate devices for work and personal use',
                'Take your vacation days without guilt',
                'Exercise and go outside daily',
            ],
        },
    ];

    const tools = [
        { category: 'Communication', tools: ['Slack', 'Microsoft Teams', 'Zoom', 'Google Meet'], icon: 'comments' },
        { category: 'Project Management', tools: ['Asana', 'Trello', 'Jira', 'Monday.com'], icon: 'list-check' },
        { category: 'Documentation', tools: ['Notion', 'Confluence', 'Google Docs', 'Loom'], icon: 'file-lines' },
        { category: 'Time Management', tools: ['Toggl', 'RescueTime', 'Clockify', 'Focus@Will'], icon: 'clock' },
    ];

    return (
        <div className="min-h-screen bg-base-200">
            {/* Header */}
            <div className="bg-gradient-to-br from-info to-primary text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Link href="/resources/career-guides" className="btn btn-ghost btn-sm mb-4">
                            <i className="fa-solid fa-arrow-left"></i> Back to Career Guides
                        </Link>
                        <div className="flex items-center gap-3 mb-4">
                            <i className="fa-solid fa-house-laptop text-4xl"></i>
                            <div>
                                <div className="badge badge-neutral mb-2">Remote Work</div>
                                <h1 className="text-4xl font-bold">Remote Work Best Practices</h1>
                            </div>
                        </div>
                        <p className="text-xl opacity-90">
                            Essential tips for staying productive and maintaining work-life balance while working remotely.
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-sm opacity-80">
                            <span><i className="fa-solid fa-clock"></i> 7 min read</span>
                            <span><i className="fa-solid fa-user"></i> Remote Work Experts</span>
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
                                Remote work offers incredible flexibility and freedom, but it also comes with unique challenges. Success requires intentionality around workspace setup, communication, time management, and maintaining healthy boundaries.
                            </p>
                            <p>
                                This guide will help you thrive in a remote work environment, whether you're new to remote work or looking to optimize your current setup.
                            </p>
                        </div>
                    </div>

                    {/* Best Practices */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">6 Pillars of Remote Work Success</h2>
                        
                        <div className="space-y-6">
                            {bestPractices.map((practice, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <i className={`fa-solid fa-${practice.icon} text-primary text-2xl`}></i>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold mb-2">{practice.title}</h3>
                                                <p className="text-base-content/70 mb-4">{practice.description}</p>
                                                
                                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {practice.tips.map((tip, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <i className="fa-solid fa-check text-success mt-1"></i>
                                                            <span className="text-sm">{tip}</span>
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

                    {/* Essential Tools */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-8">Essential Remote Work Tools</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tools.map((toolCategory, index) => (
                                <div key={index} className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex items-center gap-3 mb-4">
                                            <i className={`fa-solid fa-${toolCategory.icon} text-2xl text-primary`}></i>
                                            <h3 className="card-title text-xl">{toolCategory.category}</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {toolCategory.tools.map((tool, i) => (
                                                <span key={i} className="badge badge-lg badge-outline">{tool}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Daily Schedule Example */}
                    <div className="card bg-base-100 shadow-lg mb-12">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-6">
                                <i className="fa-solid fa-calendar-day text-primary"></i>
                                Sample Remote Work Day
                            </h2>
                            
                            <div className="space-y-3">
                                {[
                                    { time: '8:00 AM', activity: 'Morning routine & breakfast', icon: 'mug-hot' },
                                    { time: '9:00 AM', activity: 'Start work - Review priorities & emails', icon: 'list-check' },
                                    { time: '10:00 AM', activity: 'Deep work block (2 hours)', icon: 'laptop-code' },
                                    { time: '12:00 PM', activity: 'Lunch break & walk outside', icon: 'utensils' },
                                    { time: '1:00 PM', activity: 'Team meetings & collaboration', icon: 'users' },
                                    { time: '3:00 PM', activity: 'Afternoon deep work or lighter tasks', icon: 'pen' },
                                    { time: '5:00 PM', activity: 'Wrap up & plan tomorrow', icon: 'clock' },
                                    { time: '5:30 PM', activity: 'End work & personal time', icon: 'house' },
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 hover:bg-base-200 rounded-lg transition-colors">
                                        <div className="w-20 font-mono text-sm text-primary font-bold">{item.time}</div>
                                        <i className={`fa-solid fa-${item.icon} text-base-content/40`}></i>
                                        <div className="flex-1">{item.activity}</div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="alert alert-info mt-4">
                                <i className="fa-solid fa-circle-info"></i>
                                <span className="text-sm">Adjust this schedule to match your peak productivity hours and team's timezone</span>
                            </div>
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
                                    <span>Create clear boundaries between work and personal life with a dedicated workspace</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Over-communicate with your team to compensate for lack of in-person interaction</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Maintain a consistent routine and schedule to stay productive</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <i className="fa-solid fa-check-circle text-xl mt-0.5"></i>
                                    <span>Prioritize connection with colleagues and protect your mental health</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Related Resources */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h3 className="card-title text-xl mb-4">Explore More</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/jobs?q=remote" className="btn btn-primary">
                                    <i className="fa-solid fa-house-laptop"></i>
                                    Remote Jobs
                                </Link>
                                <Link href="/resources/career-guides/first-90-days" className="btn btn-outline">
                                    <i className="fa-solid fa-rocket"></i>
                                    First 90 Days
                                </Link>
                                <Link href="/resources/career-guides" className="btn btn-outline">
                                    <i className="fa-solid fa-book"></i>
                                    All Guides
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
