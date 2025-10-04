import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    birthdate: '',
    gender: '',
    phoneNumber: '',
    email: '',
    password: '',
    address: '',
    selectedDoctor: '',
    termsAccepted: false,
  });

  const [doctorList, setDoctorList] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/doctors`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        return response.json();
      })
      .then((data) => {
        setDoctorList(data);
        setLoadingDoctors(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load doctors. Please try again later.');
        setLoadingDoctors(false);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      termsAccepted: e.target.checked,
    }));
  };

  const handleDoctorSelection = (e) => {
    setFormData((prev) => ({
      ...prev,
      selectedDoctor: e.target.value,
    }));
  };

  const isFormValid =
    formData.fullName &&
    formData.birthdate &&
    formData.gender &&
    formData.phoneNumber &&
    formData.email &&
    formData.password &&
    formData.address &&
    formData.selectedDoctor &&
    formData.termsAccepted;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      setError('Please fill in all required fields and accept the terms.');
      return;
    }

    const payload = {
      fullName: formData.fullName,
      birthdate: formData.birthdate,
      gender: formData.gender,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      password: formData.password,
      address: formData.address,
      selectedDoctor: formData.selectedDoctor,
    };

    fetch(`${process.env.REACT_APP_API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }
        return data;
      })
      .then(() => {
        setRegistrationSuccess(true);
        setTimeout(() => {
          navigate('/signin');
        }, 2000);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'An unexpected error occurred');
      });
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white/95 p-10 shadow-card backdrop-blur">
        <h1 className="text-3xl font-semibold text-slate-900">New Patient Registration Form</h1>
        <h2 className="mt-2 text-lg text-slate-600">Welcome to Destination Health</h2>
        {error && <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
        {registrationSuccess && (
          <div className="mt-4 rounded-lg bg-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700">
            Registration successful! Redirecting to sign-in...
          </div>
        )}

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col text-sm font-semibold text-slate-700 sm:col-span-2">
            Full Name
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
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
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700">
            Gender
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="">-- Please Select Gender --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700">
            Phone Number
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              pattern="[0-9]{10}"
              placeholder="e.g., 1234567890"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
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
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
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
              minLength="6"
              placeholder="Minimum 6 characters"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
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
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="flex flex-col text-sm font-semibold text-slate-700 sm:col-span-2">
            Select Doctor
            <div className="mt-2">
              {loadingDoctors ? (
                <p className="text-sm text-slate-500">Loading doctors...</p>
              ) : doctorList.length > 0 ? (
                <select
                  name="selectedDoctor"
                  value={formData.selectedDoctor}
                  onChange={handleDoctorSelection}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="">-- Please Select a Doctor --</option>
                  {doctorList.map((doctor) => (
                    <option
                      key={doctor.DoctorID}
                      value={doctor.DoctorID}
                      disabled={doctor.CurrentPatientNumber >= doctor.MaxPatientNumber}
                    >
                      {doctor.FullName} ({doctor.CurrentPatientNumber}/{doctor.MaxPatientNumber} Patients)
                      {doctor.CurrentPatientNumber >= doctor.MaxPatientNumber ? ' - Full' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-500">No doctors available at the moment.</p>
              )}
            </div>
          </label>

          <label className="sm:col-span-2 flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted || false}
              onChange={handleCheckboxChange}
              required
              className="mt-1 h-5 w-5 rounded border-slate-300 text-brand-primary focus:ring-brand-accent"
            />
            <span className="font-medium">I accept the terms and conditions</span>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!isFormValid || loadingDoctors}
              className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
