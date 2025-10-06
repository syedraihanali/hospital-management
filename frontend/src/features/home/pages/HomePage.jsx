import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HomeFooter from '../components/HomeFooter';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';

const defaultHeroContent = {
  eyebrow: 'Coordinated care, on your schedule',
  title: 'Expert specialists and secure records in one hospital hub',
  subtitle:
    'Plan visits, share medical documents, and stay aligned with your care team from the comfort of your home.',
  imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1600&q=80',
  ctaLabel: 'Book an appointment',
};

const testimonials = [
  {
    quote:
      'Booking my cardiology visits takes less than a minute. Destination Health keeps every report ready for my specialists.',
    name: 'Sierra Lawson',
    role: 'Patient Partner',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=160&h=160&q=80',
  },
  {
    quote:
      'Our clinic loves the seamless scheduling tools. The emergency escalation pathway has genuinely saved lives.',
    name: 'Dr. Priya Menon',
    role: 'Cardiology Lead, Summit Health',
    avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=facearea&w=160&h=160&q=80',
  },
  {
    quote:
      'Patients can self-serve and our care team monitors everything in real time. It feels modern, safe, and compassionate.',
    name: 'Jordan Blake',
    role: 'Nursing Director',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb468fb9f89?auto=format&fit=facearea&w=160&h=160&q=80',
  },
];

const sanitizeTel = (value = '') => value.replace(/[^+\d]/g, '');

function mergeHeroContent(value) {
  if (!value || typeof value !== 'object') {
    return { ...defaultHeroContent };
  }

  const merged = { ...defaultHeroContent };
  ['eyebrow', 'title', 'subtitle', 'imageUrl', 'ctaLabel'].forEach((key) => {
    if (typeof value[key] === 'string' && value[key].trim()) {
      merged[key] = value[key];
    }
  });
  return merged;
}

function HomePage() {
  const apiBaseUrl = useMemo(() => {
    const url = process.env.REACT_APP_API_URL || '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }, []);
  const { siteSettings } = useSiteSettings();
  const [heroContent, setHeroContent] = useState(defaultHeroContent);
  const [heroStatus, setHeroStatus] = useState('idle');
  const [heroError, setHeroError] = useState('');

  const siteName = siteSettings?.siteName ?? 'Destination Health';
  const emergencyContactName = siteSettings?.emergencyContactName ?? 'Emergency coordination desk';
  const emergencyPhone = siteSettings?.emergencyContactPhone ?? '';
  const emergencyEmail = siteSettings?.emergencyContactEmail ?? '';
  const emergencyAddress = siteSettings?.emergencyContactAddress ?? '';

  useEffect(() => {
    let isMounted = true;

    const loadHero = async () => {
      setHeroStatus('loading');
      setHeroError('');
      try {
        const response = await fetch(`${apiBaseUrl}/api/content/home-hero`);
        if (!response.ok) {
          throw new Error('Unable to load homepage highlight.');
        }

        const data = await response.json();
        if (isMounted) {
          setHeroContent(mergeHeroContent(data));
          setHeroStatus('succeeded');
        }
      } catch (error) {
        if (isMounted) {
          setHeroContent(defaultHeroContent);
          setHeroStatus('failed');
          setHeroError(error.message || 'Unable to load homepage highlight.');
        }
      }
    };

    loadHero();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  const heroBackgroundStyle = heroContent.imageUrl
    ? {
        backgroundImage: `url(${heroContent.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {};
  const heroOverlayStyle = {
    background: 'linear-gradient(135deg, rgba(7, 116, 105, 0.35), rgba(15, 23, 42, 0.6))',
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <section
        className="relative mt-6 overflow-hidden rounded-[40px] border border-white/30 bg-slate-900 text-white shadow-glass"
        style={heroBackgroundStyle}
      >
        <div className="absolute inset-0" aria-hidden="true" style={heroOverlayStyle} />
        <div className="relative z-10 flex flex-col gap-8 p-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-5">
            <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
              {heroContent.eyebrow}
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              {heroContent.title}
            </h1>
            <p className="text-base text-white/85 sm:text-lg">{heroContent.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/book-appointment"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-brand-primary shadow-soft transition hover:bg-brand-secondary/90 hover:text-brand-dark"
              >
                {heroContent.ctaLabel}
              </Link>
              <Link
                to="/specialists"
                className="inline-flex items-center justify-center rounded-full border border-white/70 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Meet our specialists
              </Link>
            </div>
            {heroStatus === 'failed' ? (
              <p className="rounded-2xl border border-amber-300 bg-amber-100/40 px-4 py-2 text-sm font-medium text-amber-100">
                {heroError}
              </p>
            ) : null}
          </div>
          <div className="rounded-3xl border border-white/30 bg-white/15 p-6 text-sm text-white/80 shadow-inner backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Why patients choose {siteName}</p>
            <ul className="mt-3 space-y-2">
              <li>• Specialists across 20+ departments in one network</li>
              <li>• Secure document vault for every appointment</li>
              <li>• Real-time coordination between doctors and patients</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-16 rounded-[36px] border border-brand-primary/30 bg-gradient-to-br from-brand-primary to-brand-dark p-10 text-white shadow-glass">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm uppercase tracking-[0.35em] text-white/70">Need emergency medical care?</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{emergencyContactName} is one tap away</h2>
            <p className="text-white/80">
              Call our emergency coordination desk for immediate triage and ambulance dispatch across our hospital network.
            </p>
            <div className="flex flex-col gap-2 text-white/80 sm:flex-row sm:items-center sm:gap-6">
              {emergencyPhone ? (
                <span className="text-lg font-semibold tracking-wide">
                  24/7 hotline:{' '}
                  <a className="underline-offset-4 hover:underline" href={`tel:${sanitizeTel(emergencyPhone)}`}>
                    {emergencyPhone}
                  </a>
                </span>
              ) : null}
              {emergencyEmail ? <span>{emergencyEmail}</span> : null}
            </div>
            {emergencyAddress ? (
              <p className="text-sm text-white/70">{emergencyAddress}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={emergencyPhone ? `tel:${sanitizeTel(emergencyPhone)}` : '#'}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-brand-dark shadow-soft transition hover:bg-brand-secondary/90"
            >
              Call now
            </a>
            <Link
              to="/about-us"
              className="inline-flex items-center justify-center rounded-full border border-white/60 bg-transparent px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-white/10"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16 space-y-8">
        <div className="flex flex-col gap-2 text-center">
          <span className="mx-auto inline-flex items-center rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
            Trusted voices
          </span>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">What our patients and partners say</h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
            Stories from the people who rely on {siteName} for fast booking, compassionate care, and secure records.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="flex flex-col gap-5 rounded-3xl border border-white/60 bg-white/80 p-6 text-left shadow-soft backdrop-blur">
              <p className="text-sm leading-relaxed text-slate-600">“{item.quote}”</p>
              <div className="flex items-center gap-3">
                <img src={item.avatar} alt={item.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-20">
        <HomeFooter />
      </div>
    </div>
  );
}

export default HomePage;
