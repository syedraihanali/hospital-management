import React from 'react';

function formatCurrency(value) {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return 'BDT 0.00';
  }

  return `BDT ${numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ServiceCard({ packageData, onPurchase, actionLabel = 'Purchase package', disabled = false }) {
  const items = Array.isArray(packageData?.items) ? packageData.items : [];
  const originalPrice = Number.parseFloat(packageData?.originalPrice ?? packageData?.totalPrice ?? 0) || 0;
  const discountedPrice = Number.parseFloat(packageData?.discountedPrice ?? 0) || 0;
  const savings = Math.max(0, Number.parseFloat(packageData?.savings ?? originalPrice - discountedPrice) || 0);
  const hasDiscount = savings > 0.009;

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-card transition hover:shadow-xl">
      {hasDiscount ? (
        <div className="absolute left-[-3.75rem] top-8 rotate-[-45deg] bg-brand-primary px-12 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg">
          Save {formatCurrency(savings)}
        </div>
      ) : null}

      <header className="mb-4 flex flex-col items-center gap-2 text-center">
        <h3 className="text-2xl font-semibold text-slate-900">{packageData?.name || 'Service package'}</h3>
        {packageData?.subtitle ? (
          <p className="text-sm text-slate-600">{packageData.subtitle}</p>
        ) : null}
      </header>

      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm text-slate-700">
          <tbody>
            {items.length ? (
              items.map((service) => (
                <tr key={service.id ?? service.name} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3 font-medium text-slate-700">{service.name}</td>
                  <td className="px-5 py-3 text-right text-slate-500">{formatCurrency(service.price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-4 text-center text-slate-500" colSpan={2}>
                  Package items will appear here once published.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-5 flex flex-col gap-4">
        <div className="grid gap-3 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tests value</p>
            <p className="text-base font-semibold text-slate-900">{formatCurrency(originalPrice)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">You pay</p>
            <p className="text-base font-semibold text-brand-primary">{formatCurrency(discountedPrice)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">You save</p>
            <p className="text-base font-semibold text-emerald-600">{formatCurrency(savings)}</p>
          </div>
        </div>
        {onPurchase ? (
          <button
            type="button"
            onClick={() => onPurchase(packageData)}
            disabled={disabled}
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-8 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {actionLabel}
          </button>
        ) : null}
      </footer>
    </article>
  );
}

export default ServiceCard;