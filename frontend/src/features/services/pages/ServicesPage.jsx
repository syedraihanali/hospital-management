import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';
import ServiceCard from '../components/ServiceCard';
import { AuthContext } from '../../auth/context/AuthContext';

function ServicesPage() {
  const { siteSettings } = useSiteSettings();
  const siteName = siteSettings?.siteName ?? 'Destination Health';
  const { auth } = useContext(AuthContext);
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState('idle');
  const [purchaseFeedback, setPurchaseFeedback] = useState(null);
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    nidNumber: '',
    notes: '',
  });

  const fetchPackages = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/content/service-packages`);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message || 'Unable to load service packages right now.';
        throw new Error(message);
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setPackages(list);
      setStatus('succeeded');
    } catch (err) {
      setStatus('failed');
      setError(err.message || 'Failed to load service packages.');
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (status === 'idle') {
      fetchPackages();
    }
  }, [fetchPackages, status]);

  const sortedPackages = useMemo(() => {
    if (!Array.isArray(packages)) {
      return [];
    }

    return [...packages].sort((a, b) => {
      const orderA = Number.parseInt(a.sortOrder, 10) || 0;
      const orderB = Number.parseInt(b.sortOrder, 10) || 0;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (a.id || a.PackageID || 0) - (b.id || b.PackageID || 0);
    });
  }, [packages]);

  const isPatient = auth.user?.role === 'patient';

  const handleOpenPurchase = (pkg) => {
    const defaultName = auth.user?.fullName || auth.user?.firstName || '';
    const defaultEmail = auth.user?.email || '';

    setSelectedPackage(pkg);
    setPurchaseStatus('idle');
    setPurchaseFeedback(null);
    setFormValues({
      fullName: defaultName,
      email: defaultEmail,
      phoneNumber: '',
      nidNumber: '',
      notes: '',
    });
  };

  const handleClosePurchase = () => {
    setSelectedPackage(null);
    setPurchaseStatus('idle');
    setPurchaseFeedback(null);
  };

  const updateFormValue = (field) => (event) => {
    const { value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePurchase = async (event) => {
    event.preventDefault();

    if (!selectedPackage) {
      return;
    }

    const payload = {
      fullName: formValues.fullName.trim(),
      email: formValues.email.trim(),
      phoneNumber: formValues.phoneNumber.trim(),
      nidNumber: formValues.nidNumber.trim(),
      notes: formValues.notes.trim(),
    };

    if (!payload.fullName) {
      setPurchaseFeedback({ type: 'error', message: 'Please enter your full name to continue.' });
      return;
    }

    if (!payload.email) {
      setPurchaseFeedback({ type: 'error', message: 'Please provide an email address so we can reach you.' });
      return;
    }

    if (!payload.phoneNumber) {
      setPurchaseFeedback({ type: 'error', message: 'A contact phone number is required.' });
      return;
    }

    setPurchaseStatus('loading');
    setPurchaseFeedback(null);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/content/service-packages/${selectedPackage.id || selectedPackage.PackageID}/purchase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const message = result?.message || 'Unable to submit your request right now. Please try again later.';
        throw new Error(message);
      }

      setPurchaseStatus('succeeded');
      setPurchaseFeedback({
        type: 'success',
        message: result?.message || 'Package purchase submitted successfully.',
      });
    } catch (err) {
      setPurchaseStatus('failed');
      setPurchaseFeedback({
        type: 'error',
        message: err.message || 'Failed to submit your package purchase request.',
      });
    }
  };

  const formatCurrency = useCallback((value) => {
    const numeric = Number.parseFloat(value);
    if (Number.isNaN(numeric)) {
      return 'BDT 0.00';
    }
    return `BDT ${numeric.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col gap-10 px-6 py-20">
      <section className="space-y-4 text-center">
        <p className="inline-flex rounded-full bg-brand-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">
          Services
        </p>
        <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">Diagnostic packages</h1>
        <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
          Explore curated lab bundles from {siteName}. Each package combines popular screening tests at a special rate to help
          you plan preventive care with confidence.
        </p>
      </section>

      {status === 'loading' ? (
        <div className="flex min-h-[12rem] items-center justify-center rounded-3xl border border-slate-200 bg-white/70 text-slate-600">
          Loading packages...
        </div>
      ) : null}

      {status === 'failed' ? (
        <div className="flex min-h-[12rem] flex-col items-center justify-center gap-4 rounded-3xl border border-rose-200 bg-rose-50/60 p-10 text-center text-rose-600">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchPackages}
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
          >
            Retry loading packages
          </button>
        </div>
      ) : null}

      {status === 'succeeded' && sortedPackages.length === 0 ? (
        <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white/70 p-10 text-center text-slate-600">
          <p>Our clinical team is finalising fresh service bundles.</p>
          <p className="max-w-xl">Check back soon to discover new diagnostic packages tailored for you.</p>
        </div>
      ) : null}

      {sortedPackages.length ? (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {sortedPackages.map((pkg) => (
            <ServiceCard
              key={pkg.id || pkg.PackageID}
              packageData={pkg}
              onPurchase={handleOpenPurchase}
              actionLabel="Purchase package"
            />
          ))}
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-4 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-brand-primary bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
        >
          <FaArrowLeft aria-hidden className="h-4 w-4" />
          Back to homepage
        </Link>
      </div>

      {selectedPackage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="relative flex w-full max-w-3xl flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl">
            <button
              type="button"
              onClick={handleClosePurchase}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:text-slate-700"
              aria-label="Close purchase form"
            >
              <FaTimes aria-hidden />
            </button>

            <header className="mt-2 space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">Complete your package request</h2>
              <p className="text-sm text-slate-600">
                Submit your contact details and our team will confirm the booking shortly.
              </p>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <h3 className="text-base font-semibold text-slate-900">{selectedPackage.name}</h3>
              {selectedPackage.subtitle ? (
                <p className="text-xs text-slate-500">{selectedPackage.subtitle}</p>
              ) : null}
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {Array.isArray(selectedPackage.items) && selectedPackage.items.length ? (
                  selectedPackage.items.map((item) => (
                    <li key={item.id || item.name} className="flex items-center justify-between border-b border-slate-200 pb-1 last:border-b-0">
                      <span>{item.name}</span>
                      <span className="font-medium text-slate-500">{formatCurrency(item.price)}</span>
                    </li>
                  ))
                ) : (
                  <li>No individual tests were provided for this package.</li>
                )}
              </ul>
              <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="font-semibold text-slate-700">Tests value</p>
                  <p className="text-sm text-slate-900">{formatCurrency(selectedPackage.originalPrice ?? selectedPackage.totalPrice)}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="font-semibold text-slate-700">You pay</p>
                  <p className="text-sm text-brand-primary">{formatCurrency(selectedPackage.discountedPrice)}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="font-semibold text-slate-700">You save</p>
                  <p className="text-sm text-emerald-600">{formatCurrency(selectedPackage.savings)}</p>
                </div>
              </div>
            </section>

            {purchaseFeedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  purchaseFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {purchaseFeedback.message}
              </div>
            ) : null}

            <form className="grid gap-4" onSubmit={handlePurchase}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Full name
                  <input
                    type="text"
                    value={formValues.fullName}
                    onChange={updateFormValue('fullName')}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    placeholder="Your name"
                    autoComplete="name"
                    disabled={purchaseStatus === 'loading' || purchaseStatus === 'succeeded'}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Email address
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={updateFormValue('email')}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    placeholder="name@email.com"
                    autoComplete="email"
                    disabled={purchaseStatus === 'loading' || purchaseStatus === 'succeeded'}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  Phone number
                  <input
                    type="tel"
                    value={formValues.phoneNumber}
                    onChange={updateFormValue('phoneNumber')}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    placeholder="e.g. 017XXXXXXXX"
                    autoComplete="tel"
                    disabled={purchaseStatus === 'loading' || purchaseStatus === 'succeeded'}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                  National ID (optional)
                  <input
                    type="text"
                    value={formValues.nidNumber}
                    onChange={updateFormValue('nidNumber')}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    placeholder="NID / passport"
                    autoComplete="off"
                    disabled={purchaseStatus === 'loading' || purchaseStatus === 'succeeded'}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Additional notes (optional)
                <textarea
                  value={formValues.notes}
                  onChange={updateFormValue('notes')}
                  className="min-h-[96px] rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  placeholder="Share any preferred schedule or special requests"
                  disabled={purchaseStatus === 'loading' || purchaseStatus === 'succeeded'}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={purchaseStatus === 'loading' || purchaseStatus === 'succeeded'}
                >
                  {purchaseStatus === 'loading' ? 'Submitting...' : 'Submit purchase request'}
                </button>
                <button
                  type="button"
                  onClick={handleClosePurchase}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                {purchaseStatus === 'succeeded' ? (
                  <Link
                    to={isPatient ? '/myprofile' : '/signin/patient'}
                    className="inline-flex items-center justify-center rounded-full border border-brand-primary px-6 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                    onClick={handleClosePurchase}
                  >
                    {isPatient ? 'View my profile' : 'Sign in to track purchases'}
                  </Link>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ServicesPage;
