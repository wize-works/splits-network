'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { useState } from 'react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    {
      id: 'getting-started',
      icon: 'fa-rocket',
      title: 'Getting Started',
      faqs: [
        {
          question: 'How do I create an account?',
          answer: 'Click the "Get Started" button in the top navigation or on the homepage. You can sign up using your email address or through Google/LinkedIn. Simply fill out your basic information, verify your email, and you\'re ready to start exploring job opportunities!'
        },
        {
          question: 'Is Applicant Network really free for candidates?',
          answer: 'Yes! Applicant Network is 100% free for all job seekers. You\'ll never pay a fee to create a profile, browse jobs, apply to positions, or work with recruiters. Recruiters pay a placement fee to the hiring company when they successfully place a candidate.'
        },
        {
          question: 'How do I create my profile?',
          answer: 'After signing up, go to your Profile page. You can upload your resume (which will automatically populate many fields), add your work experience, education, skills, and career preferences. The more complete your profile, the better matches you\'ll receive!'
        },
      ]
    },
    {
      id: 'applications',
      icon: 'fa-file-lines',
      title: 'Applications & Job Search',
      faqs: [
        {
          question: 'How do I apply to jobs?',
          answer: 'Browse available jobs on the Jobs page. When you find a role you\'re interested in, click "Apply Now." You\'ll be matched with a specialized recruiter who will review your application and reach out if you\'re a good fit.'
        },
        {
          question: 'Can I apply to multiple jobs at once?',
          answer: 'Absolutely! You can apply to as many jobs as you\'d like. Each application goes to a specialized recruiter for that specific role and company. We recommend applying to positions that genuinely interest you and match your skills.'
        },
        {
          question: 'How do I track my applications?',
          answer: 'Visit your Dashboard or Applications page to see all your active applications. You\'ll see the status of each application (submitted, under review, interviewing, etc.), which recruiter is managing it, and any messages or updates.'
        },
        {
          question: 'What if I don\'t hear back after applying?',
          answer: 'Recruiters typically respond within 3-5 business days. If you haven\'t heard back, it usually means the role wasn\'t the right match. Don\'t worry—keep applying to other opportunities! Not every application will be a perfect fit, and that\'s normal in the job search process.'
        },
      ]
    },
    {
      id: 'recruiters',
      icon: 'fa-user-tie',
      title: 'Working with Recruiters',
      faqs: [
        {
          question: 'How are recruiters matched to my applications?',
          answer: 'When you apply to a job, you\'re automatically matched with the recruiter who specializes in that industry and role. Each recruiter has expertise in specific fields (tech, healthcare, finance, etc.) to provide the best guidance.'
        },
        {
          question: 'Can I choose my recruiter?',
          answer: 'Recruiters are assigned based on the specific job you apply to. Each job posting has a dedicated recruiter who knows the role and company well. You can view recruiter profiles and specializations on job listings before applying.'
        },
        {
          question: 'How do I communicate with my recruiter?',
          answer: 'Once a recruiter reaches out about your application, you can message them directly through our platform. Go to your Applications page and click on the specific application to view your conversation thread.'
        },
        {
          question: 'What should I expect from my recruiter?',
          answer: 'Your recruiter will guide you through the hiring process, provide interview preparation, offer feedback, and advocate for you with the employer. They\'ll keep you updated on your application status and help negotiate salary when you receive an offer.'
        },
      ]
    },
    {
      id: 'profile',
      icon: 'fa-user-circle',
      title: 'Profile & Documents',
      faqs: [
        {
          question: 'What should I include in my profile?',
          answer: 'Include your work experience, education, skills, certifications, and career preferences (desired salary, locations, job types). Upload a current resume and consider adding a professional photo. The more complete your profile, the better recommendations you\'ll receive.'
        },
        {
          question: 'How do I update my resume?',
          answer: 'Go to your Profile page and click on the Documents section. You can upload a new resume anytime. Your previous versions will be saved, and you can choose which version to use for new applications.'
        },
        {
          question: 'Who can see my profile?',
          answer: 'Your profile is private until you apply to a job. Only recruiters whose jobs you\'ve applied to can see your full profile and application materials. Your information is never shared publicly or sold to third parties.'
        },
        {
          question: 'Can I make my profile searchable by recruiters?',
          answer: 'Yes! In your Privacy Settings, you can opt-in to make your profile visible to recruiters searching for candidates with your skills. This increases your chances of being contacted about opportunities that match your background.'
        },
      ]
    },
    {
      id: 'interviews',
      icon: 'fa-handshake',
      title: 'Interviews & Offers',
      faqs: [
        {
          question: 'How does interview scheduling work?',
          answer: 'Your recruiter will coordinate interview scheduling between you and the employer. You\'ll receive interview details through the platform with date, time, format (phone, video, in-person), and who you\'ll be meeting with.'
        },
        {
          question: 'Will my recruiter help me prepare for interviews?',
          answer: 'Yes! Your recruiter will provide interview preparation, including information about the company, role-specific questions you might be asked, and tips for success. Don\'t hesitate to ask your recruiter for guidance.'
        },
        {
          question: 'What happens if I receive a job offer?',
          answer: 'Congratulations! Your recruiter will help you review the offer, understand the compensation package, and negotiate terms if needed. They\'ll guide you through accepting the offer and transitioning to your new role.'
        },
        {
          question: 'Can I decline a job offer?',
          answer: 'Of course! You\'re never obligated to accept an offer. If a position isn\'t the right fit, simply let your recruiter know. They\'ll continue helping you find the perfect opportunity.'
        },
      ]
    },
    {
      id: 'account',
      icon: 'fa-gear',
      title: 'Account & Settings',
      faqs: [
        {
          question: 'How do I change my email or password?',
          answer: 'Click your profile icon in the top right and go to Account Settings. From there, you can update your email address, change your password, and manage other account preferences.'
        },
        {
          question: 'How do I manage email notifications?',
          answer: 'In your Account Settings, go to Notifications. You can control which emails you receive, including job recommendations, application updates, recruiter messages, and promotional emails.'
        },
        {
          question: 'Can I pause my job search temporarily?',
          answer: 'Yes! In your Account Settings, you can set your profile to "Not Currently Looking." This will pause job recommendations and recruiter outreach. You can reactivate anytime when you\'re ready to resume your search.'
        },
        {
          question: 'How do I delete my account?',
          answer: 'We\'re sorry to see you go! In Account Settings, scroll to the bottom and click "Delete Account." Your data will be permanently removed within 30 days. Note that this action cannot be undone.'
        },
      ]
    },
    {
      id: 'privacy',
      icon: 'fa-shield-halved',
      title: 'Privacy & Security',
      faqs: [
        {
          question: 'Is my personal information secure?',
          answer: 'Yes! We use industry-standard encryption and security measures to protect your data. Your information is stored securely and never sold to third parties. Read our Privacy Policy for complete details.'
        },
        {
          question: 'Who has access to my resume and application?',
          answer: 'Only the specific recruiters whose jobs you\'ve applied to can see your resume and application materials. Your information is not visible to other recruiters, employers, or the public unless you opt-in to make your profile searchable.'
        },
        {
          question: 'Can my current employer see that I\'m job searching?',
          answer: 'No. Your profile is completely private, and you control who sees your information. When you apply to jobs, only those specific recruiters have access to your application. We never share your information publicly.'
        },
      ]
    },
    {
      id: 'troubleshooting',
      icon: 'fa-wrench',
      title: 'Technical Issues',
      faqs: [
        {
          question: 'I\'m having trouble logging in. What should I do?',
          answer: 'First, try resetting your password using the "Forgot Password" link on the login page. If that doesn\'t work, clear your browser cache and cookies, or try a different browser. Still having issues? Contact our support team at support@applicant.network.'
        },
        {
          question: 'My resume upload isn\'t working. Help!',
          answer: 'Ensure your resume is in PDF, DOC, or DOCX format and under 5MB. Try using a different browser or device. If the problem persists, email your resume to support@applicant.network with your account email, and we\'ll upload it for you.'
        },
        {
          question: 'I\'m not receiving email notifications.',
          answer: 'Check your spam/junk folder first. Add notifications@applicant.network to your contacts. Verify your notification settings in Account Settings. If you still don\'t receive emails, contact support.'
        },
      ]
    },
  ];

  const filteredCategories = searchQuery
    ? faqCategories.map(category => ({
        ...category,
        faqs: category.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.faqs.length > 0)
    : faqCategories;

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          How Can We <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Help?</span>
        </h1>
        <p className="text-xl text-base-content/80 max-w-2xl mx-auto mb-8">
          Find answers to common questions about using Applicant Network.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="fieldset">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50"></i>
              <input
                type="text"
                className="input w-full pl-12 pr-4"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {faqCategories.map(category => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="card-body items-center text-center p-6">
                <i className={`fa-solid ${category.icon} text-4xl text-primary mb-2`}></i>
                <h3 className="font-semibold">{category.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="space-y-12">
        {filteredCategories.map(category => (
          <div key={category.id} id={category.id}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <i className={`fa-solid ${category.icon} text-2xl text-primary`}></i>
              </div>
              <h2 className="text-3xl font-bold">{category.title}</h2>
            </div>
            <div className="space-y-3">
              {category.faqs.map((faq, index) => (
                <div key={index} className="collapse collapse-plus bg-base-100 shadow-lg">
                  <input type="radio" name={`faq-${category.id}`} />
                  <div className="collapse-title text-lg font-semibold">
                    {faq.question}
                  </div>
                  <div className="collapse-content">
                    <p className="text-base-content/80 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {searchQuery && filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <i className="fa-solid fa-magnifying-glass text-6xl text-base-content/20 mb-4"></i>
          <h3 className="text-2xl font-bold mb-2">No results found</h3>
          <p className="text-base-content/60 mb-6">
            We couldn't find any answers matching "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="btn btn-primary"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Still Need Help Section */}
      <section className="mt-16 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Still Need Help?</h2>
        <p className="text-xl text-base-content/80 mb-8 max-w-2xl mx-auto">
          Can't find what you're looking for? Our support team is here to help you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact" className="btn btn-primary btn-lg">
            <i className="fa-solid fa-envelope mr-2"></i>
            Contact Support
          </Link>
          <a href="mailto:support@applicant.network" className="btn btn-outline btn-lg">
            <i className="fa-solid fa-at mr-2"></i>
            Email Us
          </a>
        </div>
      </section>
    </div>
  );
}
