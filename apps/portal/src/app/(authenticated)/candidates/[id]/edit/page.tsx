import { Suspense } from 'react';
import EditCandidateClient from './edit-candidate-client';

export default async function EditCandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    return (
        <div className="container mx-auto px-4 py-8">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            }>
                <EditCandidateClient candidateId={id} />
            </Suspense>
        </div>
    );
}
