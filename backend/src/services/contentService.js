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
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value) {
  return trimString(value).toLowerCase();
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
  supportPhone: '+8801711000000',
  supportWhatsappUrl: 'https://wa.me/8801711000000',
};

const defaultHomeHeroContent = {
  eyebrow: 'Coordinated care, on your schedule',
  title: 'Expert specialists and secure records in one hospital hub',
  subtitle:
    'Plan visits, share medical documents, and stay aligned with your care team from the comfort of your home.',
  imageUrl:
    'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1600&q=80',
  ctaLabel: 'Book an appointment',
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
    supportPhone: normalizeStrings(settings.supportPhone) || defaultSiteSettings.supportPhone,
    supportWhatsappUrl:
      normalizeStrings(settings.supportWhatsappUrl) || defaultSiteSettings.supportWhatsappUrl,
  };
}

function normalizeHomeHeroContent(content = {}) {
  return {
    eyebrow: normalizeStrings(content.eyebrow) || defaultHomeHeroContent.eyebrow,
    title: normalizeStrings(content.title) || defaultHomeHeroContent.title,
    subtitle: normalizeStrings(content.subtitle) || defaultHomeHeroContent.subtitle,
    imageUrl: normalizeStrings(content.imageUrl) || defaultHomeHeroContent.imageUrl,
    ctaLabel: normalizeStrings(content.ctaLabel) || defaultHomeHeroContent.ctaLabel,
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

async function getHomeHeroContent() {
  const rows = await execute('SELECT ContentValue FROM site_content WHERE ContentKey = ?', ['home_hero']);
  if (!rows.length) {
    return normalizeHomeHeroContent();
  }

  return normalizeHomeHeroContent(parseJSON(rows[0].ContentValue));
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

async function updateHomeHeroContent(content) {
  const normalized = normalizeHomeHeroContent(content);

  await execute(
    `INSERT INTO site_content (ContentKey, ContentValue)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE ContentValue = VALUES(ContentValue), UpdatedAt = CURRENT_TIMESTAMP`,
    ['home_hero', JSON.stringify(normalized)]
  );

  return normalized;
}

function normalizePackagePayload(payload = {}) {
  const rawItems = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.packageItems)
    ? payload.packageItems
    : [];

  const sanitizedItems = rawItems
    .map((item) => {
      const rawId =
        item.id !== undefined && item.id !== null
          ? item.id
          : item.packageItemId !== undefined && item.packageItemId !== null
          ? item.packageItemId
          : item.PackageItemID !== undefined && item.PackageItemID !== null
          ? item.PackageItemID
          : null;

      const normalizedIdSource = Array.isArray(rawId) ? rawId[0] : rawId;
      const normalizedIdNumber = Number.parseInt(normalizedIdSource, 10);
      const normalizedId = Number.isNaN(normalizedIdNumber) ? null : normalizedIdNumber;

      const resolvedName = normalizeStrings(item.name || item.ItemName || item.title || '');
      const rawPrice = item.price ?? item.ItemPrice ?? item.amount ?? 0;
      const numericPrice = Number.parseFloat(Array.isArray(rawPrice) ? rawPrice[0] : rawPrice);

      return {
        id: normalizedId,
        name: resolvedName,
        price: Number.isNaN(numericPrice) ? 0 : Math.max(0, numericPrice),
      };
    })
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
    ribbonText: normalizeStrings(payload.ribbonText || payload.RibbonText),
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
    ribbonText: row.RibbonText || '',
    totalPrice,
    originalPrice,
    discountedPrice: discounted,
    savings: Number((Math.max(totalPrice, originalPrice) - discounted).toFixed(2)),
    sortOrder: row.SortOrder,
    items: items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
  };
}

async function getServicePackages() {
  const packages = await execute(
    `SELECT PackageID, PackageName, Subtitle, RibbonText, OriginalPrice, DiscountedPrice, SortOrder
     FROM service_packages
     ORDER BY SortOrder ASC, PackageID ASC`
  );

  if (!packages.length) {
    return [];
  }

  const packageIds = packages.map((pkg) => pkg.PackageID);
  const placeholders = packageIds.map(() => '?').join(', ');
  const packageItems = await execute(
    `SELECT PackageItemID, PackageID, ItemName, ItemPrice, SortOrder
     FROM service_package_items
     WHERE PackageID IN (${placeholders})
     ORDER BY SortOrder ASC, PackageItemID ASC`,
    packageIds
  );

  return packages.map((pkg) => {
    const items = packageItems.filter((item) => item.PackageID === pkg.PackageID);
    return transformPackageRow(pkg, items);
  });
}

async function getLabTests() {
  const rows = await execute(
    `SELECT
        lt.LabTestID,
        lt.TestName,
        lt.Description,
        lt.BasePrice,
        lt.PackageID,
        lt.SortOrder,
        sp.PackageName,
        sp.OriginalPrice,
        sp.DiscountedPrice
     FROM lab_tests lt
     LEFT JOIN service_packages sp ON lt.PackageID = sp.PackageID
     ORDER BY lt.SortOrder ASC, lt.LabTestID ASC`
  );

  return rows.map((row) => {
    const basePrice = Number.parseFloat(row.BasePrice) || 0;
    const packageValue = Number.parseFloat(row.OriginalPrice ?? 0) || 0;
    const packageDiscounted = Number.parseFloat(row.DiscountedPrice ?? 0) || 0;
    const discountRate = packageValue > 0 ? Math.max(0, Math.min(1, 1 - packageDiscounted / packageValue)) : 0;
    const discountAmount = Number.parseFloat((basePrice * discountRate).toFixed(2));
    const finalPrice = Number.parseFloat((basePrice - discountAmount).toFixed(2));

    return {
      id: row.LabTestID,
      name: row.TestName,
      description: row.Description || '',
      basePrice,
      packageId: row.PackageID,
      packageName: row.PackageName || '',
      discountRate,
      discountAmount,
      finalPrice,
      sortOrder: row.SortOrder,
    };
  });
}

async function getServicePackageById(packageId) {
  const packages = await execute(
    `SELECT PackageID, PackageName, Subtitle, RibbonText, OriginalPrice, DiscountedPrice, SortOrder
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

    console.log('[ServicePackages] Creating package draft for persistence', {
      name: normalized.name,
      subtitle: normalized.subtitle,
      ribbonText: normalized.ribbonText,
      discountedPrice: normalized.discountedPrice,
      sortOrder: normalized.sortOrder,
      totalPrice,
      items: normalized.items.map((item, index) => ({
        name: item.name,
        price: item.price,
        sortOrder: index,
      })),
    });

    const [result] = await connection.execute(
      `INSERT INTO service_packages (PackageName, Subtitle, RibbonText, OriginalPrice, DiscountedPrice, SortOrder)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        normalized.name,
        normalized.subtitle,
        normalized.ribbonText,
        totalPrice,
        normalized.discountedPrice,
        normalized.sortOrder,
      ]
    );

    const packageId = result.insertId;
    const persistedItems = [];

    for (let index = 0; index < normalized.items.length; index += 1) {
      const item = normalized.items[index];
      await connection.execute(
        `INSERT INTO service_package_items (PackageID, ItemName, ItemPrice, SortOrder)
         VALUES (?, ?, ?, ?)`,
        [packageId, item.name, item.price, index]
      );
      persistedItems.push({
        name: item.name,
        price: item.price,
        sortOrder: index,
      });
    }

    console.log('[ServicePackages] Package persisted with items', {
      packageId,
      itemCount: persistedItems.length,
      items: persistedItems,
    });

    return packageId;
  }).then(async (packageId) => {
    const storedPackage = await getServicePackageById(packageId);
    console.log('[ServicePackages] Retrieved package from database after creation', {
      packageId,
      hasItems: Array.isArray(storedPackage?.items) && storedPackage.items.length > 0,
      itemCount: Array.isArray(storedPackage?.items) ? storedPackage.items.length : 0,
    });
    return storedPackage;
  });
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
    const existingItemIds = existingRows
      .map((row) => Number.parseInt(row.PackageItemID, 10))
      .filter((id) => !Number.isNaN(id));

    const totalPrice = normalized.items.reduce((sum, item) => sum + Number(item.price), 0);

    await connection.execute(
      `UPDATE service_packages
       SET PackageName = ?, Subtitle = ?, RibbonText = ?, OriginalPrice = ?, DiscountedPrice = ?, SortOrder = ?
       WHERE PackageID = ?`,
      [
        normalized.name,
        normalized.subtitle,
        normalized.ribbonText,
        totalPrice,
        normalized.discountedPrice,
        normalized.sortOrder,
        packageId,
      ]
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
      const numericIds = idsToDelete
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => !Number.isNaN(id));

      if (numericIds.length > 0) {
        const placeholders = numericIds.map(() => '?').join(', ');
        await connection.execute(
          `DELETE FROM service_package_items WHERE PackageItemID IN (${placeholders})`,
          numericIds
        );
      }
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

