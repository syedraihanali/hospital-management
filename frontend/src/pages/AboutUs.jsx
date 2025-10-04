import React, { useEffect, useState } from 'react';

const apiBaseUrl = process.env.REACT_APP_API_URL;

function AboutUs() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${apiBaseUrl}/api/content/about`);

        if (!response.ok) {
          throw new Error('Unable to load the about page details.');
        }

        const data = await response.json();
        setContent(data);
      } catch (err) {
        setError(err.message || 'An unexpected error occurred while loading the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-600">
        Loading Destination Health story...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  const hero = content?.hero ?? {};
  const sections = Array.isArray(content?.sections) ? content.sections : [];
  const callout = content?.callout ?? {};

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-4 text-slate-800 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-brand-primary via-sky-500 to-brand-accent px-6 py-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-6 text-left md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            {hero.eyebrow ? (
              <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {hero.eyebrow}
              </span>
            ) : null}
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{hero.title}</h1>
              {hero.subtitle ? <p className="text-lg text-emerald-100 sm:text-xl">{hero.subtitle}</p> : null}
              {hero.description ? <p className="text-sm text-emerald-50 sm:text-base">{hero.description}</p> : null}
            </div>
          </div>
          {Array.isArray(hero.stats) && hero.stats.length > 0 ? (
            <dl className="grid min-w-[16rem] gap-4 rounded-2xl border border-white/30 bg-white/10 p-6 text-left text-sm">
              {hero.stats.map((stat) => (
                <div key={`${stat.label}-${stat.value}`} className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-emerald-100">{stat.label}</dt>
                  <dd className="text-2xl font-semibold text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl backdrop-blur">
          <h2 className="text-2xl font-semibold text-brand-primary">Our commitment to care</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-700">
            Destination Health reimagines how families experience healthcare. We coordinate specialists, diagnostics, and
            digital tools so that every appointment feels connected, compassionate, and clear.
          </p>
          <p className="mt-3 text-base leading-relaxed text-slate-700">
            From preventive wellness plans to urgent consultations, your care team is designed around you—making it easier to
            stay ahead of every milestone.
          </p>
        </article>

        <article className="flex flex-col gap-4 rounded-3xl border border-brand-primary/30 bg-brand-primary/5 p-8 shadow-lg">
          <h3 className="text-xl font-semibold text-brand-primary">Patient-first philosophy</h3>
          <p className="text-base leading-relaxed text-slate-700">
            We believe in healthcare that listens first, uses data responsibly, and keeps communities thriving through
            education and early intervention.
          </p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-brand-primary" aria-hidden="true" />
              Trusted specialists collaborating across departments
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-brand-primary" aria-hidden="true" />
              Digital tools that simplify appointments and follow-ups
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-brand-primary" aria-hidden="true" />
              Holistic plans tailored to your lifestyle and goals
            </li>
          </ul>
        </article>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {sections.map((section, index) => (
          <article key={`${section.title}-${index}`} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
            <h2 className="text-xl font-semibold text-brand-primary">{section.title}</h2>
            {section.body ? <p className="text-sm leading-relaxed text-slate-700 sm:text-base">{section.body}</p> : null}
            {Array.isArray(section.bullets) && section.bullets.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-600 sm:text-base">
                {section.bullets.map((bullet, bulletIndex) => (
                  <li key={`${section.title}-${bulletIndex}`} className="flex items-start gap-2">
                    <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden="true" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      {callout?.title || callout?.description ? (
        <section className="overflow-hidden rounded-3xl border border-brand-dark/20 bg-brand-dark px-6 py-10 text-white shadow-xl">
          <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold sm:text-3xl">{callout.title}</h2>
              {callout.description ? <p className="text-base text-emerald-100 sm:text-lg">{callout.description}</p> : null}
            </div>
            <a
              href="/services"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark shadow-soft transition hover:bg-emerald-100"
            >
              Explore our care packages
            </a>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default AboutUs;
