'use client';

export function Topbar() {
    return (
        <div className="navbar bg-base-100 border-b border-base-300">
            <div className="flex-none lg:hidden">
                <label htmlFor="sidebar-drawer" className="btn btn-square btn-ghost">
                    <i className="fa-solid fa-bars text-xl"></i>
                </label>
            </div>
            <div className="flex-1">
                <h1 className="text-xl font-semibold ml-4">Dashboard</h1>
            </div>
            <div className="flex-none gap-2">
                {/* Subscription status indicator */}
                <div className="badge badge-success gap-2">
                    <i className="fa-solid fa-circle-check"></i>
                    Active
                </div>
            </div>
        </div>
    );
}