async function createServicePackageOrder(packageId, payload = {}) {
  const servicePackage = await getServicePackageById(packageId);

  if (!servicePackage) {
    const error = new Error('Service package not found.');
    error.status = 404;
    throw error;
  }

  const sanitized = {
    fullName: trimString(payload.fullName),
    email: normalizeEmail(payload.email),
    phoneNumber: trimString(payload.phoneNumber || payload.phone),
    nidNumber: trimString(payload.nidNumber || payload.nid),
    notes: trimString(payload.notes),
  };

  const patientIdValue = Number.parseInt(payload.patientId, 10);
  const normalizedPatientId = Number.isNaN(patientIdValue) ? null : patientIdValue;

  if (!sanitized.fullName) {
    const error = new Error('Full name is required.');
    error.status = 400;
    throw error;
  }

  if (!sanitized.email) {
    const error = new Error('A valid email is required.');
    error.status = 400;
    throw error;
  }

  if (!sanitized.phoneNumber) {
    const error = new Error('A valid phone number is required.');
    error.status = 400;
    throw error;
  }

  const originalPrice =
    Number.parseFloat(servicePackage.totalPrice ?? servicePackage.originalPrice ?? 0) || 0;
  const discountedPrice = Number.parseFloat(servicePackage.discountedPrice ?? 0) || 0;
  const savings = Number.parseFloat((originalPrice - discountedPrice).toFixed(2));

  const snapshot = JSON.stringify({
    id: servicePackage.id,
    name: servicePackage.name,
    subtitle: servicePackage.subtitle,
    items: servicePackage.items,
    originalPrice,
    discountedPrice,
    savings,
  });

  const result = await execute(
    `INSERT INTO package_orders
      (PackageID, PatientID, FullName, Email, PhoneNumber, NidNumber, Notes, OriginalPrice, DiscountedPrice, Savings, Status, PackageSnapshot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [
      servicePackage.id,
      normalizedPatientId,
      sanitized.fullName,
      sanitized.email,
      sanitized.phoneNumber,
      sanitized.nidNumber || null,
      sanitized.notes || null,
      originalPrice,
      discountedPrice,
      savings,
      snapshot,
    ]
  );

  const orderId = result.insertId;

  return {
    message: 'Package purchase request submitted successfully.',
    orderId,
    status: 'pending',
    package: {
      id: servicePackage.id,
      name: servicePackage.name,
      discountedPrice,
      originalPrice,
      savings,
    },
    purchaser: {
      fullName: sanitized.fullName,
      email: sanitized.email,
      phoneNumber: sanitized.phoneNumber,
      nidNumber: sanitized.nidNumber,
      notes: sanitized.notes,
    },
    patientId: normalizedPatientId,
  };
}

module.exports = {
  getAboutContent,
  updateAboutContent,
  getSiteSettings,
  updateSiteSettings,
  getHomeHeroContent,
  updateHomeHeroContent,
  getServicePackages,
  getLabTests,
  getServicePackageById,
  createServicePackage,
  updateServicePackage,
  deleteServicePackage,
  createServicePackageOrder,
};
