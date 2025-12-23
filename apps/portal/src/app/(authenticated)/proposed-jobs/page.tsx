import ProposedJobsList from '../dashboard/components/proposed-jobs-list';

export default function ProposedJobsPage() {
    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Proposed Jobs</h1>
                <p className="text-base-content/70">
                    Track all the opportunities you've proposed to candidates
                </p>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <ProposedJobsList />
                </div>
            </div>
        </div>
    );
}
