import Link from 'next/link';

export default function Footer() {
  return (
    <>
      <footer className="footer sm:footer-horizontal bg-neutral text-neutral-content p-10">
        <nav>
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-briefcase text-3xl text-primary"></i>
            <span className="font-bold text-xl">Applicant Network</span>
          </div>
          <p className="max-w-xs">
            Connecting talented candidates with amazing opportunities through expert recruiters.
          </p>
        </nav>
        <nav>
          <h6 className="footer-title">Platform</h6>
          <Link href="/jobs" className="link link-hover">Browse Jobs</Link>
          <Link href="/how-it-works" className="link link-hover">How It Works</Link>
          <Link href="/for-recruiters" className="link link-hover">For Recruiters</Link>
          <Link href="/help" className="link link-hover">Help Center</Link>
        </nav>
        <nav>
          <h6 className="footer-title">Company</h6>
          <Link href="/about" className="link link-hover">About Us</Link>
          <Link href="/contact" className="link link-hover">Contact</Link>
          <a href="https://splits.network" className="link link-hover" target="_blank" rel="noopener noreferrer">Splits Network</a>
        </nav>
        <nav>
          <h6 className="footer-title">Legal</h6>
          <Link href="/privacy" className="link link-hover">Privacy Policy</Link>
          <Link href="/terms" className="link link-hover">Terms of Service</Link>
          <Link href="/cookies" className="link link-hover">Cookie Policy</Link>
        </nav>
      </footer>
      <footer className="footer footer-center p-4 bg-neutral text-neutral-content border-t border-base-300">
        <aside>
          <p>Copyright © {new Date().getFullYear()} Splits Network. All rights reserved.</p>
        </aside>
        <nav>
          <div className="grid grid-flow-col gap-4">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <i className="fa-brands fa-twitter text-xl"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <i className="fa-brands fa-linkedin text-xl"></i>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <i className="fa-brands fa-facebook text-xl"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fa-brands fa-instagram text-xl"></i>
            </a>
          </div>
        </nav>
      </footer>
    </>
  );
}
