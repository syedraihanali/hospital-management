import React from 'react';
import { Link } from 'react-router-dom';
import { FaFileMedical, FaLock, FaCloudDownloadAlt } from 'react-icons/fa';

const highlights = [
  {
    icon: <FaFileMedical className="text-brand-primary" aria-hidden="true" />,
    title: 'All reports in one vault',
    description: 'Access lab results, prescriptions, and visit notes securely from any device.',
  },
  {
    icon: <FaLock className="text-brand-primary" aria-hidden="true" />,
    title: 'Private & encrypted',
    description: 'Industry-grade encryption keeps every diagnosis and document protected.',
  },
  {
    icon: <FaCloudDownloadAlt className="text-brand-primary" aria-hidden="true" />,
    title: 'Download or share instantly',
    description: 'Send reports to family or specialists with expiring, permission-based links.',
  },
];

function ReportsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      <section className="grid gap-10 rounded-3xl border border-white/60 bg-white/75 p-10 shadow-glass backdrop-blur-xl lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
            Reports hub
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Your diagnostics & medical history, beautifully organized
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">
            Destination Health keeps your medical records at your fingertips. Retrieve imaging, labs, prescriptions, and discharge summaries whenever you need them.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/signin"
              className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
            >
              Sign in to view reports
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-brand-primary/30 bg-white/70 px-6 py-3 text-sm font-semibold text-brand-dark shadow-soft transition hover:border-brand-primary hover:bg-brand-primary/10"
            >
              Create an account
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-brand-primary/10 via-white to-brand-secondary p-6 shadow-soft">
          {highlights.map((highlight) => (
            <div key={highlight.title} className="flex gap-4 rounded-2xl bg-white/70 p-4 shadow-soft">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10">
                {highlight.icon}
              </div>
              <div>
                <h3 className="text-base font-semibold text-brand-dark">{highlight.title}</h3>
                <p className="text-sm text-slate-600">{highlight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ReportsPage;
