import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import { AuthContext } from '../../auth/context/AuthContext';

const apiBaseUrl = process.env.REACT_APP_API_URL;

const paymentMethodOptions = [
  {
    value: 'bkash',
    label: 'bKash (Mobile Wallet)',
    description: 'Send the payment from your bKash wallet and include the transaction ID in your notes.',
  },
  {
    value: 'nagad',
    label: 'Nagad (Mobile Wallet)',
    description: 'Complete the purchase instantly with your Nagad wallet reference number.',
  },
  {
    value: 'card',
    label: 'Debit / Credit card',
    description: 'Use any Visa or Mastercard debit or credit card for instant confirmation.',
  },
];

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
  const navigate = useNavigate();
  const authUser = auth?.user;
  const authToken = auth?.token;
  const authUserRole = authUser?.role;
  const patientId = authUser?.id;
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [purchaseForm, setPurchaseForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    nidNumber: '',
    notes: '',
    paymentMethod: '',
  });
  const [purchaseStatus, setPurchaseStatus] = useState('idle');
  const [purchaseFeedback, setPurchaseFeedback] = useState('');
  const [authPrompt, setAuthPrompt] = useState('');
  const [purchasedPackages, setPurchasedPackages] = useState({});
  const [purchaseHistoryStatus, setPurchaseHistoryStatus] = useState('idle');
  const [purchaseHistoryError, setPurchaseHistoryError] = useState('');
  const [purchaseHistoryReloadToken, setPurchaseHistoryReloadToken] = useState(0);

  const defaultAuthMessage = useMemo(() => {
    if (!authToken) {
      return 'Sign in to your patient account to purchase packages and unlock instant discounts.';
    }
    if (authUserRole && authUserRole !== 'patient') {
      return 'Switch to a patient account to purchase service packages.';
    }
    return '';
  }, [authToken, authUserRole]);

  const activeAuthMessage = authPrompt || defaultAuthMessage;

  const formatCurrency = useCallback((value) => {
    const amount = Number.parseFloat(value ?? 0) || 0;
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  const trimmedApiBaseUrl = useMemo(() => {
    if (!apiBaseUrl) {
      return '';
    }
    return apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  }, []);

  const packagesEndpoint = useMemo(() => {
    return trimmedApiBaseUrl ? `${trimmedApiBaseUrl}/api/content/service-packages` : '/api/content/service-packages';
  }, [trimmedApiBaseUrl]);

  const patientOrdersEndpoint = useMemo(() => {
    if (!patientId) {
      return null;
    }

    return trimmedApiBaseUrl
      ? `${trimmedApiBaseUrl}/api/patients/${patientId}/package-orders`
      : `/api/patients/${patientId}/package-orders`;
  }, [patientId, trimmedApiBaseUrl]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPackages() {
      setStatus('loading');
      setError('');

      try {
        const response = await fetch(packagesEndpoint, { signal: controller.signal });
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
  }, [packagesEndpoint]);

  useEffect(() => {
    if (authToken && authUserRole === 'patient') {
      setAuthPrompt('');
    }
  }, [authToken, authUserRole]);

  useEffect(() => {
    if (!authToken || authUserRole !== 'patient' || !patientOrdersEndpoint) {
      setPurchasedPackages({});
      setPurchaseHistoryStatus('idle');
      setPurchaseHistoryError('');
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    async function loadPurchaseHistory() {
      setPurchaseHistoryStatus('loading');
      setPurchaseHistoryError('');

      try {
        const response = await fetch(patientOrdersEndpoint, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error('Please sign in again to view your package history.');
        }

        if (!response.ok) {
          throw new Error('Unable to load purchased packages.');
        }

        const data = await response.json();
        const orders = Array.isArray(data.orders) ? data.orders : [];

        const activeMap = {};
        orders.forEach((order) => {
          const packageIdValue = order.packageId ?? order.PackageID;
          if (!packageIdValue) {
            return;
          }

          const statusKey = String(order.status || 'pending').toLowerCase();
          const isActive = order.isActive === undefined ? true : Boolean(order.isActive);
          if (!isActive || statusKey === 'cancelled') {
            return;
          }

          activeMap[String(packageIdValue)] = {
            status: statusKey,
            purchasedAt: order.purchasedAt ?? order.CreatedAt ?? null,
            paymentMethod: order.paymentMethod ?? order.paymentMethodLabel ?? null,
            paymentMethodLabel: order.paymentMethodLabel ?? null,
          };
        });

        if (isMounted) {
          setPurchasedPackages(activeMap);
          setPurchaseHistoryStatus('succeeded');
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          setPurchasedPackages({});
          setPurchaseHistoryError(err.message || 'Failed to load purchased packages.');
          setPurchaseHistoryStatus('failed');
          if (err.message && err.message.toLowerCase().includes('sign in')) {
            setAuthPrompt(err.message);
          }
        }
      }
    }

    loadPurchaseHistory();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [authToken, authUserRole, patientOrdersEndpoint, purchaseHistoryReloadToken]);

  const handleBookNow = useCallback(
    (pkg) => {
      if (!pkg) {
        return;
      }

      if (!authToken) {
        setAuthPrompt('Please sign in to purchase a service package.');
        navigate('/signin/patient');
        return;
      }

      if (authUserRole && authUserRole !== 'patient') {
        setAuthPrompt('Switch to your patient account to purchase service packages.');
        navigate('/signin/patient');
        return;
      }

      setSelectedPackage(pkg);
      setPurchaseForm({
        fullName: authUser?.fullName || '',
        email: authUser?.email || '',
        phoneNumber: '',
        nidNumber: '',
        notes: '',
        paymentMethod: '',
      });
      setPurchaseFeedback('');
      setPurchaseStatus('idle');
    },
    [authToken, authUser, authUserRole, navigate]
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
      paymentMethod: purchaseForm.paymentMethod,
    };

    if (!payload.fullName || !payload.email || !payload.phoneNumber) {
      setPurchaseFeedback('Please provide your full name, email, and phone number.');
      setPurchaseStatus('failed');
      return;
    }

    if (!payload.nidNumber) {
      setPurchaseFeedback('Your national ID number is required to activate this package.');
      setPurchaseStatus('failed');
      return;
    }

    if (!payload.paymentMethod) {
      setPurchaseFeedback('Please select a payment method to continue.');
      setPurchaseStatus('failed');
      return;
    }

    try {
      setPurchaseStatus('loading');
      setPurchaseFeedback('');

      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`${packagesEndpoint}/${packageId}/purchase`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error('Please sign in with your patient account to purchase a package.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Unable to process your purchase.');
      }

      setPurchaseStatus('succeeded');
      setPurchaseFeedback(data.message || 'Package purchase confirmed successfully.');
      setPurchaseHistoryReloadToken((value) => value + 1);
    } catch (err) {
      setPurchaseStatus('failed');
      setPurchaseFeedback(err.message || 'Failed to complete your purchase.');
      if (err.message && err.message.toLowerCase().includes('sign in')) {
        setAuthPrompt(err.message);
        navigate('/signin/patient');
      }
    }
  };

  const selectedPaymentOption = useMemo(() => {
    return (
      paymentMethodOptions.find((option) => option.value === purchaseForm.paymentMethod) || null
    );
  }, [purchaseForm.paymentMethod]);

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

        {activeAuthMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {activeAuthMessage}
          </div>
        ) : null}

        {purchaseHistoryStatus === 'loading' ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Checking your recent package purchases…
          </div>
        ) : null}

        {purchaseHistoryStatus === 'failed' && purchaseHistoryError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {purchaseHistoryError}
          </div>
        ) : null}

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
            {packages.map((pkg) => {
              const packageIdKey = String(pkg.id ?? pkg.PackageID ?? '');
              const purchaseState =
                purchaseHistoryStatus === 'succeeded' && packageIdKey
                  ? purchasedPackages[packageIdKey]
                  : undefined;

              return (
                <ServiceCard
                  key={pkg.id ?? pkg.name}
                  packageData={pkg}
                  onBook={handleBookNow}
                  purchaseState={purchaseState}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {selectedPackage ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-8 sm:py-12">
          <div className="absolute inset-0" role="presentation" onClick={closePurchaseModal} />
          <div className="relative z-10 w-full max-w-2xl">
            <div className="relative flex max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <button
                type="button"
                onClick={closePurchaseModal}
                className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              >
                <span className="sr-only">Close purchase form</span>
                <span aria-hidden="true">×</span>
              </button>
              <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
                <header className="space-y-1 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Purchase package</p>
                  <h2 className="text-2xl font-semibold text-slate-900">{selectedPackage.name}</h2>
                  {selectedPackage.subtitle ? (
                    <p className="text-sm text-slate-500">{selectedPackage.subtitle}</p>
                  ) : null}
                </header>

                <form className="mt-6 space-y-6" onSubmit={handlePurchaseSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                      Full name
                      <input
                        type="text"
                        name="fullName"
                        value={purchaseForm.fullName}
                        onChange={handlePurchaseInputChange}
                        required
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
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
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                      Phone number
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={purchaseForm.phoneNumber}
                        onChange={handlePurchaseInputChange}
                        required
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                      NID number
                      <input
                        type="text"
                        name="nidNumber"
                        value={purchaseForm.nidNumber}
                        onChange={handlePurchaseInputChange}
                        required
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Notes for our care team (optional)
                    <textarea
                      name="notes"
                      value={purchaseForm.notes}
                      onChange={handlePurchaseInputChange}
                      rows={3}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </label>

                  <section className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-emerald-900 shadow-inner">
                    <header>
                      <h3 className="text-base font-semibold text-emerald-900">Payment details</h3>
                      <p className="mt-1 text-xs text-emerald-700">
                        Discounted price:{' '}
                        <span className="font-semibold text-emerald-900">
                          BDT {formatCurrency(selectedPackage.discountedPrice)}
                        </span>
                      </p>
                      <p className="text-xs text-emerald-700">
                        You save{' '}
                        <span className="font-semibold text-emerald-900">
                          BDT {formatCurrency(selectedPackage.savings)}
                        </span>{' '}
                        instantly with this package.
                      </p>
                    </header>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col text-xs font-semibold text-emerald-900">
                        Payment method
                        <select
                          name="paymentMethod"
                          value={purchaseForm.paymentMethod}
                          onChange={handlePurchaseInputChange}
                          required
                          className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                        >
                          <option value="">Select a payment method</option>
                          {paymentMethodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <span className="mt-1 text-[11px] font-normal text-emerald-700">
                          {selectedPaymentOption?.description || 'Choose how you would like to complete the payment.'}
                        </span>
                      </label>

                      <div className="rounded-2xl border border-emerald-200/60 bg-white/70 p-3 text-xs text-emerald-800">
                        <p className="font-semibold text-emerald-900">Instant confirmation</p>
                        <p className="mt-1 text-[11px]">
                          Share your transaction details in the notes if needed. Once submitted, your package is confirmed
                          automatically and the discount becomes active right away.
                        </p>
                      </div>
                    </div>
                  </section>

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
                        ? 'Package activated'
                        : 'Activate package'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ServicesPage;
