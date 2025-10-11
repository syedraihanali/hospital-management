import React, { useEffect, useMemo, useState } from 'react';

function LabReportsTab({ token }) {
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const [patients, setPatients] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    patientId: '',
    title: '',
    description: '',
    testName: '',
    baseCharge: '',
    packageId: '',
    file: null,
  });
  const [patientPackageOrders, setPatientPackageOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [hasManualPackageSelection, setHasManualPackageSelection] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [patientsResponse, packagesResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/patients`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiBaseUrl}/api/admin/content/service-packages`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!patientsResponse.ok) {
          throw new Error('Unable to load patients.');
        }

        if (!packagesResponse.ok) {
          throw new Error('Unable to load service packages.');
        }

        const patientsData = await patientsResponse.json();
        const packagesData = await packagesResponse.json();

        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setPackages(Array.isArray(packagesData) ? packagesData : []);
      } catch (err) {
        setError(err.message || 'Something went wrong while preparing the lab report form.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [apiBaseUrl, token]);

  useEffect(() => {
    if (!form.patientId || !token) {
      setPatientPackageOrders([]);
      setOrdersError('');
      setOrdersLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError('');
      try {
        const response = await fetch(`${apiBaseUrl}/api/patients/${form.patientId}/package-orders`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to load package history for this patient.');
        }

        const data = await response.json().catch(() => ({}));
        if (!cancelled) {
          const orders = Array.isArray(data.orders) ? data.orders : [];
          setPatientPackageOrders(orders);

          if (!hasManualPackageSelection) {
            const recentPackage = orders.find((order) =>
              order.packageId && (order.isActive === undefined || order.isActive)
            );
            if (recentPackage) {
              setForm((prev) => ({ ...prev, packageId: String(recentPackage.packageId) }));
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setOrdersError(err.message || 'Failed to load patient packages.');
          setPatientPackageOrders([]);
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiBaseUrl, form.patientId, hasManualPackageSelection, token]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === 'patientId') {
      setHasManualPackageSelection(false);
      setOrdersError('');
      setPatientPackageOrders([]);
      setForm((prev) => ({ ...prev, patientId: value, packageId: '' }));
      return;
    }

    if (name === 'packageId') {
      setHasManualPackageSelection(true);
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));
  };

  const selectedPackage = useMemo(() => {
    if (!form.packageId) {
      return null;
    }
    return packages.find((pkg) => String(pkg.id ?? pkg.PackageID) === String(form.packageId)) || null;
  }, [form.packageId, packages]);

  const latestPatientOrder = useMemo(() => {
    if (!patientPackageOrders.length) {
      return null;
    }
    return (
      patientPackageOrders.find(
        (order) => order.packageId && (order.isActive === undefined || order.isActive)
      ) || patientPackageOrders[0]
    );
  }, [patientPackageOrders]);

  const latestOrderDateLabel = useMemo(() => {
    if (!latestPatientOrder?.purchasedAt) {
      return '';
    }
    const date = new Date(latestPatientOrder.purchasedAt);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [latestPatientOrder]);

  const baseChargeValue = useMemo(() => {
    const parsed = Number.parseFloat(form.baseCharge);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [form.baseCharge]);

  const packageDiscountRate = useMemo(() => {
    if (!selectedPackage) {
      return 0;
    }
    const totalPrice =
      Number.parseFloat(selectedPackage.totalPrice ?? selectedPackage.originalPrice ?? 0) || 0;
    const discounted = Number.parseFloat(selectedPackage.discountedPrice ?? 0) || 0;
    if (totalPrice <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(1, 1 - discounted / totalPrice));
  }, [selectedPackage]);

  const discountAmount = useMemo(() => {
    return Number.parseFloat((baseChargeValue * packageDiscountRate).toFixed(2));
  }, [baseChargeValue, packageDiscountRate]);

  const finalCharge = useMemo(() => {
    return Number.parseFloat((baseChargeValue - discountAmount).toFixed(2));
  }, [baseChargeValue, discountAmount]);

  const formatCurrency = (value) => {
    const amount = Number.parseFloat(value ?? 0) || 0;
    return `BDT ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');

    if (!form.patientId || !form.title || !form.baseCharge || !form.file) {
      setFeedback('Patient, title, base charge, and report file are required.');
      return;
    }

    setSubmissionStatus('loading');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      if (form.description) formData.append('description', form.description);
      if (form.testName) formData.append('testName', form.testName);
      formData.append('baseCharge', form.baseCharge);
      if (form.packageId) formData.append('packageId', form.packageId);
      formData.append('report', form.file);

      const response = await fetch(`${apiBaseUrl}/api/admin/patients/${form.patientId}/lab-reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send the lab report.');
      }

      setSubmissionStatus('succeeded');
      setFeedback('Lab report sent successfully.');
      setForm({
        patientId: '',
        title: '',
        description: '',
        testName: '',
        baseCharge: '',
        packageId: '',
        file: null,
      });
      setPatientPackageOrders([]);
      setHasManualPackageSelection(false);
      setOrdersError('');
    } catch (err) {
      setSubmissionStatus('failed');
      setFeedback(err.message || 'Failed to send the lab report.');
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 text-center text-sm text-slate-600 shadow-card">
        Preparing lab report workspace…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-sm font-medium text-rose-600 shadow-card">
        {error}
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-brand-primary">Send lab reports to patients</h2>
        <p className="text-sm text-slate-600">
          Upload diagnostic files, select the relevant package, and we will calculate the discount before sharing with the
          patient.
        </p>
      </header>

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Patient
            <select
              name="patientId"
              value={form.patientId}
              onChange={handleInputChange}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.PatientID} value={patient.PatientID}>
                  {patient.FullName} · {patient.Email}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Lab test name
            <input
              type="text"
              name="testName"
              value={form.testName}
              onChange={handleInputChange}
              placeholder="e.g., HbA1c"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Report title
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              required
              placeholder="Comprehensive metabolic panel"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Base charge (BDT)
            <input
              type="number"
              min="0"
              step="0.01"
              name="baseCharge"
              value={form.baseCharge}
              onChange={handleInputChange}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Package discount (optional)
          <select
            name="packageId"
            value={form.packageId}
            onChange={handleInputChange}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">No package applied</option>
            {packages.map((pkg) => {
              const total = Number.parseFloat(pkg.totalPrice ?? pkg.originalPrice ?? 0) || 0;
              const discounted = Number.parseFloat(pkg.discountedPrice ?? 0) || 0;
              const percent = total > 0 ? Math.round((1 - discounted / total) * 100) : 0;
              const label = pkg.name ?? pkg.PackageName ?? 'Service package';
              return (
                <option key={pkg.id ?? pkg.PackageID} value={pkg.id ?? pkg.PackageID}>
                  {label} · save {Number.isFinite(percent) ? percent : 0}%
                </option>
              );
            })}
          </select>
          {ordersLoading ? (
            <p className="text-xs text-slate-500">Loading purchased packages…</p>
          ) : null}
          {ordersError ? <p className="text-xs text-rose-600">{ordersError}</p> : null}
          {!ordersLoading && !ordersError && latestPatientOrder ? (
            <p className="text-xs text-emerald-600">
              Active package: {latestPatientOrder.packageName || 'Package'}
              {latestOrderDateLabel ? ` · ${latestOrderDateLabel}` : ''}
            </p>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Description (optional)
          <textarea
            name="description"
            value={form.description}
            onChange={handleInputChange}
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            placeholder="Add notes that will help the patient understand the results."
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Upload lab report (PDF, JPG, PNG)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            required
            className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:grid-cols-3">
          <div>
            <p className="font-semibold text-slate-700">Base charge</p>
            <p className="text-brand-primary">{formatCurrency(baseChargeValue)}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Package discount</p>
            <p className="text-emerald-600">{formatCurrency(discountAmount)}</p>
            {selectedPackage ? (
              <p className="text-xs text-slate-500">
                {selectedPackage.name ?? selectedPackage.PackageName ?? 'Selected package'}
              </p>
            ) : (
              <p className="text-xs text-slate-400">No discount applied</p>
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-700">Final payable</p>
            <p className="text-brand-dark">{formatCurrency(finalCharge)}</p>
          </div>
        </div>

        {feedback ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              submissionStatus === 'succeeded'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            {feedback}
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submissionStatus === 'loading'}
        >
          {submissionStatus === 'loading' ? 'Sending…' : 'Send lab report'}
        </button>
      </form>
    </section>
  );
}

export default LabReportsTab;
