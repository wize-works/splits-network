import { Metadata } from 'next';
import InvitationPageClient from './invitation-client';

export const metadata: Metadata = {
    title: 'Recruiter Invitation | Applicant Network',
    description: 'Review and respond to your recruiter invitation',
};

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: PageProps) {
    const { token } = await params;
    
    return <InvitationPageClient token={token} />;
}
