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

export const mapPackageResponseToForm = (pkg) => ({
  id: pkg.id ?? pkg.PackageID ?? null,
  name: pkg.name ?? pkg.PackageName ?? '',
  subtitle: pkg.subtitle ?? pkg.Subtitle ?? '',
  discountedPrice: pkg.discountedPrice !== undefined ? pkg.discountedPrice.toString() : (pkg.totalPrice ?? '').toString(),
  sortOrder: pkg.sortOrder !== undefined ? pkg.sortOrder.toString() : '0',
  items: Array.isArray(pkg.items)
    ? pkg.items.map((item) => ({
        id: item.id ?? item.PackageItemID ?? null,
        name: item.name ?? item.ItemName ?? '',
        price: item.price !== undefined ? item.price.toString() : '0',
      }))
    : [],
});
