import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const apiBaseUrl = process.env.REACT_APP_API_URL;

const formatCurrency = (value) => {
  const amount = Number.parseFloat(value ?? 0) || 0;
  return `BDT ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function ServicesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
              Destination Health Packages
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

      <section className="space-y-8">
        {sortedPackages.map((pkg) => {
          const packageItems = Array.isArray(pkg.items) ? pkg.items : [];
          const totalPrice = packageItems.reduce((sum, item) => sum + (Number.parseFloat(item.price ?? 0) || 0), 0);
          const discountedPrice = Number.parseFloat(pkg.discountedPrice ?? pkg.totalPrice ?? 0) || 0;
          const savings = Math.max(0, totalPrice - discountedPrice);

          return (
            <article
              key={pkg.id ?? pkg.name}
              className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-card backdrop-blur"
            >
              <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-brand-primary">{pkg.name}</h2>
                  {pkg.subtitle ? <p className="text-sm text-slate-600 sm:text-base">{pkg.subtitle}</p> : null}
                </div>
                <div className="flex flex-wrap items-end gap-6 text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Total value</p>
                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(totalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-brand-primary">Discounted package</p>
                    <p className="text-2xl font-semibold text-brand-primary">{formatCurrency(discountedPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-600">You save</p>
                    <p className="text-lg font-semibold text-emerald-600">{formatCurrency(savings)}</p>
                  </div>
                </div>
              </header>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {packageItems.map((item) => (
                  <div
                    key={item.id ?? `${pkg.name}-${item.name}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 shadow-sm"
                  >
                    <span className="pr-4 text-slate-800">{item.name}</span>
                    <span className="font-semibold text-brand-primary">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>

              <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-brand-primary" aria-hidden="true" />
                  Includes all consumables, reporting, and physician review.
                </p>
                <Link
                  to="/book-appointment"
                  className="inline-flex items-center justify-center rounded-full border border-brand-primary px-5 py-2 font-medium text-brand-primary transition hover:bg-brand-primary hover:text-white"
                >
                  Schedule this package
                </Link>
              </footer>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default ServicesPage;
