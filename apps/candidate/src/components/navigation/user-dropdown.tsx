'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function UserDropdown() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' });
  };

  const getInitials = () => {
    if (!user) return '?';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || '?';
  };

  const getDisplayName = () => {
    if (!user) return 'User';
    return user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || 'User';
  };

  const getUserEmail = () => {
    if (!user) return '';
    return user.emailAddresses[0]?.emailAddress || '';
  };

  const getAvatarUrl = () => {
    return user?.imageUrl;
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
        <div className="w-10 rounded-full">
          {getAvatarUrl() ? (
            <img
              alt={getDisplayName()}
              src={getAvatarUrl()}
            />
          ) : (
            <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-semibold">
              {getInitials()}
            </div>
          )}
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu dropdown-content mt-3 z-1 shadow-lg bg-base-100 rounded-box border border-base-300 space-y-2 overflow-hidden"
      >
          {/* User Info Header */}
          <li className="menu-title px-4 py-3 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-12 rounded-full">
                  {getAvatarUrl() ? (
                    <img
                      alt={getDisplayName()}
                      src={getAvatarUrl()}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-semibold text-lg">
                      {getInitials()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-base-content truncate">{getDisplayName()}</div>
                <div className="text-xs text-base-content/60 truncate">{getUserEmail()}</div>
              </div>
            </div>
          </li>

          {/* Menu Items */}
        <li>
          <Link href="/dashboard">
            <i className="fa-solid fa-house"></i>
            Dashboard
          </Link>
        </li>
          <li>
          <Link href="/profile">
            <i className="fa-solid fa-user"></i>
            Profile
          </Link>
        </li>
        <li>
          <Link href="/applications">
            <i className="fa-solid fa-file-lines"></i>
            Applications
          </Link>
        </li>
        <li>
          <Link href="/documents">
            <i className="fa-solid fa-folder-open"></i>
          Documents
            </Link>
          </li>

          {/* Divider */}
          <li>
            <hr className="border-base-300" />
          </li>

          {/* Sign Out */}
          <li>
            <button onClick={handleSignOut} className="text-error">
              <i className="fa-solid fa-right-from-bracket"></i>
              Sign Out
            </button>
          </li>
        </ul>
    </div>
  );
}
