import { Metadata } from 'next';
import InvitationsPageClient from './invitations-client';

export const metadata: Metadata = {
    title: 'Candidate Invitations | Splits Network',
    description: 'Track and manage your candidate invitations',
};

export default function InvitationsPage() {
    return <InvitationsPageClient />;
}
