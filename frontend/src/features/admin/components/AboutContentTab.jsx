import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createEmptyAboutDraft, deepClone } from '../utils/adminContentHelpers';

const apiBaseUrl = process.env.REACT_APP_API_URL;

function normalizeAboutContent(value) {
  if (!value || typeof value !== 'object') {
    return createEmptyAboutDraft();
  }

  return {
    hero: {
      eyebrow: value.hero?.eyebrow ?? '',
      title: value.hero?.title ?? '',
      subtitle: value.hero?.subtitle ?? '',
      description: value.hero?.description ?? '',
      stats: Array.isArray(value.hero?.stats)
        ? value.hero.stats.map((stat) => ({
            label: stat?.label ?? '',
            value: stat?.value ?? '',
          }))
        : [],
    },
    sections: Array.isArray(value.sections)
      ? value.sections.map((section) => ({
          title: section?.title ?? '',
          body: section?.body ?? '',
          bullets: Array.isArray(section?.bullets) ? section.bullets : [],
        }))
      : [],
    callout: {
      title: value.callout?.title ?? '',
      description: value.callout?.description ?? '',
    },
  };
}

function AboutContentTab({ token }) {
  const [draft, setDraft] = useState(createEmptyAboutDraft());
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAboutContent = useCallback(async () => {
    if (!token) {
      return;
    }

    setStatus('loading');
    setError('');
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/about`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load the about page content.');
      }

      const data = await response.json();
      setDraft(normalizeAboutContent(data));
      setStatus('succeeded');
    } catch (err) {
      setError(err.message || 'Failed to load about page content.');
      setStatus('failed');
    }
  }, [token]);

  useEffect(() => {
    if (status === 'idle' && token) {
      fetchAboutContent();
    }
  }, [fetchAboutContent, status, token]);

  const handleHeroFieldChange = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        [field]: value,
      },
    }));
  };

  const handleHeroStatChange = (index, field, value) => {
    setDraft((prev) => {
      const next = deepClone(prev.hero.stats);
      next[index] = { ...next[index], [field]: value };
      return {
        ...prev,
        hero: {
          ...prev.hero,
          stats: next,
        },
      };
    });
  };

  const handleAddHeroStat = () => {
    setDraft((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: [...prev.hero.stats, { label: '', value: '' }],
      },
    }));
  };

  const handleRemoveHeroStat = (index) => {
    setDraft((prev) => {
      const next = prev.hero.stats.filter((_, idx) => idx !== index);
      return {
        ...prev,
        hero: {
          ...prev.hero,
          stats: next,
        },
      };
    });
  };

  const handleSectionFieldChange = (index, field, value) => {
    setDraft((prev) => {
      const sections = deepClone(prev.sections);
      sections[index] = {
        ...sections[index],
        [field]: value,
      };
      return {
        ...prev,
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
    setDraft((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: '', body: '', bullets: [] }],
    }));
  };

  const handleRemoveSection = (index) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }));
  };

  const handleCalloutChange = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      callout: {
        ...prev.callout,
        [field]: value,
      },
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/content/about`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        throw new Error('Unable to save the about page content.');
      }

      const updated = await response.json();
      setDraft(normalizeAboutContent(updated));
      setFeedback({ type: 'success', message: 'About page content updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save about page content.' });
    } finally {
      setSaving(false);
    }
  };

  const sectionBulletStrings = useMemo(
    () => draft.sections.map((section) => (Array.isArray(section.bullets) ? section.bullets.join('\n') : '')),
    [draft.sections],
  );

  if (!token) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-slate-600">
        Sign in as an administrator to edit the about page content.
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-slate-600">
        Loading about page content...
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-red-600">
        <span>{error}</span>
        <button
          type="button"
          onClick={fetchAboutContent}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-dark"
        >
          Retry loading content
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand-primary">About page content</h2>
          <p className="text-sm text-slate-600">Edit hero messaging, supporting sections, and the closing call-to-action.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {saving ? 'Saving...' : 'Save changes'}
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
        <h3 className="text-lg font-semibold text-brand-primary">Hero section</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Eyebrow</span>
            <input
              type="text"
              value={draft.hero.eyebrow}
              onChange={(event) => handleHeroFieldChange('eyebrow', event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Subtitle</span>
            <input
              type="text"
              value={draft.hero.subtitle}
              onChange={(event) => handleHeroFieldChange('subtitle', event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Title</span>
          <input
            type="text"
            value={draft.hero.title}
            onChange={(event) => handleHeroFieldChange('title', event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            value={draft.hero.description}
            onChange={(event) => handleHeroFieldChange('description', event.target.value)}
            rows={3}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">Hero statistics</h4>
            <button type="button" onClick={handleAddHeroStat} className="text-sm font-medium text-brand-primary hover:text-brand-dark">
              + Add stat
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {draft.hero.stats.map((stat, index) => (
              <div key={`stat-${index}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  Label
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(event) => handleHeroStatChange(index, 'label', event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                  Value
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(event) => handleHeroStatChange(index, 'value', event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
                <button type="button" onClick={() => handleRemoveHeroStat(index)} className="self-start text-xs font-medium text-rose-500 hover:text-rose-600">
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
          <button type="button" onClick={handleAddSection} className="text-sm font-medium text-brand-primary hover:text-brand-dark">
            + Add section
          </button>
        </div>
        <div className="space-y-4">
          {draft.sections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              Add sections to tell the Destination Health story.
            </div>
          ) : (
            draft.sections.map((section, index) => (
              <article key={`section-${index}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-base font-semibold text-brand-primary">Section {index + 1}</h4>
                  <button type="button" onClick={() => handleRemoveSection(index)} className="text-xs font-medium text-rose-500 hover:text-rose-600">
                    Remove section
                  </button>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Title</span>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(event) => handleSectionFieldChange(index, 'title', event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Body</span>
                  <textarea
                    value={section.body}
                    onChange={(event) => handleSectionFieldChange(index, 'body', event.target.value)}
                    rows={3}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Bullet points</span>
                  <textarea
                    value={sectionBulletStrings[index]}
                    onChange={(event) => handleSectionBulletsChange(index, event.target.value)}
                    rows={3}
                    placeholder={'Each bullet on a new line'}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
                  />
                </label>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-brand-primary">Final call-to-action</h3>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Title</span>
          <input
            type="text"
            value={draft.callout.title}
            onChange={(event) => handleCalloutChange('title', event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Description</span>
          <textarea
            value={draft.callout.description}
            onChange={(event) => handleCalloutChange('description', event.target.value)}
            rows={3}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-brand-primary focus:outline-none"
          />
        </label>
      </section>
    </form>
  );
}

export default AboutContentTab;
