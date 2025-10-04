import React from 'react';
import { Link } from 'react-router-dom';

const services = [
  {
    title: 'Specialist Consultations',
    description: 'Personalized visits with top specialists in cardiology, neurology, oncology, and more.',
  },
  {
    title: 'Diagnostic & Imaging',
    description: 'Same-day laboratory work, imaging appointments, and follow-up coordination.',
  },
  {
    title: 'Preventive Care Plans',
    description: 'Long-term wellness plans designed by our care team to keep you thriving every day.',
  },
];

function ServicesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/60 bg-white/70 p-10 shadow-glass backdrop-blur-xl">
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex items-center rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
            Our Services
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Comprehensive care tailored to you</h1>
          <p className="text-base text-slate-600 sm:text-lg">
            Discover the programs, clinics, and support teams that power our medical network. We combine compassionate specialists with seamless technology to support you at every step.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-brand-dark">{service.title}</h3>
              <p className="text-sm text-slate-600">{service.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-6 py-3 text-sm text-brand-dark">
          Looking for a specific program?
          <Link
            to="/book-appointment"
            className="rounded-full bg-brand-primary px-4 py-2 text-white shadow-soft transition hover:bg-brand-dark"
          >
            Book a visit
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ServicesPage;
