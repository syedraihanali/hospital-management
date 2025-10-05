import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const defaultHeroState = {
  eyebrow: '',
  title: '',
  subtitle: '',
  imageUrl: '',
  ctaLabel: '',
};

function HomeHeroTab({ token }) {
  const apiBaseUrl = useMemo(() => {
    const url = process.env.REACT_APP_API_URL || '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }, []);
  const [form, setForm] = useState(defaultHeroState);
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const loadHero = async () => {
      setStatus('loading');
      setFeedback(null);
      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/content/home-hero`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load homepage hero content.');
        }

        const data = await response.json();
        if (isMounted) {
          setForm({
            eyebrow: data.eyebrow || '',
            title: data.title || '',
            subtitle: data.subtitle || '',
            imageUrl: data.imageUrl || '',
            ctaLabel: data.ctaLabel || '',
          });
          setStatus('succeeded');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('failed');
          setFeedback({ type: 'error', message: error.message || 'Unable to load hero content.' });
        }
      }
    };

    loadHero();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setFeedback({ type: 'error', message: 'Authentication token missing.' });
      return;
    }

    setFeedback(null);
    setStatus('saving');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/home-hero`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || payload.message || 'Unable to update hero content.');
      }

      const data = await response.json();
      setForm({
        eyebrow: data.eyebrow || '',
        title: data.title || '',
        subtitle: data.subtitle || '',
        imageUrl: data.imageUrl || '',
        ctaLabel: data.ctaLabel || '',
      });
      setStatus('succeeded');
      setFeedback({ type: 'success', message: 'Homepage hero content updated successfully.' });
    } catch (error) {
      setStatus('failed');
      setFeedback({ type: 'error', message: error.message || 'Unable to update hero content.' });
    }
  };

  const heroPreviewStyle = form.imageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(7, 116, 105, 0.82), rgba(15, 23, 42, 0.78)), url(${form.imageUrl})`,
      }
    : {
        backgroundImage: 'linear-gradient(135deg, rgba(7, 116, 105, 0.82), rgba(15, 23, 42, 0.78))',
      };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand-primary">Homepage hero</h2>
          <p className="text-sm text-slate-600">
            Update the landing banner image, headline, and call-to-action shown on the public homepage.
          </p>
        </div>
        {status === 'loading' ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Loading…</span>
        ) : null}
      </header>

      {feedback ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Eyebrow label
            <input
              type="text"
              name="eyebrow"
              value={form.eyebrow}
              onChange={handleChange}
              placeholder="Example: Coordinated care, on your schedule"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Headline
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Expert specialists and secure records in one hospital hub"
              required
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Supporting text
            <textarea
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              placeholder="Describe how patients benefit from the platform"
              rows={4}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Call-to-action label
            <input
              type="text"
              name="ctaLabel"
              value={form.ctaLabel}
              onChange={handleChange}
              placeholder="Book an appointment"
              required
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Background image URL
            <input
              type="url"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={status === 'saving'}
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {status === 'saving' ? 'Saving…' : 'Save hero content'}
            </button>
            <button
              type="button"
              onClick={() => setForm(defaultHeroState)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-primary hover:text-brand-primary"
            >
              Reset fields
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-slate-600">Live preview</p>
          <div
            className="relative overflow-hidden rounded-[32px] border border-slate-200 text-white shadow-soft"
            style={heroPreviewStyle}
          >
            <div className="absolute inset-0 bg-cover bg-center" aria-hidden="true" style={heroPreviewStyle} />
            <div className="relative z-10 flex flex-col gap-4 p-8">
              <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                {form.eyebrow || 'Eyebrow label'}
              </span>
              <h3 className="text-2xl font-semibold sm:text-3xl">{form.title || 'Hero headline goes here'}</h3>
              <p className="text-sm text-white/90">
                {form.subtitle || 'Use this space to describe how patients can use the platform to manage appointments and records.'}
              </p>
              <button
                type="button"
                className="w-max rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-primary shadow-soft"
                disabled
              >
                {form.ctaLabel || 'Book an appointment'}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            The booking button always links to the public booking page. Provide a compelling label to encourage patients to book.
          </p>
        </div>
      </div>
    </section>
  );
}

HomeHeroTab.propTypes = {
  token: PropTypes.string,
};

HomeHeroTab.defaultProps = {
  token: '',
};

export default HomeHeroTab;
