export default async function AdminPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-base-content/70 mt-1">
                    Platform administration and management
                </p>
            </div>

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body items-center text-center py-12">
                    <i className="fa-solid fa-gear text-6xl text-base-content/20"></i>
                    <h3 className="text-xl font-semibold mt-4">Coming Soon</h3>
                    <p className="text-base-content/70 mt-2">
                        Admin features are under development
                    </p>
                </div>
            </div>
        </div>
    );
}
