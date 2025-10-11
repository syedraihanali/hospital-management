import React, { useMemo } from 'react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';

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

  const paymentMarks = useMemo(
    () => [
      {
        name: 'bkash',
        label: 'bKash',
        icon: (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E2136E] text-[11px] font-bold uppercase text-white shadow-sm"
          >
            bK
          </span>
        ),
      },
      {
        name: 'nagad',
        label: 'Nagad',
        icon: (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EA1D25] text-[11px] font-semibold uppercase text-white shadow-sm"
          >
            NG
          </span>
        ),
      },
      {
        name: 'visa',
        label: 'Visa',
        icon: (
          <span
            aria-hidden="true"
            className="flex h-8 w-12 items-center justify-center rounded-md border border-[#1A1F71] bg-white text-xs font-bold uppercase text-[#1A1F71] shadow-sm"
          >
            VISA
          </span>
        ),
      },
      {
        name: 'mastercard',
        label: 'Mastercard',
        icon: (
          <span aria-hidden="true" className="relative flex h-8 w-12 items-center justify-center">
            <span className="h-7 w-7 rounded-full bg-[#EB001B] opacity-90" />
            <span className="absolute left-1/2 h-7 w-7 -translate-x-1/4 rounded-full bg-[#F79E1B] opacity-90" />
          </span>
        ),
      },
    ],
    []
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

      <div className="mt-10 rounded-3xl border border-white/70 bg-white/70 p-5 shadow-inner">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500">What we accept</h4>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {paymentMarks.map((mark) => (
            <div
              key={mark.name}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            >
              {mark.icon}
              <span>{mark.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-white/70 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
        <p className="text-slate-400">{footerNote}</p>
      </div>
    </footer>
  );
}

export default HomeFooter;
