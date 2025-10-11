import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const formatCurrency = (value) => {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return '0.00';
  }

  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const purchaseStatusLabelMap = {
  pending: 'Awaiting confirmation',
  confirmed: 'Active package',
  cancelled: 'Cancelled',
};

export default function ServiceCard({ packageData, onBook, purchaseState }) {
  const { name, subtitle, ribbonText, discountedPrice } = packageData;

  const items = useMemo(() => {
    const list = Array.isArray(packageData.items) ? packageData.items : [];
    return [...list].sort((a, b) => {
      const sortDifference = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (sortDifference !== 0) {
        return sortDifference;
      }
      const idA = Number.parseInt(a.id ?? a.PackageItemID ?? 0, 10);
      const idB = Number.parseInt(b.id ?? b.PackageItemID ?? 0, 10);
      if (Number.isNaN(idA) || Number.isNaN(idB)) {
        return 0;
      }
      return idA - idB;
    });
  }, [packageData.items]);

  const totalCost = useMemo(() => {
    if (typeof packageData.totalPrice === 'number') {
      return packageData.totalPrice;
    }
    if (typeof packageData.originalPrice === 'number') {
      return packageData.originalPrice;
    }

    return items.reduce((sum, item) => sum + (Number.parseFloat(item.price) || 0), 0);
  }, [items, packageData.originalPrice, packageData.totalPrice]);

  const resolvedDiscountedPrice = Number.parseFloat(discountedPrice) || 0;
  const savings = useMemo(() => {
    if (typeof packageData.savings === 'number') {
      return packageData.savings;
    }

    return Math.max(0, totalCost - resolvedDiscountedPrice);
  }, [packageData.savings, totalCost, resolvedDiscountedPrice]);

  const resolvedRibbonText = useMemo(() => {
    const trimmed = (ribbonText || '').trim();
    if (trimmed) {
      return trimmed;
    }

    if (savings > 0) {
      return `SAVE BDT ${formatCurrency(savings)}`;
    }

    return '';
  }, [ribbonText, savings]);

  const purchaseDisplay = useMemo(() => {
    if (!purchaseState) {
      return null;
    }

    const statusKey = String(purchaseState.status || 'pending').toLowerCase();
    const statusLabel = purchaseStatusLabelMap[statusKey] || 'Purchased';
    const badgeClass =
      statusKey === 'confirmed'
        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border border-amber-200 bg-amber-50 text-amber-700';

    return {
      statusKey,
      statusLabel,
      badgeClass,
    };
  }, [purchaseState]);

  const purchaseDateLabel = useMemo(() => {
    if (!purchaseState?.purchasedAt) {
      return '';
    }
    const parsed = new Date(purchaseState.purchasedAt);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [purchaseState?.purchasedAt]);

  const buttonDisabled = Boolean(purchaseDisplay);
  const buttonLabel = useMemo(() => {
    if (!purchaseDisplay) {
      return 'Purchase package';
    }
    if (purchaseDisplay.statusKey === 'confirmed') {
      return 'Purchased';
    }
    return 'Awaiting confirmation';
  }, [purchaseDisplay]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white p-6 font-sans shadow-md">
      {purchaseDisplay ? (
        <div className="absolute right-4 top-4 flex flex-col items-end gap-1 text-xs font-semibold">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${purchaseDisplay.badgeClass}`}>
            Purchased
          </span>
          <span className="text-[11px] font-medium text-slate-500">{purchaseDisplay.statusLabel}</span>
        </div>
      ) : null}
      {resolvedRibbonText ? (
        <div className="absolute top-9 -left-14" aria-hidden="true">
          <div className="relative">
            <div className="bg-brand-primary text-white font-semibold px-12 py-3.5 shadow-lg transform -rotate-45 flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 30 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm tracking-wide uppercase">{resolvedRibbonText}</span>
            </div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-green-700 border-r-[6px] border-r-transparent" />
          </div>
        </div>
      ) : null}

      <div className="mt-8 mb-4 space-y-1 text-center">
        <span className="block text-2xl font-semibold tracking-tight text-slate-900">{name}</span>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="rounded-xl overflow-hidden">
        <table className="w-full text-sm font-medium text-slate-600">
          <tbody>
            {items.map((service) => {
              const price = Number.parseFloat(service.price);
              return (
                <tr key={service.id || service.PackageItemID || service.name}>
                  <td className="px-5 py-2 text-left align-top text-slate-700">{service.name}</td>
                  <td className="whitespace-nowrap px-5 py-2 text-right text-slate-700">
                    BDT {formatCurrency(Number.isNaN(price) ? 0 : price)}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={2}>
                <hr className="my-2 border-gray-200" />
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2 font-semibold text-slate-600">Total Cost:</td>
              <td className="px-5 py-2 text-right text-slate-600">BDT {formatCurrency(totalCost)}</td>
            </tr>
            <tr>
              <td className="px-5 py-2 font-semibold text-slate-600">Discounted Price:</td>
              <td className="px-5 py-2 text-right text-lg font-semibold text-brand-primary">
                BDT {formatCurrency(resolvedDiscountedPrice)}
              </td>
            </tr>
          </tbody>
        </table>
        <button
          type="button"
          className="mt-4 rounded-full bg-brand-primary px-12 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          disabled={buttonDisabled}
          onClick={() => {
            if (typeof onBook === 'function' && !buttonDisabled) {
              onBook(packageData);
            }
          }}
        >
          {buttonLabel}
        </button>
        {purchaseDisplay ? (
          <div className="mt-3 space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <p className="font-medium text-slate-700">
              {purchaseDisplay.statusKey === 'confirmed'
                ? 'This package is active for your reports.'
                : 'We will confirm your request shortly.'}
            </p>
            {purchaseState?.paymentMethodLabel ? (
              <p>
                Payment method:{' '}
                <span className="font-semibold text-slate-700">{purchaseState.paymentMethodLabel}</span>
              </p>
            ) : null}
            {purchaseDateLabel ? <p>Requested on {purchaseDateLabel}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

ServiceCard.propTypes = {
  packageData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    ribbonText: PropTypes.string,
    totalPrice: PropTypes.number,
    originalPrice: PropTypes.number,
    discountedPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    savings: PropTypes.number,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        PackageItemID: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        name: PropTypes.string.isRequired,
        price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        sortOrder: PropTypes.number,
      })
    ),
  }).isRequired,
  onBook: PropTypes.func,
  purchaseState: PropTypes.shape({
    status: PropTypes.string,
    purchasedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    paymentMethod: PropTypes.string,
    paymentMethodLabel: PropTypes.string,
  }),
};

ServiceCard.defaultProps = {
  onBook: undefined,
  purchaseState: null,
};
