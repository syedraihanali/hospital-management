import React from 'react';
import { FaArrowRight, FaLock, FaUserPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function AuthSection() {
  const navigate = useNavigate();

  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-card shadow-blue-100/60 backdrop-blur lg:grid-cols-2">
      <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/60 bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-brand-primary">
            <FaLock />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Already a patient?</h3>
            <p className="text-sm text-slate-500">Securely access your medical history and manage appointments.</p>
          </div>
        </div>
        <form className="flex flex-col gap-4 text-sm text-slate-700">
          <label className="flex flex-col gap-2 font-medium">
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </label>
          <label className="flex flex-col gap-2 font-medium">
            Password
            <input
              type="password"
              placeholder="Enter password"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </label>
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="mt-2 inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-primary px-5 py-3 font-semibold text-white shadow-lg shadow-brand-primary/30 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Sign in
            <FaArrowRight className="text-xs" />
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-blue-200 bg-blue-50/70 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
            <FaUserPlus />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">New here?</h3>
            <p className="text-sm text-slate-500">Create a profile in minutes to connect with the right specialist.</p>
          </div>
        </div>
        <ul className="grid gap-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-brand-primary" />
            Schedule visits with real-time availability.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-brand-primary" />
            Share secure medical history with your care team.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-brand-primary" />
            Receive reminders and personalized follow-ups.
          </li>
        </ul>
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-brand-primary/40 bg-white px-5 py-3 font-semibold text-brand-primary shadow-md shadow-brand-primary/20 transition hover:-translate-y-0.5 hover:bg-blue-100"
        >
          Create account
          <FaArrowRight className="text-xs" />
        </button>
      </div>
    </section>
  );
}

export default AuthSection;
