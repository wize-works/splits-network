import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Invitation Accepted | Applicant Network',
    description: 'You have successfully accepted the recruiter invitation',
};

export default function AcceptedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
            <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                <div className="card-body text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 rounded-full p-6">
                            <i className="fa-solid fa-check-circle text-6xl text-green-600"></i>
                        </div>
                    </div>
                    
                    <h1 className="text-4xl font-bold text-green-600 mb-4">
                        Invitation Accepted!
                    </h1>
                    
                    <p className="text-xl text-gray-700 mb-6">
                        You've successfully accepted the invitation and granted your recruiter the right to represent you.
                    </p>
                    
                    <div className="bg-blue-50 rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-3 text-blue-800">What Happens Next?</h2>
                        <ul className="text-left space-y-3">
                            <li className="flex items-start gap-3">
                                <i className="fa-solid fa-1 text-blue-600 mt-1"></i>
                                <span>Your recruiter will receive a notification of your acceptance</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <i className="fa-solid fa-2 text-blue-600 mt-1"></i>
                                <span>They'll start searching for job opportunities that match your profile</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <i className="fa-solid fa-3 text-blue-600 mt-1"></i>
                                <span>You'll receive updates when you're submitted to positions</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <i className="fa-solid fa-4 text-blue-600 mt-1"></i>
                                <span>Track all your applications right here on Applicant Network</span>
                            </li>
                        </ul>
                    </div>

                    <div className="alert alert-info mb-6">
                        <i className="fa-solid fa-info-circle"></i>
                        <span>
                            Your recruiter will contact you directly about next steps and potential opportunities.
                        </span>
                    </div>
                    
                    <div className="card-actions justify-center">
                        <Link href="/" className="btn btn-primary btn-lg">
                            <i className="fa-solid fa-home"></i>
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
