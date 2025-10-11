import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const [formData, setFormData] = useState({
    fullName: '',
    birthdate: '',
    gender: '',
    phoneNumber: '',
    nidNumber: '',
    email: '',
    password: '',
    address: '',
    termsAccepted: false,
  });
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (event) => {
    setFormData((prev) => ({ ...prev, termsAccepted: event.target.checked }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setMedicalRecords(files);
  };

  const isFormValid =
    formData.fullName &&
    formData.birthdate &&
    formData.gender &&
    formData.phoneNumber &&
    formData.nidNumber &&
    formData.email &&
    formData.password &&
    formData.address &&
    formData.termsAccepted;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!isFormValid) {
      setError('Please complete all required fields and accept the terms.');
      return;
    }

    const phonePattern = /^(\+?88)?01[3-9]\d{8}$/;
    if (!phonePattern.test(formData.phoneNumber)) {
      setError('Please enter a valid Bangladeshi mobile number.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append('fullName', formData.fullName);
      payload.append('birthdate', formData.birthdate);
      payload.append('gender', formData.gender);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('nidNumber', formData.nidNumber);
      payload.append('email', formData.email);
      payload.append('password', formData.password);
      payload.append('address', formData.address);
      medicalRecords.forEach((file) => payload.append('medicalRecords', file));

      const response = await fetch(`${apiBaseUrl}/api/patients/register`, {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Registration failed.');
      }

      setSuccess(true);
      setTimeout(() => navigate('/signin/patient'), 2200);
    } catch (err) {
      setError(err.message || 'Unable to register at this time.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white/95 p-10 shadow-card backdrop-blur">
        <h1 className="text-3xl font-semibold text-slate-900">New Patient Registration</h1>
        <p className="mt-2 text-slate-600">
          Create your account to manage appointments, upload medical history, and receive prescriptions digitally.
        </p>
        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Registration successful! Redirecting to sign-in...
          </div>
        ) : null}

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col text-sm font-semibold text-slate-700 sm:col-span-2">
            Full name
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700">
            Birthdate
            <input
              type="date"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700">
            Gender
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="">-- Select gender --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700">
            Mobile number
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              placeholder="e.g. +8801XXXXXXXXX"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700">
            National ID (NID)
            <input
              type="text"
              name="nidNumber"
              value={formData.nidNumber}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700 sm:col-span-2">
            Address
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700 sm:col-span-2">
            Medical records (PDF or image)
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="mt-2 w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <span className="mt-1 text-xs font-medium text-slate-500">
              You can upload up to six existing prescriptions, lab results, or discharge summaries to help our doctors prepare.
            </span>
          </label>

          <label className="sm:col-span-2 flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleCheckboxChange}
              required
              className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-primary focus:ring-brand-accent"
            />
            <span className="font-medium">I agree to the hospital's privacy policy and consent to digital storage of my records.</span>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
