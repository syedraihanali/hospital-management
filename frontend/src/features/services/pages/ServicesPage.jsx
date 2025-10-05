import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';

const apiBaseUrl = process.env.REACT_APP_API_URL;

const formatCurrency = (value) => {
  const amount = Number.parseFloat(value ?? 0) || 0;
  return `BDT ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function ServicesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { siteSettings } = useSiteSettings();

  const siteName = siteSettings?.siteName ?? 'Destination Health';

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${apiBaseUrl}/api/content/service-packages`);
        if (!response.ok) {
          throw new Error('Unable to load service packages.');
        }

        const data = await response.json();
        setPackages(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'An unexpected error occurred while loading the packages.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [packages]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-600">
        Gathering wellness packages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/40 bg-white/80 p-10 shadow-glass backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
              {siteName} Packages
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">Preventive health, designed for every stage of life</h1>
            <p className="text-base text-slate-600 sm:text-lg">
              From essential checkups to advanced diagnostics, each package blends laboratory tests, imaging, and consultations
              so you can take proactive steps toward long-term wellness.
            </p>
            <div className="grid gap-4 rounded-2xl border border-brand-primary/20 bg-brand-primary/10 p-5 text-sm text-brand-dark sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-dark/70">Same-day reporting</p>
                <p className="mt-1 text-lg font-semibold text-brand-dark">Results delivered digitally for quick follow-up</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-dark/70">Personal guidance</p>
                <p className="mt-1 text-lg font-semibold text-brand-dark">Care coordinators to review every outcome</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-brand-primary/20 bg-brand-primary/5 p-8">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-brand-primary">Not sure where to begin?</h2>
              <p className="text-sm text-slate-600">
                Share your health goals with our coordinators and they will recommend the right screening path or specialist
                consultation for you or your loved ones.
              </p>
            </div>
            <Link
              to="/book-appointment"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
            >
              Book a consultation
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Choose a screening bundle that fits you</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Transparent pricing with bundled diagnostics and consultations—saving you time and {siteName} money.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedPackages.map((pkg) => {
            const packageItems = Array.isArray(pkg.items) ? pkg.items : [];
            const totalPrice = packageItems.reduce((sum, item) => sum + (Number.parseFloat(item.price ?? 0) || 0), 0);
            const discountedPrice = Number.parseFloat(pkg.discountedPrice ?? pkg.totalPrice ?? 0) || 0;
            const savings = Math.max(0, totalPrice - discountedPrice);

            return (
              <article
                key={pkg.id ?? pkg.name}
                className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 p-8 shadow-card backdrop-blur transition hover:translate-y-[-4px] hover:shadow-lg"
              >
                <span className="absolute left-6 top-6 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Save! {formatCurrency(savings)}
                </span>

                <header className="mt-12 flex flex-col gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80">Health package</p>
                    <h2 className="text-2xl font-semibold text-brand-primary">{pkg.name}</h2>
                    {pkg.subtitle ? <p className="text-sm text-slate-600">{pkg.subtitle}</p> : null}
                  </div>
                  <div className="self-start rounded-2xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Discounted price</p>
                    <p className="text-xl font-semibold text-brand-primary">{formatCurrency(discountedPrice)}</p>
                  </div>
                </header>

                <ul className="mt-6 flex-1 space-y-3">
                  {packageItems.map((item) => (
                    <li
                      key={item.id ?? `${pkg.name}-${item.name}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 shadow-sm"
                    >
                      <span className="pr-3 text-slate-800">{item.name}</span>
                      <span className="font-semibold text-brand-primary">{formatCurrency(item.price)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 space-y-3 rounded-2xl bg-slate-50 px-5 py-4 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total value</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-brand-primary">
                    <span>Package price</span>
                    <span className="text-lg font-semibold">{formatCurrency(discountedPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>You save</span>
                    <span className="font-semibold">{formatCurrency(savings)}</span>
                  </div>
                </div>

                <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex h-2 w-2 rounded-full bg-brand-primary" aria-hidden="true" />
                  Includes consumables, physician review, and digital report delivery.
                </p>

                <Link
                  to="/book-appointment"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
                >
                  Schedule this package
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ServicesPage;
