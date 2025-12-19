import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Invitation Declined | Applicant Network',
    description: 'You have declined the recruiter invitation',
};

export default function DeclinedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                <div className="card-body text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-base-300 rounded-full p-6">
                            <i className="fa-solid fa-times-circle text-6xl text-base-content/60"></i>
                        </div>
                    </div>
                    
                    <h1 className="text-4xl font-bold mb-4">
                        Invitation Declined
                    </h1>
                    
                    <p className="text-xl text-base-content/70 mb-6">
                        You've declined this invitation. Your recruiter has been notified of your decision.
                    </p>
                    
                    <div className="bg-base-200 rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-3">Changed Your Mind?</h2>
                        <p className="mb-3">
                            If you'd like to work with this recruiter after all, please contact them directly. 
                            They can send you a new invitation if you're both interested in working together.
                        </p>
                    </div>

                    <div className="alert alert-info mb-6">
                        <i className="fa-solid fa-info-circle"></i>
                        <div className="text-left">
                            <p className="font-semibold">Your feedback matters</p>
                            <p className="text-sm">
                                If you provided a reason for declining, your recruiter will receive it. 
                                This helps them understand how to better serve candidates in the future.
                            </p>
                        </div>
                    </div>
                    
                    <div className="card-actions justify-center">
                        <Link href="/" className="btn btn-primary btn-lg">
                            <i className="fa-solid fa-home"></i>
                            Go to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
