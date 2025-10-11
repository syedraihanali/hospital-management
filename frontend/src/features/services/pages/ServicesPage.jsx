import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ServiceCard from '../components/ServiceCard';
import { AuthContext } from '../../auth/context/AuthContext';

const apiBaseUrl = process.env.REACT_APP_API_URL;

const normalizeServicePackage = (pkg) => {
  if (!pkg) {
    return null;
  }

  const id = pkg.id ?? pkg.PackageID ?? null;
  const name = (pkg.name ?? pkg.PackageName ?? '').trim();
  if (!name) {
    return null;
  }

  const subtitle = (pkg.subtitle ?? pkg.Subtitle ?? '').trim();
  const ribbonText = (pkg.ribbonText ?? pkg.RibbonText ?? '').trim();
  const sortOrder = Number.parseInt(pkg.sortOrder ?? pkg.SortOrder ?? '0', 10);
  const discountedRaw = pkg.discountedPrice ?? pkg.DiscountedPrice ?? 0;
  const originalRaw = pkg.originalPrice ?? pkg.OriginalPrice ?? pkg.totalPrice ?? pkg.TotalPrice ?? 0;
  const totalRaw = pkg.totalPrice ?? pkg.TotalPrice ?? originalRaw;

  const discountedPrice = Number.parseFloat(discountedRaw) || 0;
  const originalPrice = Number.parseFloat(originalRaw) || 0;
  const totalPrice = Number.parseFloat(totalRaw) || originalPrice || 0;

  const rawItems = Array.isArray(pkg.items)
    ? pkg.items
    : Array.isArray(pkg.packageItems)
    ? pkg.packageItems
    : [];

  const items = rawItems
    .map((item) => {
      const itemName = (item.name ?? item.ItemName ?? '').trim();
      if (!itemName) {
        return null;
      }

      const itemPrice = Number.parseFloat(item.price ?? item.ItemPrice ?? item.amount ?? 0) || 0;
      const itemId = item.id ?? item.PackageItemID ?? null;
      const itemSortOrder = Number.parseInt(item.sortOrder ?? item.SortOrder ?? '0', 10) || 0;

      return {
        id: itemId,
        name: itemName,
        price: itemPrice,
        sortOrder: itemSortOrder,
      };
    })
    .filter(Boolean);

  const resolvedSavings = (() => {
    if (pkg.savings !== undefined && pkg.savings !== null) {
      const numeric = Number.parseFloat(pkg.savings);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }

    if (pkg.Savings !== undefined && pkg.Savings !== null) {
      const numeric = Number.parseFloat(pkg.Savings);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }
    }

    const computedSavings = Math.max(0, Math.max(totalPrice, originalPrice) - discountedPrice);
    return Number.parseFloat(computedSavings.toFixed(2));
  })();

  return {
    id,
    name,
    subtitle,
    ribbonText,
    items,
    discountedPrice,
    originalPrice,
    totalPrice,
    savings: resolvedSavings,
    sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
  };
};

