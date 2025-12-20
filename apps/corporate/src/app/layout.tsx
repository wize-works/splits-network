import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Employment Networks - Modern Recruiting & Candidate Experience',
    description: 'Powering the future of recruiting with Splits (collaborative recruiting platform) and Applicant (modern candidate portal). Transform your hiring process with our innovative platforms.',
    metadataBase: new URL('https://employment-networks.com'),
    openGraph: {
        title: 'Employment Networks - Modern Recruiting & Candidate Experience',
        description: 'Powering the future of recruiting with Splits (collaborative recruiting platform) and Applicant (modern candidate portal). Transform your hiring process.',
        url: 'https://employment-networks.com',
        siteName: 'Employment Networks',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Employment Networks - The Future of Recruiting',
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Employment Networks - Modern Recruiting & Candidate Experience',
        description: 'Powering the future of recruiting with Splits and Applicant. Transform your hiring process.',
        images: ['/og-image.png'],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-theme="splits-light">
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.1/css/all.min.css"
                    integrity="sha512-5Hs3dF2AEPkpNAR7UiOHba+lRSJNeM2ECkwxUIxC1Q/FLycGTbNapWXB4tP889k5T5Ju8fs4b1P5z/iB4nMfSQ=="
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                />
            </head>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
