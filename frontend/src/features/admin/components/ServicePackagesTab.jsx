import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { deepClone, mapPackageResponseToForm } from '../utils/adminContentHelpers';

const apiBaseUrl = process.env.REACT_APP_API_URL;

function ServicePackagesTab({ token }) {
  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [deletingKey, setDeletingKey] = useState(null);

  const fetchPackages = useCallback(async () => {
    if (!token) {
      return;
    }

    setStatus('loading');
    setError('');
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/service-packages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load service packages.');
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data.map(mapPackageResponseToForm) : [];
      setPackages(list);
      setStatus('succeeded');
    } catch (err) {
      setError(err.message || 'Failed to load service packages.');
      setStatus('failed');
    }
  }, [token]);

  useEffect(() => {
    if (status === 'idle' && token) {
      fetchPackages();
    }
  }, [fetchPackages, status, token]);

  const handlePackageFieldChange = (index, field, value) => {
    setPackages((prev) => {
      const next = deepClone(prev);
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handlePackageItemChange = (packageIndex, itemIndex, field, value) => {
    setPackages((prev) => {
      const next = deepClone(prev);
      const pkg = next[packageIndex];
      const items = Array.isArray(pkg.items) ? [...pkg.items] : [];
      items[itemIndex] = {
        ...items[itemIndex],
        [field]: value,
      };
      next[packageIndex] = {
        ...pkg,
        items,
      };
      return next;
    });
  };

  const handleAddPackageItem = (packageIndex) => {
    setPackages((prev) => {
      const next = deepClone(prev);
      const pkg = next[packageIndex];
      const items = Array.isArray(pkg.items) ? [...pkg.items] : [];
      items.push({ id: null, name: '', price: '' });
      next[packageIndex] = {
        ...pkg,
        items,
      };
      return next;
    });
  };

  const handleRemovePackageItem = (packageIndex, itemIndex) => {
    setPackages((prev) => {
      const next = deepClone(prev);
      const pkg = next[packageIndex];
      const items = Array.isArray(pkg.items) ? [...pkg.items] : [];
      items.splice(itemIndex, 1);
      next[packageIndex] = {
        ...pkg,
        items,
      };
      return next;
    });
  };

  const handleAddPackage = () => {
    setPackages((prev) => [
      ...prev,
      {
        id: null,
        name: '',
        subtitle: '',
        discountedPrice: '',
        sortOrder: (prev.length + 1).toString(),
        items: [{ id: null, name: '', price: '' }],
      },
    ]);
  };

  const buildPackagePayload = (pkg) => {
    const normalizedItems = Array.isArray(pkg.items) ? pkg.items : [];

    const items = normalizedItems
      .map((item) => {
        const trimmedName = (item.name || '').trim();
        const rawPrice = item.price ?? item.ItemPrice ?? '';
        const parsedPrice = Number.parseFloat(rawPrice);

        return {
          id: item.id || item.packageItemId || item.PackageItemID || undefined,
          name: trimmedName,
          price: Number.isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice),
        };
      })
      .filter((item) => item.name.length > 0);

    return {
      name: (pkg.name || '').trim(),
      subtitle: (pkg.subtitle || '').trim(),
      discountedPrice: (() => {
        const parsed = Number.parseFloat(pkg.discountedPrice);
        return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
      })(),
      sortOrder: (() => {
        const parsed = Number.parseInt(pkg.sortOrder, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      })(),
      items,
    };
  };

  const handleSavePackage = async (pkg, originalIndex) => {
    if (!token) {
      return;
    }

    const payload = buildPackagePayload(pkg);
    if (!payload.name) {
      setFeedback({ type: 'error', message: 'Package name is required.' });
      return;
    }

    if (!payload.items.length) {
      setFeedback({ type: 'error', message: 'Add at least one package item before saving.' });
      return;
    }

    const key = pkg.id ?? `new-${originalIndex}`;
    setSavingKey(key);
    setFeedback(null);

    const endpoint = pkg.id
      ? `${apiBaseUrl}/api/admin/content/service-packages/${pkg.id}`
      : `${apiBaseUrl}/api/admin/content/service-packages`;

    const method = pkg.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save the service package.');
      }

      const result = await response.json();
      setPackages((prev) => {
        const next = [...prev];
        next[originalIndex] = mapPackageResponseToForm(result);
        return next;
      });
      setFeedback({ type: 'success', message: `${result.name || 'Package'} saved successfully.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save package.' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleDeletePackage = async (pkg, originalIndex) => {
    if (!token) {
      return;
    }

    if (!pkg.id) {
      setPackages((prev) => prev.filter((_, idx) => idx !== originalIndex));
      setFeedback({ type: 'success', message: 'Draft package removed.' });
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to remove ${pkg.name}?`);
    if (!confirmDelete) {
      return;
    }

    setDeletingKey(pkg.id);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/service-packages/${pkg.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to delete the service package.');
      }

      setPackages((prev) => prev.filter((_, idx) => idx !== originalIndex));
      setFeedback({ type: 'success', message: `${pkg.name} removed successfully.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete package.' });
    } finally {
      setDeletingKey(null);
    }
  };

  const sortedPackages = useMemo(
    () =>
      packages
        .map((pkg, originalIndex) => ({ pkg, originalIndex }))
        .sort(
          (a, b) =>
            (Number.parseInt(a.pkg.sortOrder, 10) || 0) - (Number.parseInt(b.pkg.sortOrder, 10) || 0)
        ),
    [packages],
  );

  if (!token) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-slate-600">
        Sign in as an administrator to manage service packages.
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-slate-600">Loading service packages...</div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-red-600">
        <span>{error}</span>
        <button
          type="button"
          onClick={fetchPackages}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-dark"
        >
          Retry loading packages
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand-primary">Lab test packages</h2>
          <p className="text-sm text-slate-600">
            Create bundled laboratory screenings, add individual test items, and publish the discounted price patients will see
            on the services page.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddPackage}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
        >
          + Add new package
        </button>
      </header>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="space-y-6">
        {sortedPackages.map(({ pkg, originalIndex }) => {
          const key = pkg.id ?? `draft-${originalIndex}`;
          const items = Array.isArray(pkg.items) ? pkg.items : [];
          const total = items.reduce((sum, item) => sum + (Number.parseFloat(item.price) || 0), 0);
          const discounted = Number.parseFloat(pkg.discountedPrice) || 0;
          const saving = Math.max(0, total - discounted);
          const savingKeyForPackage = pkg.id ?? `new-${originalIndex}`;

          return (
            <article key={key} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Package name</span>
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(event) => handlePackageFieldChange(originalIndex, 'name', event.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Subtitle</span>
                    <input
                      type="text"
                      value={pkg.subtitle}
                      onChange={(event) => handlePackageFieldChange(originalIndex, 'subtitle', event.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                    Sort order
                    <input
                      type="number"
                      value={pkg.sortOrder}
                      onChange={(event) => handlePackageFieldChange(originalIndex, 'sortOrder', event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                    Discounted price (BDT)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pkg.discountedPrice}
                      onChange={(event) => handlePackageFieldChange(originalIndex, 'discountedPrice', event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                  <div className="flex flex-col justify-center rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span>
                      Total tests value: <strong className="text-slate-900">BDT {total.toLocaleString('en-US')}</strong>
                    </span>
                    <span>
                      Savings: <strong className="text-emerald-600">BDT {saving.toLocaleString('en-US')}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Lab tests in this package</h4>
                  <button
                    type="button"
                    onClick={() => handleAddPackageItem(originalIndex)}
                    className="text-sm font-medium text-brand-primary hover:text-brand-dark"
                  >
                    + Add item
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((item, itemIndex) => (
                    <div key={`${key}-item-${itemIndex}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
                      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                        Lab test name
                        <input
                          type="text"
                          value={item.name}
                          onChange={(event) => handlePackageItemChange(originalIndex, itemIndex, 'name', event.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                        Lab test price (BDT)
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(event) => handlePackageItemChange(originalIndex, itemIndex, 'price', event.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemovePackageItem(originalIndex, itemIndex)}
                        className="self-start text-xs font-medium text-rose-500 hover:text-rose-600"
                      >
                        Remove item
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleSavePackage(pkg, originalIndex)}
                  disabled={savingKey === savingKeyForPackage}
                  className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {savingKey === savingKeyForPackage ? 'Saving...' : 'Save package'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePackage(pkg, originalIndex)}
                  disabled={deletingKey === pkg.id}
                  className="inline-flex items-center justify-center rounded-full border border-rose-300 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  {deletingKey === pkg.id ? 'Removing...' : 'Remove package'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ServicePackagesTab;
