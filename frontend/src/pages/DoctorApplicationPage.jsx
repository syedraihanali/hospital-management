import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function DoctorApplicationPage() {
  const navigate = useNavigate();
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    licenseNumber: '',
    nidNumber: '',
  });
  const [files, setFiles] = useState({ license: null, nid: null, resume: null });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const { name, files: selected } = event.target;
    setFiles((prev) => ({ ...prev, [name]: selected?.[0] ?? null }));
  };

  const isFormValid =
    formData.fullName &&
    formData.email &&
    formData.phoneNumber &&
    formData.specialization &&
    formData.licenseNumber &&
    formData.nidNumber &&
    files.license &&
    files.nid;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!isFormValid) {
      setFeedback({ type: 'error', message: 'Please complete all required fields and upload mandatory documents.' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append('fullName', formData.fullName);
      payload.append('email', formData.email);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('specialization', formData.specialization);
      payload.append('licenseNumber', formData.licenseNumber);
      payload.append('nidNumber', formData.nidNumber);
      if (files.license) payload.append('license', files.license);
      if (files.nid) payload.append('nid', files.nid);
      if (files.resume) payload.append('resume', files.resume);

      const response = await fetch(`${apiBaseUrl}/api/doctors/apply`, {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to submit application.');
      }

      setFeedback({ type: 'success', message: 'Application submitted! Our admin team will contact you shortly.' });
      setTimeout(() => {
        navigate('/signin/doctor');
      }, 2500);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Failed to submit the application.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-16 pt-10">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Apply to join Destination Health</h1>
        <p className="text-base text-slate-600">
          Share your credentials and supporting documents. An administrator will review your application within two business
          days.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur sm:p-8"
      >
        <section className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Full name
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Email address
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Mobile number
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              placeholder="e.g. +8801XXXXXXXXX"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Specialization
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              required
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none"
            />
          </label>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            BMDC license number
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              required
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            National ID number
            <input
              type="text"
              name="nidNumber"
              value={formData.nidNumber}
              onChange={handleInputChange}
              required
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none"
            />
          </label>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            License document (PDF/JPG)
            <input
              type="file"
              name="license"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            NID document (PDF/JPG)
            <input
              type="file"
              name="nid"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Resume / CV (optional)
            <input
              type="file"
              name="resume"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none"
            />
          </label>
        </section>

        <p className="rounded-2xl bg-brand-secondary/40 px-4 py-3 text-sm text-slate-600">
          By submitting this application you agree to our credential verification process. You will receive onboarding details
          once approved by an administrator.
        </p>

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

        <button
          type="submit"
          disabled={submitting || !isFormValid}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? 'Submitting application...' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}

export default DoctorApplicationPage;
