import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";
import CookieConsent from "@/components/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
    title: "Applicant Network - Find Your Next Career Opportunity",
    description: "Browse thousands of job opportunities and manage your job search on Applicant Network. Track applications, verify credentials, and connect with recruiters.",
    openGraph: {
        title: 'Applicant Network - Find Your Next Career Opportunity',
        description: 'Browse thousands of job opportunities and manage your job search on Applicant Network. Track applications, verify credentials, and connect with recruiters.',
        url: 'https://applicant.network',
        siteName: 'Applicant Network',
        images: [
            {
                url: 'https://applicant.network/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Applicant Network - Career Opportunities',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Applicant Network - Find Your Next Career Opportunity',
        description: 'Browse thousands of job opportunities and manage your job search on Applicant Network.',
        images: ['https://applicant.network/og-image.png'],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // For the portal (browser-facing app), we use environment variables directly
    // Backend services use Vault for secret management
    // Note: CLERK_SECRET_KEY is used automatically by Clerk SDK on the server
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (!publishableKey) {
        throw new Error('Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable');
    }
    return (
        <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
            <html lang="en" data-theme="applicant-light">
                <head>
                    <script src="https://kit.fontawesome.com/728c8ddec8.js" crossOrigin="anonymous"></script>
                </head>
                <body className="flex flex-col min-h-screen bg-base-200">
                    <Header />
                    <main className="flex-1">
                        {children}
                    </main>
                    <Footer />
                    <CookieConsent />
                </body>
            </html>
        </ClerkProvider>
    );
}
