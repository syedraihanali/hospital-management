import React from 'react';
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';
import { useSiteSettings } from '../context/SiteSettingsContext';

function SupportButtons() {
  const { siteSettings } = useSiteSettings();
  const phone = siteSettings?.supportPhone?.trim();
  const whatsappUrl = siteSettings?.supportWhatsappUrl?.trim();

  if (!phone && !whatsappUrl) {
    return null;
  }

  const normalizedPhone = phone ? phone.replace(/\s+/g, '') : '';

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 sm:gap-4">
      {phone ? (
        <a
          href={`tel:${normalizedPhone}`}
          className="group inline-flex items-center gap-3 rounded-full bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          <FaPhoneAlt aria-hidden="true" />
          <span className="hidden sm:inline">Call support</span>
        </a>
      ) : null}
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600"
        >
          <FaWhatsapp aria-hidden="true" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      ) : null}
    </div>
  );
}

export default SupportButtons;
