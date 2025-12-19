'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import UserDropdown from './user-dropdown';

export default function Header() {
  const { isSignedIn } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    // Initialize theme from localStorage on mount
    try {
      const saved = localStorage.getItem('theme');
      if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        setIsDark(saved === 'applicant-dark');
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Close other dropdowns when one is opened
    const handleToggle = (e: Event) => {
      const target = e.target as HTMLDetailsElement;
      if (target.tagName === 'DETAILS' && target.open) {
        const allDetails = menuRef.current?.querySelectorAll('details');
        allDetails?.forEach((details) => {
          if (details !== target && details.open) {
            details.open = false;
          }
        });
      }
    };

    const menu = menuRef.current;
    menu?.addEventListener('toggle', handleToggle, true);
    return () => menu?.removeEventListener('toggle', handleToggle, true);
  }, []);

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.currentTarget.checked;
    const theme = checked ? 'applicant-dark' : 'applicant-light';
    document.documentElement.setAttribute('data-theme', theme);
    setIsDark(checked);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/jobs?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const closeAllDropdowns = () => {
    const allDetails = menuRef.current?.querySelectorAll('details');
    allDetails?.forEach((details) => {
      details.open = false;
    });
  };

  const jobCategories = [
    { name: 'Engineering', icon: 'code', count: '2.3K' },
    { name: 'Sales', icon: 'handshake', count: '1.8K' },
    { name: 'Marketing', icon: 'bullhorn', count: '1.2K' },
    { name: 'Design', icon: 'palette', count: '890' },
    { name: 'Product', icon: 'lightbulb', count: '760' },
    { name: 'Customer Success', icon: 'headset', count: '540' },
  ];

  return (
    <div className="navbar bg-base-100 shadow-md sticky top-0 z-50 border-b border-base-300">
      {/* Mobile Menu */}
      <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <i className="fa-solid fa-bars text-xl"></i>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-64">
              <li className="menu-title">Jobs</li>
              <li><Link href="/jobs">All Jobs</Link></li>
              <li><Link href="/jobs?q=remote">Remote Jobs</Link></li>
              <li><Link href="/jobs?q=director">Director Roles</Link></li>
              <li className="menu-title mt-2">Resources</li>
              <li><Link href="/resources/career-guides">Career Guides</Link></li>
              <li><Link href="/resources/salary-insights">Salary Insights</Link></li>
              <li><Link href="/resources/interview-prep">Interview Prep</Link></li>
              <li><Link href="/resources/success-stories">Success Stories</Link></li>
              <li className="menu-title mt-2">Companies</li>
              <li><Link href="/companies">Browse Companies</Link></li>
              <li><Link href="/companies/featured">Featured Employers</Link></li>
              {isSignedIn && (
                <>
                  <li className="menu-title mt-2">My Account</li>
                  <li><Link href="/dashboard">Dashboard</Link></li>
                  <li><Link href="/applications">Applications</Link></li>
                  <li><Link href="/profile">Profile</Link></li>
                  <li><Link href="/documents">Documents</Link></li>
                </>
              )}
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost text-xl">
            <i className="fa-solid fa-briefcase text-primary"></i>
            <span className="hidden sm:inline font-bold">Applicant Network</span>
          </Link>
        </div>
        
        {/* Desktop Mega Menu */}
        <div className="navbar-center hidden lg:flex relative">
          <ul className="menu menu-horizontal px-1 gap-1" ref={menuRef}>

            {/* Simple Links */}
            <li><Link href="/how-it-works">How It Works</Link></li>
            {/* Jobs Mega Dropdown */}
            <li>
              <details>
                <summary>Jobs</summary>
                <ul className="p-6 bg-base-100 shadow-2xl border border-base-300 rounded-box min-w-[600px] z-50">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold text-sm mb-3 text-base-content/60">BROWSE BY CATEGORY</h3>
                      <ul className="space-y-2">
                        {jobCategories.map((cat) => (
                          <li key={cat.name}>
                            <Link 
                              href={`/jobs?q=${encodeURIComponent(cat.name.toLowerCase())}`}
                              className="flex items-center justify-between p-2 hover:bg-base-200 rounded-lg transition-colors group"
                              onClick={closeAllDropdowns}
                            >
                              <div className="flex items-center gap-3">
                                <i className={`fa-solid fa-${cat.icon} text-primary group-hover:scale-110 transition-transform`}></i>
                                <span>{cat.name}</span>
                              </div>
                              <span className="badge badge-ghost badge-sm">{cat.count}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm mb-3 text-base-content/60">POPULAR SEARCHES</h3>
                      <ul className="space-y-2">
                        <li>
                          <Link href="/jobs?q=remote" className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                            <i className="fa-solid fa-house-laptop text-secondary"></i>
                            Remote Jobs
                          </Link>
                        </li>
                        <li>
                          <Link href="/jobs?q=director" className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                            <i className="fa-solid fa-user-tie text-accent"></i>
                            Director Roles
                          </Link>
                        </li>
                        <li>
                          <Link href="/jobs?q=100000" className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                            <i className="fa-solid fa-dollar-sign text-success"></i>
                            $100K+ Salary
                          </Link>
                        </li>
                        <li>
                          <Link href="/jobs?employment_type=full_time" className="flex items-center gap-2 p-2 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                            <i className="fa-solid fa-briefcase text-info"></i>
                            Full-Time Positions
                          </Link>
                        </li>
                      </ul>
                      <div className="mt-4 pt-4 border-t border-base-300">
                        <Link href="/jobs" className="btn btn-primary btn-sm btn-block" onClick={closeAllDropdowns}>
                          View All Jobs <i className="fa-solid fa-arrow-right"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </ul>
              </details>
            </li>

            {/* Resources Mega Dropdown */}
            <li>
              <details>
                <summary>Resources</summary>
                <ul className="p-6 bg-base-100 shadow-2xl border border-base-300 rounded-box min-w-[500px] z-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <li>
                        <Link href="/resources/career-guides" className="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                          <i className="fa-solid fa-book text-primary text-lg mt-1"></i>
                          <div>
                            <div className="font-semibold">Career Guides</div>
                            <div className="text-xs text-base-content/60">Expert advice for your journey</div>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link href="/resources/salary-insights" className="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                          <i className="fa-solid fa-chart-line text-success text-lg mt-1"></i>
                          <div>
                            <div className="font-semibold">Salary Insights</div>
                            <div className="text-xs text-base-content/60">Know your worth</div>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link href="/resources/interview-prep" className="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                          <i className="fa-solid fa-user-tie text-secondary text-lg mt-1"></i>
                          <div>
                            <div className="font-semibold">Interview Prep</div>
                            <div className="text-xs text-base-content/60">Ace your next interview</div>
                          </div>
                        </Link>
                      </li>
                    </div>
                    <div className="space-y-1">
                      <li>
                        <Link href="/resources/success-stories" className="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                          <i className="fa-solid fa-star text-warning text-lg mt-1"></i>
                          <div>
                            <div className="font-semibold">Success Stories</div>
                            <div className="text-xs text-base-content/60">Real candidate experiences</div>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link href="/resources/resume-tips" className="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                          <i className="fa-solid fa-file-alt text-info text-lg mt-1"></i>
                          <div>
                            <div className="font-semibold">Resume Tips</div>
                            <div className="text-xs text-base-content/60">Stand out from the crowd</div>
                          </div>
                        </Link>
                      </li>
                      <li>
                        <Link href="/resources/industry-trends" className="flex items-start gap-3 p-3 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                          <i className="fa-solid fa-trending-up text-accent text-lg mt-1"></i>
                          <div>
                            <div className="font-semibold">Industry Trends</div>
                            <div className="text-xs text-base-content/60">Stay ahead of the curve</div>
                          </div>
                        </Link>
                      </li>
                    </div>
                  </div>
                </ul>
              </details>
            </li>

            {/* Companies Mega Dropdown */}
            <li>
              <details>
                <summary>Companies</summary>
                <ul className="p-6 bg-base-100 shadow-2xl border border-base-300 rounded-box min-w-[450px] z-50">
                  <h3 className="font-bold text-sm mb-3 text-base-content/60">EXPLORE COMPANIES</h3>
                  <div className="space-y-1">
                    <li>
                      <Link href="/companies" className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                        <i className="fa-solid fa-building text-primary text-lg"></i>
                        <div>
                          <div className="font-semibold">Browse All Companies</div>
                          <div className="text-xs text-base-content/60">Discover top employers</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link href="/companies/featured" className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                        <i className="fa-solid fa-crown text-warning text-lg"></i>
                        <div>
                          <div className="font-semibold">Featured Employers</div>
                          <div className="text-xs text-base-content/60">Companies actively hiring</div>
                        </div>
                      </Link>
                    </li>
                    <li>
                      <Link href="/companies/reviews" className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg" onClick={closeAllDropdowns}>
                        <i className="fa-solid fa-star text-success text-lg"></i>
                        <div>
                          <div className="font-semibold">Company Reviews</div>
                          <div className="text-xs text-base-content/60">See what others say</div>
                        </div>
                      </Link>
                    </li>
                  </div>
                  <div className="divider my-4"></div>
                  <h3 className="font-bold text-sm mb-3 text-base-content/60">FOR EMPLOYERS</h3>
                  <li>
                    <Link href="/for-recruiters" className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg bg-primary/5 border border-primary/20">
                      <i className="fa-solid fa-user-tie text-primary text-lg"></i>
                      <div>
                        <div className="font-semibold">Hire Great Talent</div>
                        <div className="text-xs text-base-content/60">Partner with expert recruiters</div>
                      </div>
                    </Link>
                  </li>
                </ul>
              </details>
            </li>

            {/* Authenticated User Links */}
            {isSignedIn && (
              <>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/applications">Applications</Link></li>
              </>
            )}
          </ul>
        </div>
        
        {/* Right Side: Search, Theme Toggle, Auth */}
        <div className="navbar-end flex items-center gap-2">
          {/* Quick Search */}
          <div className="dropdown dropdown-end hidden xl:block">
            <button className="btn btn-ghost btn-circle" onClick={() => (document.getElementById('search-modal') as HTMLDialogElement)?.showModal()}>
              <i className="fa-solid fa-magnifying-glass text-lg"></i>
            </button>
          </div>

          {/* Location Badge - Optional */}
          {!isSignedIn && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 bg-base-200 rounded-full text-sm">
              <i className="fa-solid fa-location-dot text-primary"></i>
              <span className="font-semibold">5,234</span>
              <span className="text-base-content/60">jobs near you</span>
            </div>
          )}

          {/* Theme Toggle */}
          <label className="swap swap-rotate cursor-pointer">
            <input
              type="checkbox"
              checked={isDark}
              onChange={handleThemeChange}
              className="theme-controller"
            />
            <i className="fa-solid fa-sun swap-off text-lg"></i>
            <i className="fa-solid fa-moon swap-on text-lg"></i>
          </label>
          
          {/* Auth Buttons */}
          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <button className="btn btn-ghost btn-circle indicator">
                <i className="fa-solid fa-bell text-lg"></i>
                <span className="badge badge-primary badge-xs indicator-item"></span>
              </button>
              <UserDropdown />
            </div>
          ) : (
            <div className="hidden lg:flex gap-2">
              <Link href="/sign-in" className="btn btn-ghost">
                Sign In
              </Link>
              <Link href="/sign-up" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          )}
        </div>

      {/* Search Modal */}
      <dialog id="search-modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg mb-4">Quick Job Search</h3>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="fieldset">
              <input 
                type="text"
                className="input input-lg w-full"
                placeholder="Search jobs, companies, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-base-content/60">Popular:</span>
              {['Remote', 'Engineering', 'Senior', '$100K+'].map((term) => (
                <button
                  key={term}
                  type="button"
                  className="badge badge-outline badge-lg"
                  onClick={() => setSearchQuery(term)}
                >
                  {term}
                </button>
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Search Jobs <i className="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
