import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';
import ServiceCard from '../components/ServiceCard';

function ServicesPage() {
  const { siteSettings } = useSiteSettings();
  const siteName = siteSettings?.siteName ?? 'Destination Health';

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col items-center justify-center gap-10 px-6 py-20 text-center">
      <div className="space-y-4">
        <p className="inline-flex rounded-full bg-brand-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">
          Services
        </p>
        <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">Coming soon</h1>
        <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
          We are curating a refreshed catalogue of wellness and diagnostic services for {siteName}. Check back
          shortly to explore new care packages tailored to your needs.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 my-20'>
        <ServiceCard/>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-brand-primary bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
        >
          <FaArrowLeft aria-hidden className="h-4 w-4" />
          Back to homepage
        </Link>
      </div>
    </div>
  );
}

export default ServicesPage;
