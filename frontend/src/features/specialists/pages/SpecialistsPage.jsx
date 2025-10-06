import React from 'react';
import { FiHeart, FiActivity, FiCpu } from 'react-icons/fi';
import { MdOutlineBiotech, MdOutlinePsychology } from 'react-icons/md';
import { GiKidneys, GiLungs } from 'react-icons/gi';

const specialistCatalog = [
  {
    name: 'Cardiology',
    description: 'Advanced cardiac diagnostics, minimally invasive procedures, and long-term heart health programs.',
    icon: FiHeart,
    accentClass: 'bg-rose-100 text-rose-500',
  },
  {
    name: 'Orthopedics',
    description: 'Joint preservation, robotic-assisted surgeries, and personalized rehabilitation for active recovery.',
    icon: FiActivity,
    accentClass: 'bg-orange-100 text-orange-500',
  },
  {
    name: 'Neurology',
    description: 'Comprehensive stroke care, neurosurgery coordination, and ongoing neurological wellness support.',
    icon: FiCpu,
    accentClass: 'bg-indigo-100 text-indigo-500',
  },
  {
    name: 'Gastroenterology',
    description: 'Digestive health screenings, endoscopic therapies, and nutrition-guided treatment pathways.',
    icon: MdOutlineBiotech,
    accentClass: 'bg-emerald-100 text-emerald-600',
  },
  {
    name: 'Oncology',
    description: 'Integrated cancer care with precision medicine, infusion therapy, and survivorship planning.',
    icon: MdOutlinePsychology,
    accentClass: 'bg-fuchsia-100 text-fuchsia-500',
  },
  {
    name: 'Transplant Services',
    description: 'Kidney, liver, heart, and lung transplant programs supported by dedicated post-operative teams.',
    icon: GiKidneys,
    accentClass: 'bg-sky-100 text-sky-500',
  },
  {
    name: 'Pulmonology',
    description: 'Respiratory diagnostics, pulmonary rehabilitation, and chronic lung disease management clinics.',
    icon: GiLungs,
    accentClass: 'bg-cyan-100 text-cyan-500',
  },
];

function SpecialistsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-12">
      <section className="mt-6 rounded-[36px] border border-brand-primary/30 bg-white/80 p-10 shadow-glass backdrop-blur">
        <div className="max-w-3xl space-y-4">
          <p className="inline-flex items-center rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-brand-dark">
            Specialist care
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-brand-dark sm:text-5xl">
            Experts across every critical discipline, ready to collaborate on your care plan
          </h1>
          <p className="text-lg text-slate-600">
            Our specialists combine advanced technology with compassionate care. Browse the departments below to discover how each team supports patients with comprehensive treatment pathways.
          </p>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {specialistCatalog.map(({ name, description, icon: Icon, accentClass }) => (
          <article
            key={name}
            className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-primary/60 hover:shadow-glass"
          >
            <div className="flex items-start gap-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accentClass}`}>
                <Icon className="text-2xl" />
              </span>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-800">{name}</h2>
                <p className="text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-primary opacity-0 transition group-hover:opacity-100">
              <span>View care team</span>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default SpecialistsPage;
