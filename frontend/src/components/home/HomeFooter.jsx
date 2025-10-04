import React from 'react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const footerLinks = [
  {
    title: 'Explore',
    items: [
      { label: 'Book an appointment', to: '/book-appointment' },
      { label: 'Services', to: '/services' },
      { label: 'Get reports', to: '/reports' },
      { label: 'About us', to: '/about-us' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Patient help center', to: '/register' },
      { label: 'Staff portal', to: '/staff-portal' },
      { label: 'Privacy policy', to: '#' },
      { label: 'Accessibility', to: '#' },
    ],
  },
  {
    title: 'Contact',
    items: [
      { label: 'Call 1-800-123-456', to: 'tel:1800123456', external: true },
      { label: 'Email care@destinationhealth.com', to: 'mailto:care@destinationhealth.com', external: true },
      { label: 'Visit 221B Harbor Street, Seattle', to: '#location' },
    ],
  },
];

function HomeFooter() {
  return (
    <footer className="rounded-[32px] border border-white/60 bg-white/80 p-10 shadow-glass backdrop-blur-xl">
      <div className="grid gap-10 lg:grid-cols-[1.6fr_2fr]">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-brand-dark">Destination Health</h3>
            <p className="mt-3 max-w-md text-sm text-slate-600">
              Seamless booking, coordinated care teams, and secure records—designed for modern health journeys.
            </p>
          </div>
          <div className="flex items-center gap-3 text-brand-dark">
            <a
              href="https://twitter.com"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 bg-white/70 transition hover:bg-brand-primary/20"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a>
            <a
              href="https://facebook.com"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 bg-white/70 transition hover:bg-brand-primary/20"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://instagram.com"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 bg-white/70 transition hover:bg-brand-primary/20"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://linkedin.com"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/30 bg-white/70 transition hover:bg-brand-primary/20"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">{column.title}</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                {column.items.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a
                        href={item.to}
                        className="transition hover:text-brand-dark"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.to} className="transition hover:text-brand-dark">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-white/70 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Destination Health. All rights reserved.</p>
        <p className="text-slate-400">Secured with HIPAA-compliant infrastructure.</p>
      </div>
    </footer>
  );
}

export default HomeFooter;
