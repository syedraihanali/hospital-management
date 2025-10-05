import React, { useState } from 'react';
import { FaCalendarAlt, FaUserMd, FaClinicMedical, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const specialistOptions = [
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'mental-health', label: 'Mental Health' },
];

const doctorOptions = [
  { value: 'dr-jordan', label: 'Dr. Jordan Smith' },
  { value: 'dr-owens', label: 'Dr. Natalie Owens' },
  { value: 'dr-ramirez', label: 'Dr. Lucia Ramirez' },
  { value: 'dr-wells', label: 'Dr. Amir Wells' },
];

function BookingCard() {
  const navigate = useNavigate();
  const [bookingForm, setBookingForm] = useState({
    specialist: specialistOptions[0].value,
    doctor: doctorOptions[0].value,
    date: '',
    time: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate('/book-appointment', { state: bookingForm });
  };

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-card shadow-blue-100/70 backdrop-blur">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-brand-primary">
          <FaClinicMedical />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Find your next appointment</h2>
          <p className="text-sm text-slate-500">Select a specialist, doctor, and time that suits you.</p>
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Specialist
          <span className="relative">
            <FaUserMd className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              name="specialist"
              value={bookingForm.specialist}
              onChange={handleChange}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              {specialistOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Doctor
          <span className="relative">
            <FaClinicMedical className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              name="doctor"
              value={bookingForm.doctor}
              onChange={handleChange}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              {doctorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Date
            <span className="relative">
              <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                name="date"
                value={bookingForm.date}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                required
              />
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Time
            <span className="relative">
              <FaClock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="time"
                name="time"
                value={bookingForm.time}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                required
              />
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-2xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Check availability
        </button>
      </form>
    </div>
  );
}

export default BookingCard;
