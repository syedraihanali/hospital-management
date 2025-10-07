import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaHeartbeat,
  FaBrain,
  FaBone,
  FaChild,
  FaAllergies,
  FaStethoscope,
  FaLungs,
  FaUserNurse,
} from 'react-icons/fa';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';

const specialists = [
  {
    name: 'Cardiology',
    description:
      'Heart rhythm evaluations, cardiac imaging, and personalized treatment plans for every stage of cardiovascular health.',
    icon: FaHeartbeat,
  },
  {
    name: 'Neurology',
    description:
      'Brain and nerve care that covers migraine management, stroke rehabilitation, and complex neurodiagnostics.',
    icon: FaBrain,
  },
  {
    name: 'Orthopedics',
    description:
      'Bone, joint, and sports medicine support, from injury prevention to minimally invasive surgical interventions.',
    icon: FaBone,
  },
  {
    name: 'Pediatrics',
    description:
      'Dedicated child health teams for growth checkups, vaccinations, developmental screenings, and parent guidance.',
    icon: FaChild,
  },
  {
    name: 'Allergy & Immunology',
    description:
      'Evidence-based allergy testing, immunotherapy, and chronic immune condition monitoring for all age groups.',
    icon: FaAllergies,
  },
  {
    name: 'Internal Medicine',
    description:
      'Comprehensive adult medicine with coordinated chronic disease management and preventive lifestyle coaching.',
    icon: FaStethoscope,
  },
  {
    name: 'Pulmonology',
    description:
      'Advanced respiratory diagnostics, asthma and COPD clinics, and sleep apnea programs supported by modern imaging.',
    icon: FaLungs,
  },
  {
    name: 'Nursing Specialists',
    description:
      'Highly trained nurse coordinators who guide patients through recovery, education, and long-term wellness plans.',
    icon: FaUserNurse,
  },
];

function SpecialistsPage() {
  const { siteSettings } = useSiteSettings();
  const siteName = siteSettings?.siteName ?? 'Destination Health';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      {/* <section className="rounded-3xl border border-white/40 bg-white/80 p-10 shadow-glass backdrop-blur-xl">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
              Our Specialists
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">
              Meet the clinical experts powering {siteName}
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              Every specialist at {siteName} collaborates across departments, using shared electronic health records and real-time diagnostics to create a complete picture of your health. Explore our core disciplines and discover how our teams guide you from first consultation to follow-up care.
            </p>
            <div className="grid gap-4 rounded-2xl border border-brand-primary/20 bg-brand-primary/10 p-5 text-sm text-brand-dark sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-dark/70">Integrated expertise</p>
                <p className="mt-1 text-lg font-semibold text-brand-dark">Doctors, nurses, and coordinators working in sync</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-dark/70">Personalized pathways</p>
                <p className="mt-1 text-lg font-semibold text-brand-dark">Care plans tailored to your goals and lifestyle</p>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-brand-primary/20 bg-brand-primary/5 p-8 shadow-card">
            <h2 className="text-xl font-semibold text-brand-primary">Need help choosing a specialist?</h2>
            <p className="mt-3 text-sm text-slate-600">
              Our care navigators connect you with the right clinical expert, schedule diagnostic tests, and coordinate follow-ups so you can focus on feeling better.
            </p>
            <Link
              to="/book-appointment"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
            >
              Book a consultation
            </Link>
          </div>
        </div>
      </section> */}

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Specialist departments at {siteName}</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Discover the range of clinical disciplines ready to support your wellbeing. Each card highlights the focus areas and coordinated services available to you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {specialists.map(({ name, description, icon: Icon }) => (
            <article
              key={name}
              className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white/95 p-8 shadow-card backdrop-blur transition hover:translate-y-[-4px] hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-semibold text-slate-900">{name}</h3>
              </div>
              <p className="mt-4 text-sm text-slate-600 sm:text-base">{description}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-primary">
                <span aria-hidden="true">•</span>
                <span>Available for in-person and virtual consultations</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default SpecialistsPage;
