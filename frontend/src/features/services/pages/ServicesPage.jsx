import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ServiceCard from '../components/ServiceCard';

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

  const endpoint = useMemo(() => {
    if (!apiBaseUrl) {
      return '/api/content/service-packages';
    }
    const trimmed = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
    return `${trimmed}/api/content/service-packages`;
  }, []);

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

  const handleBookNow = useCallback((pkg) => {
    console.info('Book package request', pkg);
  }, []);

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
    </div>
  );
}

export default ServicesPage;
