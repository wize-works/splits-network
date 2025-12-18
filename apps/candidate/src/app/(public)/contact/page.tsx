'use client';

import type { Metadata } from 'next';
import { useState, FormEvent } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // TODO: Implement actual API call to send contact form
      // For now, simulate submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: 'general', message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-check-circle text-5xl text-success"></i>
            </div>
            <h2 className="card-title justify-center text-3xl">Message Sent!</h2>
            <p className="text-base-content/80 mb-6">
              Thank you for contacting us. We've received your message and will respond within 1-2 business days.
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="btn btn-primary"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Touch</span>
        </h1>
        <p className="text-xl md:text-2xl text-base-content/80 max-w-3xl mx-auto">
          Have a question or need help? We're here for you. Send us a message and we'll respond as soon as possible.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Contact Form */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Send us a Message</h2>
            
            {error && (
              <div className="alert alert-error mb-4">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="fieldset">
                <label className="label">Name *</label>
                <input 
                  type="text"
                  className="input w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="fieldset">
                <label className="label">Email *</label>
                <input 
                  type="email"
                  className="input w-full"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="fieldset">
                <label className="label">Subject *</label>
                <select 
                  className="select w-full"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                >
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="recruiter">Recruiter Questions</option>
                  <option value="candidate">Candidate Questions</option>
                  <option value="partnership">Partnership Opportunities</option>
                  <option value="press">Press & Media</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="fieldset">
                <label className="label">Message *</label>
                <textarea
                  className="textarea w-full h-32"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  required
                />
                <label className="label">
                  <span className="label-text-alt">Please provide as much detail as possible</span>
                </label>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane mr-2"></i>
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <i className="fa-solid fa-envelope text-primary"></i>
                Email Us
              </h3>
              <div className="space-y-2">
                <p className="text-base-content/80">
                  <strong>General:</strong> <a href="mailto:hello@applicant.network" className="link link-primary">hello@applicant.network</a>
                </p>
                <p className="text-base-content/80">
                  <strong>Support:</strong> <a href="mailto:support@applicant.network" className="link link-primary">support@applicant.network</a>
                </p>
                <p className="text-base-content/80">
                  <strong>Recruiters:</strong> <a href="mailto:hello@splits.network" className="link link-primary">hello@splits.network</a>
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <i className="fa-solid fa-clock text-secondary"></i>
                Support Hours
              </h3>
              <div className="space-y-2 text-base-content/80">
                <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM EST</p>
                <p><strong>Saturday:</strong> 10:00 AM - 4:00 PM EST</p>
                <p><strong>Sunday:</strong> Closed</p>
                <p className="text-sm mt-4">
                  We typically respond within 1-2 business days. For urgent issues, please mark your inquiry as "Technical Support."
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <i className="fa-solid fa-location-dot text-accent"></i>
                Office Location
              </h3>
              <p className="text-base-content/80">
                Splits Network, Inc.<br />
                [Street Address]<br />
                [City, State ZIP]<br />
                United States
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                <i className="fa-solid fa-share-nodes text-info"></i>
                Follow Us
              </h3>
              <div className="flex gap-4 mt-2">
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-circle btn-outline"
                  aria-label="Twitter"
                >
                  <i className="fa-brands fa-twitter text-xl"></i>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-circle btn-outline"
                  aria-label="LinkedIn"
                >
                  <i className="fa-brands fa-linkedin text-xl"></i>
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-circle btn-outline"
                  aria-label="Facebook"
                >
                  <i className="fa-brands fa-facebook text-xl"></i>
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-circle btn-outline"
                  aria-label="Instagram"
                >
                  <i className="fa-brands fa-instagram text-xl"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Quick Links */}
      <section className="bg-base-200 rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Need Quick Answers?</h2>
        <p className="text-lg text-base-content/80 mb-6">
          Check out our Help Center for answers to frequently asked questions.
        </p>
        <a href="/help" className="btn btn-primary btn-lg">
          <i className="fa-solid fa-circle-question mr-2"></i>
          Visit Help Center
        </a>
      </section>
    </div>
  );
}
