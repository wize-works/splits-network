'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
    const pathname = usePathname();

    // Don't show footer on auth pages
    const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname?.startsWith('/sso-callback');
    if (isAuthPage) {
        return null;
    }

    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-base-200 text-base-content">
            {/* Main Footer Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/logo.svg" alt="Splits Network" className="h-18" />
                        </div>
                        <p className="text-base-content/70 mb-6 max-w-md">
                            The modern platform for split-fee recruiting. Connecting specialized recruiters with companies seeking top talent.
                        </p>
                        <div className="flex gap-3">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content">
                                <i className="fa-brands fa-twitter text-lg"></i>
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content">
                                <i className="fa-brands fa-linkedin text-lg"></i>
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content">
                                <i className="fa-brands fa-facebook text-lg"></i>
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                                className="btn btn-circle btn-ghost btn-sm hover:bg-primary hover:text-primary-content">
                                <i className="fa-brands fa-github text-lg"></i>
                            </a>
                        </div>
                    </div>

                    {/* Product Column */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/features" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/how-it-works" className="link link-hover text-base-content/70 hover:text-base-content">
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link href="/integrations" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Integrations
                                </Link>
                            </li>
                            <li>
                                <Link href="/updates" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Updates
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Company</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="link link-hover text-base-content/70 hover:text-base-content">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/careers" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="/press" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Press Kit
                                </Link>
                            </li>
                            <li>
                                <Link href="/partners" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Partners
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Support</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a href="#" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Contact Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="link link-hover text-base-content/70 hover:text-base-content">
                                    Documentation
                                </a>
                            </li>
                            <li>
                                <a href="#" className="link link-hover text-base-content/70 hover:text-base-content">
                                    API Reference
                                </a>
                            </li>
                            <li>
                                <Link href="/status" className="link link-hover text-base-content/70 hover:text-base-content">
                                    System Status
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-base-300">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-base-content/60">
                            © {currentYear} Employment Networks, Inc. All rights reserved.
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <a href="#" className="link link-hover text-base-content/60 hover:text-base-content">
                                Privacy Policy
                            </a>
                            <a href="#" className="link link-hover text-base-content/60 hover:text-base-content">
                                Terms of Service
                            </a>
                            <a href="#" className="link link-hover text-base-content/60 hover:text-base-content">
                                Cookie Policy
                            </a>
                            <a href="#" className="link link-hover text-base-content/60 hover:text-base-content">
                                Sitemap
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating CTA Badge (optional - shows on scroll) */}
            <div className="hidden">
                <div className="fixed bottom-8 right-8 z-40">
                    <Link href="/sign-up" className="btn btn-primary btn-lg shadow-2xl">
                        <i className="fa-solid fa-rocket"></i>
                        Get Started Free
                    </Link>
                </div>
            </div>
        </footer>
    );
}