function ServicesPage() {
  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const { auth } = useContext(AuthContext);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    nidNumber: '',
    notes: '',
  });
  const [purchaseStatus, setPurchaseStatus] = useState('idle');
  const [purchaseFeedback, setPurchaseFeedback] = useState('');

  const formatCurrency = useCallback((value) => {
    const amount = Number.parseFloat(value ?? 0) || 0;
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  const endpoint = useMemo(() => {
    if (!apiBaseUrl) {
      return '/api/content/service-packages';
    }
    const trimmed = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    return `${trimmed}/api/content/service-packages`;
  }, []);

  const purchaseEndpoint = useMemo(() => endpoint, [endpoint]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPackages() {
      setStatus('loading');
      setError('');

      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Unable to load service packages.');
        }

        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data
              .map((pkg) => normalizeServicePackage(pkg))
              .filter((pkg) => pkg && pkg.items.length > 0)
          : [];

        normalized.sort((a, b) => {
          const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
          if (orderDiff !== 0) {
            return orderDiff;
          }
          return (a.id ?? 0) - (b.id ?? 0);
        });

        setPackages(normalized);
        setStatus('succeeded');
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        setError(err.message || 'Failed to load service packages.');
        setStatus('failed');
      }
    }

    loadPackages();

    return () => {
      controller.abort();
    };
  }, [endpoint]);

  const handleBookNow = useCallback(
    (pkg) => {
      if (!pkg) {
        return;
      }
      setSelectedPackage(pkg);
      setPurchaseForm({
        fullName: auth.user?.fullName || '',
        email: auth.user?.email || '',
        phoneNumber: '',
        nidNumber: '',
        notes: '',
      });
      setPurchaseFeedback('');
      setPurchaseStatus('idle');
    },
    [auth.user]
  );

  const closePurchaseModal = useCallback(() => {
    setSelectedPackage(null);
    setPurchaseStatus('idle');
    setPurchaseFeedback('');
  }, []);

  const handlePurchaseInputChange = (event) => {
    const { name, value } = event.target;
    setPurchaseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchaseSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPackage) {
      return;
    }

    const packageId = selectedPackage.id ?? selectedPackage.PackageID;
    if (!packageId) {
      setPurchaseFeedback('This package is temporarily unavailable.');
      setPurchaseStatus('failed');
      return;
    }

    const payload = {
      fullName: purchaseForm.fullName.trim(),
      email: purchaseForm.email.trim(),
      phoneNumber: purchaseForm.phoneNumber.trim(),
      nidNumber: purchaseForm.nidNumber.trim(),
      notes: purchaseForm.notes.trim(),
    };

    if (!payload.fullName || !payload.email || !payload.phoneNumber) {
      setPurchaseFeedback('Please provide your full name, email, and phone number.');
      setPurchaseStatus('failed');
      return;
    }

    try {
      setPurchaseStatus('loading');
      setPurchaseFeedback('');

      const headers = { 'Content-Type': 'application/json' };
      if (auth.token) {
        headers.Authorization = `Bearer ${auth.token}`;
      }

      const response = await fetch(`${purchaseEndpoint}/${packageId}/purchase`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Unable to process your purchase.');
      }

      setPurchaseStatus('succeeded');
      setPurchaseFeedback(data.message || 'Package purchase request submitted successfully.');
    } catch (err) {
      setPurchaseStatus('failed');
      setPurchaseFeedback(err.message || 'Failed to complete your purchase.');
    }
  };

  const purchaseButtonDisabled = purchaseStatus === 'loading' || purchaseStatus === 'succeeded';

  return (
    <div className="bg-slate-50">
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">Our Service Packages</h1>
          <p className="text-gray-600">
            Explore curated healthcare bundles designed to give you the best value on diagnostics and wellness services.
          </p>
        </header>

        {status === 'loading' ? (
          <div className="flex justify-center py-10 text-gray-500">Loading service packages…</div>
        ) : null}

        {status === 'failed' ? (
          <div className="flex justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-red-700">
            {error}
          </div>
        ) : null}

        {status === 'succeeded' && packages.length === 0 ? (
          <div className="flex justify-center rounded-lg border border-gray-200 bg-white px-4 py-6 text-gray-600">
            No service packages are available right now. Please check back later.
          </div>
        ) : null}

        {packages.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {packages.map((pkg) => (
              <ServiceCard key={pkg.id ?? pkg.name} packageData={pkg} onBook={handleBookNow} />
            ))}
          </div>
        ) : null}
      </div>

      {selectedPackage ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="absolute inset-0" role="presentation" onClick={closePurchaseModal} />
          <div className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <header className="space-y-1 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Purchase package</p>
              <h2 className="text-2xl font-semibold text-slate-900">{selectedPackage.name}</h2>
              {selectedPackage.subtitle ? (
                <p className="text-sm text-slate-500">{selectedPackage.subtitle}</p>
              ) : null}
            </header>

            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p>
                Discounted price:{' '}
                <span className="font-semibold text-brand-primary">
                  BDT {formatCurrency(selectedPackage.discountedPrice)}
                </span>
              </p>
              <p>
                You save{' '}
                <span className="font-semibold text-emerald-600">
                  BDT {formatCurrency(selectedPackage.savings)}
                </span>
                {' '}with this package.
              </p>
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handlePurchaseSubmit}>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Full name
                <input
                  type="text"
                  name="fullName"
                  value={purchaseForm.fullName}
                  onChange={handlePurchaseInputChange}
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Email address
                <input
                  type="email"
                  name="email"
                  value={purchaseForm.email}
                  onChange={handlePurchaseInputChange}
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Phone number
                <input
                  type="tel"
                  name="phoneNumber"
                  value={purchaseForm.phoneNumber}
                  onChange={handlePurchaseInputChange}
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  NID (optional)
                  <input
                    type="text"
                    name="nidNumber"
                    value={purchaseForm.nidNumber}
                    onChange={handlePurchaseInputChange}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                  Notes (optional)
                  <input
                    type="text"
                    name="notes"
                    value={purchaseForm.notes}
                    onChange={handlePurchaseInputChange}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </label>
              </div>

              {purchaseFeedback ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    purchaseStatus === 'succeeded'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {purchaseFeedback}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePurchaseModal}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseButtonDisabled}
                  className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-brand-primary/60"
                >
                  {purchaseStatus === 'loading'
                    ? 'Processing…'
                    : purchaseStatus === 'succeeded'
                    ? 'Purchased!'
                    : 'Confirm purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ServicesPage;
