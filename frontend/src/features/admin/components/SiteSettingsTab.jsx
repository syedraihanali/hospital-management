import React, { useCallback, useEffect, useState } from 'react';
import { deepClone } from '../utils/adminContentHelpers';

const apiBaseUrl = process.env.REACT_APP_API_URL;

function SiteSettingsTab({ token, siteSettings, refreshSiteSettings, setCachedSiteSettings }) {
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchSiteSettings = useCallback(async () => {
    if (!token) {
      return;
    }

    setStatus('loading');
    setError('');
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/site-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load site settings.');
      }

      const data = await response.json();
      setDraft(deepClone(data || {}));
      setStatus('succeeded');
    } catch (err) {
      setError(err.message || 'Failed to load site settings.');
      setStatus('failed');
    }
  }, [token]);

  useEffect(() => {
    if (status === 'idle' && token) {
      fetchSiteSettings();
    }
  }, [fetchSiteSettings, status, token]);

  const handleFieldChange = (field, value) => {
    setDraft((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token || !draft) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/site-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error('Unable to save site settings.');
      }

      const updated = await response.json();
      setDraft(deepClone(updated));
      setCachedSiteSettings(updated);
      await refreshSiteSettings();
      setFeedback({ type: 'success', message: 'Site settings updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update site settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-slate-600">
        Sign in as an administrator to update site settings.
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-slate-600">Loading site settings...</div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-red-600">
        <span>{error}</span>
        <button
          type="button"
          onClick={fetchSiteSettings}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-dark"
        >
          Retry loading settings
        </button>
      </div>
    );
  }

  const valueFor = (field) => (draft?.[field] ?? siteSettings?.[field] ?? '');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand-primary">Site settings</h2>
          <p className="text-sm text-slate-600">Customize the public-facing information shown across the experience.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? 'Saving...' : 'Save settings'}
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

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Hospital name</span>
            <input
              type="text"
              value={valueFor('siteName')}
              onChange={(event) => handleFieldChange('siteName', event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Tagline</span>
            <input
              type="text"
              value={valueFor('siteTagline')}
              onChange={(event) => handleFieldChange('siteTagline', event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Footer note</span>
          <textarea
            value={valueFor('footerNote')}
            onChange={(event) => handleFieldChange('footerNote', event.target.value)}
            rows={2}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
          />
        </label>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-brand-primary">Primary contact</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Phone number</span>
            <input
              type="text"
              value={valueFor('primaryContactPhone')}
              onChange={(event) => handleFieldChange('primaryContactPhone', event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Email address</span>
            <input
              type="email"
              value={valueFor('primaryContactEmail')}
              onChange={(event) => handleFieldChange('primaryContactEmail', event.target.value)}
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
              value={valueFor('emergencyContactName')}
              onChange={(event) => handleFieldChange('emergencyContactName', event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Phone number</span>
            <input
              type="text"
              value={valueFor('emergencyContactPhone')}
              onChange={(event) => handleFieldChange('emergencyContactPhone', event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Email address</span>
          <input
            type="email"
            value={valueFor('emergencyContactEmail')}
            onChange={(event) => handleFieldChange('emergencyContactEmail', event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Physical address</span>
          <textarea
            value={valueFor('emergencyContactAddress')}
            onChange={(event) => handleFieldChange('emergencyContactAddress', event.target.value)}
            rows={2}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
          />
        </label>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-brand-primary">Support channels</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Support phone</span>
            <input
              type="text"
              value={valueFor('supportPhone')}
              onChange={(event) => handleFieldChange('supportPhone', event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">WhatsApp link</span>
            <input
              type="url"
              value={valueFor('supportWhatsappUrl')}
              onChange={(event) => handleFieldChange('supportWhatsappUrl', event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
            />
          </label>
        </div>
      </section>
    </form>
  );
}

export default SiteSettingsTab;
