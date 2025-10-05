import React from 'react';
import { Link } from 'react-router-dom';

const roles = [
  {
    role: 'patient',
    title: 'Patient login',
    description: 'Manage your appointments, prescriptions, and health history.',
    to: '/signin/patient',
    accent: 'bg-brand-primary/10 text-brand-primary',
  },
  {
    role: 'doctor',
    title: 'Doctor login',
    description: 'Review schedules, patient information, and care tasks.',
    to: '/signin/doctor',
    accent: 'bg-emerald-100 text-emerald-700',
  },
  {
    role: 'admin',
    title: 'Administrator login',
    description: 'Oversee users, reports, and operational dashboards.',
    to: '/signin/admin',
    accent: 'bg-slate-200 text-slate-700',
  },
];

function SignInLandingPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-4xl flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-10 shadow-card backdrop-blur">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Choose your portal</h1>
          <p className="mt-2 text-sm text-slate-600">
            Access is tailored for each role. Select the portal that matches how you collaborate with Destination Health.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {roles.map((option) => (
            <Link
              key={option.role}
              to={option.to}
              className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand-primary/60 hover:shadow-lg"
            >
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${option.accent}`}>
                  {option.role.charAt(0).toUpperCase() + option.role.slice(1)} portal
                </span>
                <h2 className="mt-4 text-xl font-semibold text-slate-900">{option.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{option.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
                Continue
                <span className="transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SignInLandingPage;
