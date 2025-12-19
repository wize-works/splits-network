import Link from 'next/link';
import UserDropdown from './user-dropdown';

export default function AuthenticatedNav() {
  return (
    <nav className="navbar bg-base-100 shadow-sm">
      <div className="container mx-auto">
        <div className="flex-1">
          <Link href="/dashboard" className="btn btn-ghost text-xl">
            <i className="fa-solid fa-briefcase"></i>
            Applicant Network
          </Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li>
              <Link href="/jobs">Browse Jobs</Link>
            </li>
            <li>
              <Link href="/dashboard">
                <i className="fa-solid fa-house"></i>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/applications">
                <i className="fa-solid fa-file-lines"></i>
                Applications
              </Link>
            </li>
            <li>
              <Link href="/profile">
                <i className="fa-solid fa-user"></i>
                Profile
              </Link>
            </li>
            <li>
              <Link href="/documents">
                <i className="fa-solid fa-folder"></i>
                Documents
              </Link>
            </li>
            <li className="ml-4">
              <UserDropdown />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
