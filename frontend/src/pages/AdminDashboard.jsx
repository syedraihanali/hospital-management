import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../AuthContext';
import { useSiteSettings } from '../SiteSettingsContext';

const apiBaseUrl = process.env.REACT_APP_API_URL;

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'doctor-applications', label: 'Doctor Applications' },
  { id: 'about', label: 'About Page' },
  { id: 'packages', label: 'Service Packages' },
  { id: 'site-settings', label: 'Site Settings' },
];

const createEmptyAboutDraft = () => ({
  hero: { eyebrow: '', title: '', subtitle: '', description: '', stats: [] },
  sections: [],
  callout: { title: '', description: '' },
});

const deepClone = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
};

const mapPackageResponseToForm = (pkg) => ({
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

function AdminDashboard() {
  const { auth } = useContext(AuthContext);
  const { siteSettings, refreshSiteSettings, setCachedSiteSettings } = useSiteSettings();
  const role = auth.user?.role;

  const [activeTab, setActiveTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [overviewStatus, setOverviewStatus] = useState('idle');
  const [overviewError, setOverviewError] = useState('');

  const [aboutDraft, setAboutDraft] = useState(null);
  const [aboutStatus, setAboutStatus] = useState('idle');
  const [aboutError, setAboutError] = useState('');
  const [aboutFeedback, setAboutFeedback] = useState(null);
  const [aboutSaving, setAboutSaving] = useState(false);

  const [packageDrafts, setPackageDrafts] = useState([]);
  const [packagesStatus, setPackagesStatus] = useState('idle');
  const [packagesError, setPackagesError] = useState('');
  const [packageFeedback, setPackageFeedback] = useState(null);
  const [packageSavingKey, setPackageSavingKey] = useState(null);
  const [packageDeletingKey, setPackageDeletingKey] = useState(null);

  const [siteSettingsDraft, setSiteSettingsDraft] = useState(null);
  const [siteSettingsStatus, setSiteSettingsStatus] = useState('idle');
  const [siteSettingsError, setSiteSettingsError] = useState('');
  const [siteSettingsFeedback, setSiteSettingsFeedback] = useState(null);
  const [siteSettingsSaving, setSiteSettingsSaving] = useState(false);

  const [applications, setApplications] = useState([]);
  const [applicationsStatus, setApplicationsStatus] = useState('idle');
  const [applicationsError, setApplicationsError] = useState('');
  const [applicationsFeedback, setApplicationsFeedback] = useState(null);
  const [applicationFilter, setApplicationFilter] = useState('pending');
  const [reviewingId, setReviewingId] = useState(null);

  const fetchOverview = useCallback(async () => {
    if (!auth.token) {
      return;
    }

    setOverviewStatus('loading');
    setOverviewError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/overview`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load dashboard metrics.');
      }

      const data = await response.json();
      setOverview(data);
      setOverviewStatus('succeeded');
    } catch (err) {
      setOverviewError(err.message || 'An unexpected error occurred while loading metrics.');
      setOverviewStatus('failed');
    }
  }, [auth.token]);

  const fetchAboutContent = useCallback(async () => {
    if (!auth.token) {
      return;
    }

    setAboutStatus('loading');
    setAboutError('');
    setAboutFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/about`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load the about page content.');
      }

      const data = await response.json();
      const normalized = data && typeof data === 'object' ? data : createEmptyAboutDraft();
      setAboutDraft(deepClone(normalized));
      setAboutStatus('succeeded');
    } catch (err) {
      setAboutError(err.message || 'Failed to load about page content.');
      setAboutStatus('failed');
    }
  }, [auth.token]);

  const fetchPackages = useCallback(async () => {
    if (!auth.token) {
      return;
    }

    setPackagesStatus('loading');
    setPackagesError('');
    setPackageFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/service-packages`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load service packages.');
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data.map(mapPackageResponseToForm) : [];
      setPackageDrafts(list);
      setPackagesStatus('succeeded');
    } catch (err) {
      setPackagesError(err.message || 'Failed to load service packages.');
      setPackagesStatus('failed');
    }
  }, [auth.token]);

  const fetchSiteSettings = useCallback(async () => {
    if (!auth.token) {
      return;
    }

    setSiteSettingsStatus('loading');
    setSiteSettingsError('');
    setSiteSettingsFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/site-settings`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load site settings.');
      }

      const data = await response.json();
      setSiteSettingsDraft(deepClone(data || {}));
      setSiteSettingsStatus('succeeded');
    } catch (err) {
      setSiteSettingsError(err.message || 'Failed to load site settings.');
      setSiteSettingsStatus('failed');
    }
  }, [auth.token]);

  const fetchApplications = useCallback(
    async (status = applicationFilter) => {
      if (!auth.token) {
        return;
      }

      setApplicationsStatus('loading');
      setApplicationsError('');
      setApplicationsFeedback(null);

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/admin/doctor-applications?status=${status}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Unable to load doctor applications.');
        }

        const data = await response.json();
        setApplications(Array.isArray(data) ? data : []);
        setApplicationsStatus('succeeded');
      } catch (err) {
        setApplicationsError(err.message || 'Failed to load applications.');
        setApplicationsStatus('failed');
      }
    },
    [applicationFilter, auth.token]
  );

  const handleReviewApplication = async (applicationId, status) => {
    setApplicationsFeedback(null);
    setReviewingId(applicationId);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/doctor-applications/${applicationId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Unable to update application.');
      }

      setApplicationsFeedback({
        type: 'success',
        message:
          status === 'approved'
            ? 'Application approved and doctor account created.'
            : 'Application rejected successfully.',
      });
      await fetchApplications(applicationFilter);
    } catch (err) {
      setApplicationsFeedback({ type: 'error', message: err.message || 'Failed to update application.' });
    } finally {
      setReviewingId(null);
    }
  };

  useEffect(() => {
    if (!auth.token || role !== 'admin') {
      return;
    }

    if (activeTab === 'overview' && overviewStatus === 'idle') {
      fetchOverview();
    }

    if (activeTab === 'doctor-applications' && applicationsStatus === 'idle') {
      fetchApplications(applicationFilter);
    }

    if (activeTab === 'about' && aboutStatus === 'idle') {
      fetchAboutContent();
    }

    if (activeTab === 'packages' && packagesStatus === 'idle') {
      fetchPackages();
    }

    if (activeTab === 'site-settings' && siteSettingsStatus === 'idle') {
      fetchSiteSettings();
    }
  }, [
    activeTab,
    auth.token,
    role,
    overviewStatus,
    aboutStatus,
    packagesStatus,
    siteSettingsStatus,
    fetchOverview,
    fetchAboutContent,
    applicationsStatus,
    applicationFilter,
    fetchApplications,
    fetchPackages,
    fetchSiteSettings,
  ]);

  useEffect(() => {
    if (activeTab === 'doctor-applications') {
      fetchApplications(applicationFilter);
    }
  }, [activeTab, applicationFilter, fetchApplications]);

  const renderMetricCard = (title, value) => (
    <div className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-soft" key={title}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-primary">{value}</p>
    </div>
  );

  const handleHeroFieldChange = (field, value) => {
    setAboutDraft((prev) => ({
      ...(prev || createEmptyAboutDraft()),
      hero: {
        ...((prev && prev.hero) || createEmptyAboutDraft().hero),
        [field]: value,
      },
    }));
  };

  const handleHeroStatChange = (index, field, value) => {
    setAboutDraft((prev) => {
      const base = prev || createEmptyAboutDraft();
      const stats = Array.isArray(base.hero?.stats) ? [...base.hero.stats] : [];
      stats[index] = { ...stats[index], [field]: value };
      return {
        ...base,
        hero: {
          ...base.hero,
          stats,
        },
      };
    });
  };

  const handleAddHeroStat = () => {
    setAboutDraft((prev) => {
      const base = prev || createEmptyAboutDraft();
      const stats = Array.isArray(base.hero?.stats) ? [...base.hero.stats] : [];
      stats.push({ label: '', value: '' });
      return {
        ...base,
        hero: {
          ...base.hero,
          stats,
        },
      };
    });
  };

  const handleRemoveHeroStat = (index) => {
    setAboutDraft((prev) => {
      const base = prev || createEmptyAboutDraft();
      const stats = Array.isArray(base.hero?.stats) ? [...base.hero.stats] : [];
      stats.splice(index, 1);
      return {
        ...base,
        hero: {
          ...base.hero,
          stats,
        },
      };
    });
  };

  const handleSectionFieldChange = (index, field, value) => {
    setAboutDraft((prev) => {
      const base = prev || createEmptyAboutDraft();
      const sections = Array.isArray(base.sections) ? [...base.sections] : [];
      sections[index] = {
        ...sections[index],
        [field]: value,
      };
      return {
        ...base,
        sections,
      };
    });
  };

  const handleSectionBulletsChange = (index, value) => {
    const bullets = value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    handleSectionFieldChange(index, 'bullets', bullets);
  };

  const handleAddSection = () => {
    setAboutDraft((prev) => {
      const base = prev || createEmptyAboutDraft();
      const sections = Array.isArray(base.sections) ? [...base.sections] : [];
      sections.push({ title: '', body: '', bullets: [] });
      return {
        ...base,
        sections,
      };
    });
  };

  const handleRemoveSection = (index) => {
    setAboutDraft((prev) => {
      const base = prev || createEmptyAboutDraft();
      const sections = Array.isArray(base.sections) ? [...base.sections] : [];
      sections.splice(index, 1);
      return {
        ...base,
        sections,
      };
    });
  };

  const handleCalloutChange = (field, value) => {
    setAboutDraft((prev) => ({
      ...(prev || createEmptyAboutDraft()),
      callout: {
        ...((prev && prev.callout) || createEmptyAboutDraft().callout),
        [field]: value,
      },
    }));
  };

  const handleSaveAbout = async (event) => {
    event.preventDefault();
    if (!aboutDraft || !auth.token) {
      return;
    }

    setAboutSaving(true);
    setAboutFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/about`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(aboutDraft),
      });

      if (!response.ok) {
        throw new Error('Unable to save about page content.');
      }

      const updated = await response.json();
      setAboutDraft(deepClone(updated));
      setAboutFeedback({ type: 'success', message: 'About page updated successfully.' });
    } catch (err) {
      setAboutFeedback({ type: 'error', message: err.message || 'Failed to update about page.' });
    } finally {
      setAboutSaving(false);
    }
  };

  const handlePackageFieldChange = (index, field, value) => {
    setPackageDrafts((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  const handlePackageItemChange = (packageIndex, itemIndex, field, value) => {
    setPackageDrafts((prev) => {
      const next = [...prev];
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
    setPackageDrafts((prev) => {
      const next = [...prev];
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
    setPackageDrafts((prev) => {
      const next = [...prev];
      const pkg = next[packageIndex];
      const items = Array.isArray(pkg.items) ? [...pkg.items] : [];
      if (items.length <= 1) {
        items[0] = { ...items[0], name: '', price: '' };
      } else {
        items.splice(itemIndex, 1);
      }
      next[packageIndex] = {
        ...pkg,
        items,
      };
      return next;
    });
  };

  const buildPackagePayload = (pkg) => ({
    name: (pkg.name || '').trim(),
    subtitle: (pkg.subtitle || '').trim(),
    discountedPrice: Number.parseFloat(pkg.discountedPrice) || 0,
    sortOrder: Number.parseInt(pkg.sortOrder, 10) || 0,
    items: (pkg.items || [])
      .map((item) => ({
        id: item.id || undefined,
        name: (item.name || '').trim(),
        price: Number.parseFloat(item.price) || 0,
      }))
      .filter((item) => item.name.length > 0),
  });

  const handleSavePackage = async (pkg, index) => {
    if (!auth.token) {
      return;
    }

    const payload = buildPackagePayload(pkg);
    if (!payload.name) {
      setPackageFeedback({ type: 'error', message: 'Package name is required.' });
      return;
    }

    if (!payload.items.length) {
      setPackageFeedback({ type: 'error', message: 'Add at least one package item before saving.' });
      return;
    }

    const key = pkg.id ?? `new-${index}`;
    setPackageSavingKey(key);
    setPackageFeedback(null);

    const endpoint = pkg.id
      ? `${apiBaseUrl}/api/admin/content/service-packages/${pkg.id}`
      : `${apiBaseUrl}/api/admin/content/service-packages`;

    const method = pkg.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save the service package.');
      }

      const result = await response.json();
      setPackageDrafts((prev) => {
        const next = [...prev];
        next[index] = mapPackageResponseToForm(result);
        return next;
      });
      setPackageFeedback({ type: 'success', message: `${result.name || 'Package'} saved successfully.` });
    } catch (err) {
      setPackageFeedback({ type: 'error', message: err.message || 'Failed to save package.' });
    } finally {
      setPackageSavingKey(null);
    }
  };

  const handleDeletePackage = async (pkg, index) => {
    if (!auth.token) {
      return;
    }

    if (!pkg.id) {
      setPackageDrafts((prev) => prev.filter((_, idx) => idx !== index));
      setPackageFeedback({ type: 'success', message: 'Draft package removed.' });
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to remove ${pkg.name}?`);
    if (!confirmDelete) {
      return;
    }

    setPackageDeletingKey(pkg.id);
    setPackageFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/service-packages/${pkg.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to delete the service package.');
      }

      setPackageDrafts((prev) => prev.filter((_, idx) => idx !== index));
      setPackageFeedback({ type: 'success', message: `${pkg.name} removed successfully.` });
    } catch (err) {
      setPackageFeedback({ type: 'error', message: err.message || 'Failed to delete package.' });
    } finally {
      setPackageDeletingKey(null);
    }
  };

  const handleAddPackage = () => {
    setPackageDrafts((prev) => [
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

  const handleSiteSettingsFieldChange = (field, value) => {
    setSiteSettingsDraft((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const handleSaveSiteSettings = async (event) => {
    event.preventDefault();
    if (!auth.token || !siteSettingsDraft) {
      return;
    }

    setSiteSettingsSaving(true);
    setSiteSettingsFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/site-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(siteSettingsDraft),
      });

      if (!response.ok) {
        throw new Error('Unable to save site settings.');
      }

      const updated = await response.json();
      setSiteSettingsDraft(deepClone(updated));
      setCachedSiteSettings(updated);
      await refreshSiteSettings();
      setSiteSettingsFeedback({ type: 'success', message: 'Site settings updated successfully.' });
    } catch (err) {
      setSiteSettingsFeedback({
        type: 'error',
        message: err.message || 'Failed to update site settings.',
      });
    } finally {
      setSiteSettingsSaving(false);
    }
  };

  const sortedPackageDrafts = useMemo(
    () => [...packageDrafts].sort((a, b) => (Number.parseInt(a.sortOrder, 10) || 0) - (Number.parseInt(b.sortOrder, 10) || 0)),
    [packageDrafts]
  );

  if (role !== 'admin') {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-red-600">
        Access restricted to administrator accounts.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">Manage operations, site content, and promotional packages from a single workspace.</p>
      </header>

      <nav className="mx-auto flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-soft'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50 hover:text-brand-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' ? (
        overviewStatus === 'loading' ? (
          <div className="flex min-h-[12rem] items-center justify-center text-slate-600">Loading dashboard...</div>
        ) : overviewError ? (
          <div className="flex min-h-[12rem] items-center justify-center text-red-600">{overviewError}</div>
        ) : (
          <section className="flex flex-col gap-8">
            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
              {renderMetricCard('Total Patients', overview?.metrics?.totalPatients ?? 0)}
              {renderMetricCard('Total Doctors', overview?.metrics?.totalDoctors ?? 0)}
              {renderMetricCard('Appointments Booked', overview?.metrics?.totalAppointments ?? 0)}
              {renderMetricCard('Upcoming Appointments', overview?.metrics?.upcomingAppointments ?? 0)}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
                <h2 className="text-xl font-semibold text-brand-primary">Most Active Doctors</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {overview?.topDoctors?.length ? (
                    overview.topDoctors.map((doctor) => (
                      <li key={doctor.DoctorID} className="flex items-center justify-between">
                        <span>{doctor.FullName}</span>
                        <span className="font-semibold text-brand-primary">
                          {doctor.CurrentPatientNumber}/{doctor.MaxPatientNumber}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500">No doctor data available.</li>
                  )}
                </ul>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
                <h2 className="text-xl font-semibold text-brand-primary">Recent Patients</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {overview?.recentPatients?.length ? (
                    overview.recentPatients.map((patient) => (
                      <li key={patient.PatientID} className="flex flex-col rounded-xl bg-slate-50 px-4 py-3">
                        <span className="font-semibold text-slate-900">{patient.FullName}</span>
                        <span className="text-slate-500">{patient.Email}</span>
                        <span className="text-slate-500">{patient.PhoneNumber}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-500">No recent patients found.</li>
                  )}
                </ul>
              </article>
            </div>
      </section>
    )
  ) : null}

      {activeTab === 'doctor-applications' ? (
        applicationsStatus === 'loading' ? (
          <div className="flex min-h-[12rem] items-center justify-center text-slate-600">
            Loading doctor applications...
          </div>
        ) : applicationsError ? (
          <div className="flex min-h-[12rem] items-center justify-center text-red-600">{applicationsError}</div>
        ) : (
          <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-primary">Doctor onboarding</h2>
                <p className="text-sm text-slate-600">
                  Review applications from clinicians and approve or reject their access to the portal.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Filter by status
                </label>
                <select
                  value={applicationFilter}
                  onChange={(event) => setApplicationFilter(event.target.value)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
              </div>
            </header>

            {applicationsFeedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  applicationsFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {applicationsFeedback.message}
              </div>
            ) : null}

            <div className="grid gap-4">
              {applications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                  No applications found for this status.
                </div>
              ) : (
                applications.map((application) => {
                  const submittedDate = application.SubmittedAt
                    ? new Date(application.SubmittedAt)
                    : null;
                  const isPending = application.Status === 'pending';
                  return (
                    <article
                      key={application.ApplicationID}
                      className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">{application.FullName}</h3>
                          <p className="text-sm text-slate-600">{application.Specialization}</p>
                          <div className="mt-2 grid gap-1 text-xs text-slate-600">
                            <span>Email: {application.Email}</span>
                            <span>Phone: {application.PhoneNumber}</span>
                            <span>License: {application.LicenseNumber}</span>
                            <span>NID: {application.NidNumber}</span>
                            <span>
                              Submitted:{' '}
                              {submittedDate
                                ? submittedDate.toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 text-xs text-slate-600">
                          <a
                            href={application.LicenseDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            License document
                          </a>
                          <a
                            href={application.NidDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            NID document
                          </a>
                          {application.ResumeUrl ? (
                            <a
                              href={application.ResumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Resume/CV
                            </a>
                          ) : null}
                          <span
                            className={`mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 font-semibold ${
                              application.Status === 'approved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : application.Status === 'rejected'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {application.Status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {application.ReviewNotes ? (
                        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          Admin notes: {application.ReviewNotes}
                        </p>
                      ) : null}

                      {isPending ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleReviewApplication(application.ApplicationID, 'approved')}
                            disabled={reviewingId === application.ApplicationID}
                            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            {reviewingId === application.ApplicationID ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewApplication(application.ApplicationID, 'rejected')}
                            disabled={reviewingId === application.ApplicationID}
                            className="inline-flex items-center justify-center rounded-full border border-rose-300 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                          >
                            {reviewingId === application.ApplicationID ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      ) : application.Status === 'approved' && application.DoctorID ? (
                        <p className="mt-4 text-xs font-medium text-emerald-600">
                          Doctor account created (ID #{application.DoctorID}).
                        </p>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )
      ) : null}

      {activeTab === 'about' ? (
        aboutStatus === 'loading' ? (
          <div className="flex min-h-[12rem] items-center justify-center text-slate-600">Loading about page content...</div>
        ) : aboutError ? (
          <div className="flex min-h-[12rem] items-center justify-center text-red-600">{aboutError}</div>
        ) : (
          <form
            onSubmit={handleSaveAbout}
            className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur"
          >
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-primary">About page content</h2>
                <p className="text-sm text-slate-600">Edit hero messaging, supporting sections, and the closing call-to-action.</p>
              </div>
              <button
                type="submit"
                disabled={aboutSaving}
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {aboutSaving ? 'Saving...' : 'Save changes'}
              </button>
            </header>

            {aboutFeedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  aboutFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {aboutFeedback.message}
              </div>
            ) : null}

            <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-brand-primary">Hero section</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Eyebrow</span>
                  <input
                    type="text"
                    value={aboutDraft?.hero?.eyebrow ?? ''}
                    onChange={(event) => handleHeroFieldChange('eyebrow', event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Subtitle</span>
                  <input
                    type="text"
                    value={aboutDraft?.hero?.subtitle ?? ''}
                    onChange={(event) => handleHeroFieldChange('subtitle', event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Title</span>
                <input
                  type="text"
                  value={aboutDraft?.hero?.title ?? ''}
                  onChange={(event) => handleHeroFieldChange('title', event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Description</span>
                <textarea
                  value={aboutDraft?.hero?.description ?? ''}
                  onChange={(event) => handleHeroFieldChange('description', event.target.value)}
                  rows={3}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                />
              </label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Hero statistics</h4>
                  <button
                    type="button"
                    onClick={handleAddHeroStat}
                    className="text-sm font-medium text-brand-primary hover:text-brand-dark"
                  >
                    + Add stat
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(aboutDraft?.hero?.stats ?? []).map((stat, index) => (
                    <div key={`stat-${index}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
                      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                        Label
                        <input
                          type="text"
                          value={stat?.label ?? ''}
                          onChange={(event) => handleHeroStatChange(index, 'label', event.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                        Value
                        <input
                          type="text"
                          value={stat?.value ?? ''}
                          onChange={(event) => handleHeroStatChange(index, 'value', event.target.value)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveHeroStat(index)}
                        className="self-start text-xs font-medium text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-primary">Supporting sections</h3>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-sm font-medium text-brand-primary hover:text-brand-dark"
                >
                  + Add section
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {(aboutDraft?.sections ?? []).map((section, index) => (
                  <article key={`section-${index}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Title
                      <input
                        type="text"
                        value={section?.title ?? ''}
                        onChange={(event) => handleSectionFieldChange(index, 'title', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Body
                      <textarea
                        value={section?.body ?? ''}
                        onChange={(event) => handleSectionFieldChange(index, 'body', event.target.value)}
                        rows={3}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                      Bullet points (one per line)
                      <textarea
                        value={(section?.bullets ?? []).join('\n')}
                        onChange={(event) => handleSectionBulletsChange(index, event.target.value)}
                        rows={3}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(index)}
                      className="self-start text-xs font-medium text-rose-500 hover:text-rose-600"
                    >
                      Remove section
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-brand-primary">Call-to-action</h3>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Title</span>
                <input
                  type="text"
                  value={aboutDraft?.callout?.title ?? ''}
                  onChange={(event) => handleCalloutChange('title', event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Description</span>
                <textarea
                  value={aboutDraft?.callout?.description ?? ''}
                  onChange={(event) => handleCalloutChange('description', event.target.value)}
                  rows={3}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                />
              </label>
            </section>
          </form>
        )
      ) : null}

      {activeTab === 'packages' ? (
        packagesStatus === 'loading' ? (
          <div className="flex min-h-[12rem] items-center justify-center text-slate-600">Loading service packages...</div>
        ) : packagesError ? (
          <div className="flex min-h-[12rem] items-center justify-center text-red-600">{packagesError}</div>
        ) : (
          <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-primary">Diagnostic packages</h2>
                <p className="text-sm text-slate-600">Update pricing, descriptions, and the tests included in each promotional package.</p>
              </div>
              <button
                type="button"
                onClick={handleAddPackage}
                className="inline-flex items-center justify-center rounded-full border border-brand-primary px-5 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
              >
                + Add new package
              </button>
            </header>

            {packageFeedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  packageFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {packageFeedback.message}
              </div>
            ) : null}

            <div className="space-y-6">
              {sortedPackageDrafts.map((pkg, index) => {
                const key = pkg.id ?? `draft-${index}`;
                const items = Array.isArray(pkg.items) ? pkg.items : [];
                const total = items.reduce((sum, item) => sum + (Number.parseFloat(item.price) || 0), 0);
                const discounted = Number.parseFloat(pkg.discountedPrice) || 0;
                const saving = Math.max(0, total - discounted);

                return (
                  <article key={key} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-3">
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="font-medium text-slate-700">Package name</span>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(event) => handlePackageFieldChange(index, 'name', event.target.value)}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                          <span className="font-medium text-slate-700">Subtitle</span>
                          <input
                            type="text"
                            value={pkg.subtitle}
                            onChange={(event) => handlePackageFieldChange(index, 'subtitle', event.target.value)}
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
                            onChange={(event) => handlePackageFieldChange(index, 'sortOrder', event.target.value)}
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
                            onChange={(event) => handlePackageFieldChange(index, 'discountedPrice', event.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                          />
                        </label>
                        <div className="flex flex-col justify-center rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <span>Total tests value: <strong className="text-slate-900">BDT {total.toLocaleString('en-US')}</strong></span>
                          <span>Savings: <strong className="text-emerald-600">BDT {saving.toLocaleString('en-US')}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">Package items</h4>
                        <button
                          type="button"
                          onClick={() => handleAddPackageItem(index)}
                          className="text-sm font-medium text-brand-primary hover:text-brand-dark"
                        >
                          + Add item
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {items.map((item, itemIndex) => (
                          <div key={`${key}-item-${itemIndex}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                              Item name
                              <input
                                type="text"
                                value={item.name}
                                onChange={(event) => handlePackageItemChange(index, itemIndex, 'name', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                              Price (BDT)
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(event) => handlePackageItemChange(index, itemIndex, 'price', event.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemovePackageItem(index, itemIndex)}
                              className="self-start text-xs font-medium text-rose-500 hover:text-rose-600"
                            >
                              Remove item
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleSavePackage(pkg, index)}
                          disabled={packageSavingKey === (pkg.id ?? `new-${index}`)}
                          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {packageSavingKey === (pkg.id ?? `new-${index}`) ? 'Saving...' : 'Save package'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePackage(pkg, index)}
                          disabled={packageDeletingKey === pkg.id}
                          className="inline-flex items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {packageDeletingKey === pkg.id ? 'Removing...' : 'Delete'}
                        </button>
                      </div>
                      <span className="text-xs text-slate-500">Original value: BDT {total.toLocaleString('en-US')}</span>
                    </div>
                  </article>
                );
              })}

              {sortedPackageDrafts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No service packages found. Add your first package to highlight diagnostic bundles on the public site.
                </div>
              ) : null}
            </div>
          </section>
        )
      ) : null}

      {activeTab === 'site-settings' ? (
        siteSettingsStatus === 'loading' ? (
          <div className="flex min-h-[12rem] items-center justify-center text-slate-600">Loading site settings...</div>
        ) : siteSettingsError ? (
          <div className="flex min-h-[12rem] items-center justify-center text-red-600">{siteSettingsError}</div>
        ) : (
          <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
            <header className="space-y-2">
              <h2 className="text-xl font-semibold text-brand-primary">Brand & emergency details</h2>
              <p className="text-sm text-slate-600">
                Update the public-facing hospital name, footer messaging, and emergency contact information displayed across the site.
              </p>
            </header>

            {siteSettingsFeedback ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  siteSettingsFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {siteSettingsFeedback.message}
              </div>
            ) : null}

            <form onSubmit={handleSaveSiteSettings} className="grid gap-6">
              <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-brand-primary">Brand identity</h3>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Site name</span>
                  <input
                    type="text"
                    value={siteSettingsDraft?.siteName ?? siteSettings?.siteName ?? ''}
                    onChange={(event) => handleSiteSettingsFieldChange('siteName', event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Tagline</span>
                  <textarea
                    value={siteSettingsDraft?.siteTagline ?? siteSettings?.siteTagline ?? ''}
                    onChange={(event) => handleSiteSettingsFieldChange('siteTagline', event.target.value)}
                    rows={2}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
              </section>

              <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-brand-primary">Primary contact</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">General phone</span>
                    <input
                      type="text"
                      value={siteSettingsDraft?.primaryContactPhone ?? siteSettings?.primaryContactPhone ?? ''}
                      onChange={(event) => handleSiteSettingsFieldChange('primaryContactPhone', event.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">General email</span>
                    <input
                      type="email"
                      value={siteSettingsDraft?.primaryContactEmail ?? siteSettings?.primaryContactEmail ?? ''}
                      onChange={(event) => handleSiteSettingsFieldChange('primaryContactEmail', event.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                </div>
              </section>

              <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-brand-primary">Emergency contact</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Contact name</span>
                    <input
                      type="text"
                      value={siteSettingsDraft?.emergencyContactName ?? siteSettings?.emergencyContactName ?? ''}
                      onChange={(event) => handleSiteSettingsFieldChange('emergencyContactName', event.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Hotline number</span>
                    <input
                      type="text"
                      value={siteSettingsDraft?.emergencyContactPhone ?? siteSettings?.emergencyContactPhone ?? ''}
                      onChange={(event) => handleSiteSettingsFieldChange('emergencyContactPhone', event.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Emergency email</span>
                    <input
                      type="email"
                      value={siteSettingsDraft?.emergencyContactEmail ?? siteSettings?.emergencyContactEmail ?? ''}
                      onChange={(event) => handleSiteSettingsFieldChange('emergencyContactEmail', event.target.value)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm md:col-span-2">
                    <span className="font-medium text-slate-700">Emergency address</span>
                    <textarea
                      value={siteSettingsDraft?.emergencyContactAddress ?? siteSettings?.emergencyContactAddress ?? ''}
                      onChange={(event) => handleSiteSettingsFieldChange('emergencyContactAddress', event.target.value)}
                      rows={2}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                </div>
              </section>

              <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-brand-primary">Floating support buttons</h3>
                <p className="text-xs text-slate-500">
                  These values control the “Call support” and “WhatsApp” buttons visible at the bottom right of the site.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Support phone number</span>
                    <input
                      type="text"
                      value={siteSettingsDraft?.supportPhone ?? siteSettings?.supportPhone ?? ''}
                      onChange={(event) => handleSiteSettingsFieldChange('supportPhone', event.target.value)}
                      placeholder="e.g. +8801711000000"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">WhatsApp support URL</span>
                    <input
                      type="url"
                      value={siteSettingsDraft?.supportWhatsappUrl ?? siteSettings?.supportWhatsappUrl ?? ''}
                      onChange={(event) => handleSiteSettingsFieldChange('supportWhatsappUrl', event.target.value)}
                      placeholder="https://wa.me/8801XXXXXXXXX"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                    />
                  </label>
                </div>
              </section>

              <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-brand-primary">Footer message</h3>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Footer note</span>
                  <textarea
                    value={siteSettingsDraft?.footerNote ?? siteSettings?.footerNote ?? ''}
                    onChange={(event) => handleSiteSettingsFieldChange('footerNote', event.target.value)}
                    rows={2}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
              </section>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={siteSettingsSaving}
                  className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {siteSettingsSaving ? 'Saving...' : 'Save settings'}
                </button>
              </div>
            </form>
          </section>
        )
      ) : null}
    </div>
  );
}

export default AdminDashboard;
