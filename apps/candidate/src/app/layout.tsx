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
    return (
        <ClerkProvider>
            <html lang="en" data-theme="applicant-light">
                <head>
                    <link
                        rel="stylesheet"
                        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
                        integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                    />
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
