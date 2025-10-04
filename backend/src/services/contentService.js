const { execute, transaction } = require('../database/query');

function parseJSON(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function normalizeStrings(value) {
  return typeof value === 'string' ? value : '';
}

const defaultSiteSettings = {
  siteName: 'Destination Health',
  siteTagline: 'Seamless booking, coordinated care teams, and secure records—designed for modern health journeys.',
  primaryContactPhone: '1-800-123-456',
  primaryContactEmail: 'care@destinationhealth.com',
  emergencyContactName: 'Emergency coordination desk',
  emergencyContactPhone: '1-800-123-456',
  emergencyContactEmail: 'emergency@destinationhealth.com',
  emergencyContactAddress: '221B Harbor Street, Seattle, WA',
  footerNote: 'Secured with HIPAA-compliant infrastructure.',
};

function normalizeAboutContent(content = {}) {
  const hero = content.hero || {};
  const sections = Array.isArray(content.sections) ? content.sections : [];
  const callout = content.callout || {};

  return {
    hero: {
      eyebrow: normalizeStrings(hero.eyebrow),
      title: normalizeStrings(hero.title),
      subtitle: normalizeStrings(hero.subtitle),
      description: normalizeStrings(hero.description),
      stats: Array.isArray(hero.stats)
        ? hero.stats.map((stat) => ({
            label: normalizeStrings(stat.label),
            value: normalizeStrings(stat.value),
          }))
        : [],
    },
    sections: sections.map((section) => ({
      title: normalizeStrings(section.title),
      body: normalizeStrings(section.body),
      bullets: Array.isArray(section.bullets)
        ? section.bullets
            .map((item) => normalizeStrings(item))
            .filter((item) => item.length > 0)
        : [],
    })),
    callout: {
      title: normalizeStrings(callout.title),
      description: normalizeStrings(callout.description),
    },
  };
}

function normalizeSiteSettings(settings = {}) {
  return {
    siteName: normalizeStrings(settings.siteName) || defaultSiteSettings.siteName,
    siteTagline: normalizeStrings(settings.siteTagline) || defaultSiteSettings.siteTagline,
    primaryContactPhone: normalizeStrings(settings.primaryContactPhone) || defaultSiteSettings.primaryContactPhone,
    primaryContactEmail: normalizeStrings(settings.primaryContactEmail) || defaultSiteSettings.primaryContactEmail,
    emergencyContactName: normalizeStrings(settings.emergencyContactName) || defaultSiteSettings.emergencyContactName,
    emergencyContactPhone: normalizeStrings(settings.emergencyContactPhone) || defaultSiteSettings.emergencyContactPhone,
    emergencyContactEmail: normalizeStrings(settings.emergencyContactEmail) || defaultSiteSettings.emergencyContactEmail,
    emergencyContactAddress:
      normalizeStrings(settings.emergencyContactAddress) || defaultSiteSettings.emergencyContactAddress,
    footerNote: normalizeStrings(settings.footerNote) || defaultSiteSettings.footerNote,
  };
}

async function getAboutContent() {
  const rows = await execute('SELECT ContentValue FROM site_content WHERE ContentKey = ?', ['about_page']);
  if (!rows.length) {
    return normalizeAboutContent();
  }

  return normalizeAboutContent(parseJSON(rows[0].ContentValue));
}

async function getSiteSettings() {
  const rows = await execute('SELECT ContentValue FROM site_content WHERE ContentKey = ?', ['site_settings']);
  if (!rows.length) {
    return normalizeSiteSettings();
  }

  return normalizeSiteSettings(parseJSON(rows[0].ContentValue));
}

async function updateAboutContent(content) {
  const normalized = normalizeAboutContent(content);

  await execute(
    `INSERT INTO site_content (ContentKey, ContentValue)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE ContentValue = VALUES(ContentValue), UpdatedAt = CURRENT_TIMESTAMP`,
    ['about_page', JSON.stringify(normalized)]
  );

  return normalized;
}

async function updateSiteSettings(settings) {
  const normalized = normalizeSiteSettings(settings);

  await execute(
    `INSERT INTO site_content (ContentKey, ContentValue)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE ContentValue = VALUES(ContentValue), UpdatedAt = CURRENT_TIMESTAMP`,
    ['site_settings', JSON.stringify(normalized)]
  );

  return normalized;
}

function normalizePackagePayload(payload = {}) {
  const items = Array.isArray(payload.items) ? payload.items : [];

  const sanitizedItems = items
    .map((item) => ({
      id: item.id || item.packageItemId || item.PackageItemID || null,
      name: normalizeStrings(item.name || item.ItemName),
      price: Math.max(0, Number.parseFloat(item.price ?? item.ItemPrice ?? 0) || 0),
    }))
    .filter((item) => item.name.length > 0);

  const rawSortOrder =
    payload.sortOrder !== undefined && payload.sortOrder !== null
      ? payload.sortOrder
      : payload.SortOrder !== undefined && payload.SortOrder !== null
      ? payload.SortOrder
      : 0;

  return {
    id: payload.id || payload.packageId || payload.PackageID || null,
    name: normalizeStrings(payload.name || payload.PackageName),
    subtitle: normalizeStrings(payload.subtitle || payload.Subtitle),
    discountedPrice: Math.max(0, Number.parseFloat(payload.discountedPrice ?? payload.DiscountedPrice ?? 0) || 0),
    sortOrder: Number.parseInt(rawSortOrder, 10) || 0,
    items: sanitizedItems,
  };
}

function transformPackageRow(row, packageItems) {
  const items = packageItems.map((item) => ({
    id: item.PackageItemID,
    name: item.ItemName,
    price: Number.parseFloat(item.ItemPrice),
    sortOrder: item.SortOrder,
  }));

  const totalPrice = items.reduce((sum, item) => sum + Number(item.price), 0);
  const discountedRaw = Number.parseFloat(row.DiscountedPrice);
  const discounted = Number.isNaN(discountedRaw) ? 0 : discountedRaw;
  const originalRaw = Number.parseFloat(row.OriginalPrice);
  const originalPrice = Number.isNaN(originalRaw) ? totalPrice : originalRaw;

  return {
    id: row.PackageID,
    name: row.PackageName,
    subtitle: row.Subtitle || '',
    totalPrice,
    originalPrice,
    discountedPrice: discounted,
    savings: Number((totalPrice - discounted).toFixed(2)),
    sortOrder: row.SortOrder,
    items: items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
  };
}

async function getServicePackages() {
  const packages = await execute(
    `SELECT PackageID, PackageName, Subtitle, OriginalPrice, DiscountedPrice, SortOrder
     FROM service_packages
     ORDER BY SortOrder ASC, PackageID ASC`
  );

  if (!packages.length) {
    return [];
  }

  const packageIds = packages.map((pkg) => pkg.PackageID);
  const packageItems = await execute(
    `SELECT PackageItemID, PackageID, ItemName, ItemPrice, SortOrder
     FROM service_package_items
     WHERE PackageID IN (?)
     ORDER BY SortOrder ASC, PackageItemID ASC`,
    [packageIds]
  );

  return packages.map((pkg) => {
    const items = packageItems.filter((item) => item.PackageID === pkg.PackageID);
    return transformPackageRow(pkg, items);
  });
}

async function getServicePackageById(packageId) {
  const packages = await execute(
    `SELECT PackageID, PackageName, Subtitle, OriginalPrice, DiscountedPrice, SortOrder
     FROM service_packages
     WHERE PackageID = ?`,
    [packageId]
  );

  const pkg = packages[0];
  if (!pkg) {
    return null;
  }

  const items = await execute(
    `SELECT PackageItemID, PackageID, ItemName, ItemPrice, SortOrder
     FROM service_package_items
     WHERE PackageID = ?
     ORDER BY SortOrder ASC, PackageItemID ASC`,
    [packageId]
  );

  return transformPackageRow(pkg, items);
}

async function createServicePackage(payload) {
  const normalized = normalizePackagePayload(payload);

  if (!normalized.name) {
    const error = new Error('Package name is required.');
    error.status = 400;
    throw error;
  }

  if (!normalized.items.length) {
    const error = new Error('At least one service item is required.');
    error.status = 400;
    throw error;
  }

  return transaction(async (connection) => {
    const totalPrice = normalized.items.reduce((sum, item) => sum + Number(item.price), 0);

    const [result] = await connection.execute(
      `INSERT INTO service_packages (PackageName, Subtitle, OriginalPrice, DiscountedPrice, SortOrder)
       VALUES (?, ?, ?, ?, ?)`,
      [normalized.name, normalized.subtitle, totalPrice, normalized.discountedPrice, normalized.sortOrder]
    );

    const packageId = result.insertId;

    await Promise.all(
      normalized.items.map((item, index) =>
        connection.execute(
          `INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
           VALUES (?, ?, ?, ?)`,
          [packageId, item.name, item.price, index]
        )
      )
    );

    return packageId;
  }).then((packageId) => getServicePackageById(packageId));
}

async function updateServicePackage(packageId, payload) {
  const normalized = normalizePackagePayload(payload);

  if (!normalized.name) {
    const error = new Error('Package name is required.');
    error.status = 400;
    throw error;
  }

  if (!normalized.items.length) {
    const error = new Error('At least one service item is required.');
    error.status = 400;
    throw error;
  }

  return transaction(async (connection) => {
    const [existingRows] = await connection.execute(
      'SELECT PackageItemID FROM service_package_items WHERE PackageID = ?',
      [packageId]
    );
    const existingItemIds = existingRows.map((row) => row.PackageItemID);

    const totalPrice = normalized.items.reduce((sum, item) => sum + Number(item.price), 0);

    await connection.execute(
      `UPDATE service_packages
       SET PackageName = ?, Subtitle = ?, OriginalPrice = ?, DiscountedPrice = ?, SortOrder = ?
       WHERE PackageID = ?`,
      [normalized.name, normalized.subtitle, totalPrice, normalized.discountedPrice, normalized.sortOrder, packageId]
    );

    const retainedIds = new Set();

    for (let index = 0; index < normalized.items.length; index += 1) {
      const item = normalized.items[index];
      if (item.id && existingItemIds.includes(item.id)) {
        await connection.execute(
          `UPDATE service_package_items
           SET ItemName = ?, ItemPrice = ?, SortOrder = ?
           WHERE PackageItemID = ? AND PackageID = ?`,
          [item.name, item.price, index, item.id, packageId]
        );
        retainedIds.add(item.id);
      } else {
        const [result] = await connection.execute(
          `INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
           VALUES (?, ?, ?, ?)`,
          [packageId, item.name, item.price, index]
        );
        retainedIds.add(result.insertId);
      }
    }

    const idsToDelete = existingItemIds.filter((id) => !retainedIds.has(id));
    if (idsToDelete.length > 0) {
      await connection.execute(
        `DELETE FROM service_package_items WHERE PackageItemID IN (?)`,
        [idsToDelete]
      );
    }

    return packageId;
  }).then((updatedId) => getServicePackageById(updatedId));
}

async function deleteServicePackage(packageId) {
  const result = await execute('DELETE FROM service_packages WHERE PackageID = ?', [packageId]);
  if (result.affectedRows === 0) {
    const error = new Error('Service package not found.');
    error.status = 404;
    throw error;
  }
}

module.exports = {
  getAboutContent,
  updateAboutContent,
  getSiteSettings,
  updateSiteSettings,
  getServicePackages,
  getServicePackageById,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
};
