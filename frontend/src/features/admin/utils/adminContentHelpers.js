export const createEmptyAboutDraft = () => ({
  hero: { eyebrow: '', title: '', subtitle: '', description: '', stats: [] },
  sections: [],
  callout: { title: '', description: '' },
});

export const deepClone = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
};

export const mapPackageResponseToForm = (pkg) => {
  const resolvedDiscountedPrice =
    pkg.discountedPrice !== undefined && pkg.discountedPrice !== null
      ? pkg.discountedPrice
      : pkg.DiscountedPrice !== undefined && pkg.DiscountedPrice !== null
      ? pkg.DiscountedPrice
      : pkg.totalPrice ?? pkg.TotalPrice ?? '';

  const resolvedSortOrder =
    pkg.sortOrder !== undefined && pkg.sortOrder !== null ? pkg.sortOrder : pkg.SortOrder ?? '0';

  const items = Array.isArray(pkg.items)
    ? pkg.items
    : Array.isArray(pkg.packageItems)
    ? pkg.packageItems
    : [];

  return {
    id: pkg.id ?? pkg.PackageID ?? null,
    name: pkg.name ?? pkg.PackageName ?? '',
    subtitle: pkg.subtitle ?? pkg.Subtitle ?? '',
    discountedPrice:
      resolvedDiscountedPrice === '' || resolvedDiscountedPrice === null
        ? ''
        : Number.parseFloat(resolvedDiscountedPrice).toString(),
    sortOrder: resolvedSortOrder.toString(),
    items: items.map((item) => {
      const rawPrice =
        item.price !== undefined && item.price !== null
          ? item.price
          : item.ItemPrice !== undefined && item.ItemPrice !== null
          ? item.ItemPrice
          : item.amount ?? 0;

      const parsedPrice = Number.parseFloat(Array.isArray(rawPrice) ? rawPrice[0] : rawPrice);

      return {
        id: item.id ?? item.PackageItemID ?? null,
        name: item.name ?? item.ItemName ?? '',
        price: Number.isNaN(parsedPrice) ? '' : parsedPrice.toString(),
      };
    }),
  };
};
