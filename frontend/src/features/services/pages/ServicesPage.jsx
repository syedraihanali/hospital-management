import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';

const apiBaseUrl = process.env.REACT_APP_API_URL;

const formatCurrency = (value) => {
  const amount = Number.parseFloat(value ?? 0) || 0;
  return `BDT ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return '0%';
  }
  return `${(value * 100).toFixed(0)}%`;
};

function ServicesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [labTests, setLabTests] = useState([]);
  const [labStatus, setLabStatus] = useState('idle');
  const [labError, setLabError] = useState('');
  const { siteSettings } = useSiteSettings();

  const siteName = siteSettings?.siteName ?? 'Destination Health';

  useEffect(() => {
    let cancelled = false;

    const loadPackages = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${apiBaseUrl}/api/content/service-packages`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load service packages.');
        }

        if (!cancelled) {
          setPackages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setPackages([]);
          setError(err.message || 'An unexpected error occurred while loading the packages.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const loadLabTests = async () => {
      setLabStatus('loading');
      setLabError('');

      try {
        const response = await fetch(`${apiBaseUrl}/api/content/lab-tests`);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load lab test pricing.');
        }

        if (!cancelled) {
          setLabTests(Array.isArray(data) ? data : []);
          setLabStatus('succeeded');
        }
      } catch (err) {
        if (!cancelled) {
          setLabTests([]);
          setLabStatus('failed');
          setLabError(err.message || 'Unable to load lab test pricing.');
        }
      }
    };

    loadPackages();
    loadLabTests();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [packages]);

  const displayedPackages = sortedPackages;

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
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">
              Preventive health, designed for every stage of life
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              From essential checkups to advanced diagnostics, each package blends laboratory tests, imaging, and consultations
              so you can take proactive steps toward long-term wellness. Pay only for the lab investigations you need and see
              how bundled packages lower the final bill instantly—with every test result delivered straight to your digital
              records.
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
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Choose a lab test bundle that fits you</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Transparent pricing with bundled diagnostics and consultations—saving you time and {siteName} money. Every bundle
            below is curated for laboratory services, so you can complete investigations and receive coordinated follow-up in
            one visit.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {displayedPackages.map((pkg) => {
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
                  {!packageItems.length ? (
                    <li className="rounded-2xl border border-dashed border-brand-primary/40 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
                      Detailed lab investigations for this package will be published soon.
                    </li>
                  ) : null}
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
          {!displayedPackages.length ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-sm text-slate-500">
              Service packages will appear here once they are published.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-brand-primary/20 bg-brand-primary/5 p-8 text-center text-slate-700 shadow-card">
        <h3 className="text-2xl font-semibold text-brand-primary">Digital lab reports delivered to you</h3>
        <p className="mt-3 text-sm sm:text-base">
          After you purchase a lab test package, our admin team securely uploads the completed reports. Patients can download
          every result from the Get Report section as well as their personal dashboard—making follow-up consultations simple
          and paperless.
        </p>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Understand lab test pricing</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Review individual lab charges and see how applying a preventive package instantly reduces your payable amount.
          </p>
        </div>

        {labStatus === 'failed' ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-sm font-medium text-rose-600">
            {labError || 'We could not load lab test pricing right now. Please try again shortly.'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-card">
            <div className="hidden bg-slate-50/80 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
              <span>Test</span>
              <span>Base charge</span>
              <span>Package</span>
              <span>Discount</span>
              <span>Final payable</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {(labTests || []).map((test) => (
                <li key={test.id ?? test.name} className="grid gap-3 px-6 py-5 text-sm text-slate-700 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] md:items-center">
                  <div>
                    <p className="font-semibold text-slate-900">{test.name}</p>
                    {test.description ? <p className="text-xs text-slate-500">{test.description}</p> : null}
                  </div>
                  <span className="font-semibold text-brand-primary">{formatCurrency(test.basePrice)}</span>
                  <div className="text-xs text-slate-500">
                    {test.packageName ? (
                      <>
                        <p className="font-semibold text-slate-700">{test.packageName}</p>
                        <p>{formatPercentage(test.discountRate)} off</p>
                      </>
                    ) : (
                      <p className="text-slate-400">Not bundled</p>
                    )}
                  </div>
                  <span className="font-semibold text-emerald-600">{formatCurrency(test.discountAmount)}</span>
                  <span className="font-semibold text-brand-dark">{formatCurrency(test.finalPrice)}</span>
                </li>
              ))}
              {!labTests.length && labStatus !== 'failed' ? (
                <li className="px-6 py-5 text-sm text-slate-500">No lab tests have been published yet.</li>
              ) : null}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

export default ServicesPage;
