import React, { useMemo } from 'react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../SiteSettingsContext';

const sanitizeTel = (value) => value.replace(/[^+\d]/g, '');

function HomeFooter() {
  const { siteSettings } = useSiteSettings();

  const siteName = siteSettings?.siteName ?? 'Destination Health';
  const siteTagline = siteSettings?.siteTagline ?? '';
  const primaryContactPhone = siteSettings?.primaryContactPhone ?? '';
  const primaryContactEmail = siteSettings?.primaryContactEmail ?? '';
  const emergencyContactPhone = siteSettings?.emergencyContactPhone ?? '';
  const emergencyContactAddress = siteSettings?.emergencyContactAddress ?? '';
  const footerNote = siteSettings?.footerNote ?? '';

  const footerLinks = useMemo(
    () => [
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
          primaryContactPhone
            ? {
                label: `Call ${primaryContactPhone}`,
                to: `tel:${sanitizeTel(primaryContactPhone)}`,
                external: true,
              }
            : null,
          primaryContactEmail
            ? {
                label: `Email ${primaryContactEmail}`,
                to: `mailto:${primaryContactEmail}`,
                external: true,
              }
            : null,
          emergencyContactPhone
            ? {
                label: `Emergency ${emergencyContactPhone}`,
                to: `tel:${sanitizeTel(emergencyContactPhone)}`,
                external: true,
              }
            : null,
          emergencyContactAddress
            ? {
                label: emergencyContactAddress,
                to: '#location',
              }
            : null,
        ].filter(Boolean),
      },
    ],
    [primaryContactPhone, primaryContactEmail, emergencyContactPhone, emergencyContactAddress]
  );

  return (
    <footer className="rounded-[32px] border border-white/60 bg-white/80 p-10 shadow-glass backdrop-blur-xl">
      <div className="grid gap-10 lg:grid-cols-[1.6fr_2fr]">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-brand-dark">{siteName}</h3>
            <p className="mt-3 max-w-md text-sm text-slate-600">{siteTagline}</p>
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
        <p>
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
        <p className="text-slate-400">{footerNote}</p>
      </div>
    </footer>
  );
}

export default HomeFooter;
