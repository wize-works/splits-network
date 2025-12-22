import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

async function fetchFromGateway(endpoint: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
}

export default async function BillingPage() {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const token = await getToken();
    if (!token) {
        redirect('/sign-in');
    }

    // Fetch user profile to check permissions
    const profileResponse: any = await fetchFromGateway('/api/me', token);
    const profile = profileResponse?.data;
    const memberships = profile?.memberships || [];

    // Check if user has access to billing
    const hasAccess = memberships.some((m: any) =>
        ['company_admin', 'recruiter', 'admin'].includes(m.role)
    );

    if (!hasAccess) {
        redirect('/dashboard');
    }

    const isRecruiter = memberships.some((m: any) => m.role === 'recruiter');
    const isCompanyAdmin = memberships.some((m: any) => m.role === 'company_admin');

    return (
        <div className="container mx-auto py-6 px-4 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">
                    <i className="fa-solid fa-credit-card mr-3"></i>
                    Billing & Subscriptions
                </h1>
                <p className="text-base-content/70 mt-2">
                    Manage your subscriptions, payment methods, and billing history
                </p>
            </div>

            <div className="space-y-6">
                {/* Current Plan Section */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title">
                            <i className="fa-solid fa-box"></i>
                            Current Plan
                            <div className="badge badge-primary">Active</div>
                        </h2>
                        <div className="divider my-2"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">
                                    {isRecruiter ? 'Recruiter Professional' : 'Company Starter'}
                                </h3>
                                <p className="text-base-content/70 mb-4">
                                    {isRecruiter
                                        ? 'Full access to job opportunities and candidate management'
                                        : 'Post jobs and manage applications'}
                                </p>
                                <div className="text-2xl font-bold">
                                    $99<span className="text-base font-normal text-base-content/70">/month</span>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between">
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-check text-success"></i>
                                        <span className="text-sm">Unlimited job applications</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-check text-success"></i>
                                        <span className="text-sm">Candidate tracking system</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-check text-success"></i>
                                        <span className="text-sm">Email notifications</span>
                                    </div>
                                </div>
                                <button className="btn btn-outline" disabled>
                                    <i className="fa-solid fa-lock"></i>
                                    Manage Plan (Coming Soon)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Method Section */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title">
                            <i className="fa-solid fa-wallet"></i>
                            Payment Method
                        </h2>
                        <div className="divider my-2"></div>

                        <div className="alert alert-info">
                            <i className="fa-solid fa-info-circle"></i>
                            <div>
                                <div className="font-semibold">Stripe Integration Coming Soon</div>
                                <div className="text-sm">
                                    Payment processing and subscription management will be available soon.
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-base-200 rounded-lg opacity-60">
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">
                                    <i className="fa-brands fa-cc-visa"></i>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold">•••• •••• •••• 4242</div>
                                    <div className="text-sm text-base-content/70">Expires 12/2025</div>
                                </div>
                                <button className="btn btn-sm btn-ghost" disabled>
                                    <i className="fa-solid fa-pen"></i>
                                    Edit
                                </button>
                            </div>
                        </div>

                        <button className="btn btn-primary mt-4" disabled>
                            <i className="fa-solid fa-plus"></i>
                            Add Payment Method
                        </button>
                    </div>
                </div>

                {/* Billing History Section */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title">
                            <i className="fa-solid fa-receipt"></i>
                            Billing History
                        </h2>
                        <div className="divider my-2"></div>

                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Invoice</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="opacity-60">
                                        <td>Dec 1, 2025</td>
                                        <td>Monthly Subscription</td>
                                        <td>$99.00</td>
                                        <td>
                                            <div className="badge badge-success">Paid</div>
                                        </td>
                                        <td>
                                            <button className="btn btn-xs btn-ghost" disabled>
                                                <i className="fa-solid fa-download"></i>
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="opacity-60">
                                        <td>Nov 1, 2025</td>
                                        <td>Monthly Subscription</td>
                                        <td>$99.00</td>
                                        <td>
                                            <div className="badge badge-success">Paid</div>
                                        </td>
                                        <td>
                                            <button className="btn btn-xs btn-ghost" disabled>
                                                <i className="fa-solid fa-download"></i>
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="opacity-60">
                                        <td>Oct 1, 2025</td>
                                        <td>Monthly Subscription</td>
                                        <td>$99.00</td>
                                        <td>
                                            <div className="badge badge-success">Paid</div>
                                        </td>
                                        <td>
                                            <button className="btn btn-xs btn-ghost" disabled>
                                                <i className="fa-solid fa-download"></i>
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {isRecruiter && (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fa-solid fa-money-bill-transfer"></i>
                                Payout Settings
                            </h2>
                            <div className="divider my-2"></div>

                            <div className="alert alert-info">
                                <i className="fa-solid fa-info-circle"></i>
                                <div>
                                    <div className="font-semibold">Payout Management Coming Soon</div>
                                    <div className="text-sm">
                                        Manage your bank account details and payout preferences for placement fees.
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-4">
                                <div className="fieldset">
                                    <label className="label">Bank Account</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Not configured"
                                        disabled
                                    />
                                </div>

                                <div className="fieldset">
                                    <label className="label">Payout Schedule</label>
                                    <select className="select" disabled>
                                        <option>Weekly</option>
                                        <option>Bi-weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>

                                <button className="btn btn-primary" disabled>
                                    <i className="fa-solid fa-gear"></i>
                                    Configure Payout Settings
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Danger Zone - Only for Admins */}
                {(isCompanyAdmin || profile?.role === 'admin') && (
                    <div className="card bg-base-100 shadow-sm border-2 border-error">
                        <div className="card-body">
                            <h2 className="card-title text-error">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                Danger Zone
                            </h2>
                            <div className="divider my-2"></div>

                            <p className="text-base-content/70 mb-4">
                                Permanently cancel your subscription and delete associated data.
                            </p>

                            <button className="btn btn-error btn-outline" disabled>
                                <i className="fa-solid fa-ban"></i>
                                Cancel Subscription
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
