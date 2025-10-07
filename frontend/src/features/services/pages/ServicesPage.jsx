import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaFileDownload, FaFlask } from 'react-icons/fa';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';

const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

const purchaseFormDefaults = {
  fullName: '',
  email: '',
  phoneNumber: '',
  nidNumber: '',
  notes: '',
};

const formatCurrency = (value) => {
  const amount = Number.parseFloat(value ?? 0) || 0;
  return `BDT ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function PackagePurchaseDialog({ open, pkg, form, onChange, onClose, onSubmit, status, feedback }) {
  if (!open || !pkg) {
    return null;
  }

  const packageItems = Array.isArray(pkg.items) ? pkg.items : [];
  const totalPrice = packageItems.reduce(
    (sum, item) => sum + (Number.parseFloat(item.price ?? item.ItemPrice ?? 0) || 0),
    0,
  );
  const discountedPrice =
    Number.parseFloat(pkg.discountedPrice ?? pkg.totalPrice ?? pkg.OriginalPrice ?? 0) || 0;
  const savings = Math.max(0, Number.parseFloat((totalPrice - discountedPrice).toFixed(2)));
  const isSubmitting = status === 'loading';
  const isCompleted = status === 'succeeded';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close purchase dialog"
          className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        >
          Close
        </button>

        <div className="space-y-6">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80">Buy lab package</p>
            <h2 className="text-2xl font-semibold text-slate-900">{pkg.name}</h2>
            {pkg.subtitle ? <p className="text-sm text-slate-600">{pkg.subtitle}</p> : null}
          </header>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total lab value</p>
                <p className="text-base font-semibold text-slate-900">{formatCurrency(totalPrice)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Package price</p>
                <p className="text-base font-semibold text-brand-primary">{formatCurrency(discountedPrice)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">You save</p>
                <p className="text-base font-semibold text-emerald-600">{formatCurrency(savings)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lab tests included</p>
              <ul className="mt-2 grid gap-2">
                {packageItems.length ? (
                  packageItems.map((item) => (
                    <li
                      key={item.id ?? item.PackageItemID ?? `${pkg.name}-${item.name}`}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm text-slate-700">{item.name ?? item.ItemName}</span>
                      <span className="text-xs font-semibold text-brand-primary">
                        {formatCurrency(item.price ?? item.ItemPrice)}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="rounded-xl border border-dashed border-brand-primary/30 bg-brand-primary/5 px-3 py-2 text-xs text-brand-primary">
                    This bundle is being finalised. A coordinator will confirm the exact tests after purchase.
                  </li>
                )}
              </ul>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Full name
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  required
                  disabled={isCompleted}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-slate-100"
                  placeholder="Enter patient name"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Email address
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  disabled={isCompleted}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-slate-100"
                  placeholder="name@example.com"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Phone number
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={onChange}
                  required
                  disabled={isCompleted}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-slate-100"
                  placeholder="e.g., +8801XXXXXXXXX"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                National ID (optional)
                <input
                  type="text"
                  name="nidNumber"
                  value={form.nidNumber}
                  onChange={onChange}
                  disabled={isCompleted}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-slate-100"
                  placeholder="Helps us match reports quickly"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Notes for our care team (optional)
              <textarea
                name="notes"
                value={form.notes}
                onChange={onChange}
                disabled={isCompleted}
                rows={3}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-slate-100"
                placeholder="Share any preparation requirements or preferred contact time."
              />
            </label>

            {feedback ? (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {feedback}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting || isCompleted}
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isCompleted ? 'Request received' : isSubmitting ? 'Processing…' : 'Confirm purchase'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
              >
                {isCompleted ? 'Close' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ServicesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseModal, setPurchaseModal] = useState({ open: false, pkg: null });
  const [purchaseForm, setPurchaseForm] = useState({ ...purchaseFormDefaults });
  const [purchaseStatus, setPurchaseStatus] = useState('idle');
  const [purchaseFeedback, setPurchaseFeedback] = useState('');
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

    loadPackages();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [packages]);

  const displayedPackages = sortedPackages;

  const handleOpenPurchase = (pkg) => {
    setPurchaseModal({ open: true, pkg });
    setPurchaseForm({ ...purchaseFormDefaults });
    setPurchaseStatus('idle');
    setPurchaseFeedback('');
  };

  const handleClosePurchase = () => {
    setPurchaseModal({ open: false, pkg: null });
    setPurchaseForm({ ...purchaseFormDefaults });
    setPurchaseStatus('idle');
    setPurchaseFeedback('');
  };

  const handlePurchaseChange = (event) => {
    const { name, value } = event.target;
    setPurchaseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchaseSubmit = async (event) => {
    event.preventDefault();

    if (!purchaseModal.pkg) {
      return;
    }

    const packageId = purchaseModal.pkg.id ?? purchaseModal.pkg.PackageID;
    if (!packageId) {
      setPurchaseStatus('failed');
      setPurchaseFeedback('Unable to identify the selected package. Please refresh and try again.');
      return;
    }

    setPurchaseStatus('loading');
    setPurchaseFeedback('');

    const payload = {
      fullName: purchaseForm.fullName.trim(),
      email: purchaseForm.email.trim(),
      phoneNumber: purchaseForm.phoneNumber.trim(),
      nidNumber: purchaseForm.nidNumber.trim(),
      notes: purchaseForm.notes.trim(),
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/content/service-packages/${packageId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit your purchase request.');
      }

      setPurchaseStatus('succeeded');
      setPurchaseFeedback(
        data.message ||
          'Your purchase request has been submitted. Our coordination team will call you shortly to confirm the appointment.',
      );
    } catch (err) {
      setPurchaseStatus('failed');
      setPurchaseFeedback(
        err.message || 'Unable to submit your purchase request right now. Please try again in a moment.',
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-600">
        Gathering lab packages…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-red-600">{error}</div>
    );
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        {/* <section className="rounded-3xl border border-white/40 bg-white/80 p-10 shadow-glass backdrop-blur-xl">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5">
              <span className="inline-flex items-center rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
                {siteName} Lab Bundles
              </span>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">
                Comprehensive lab testing packages with instant savings
              </h1>
              <p className="text-base text-slate-600 sm:text-lg">
                Choose preventive and diagnostic bundles curated by our clinicians. Each package combines multiple laboratory
                tests, streamlined sample collection, and digital reporting so that you can focus on your health—not the
                paperwork.
              </p>
              <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="mt-1 text-emerald-500" aria-hidden="true" />
                  <span>Bundled pathology tests designed for diabetes, cardiac, women’s and senior care.</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="mt-1 text-emerald-500" aria-hidden="true" />
                  <span>Transparent pricing with discounts applied automatically to every lab investigation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="mt-1 text-emerald-500" aria-hidden="true" />
                  <span>Home sample collection and fast processing by accredited laboratories.</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="mt-1 text-emerald-500" aria-hidden="true" />
                  <span>Results uploaded to your digital records and Get Reports portal for download.</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-between rounded-3xl border border-brand-primary/20 bg-brand-primary/5 p-8">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-brand-primary">Need a tailored recommendation?</h2>
                <p className="text-sm text-slate-600">
                  Tell our care navigators about your symptoms or screening goals and we will match the right laboratory bundle
                  for you.
                </p>
              </div>
              <Link
                to="/book-appointment"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
              >
                Talk to a care navigator
              </Link>
            </div>
          </div>
        </section> */}

        <section className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Pick the lab package that fits you</h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Every plan below bundles laboratory tests, technician time, and report delivery. Purchase directly and our team
              will schedule collection at your convenience.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {displayedPackages.map((pkg) => {
              const packageItems = Array.isArray(pkg.items) ? pkg.items : [];
              const totalPrice = packageItems.reduce(
                (sum, item) => sum + (Number.parseFloat(item.price ?? 0) || 0),
                0,
              );
              const discountedPrice = Number.parseFloat(pkg.discountedPrice ?? pkg.totalPrice ?? 0) || 0;
              const savings = Math.max(0, totalPrice - discountedPrice);

              return (
                <article
                  key={pkg.id ?? pkg.name}
                  className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 p-8 shadow-card backdrop-blur transition hover:translate-y-[-4px] hover:shadow-lg"
                >
                  <span className="absolute left-6 top-6 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Save {formatCurrency(savings)}
                  </span>

                  <header className="mt-12 flex flex-col gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80">Lab test bundle</p>
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
                        Detailed test line items will be confirmed by our care coordinators.
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
                    <FaFlask className="text-brand-primary" aria-hidden="true" />
                    Bundles include consumables, technologist review, and secure digital report delivery.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenPurchase(pkg)}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
                    >
                      Buy package
                    </button>
                    <Link
                      to="/book-appointment"
                      className="inline-flex items-center justify-center rounded-full border border-brand-primary px-5 py-2 text-sm font-medium text-brand-primary transition hover:bg-brand-primary hover:text-white"
                    >
                      Ask a specialist
                    </Link>
                  </div>
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

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 text-sm text-slate-600 shadow-card">
            <h3 className="text-xl font-semibold text-brand-primary">How the purchase works</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-brand-primary/10 text-center text-xs font-semibold leading-6 text-brand-primary">
                  1
                </span>
                <p>Select the package that matches your health goal and submit your purchase with contact details.</p>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-brand-primary/10 text-center text-xs font-semibold leading-6 text-brand-primary">
                  2
                </span>
                <p>Our coordination desk confirms sample collection time, shares preparation steps, and processes payment.</p>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-brand-primary/10 text-center text-xs font-semibold leading-6 text-brand-primary">
                  3
                </span>
                <p>Certified lab partners run the investigations and upload every result straight to your Destination Health profile.</p>
              </li>
            </ol>
          </article>

          <article className="flex flex-col justify-between gap-4 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-700 shadow-card">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-emerald-700">Download your lab reports anytime</h3>
              <p>
                As soon as the admin team reviews and shares your results, they appear in the dedicated lab reports section of
                the Get Reports page. Verify your NID, choose the visit, and download PDFs whenever you need them.
              </p>
            </div>
            <Link
              to="/reports"
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <FaFileDownload aria-hidden="true" /> Go to Get Reports
            </Link>
          </article>
        </section>
      </div>

      <PackagePurchaseDialog
        open={purchaseModal.open}
        pkg={purchaseModal.pkg}
        form={purchaseForm}
        onChange={handlePurchaseChange}
        onClose={handleClosePurchase}
        onSubmit={handlePurchaseSubmit}
        status={purchaseStatus}
        feedback={purchaseFeedback}
      />
    </>
  );
}

export default ServicesPage;
