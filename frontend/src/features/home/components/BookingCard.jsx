import React, { useContext, useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaUserMd, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/context/AuthContext';

function BookingCard() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [notes, setNotes] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('idle');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/doctors`);
        if (!response.ok) {
          throw new Error('Unable to load doctors right now.');
        }
        const data = await response.json();
        setDoctors(data);
        if (data.length > 0) {
          setSelectedDoctorId(String(data[0].DoctorID));
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Unable to load doctors.' });
      }
    };

    loadDoctors();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setAvailableTimes([]);
      setUniqueDates([]);
      setSelectedDate('');
      setSelectedSlotId('');
      return;
    }

    const loadAvailability = async () => {
      setAvailabilityStatus('loading');
      setSelectedDate('');
      setSelectedSlotId('');

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/appointments/available-times?doctorId=${selectedDoctorId}`
        );
        if (!response.ok) {
          throw new Error('Unable to load availability.');
        }
        const data = await response.json();
        setAvailableTimes(data);
        const uniqueDateMap = new Map();
        data.forEach((slot) => {
          if (!uniqueDateMap.has(slot.ScheduleDate)) {
            uniqueDateMap.set(slot.ScheduleDate, slot.DayName || '');
          }
        });
        const dates = Array.from(uniqueDateMap.entries())
          .map(([date, dayName]) => ({ date, dayName }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setUniqueDates(dates);
        setAvailabilityStatus('succeeded');
      } catch (error) {
        setAvailabilityStatus('failed');
        setAvailableTimes([]);
        setUniqueDates([]);
        setMessage({ type: 'error', text: error.message || 'Failed to load availability.' });
      }
    };

    loadAvailability();
  }, [apiBaseUrl, selectedDoctorId]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.DoctorID) === String(selectedDoctorId)) || null,
    [doctors, selectedDoctorId]
  );

  const slotsForSelectedDate = useMemo(
    () => availableTimes.filter((slot) => slot.ScheduleDate === selectedDate),
    [availableTimes, selectedDate]
  );

  const consultationFee = useMemo(() => {
    if (!selectedDoctor || selectedDoctor.ConsultationFee === undefined || selectedDoctor.ConsultationFee === null) {
      return 0;
    }
    const fee = Number.parseFloat(selectedDoctor.ConsultationFee);
    return Number.isNaN(fee) ? 0 : fee;
  }, [selectedDoctor]);

  const formattedConsultationFee = useMemo(
    () =>
      consultationFee.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [consultationFee]
  );

  const messageStyles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedSlotId) {
      setMessage({ type: 'error', text: 'Select a date and time to continue.' });
      return;
    }

    navigate('/book-appointment', {
      state: {
        doctorId: selectedDoctorId,
        date: selectedDate,
        slotId: selectedSlotId,
        notes,
      },
    });
  };

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-card shadow-blue-100/70 backdrop-blur">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-brand-primary">
          <FaUserMd />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Quick appointment booking</h2>
          <p className="text-sm text-slate-500">Reserve the next available slot with a preferred doctor.</p>
        </div>
      </div>

      {message.text ? (
        <div
          className={`mb-4 rounded-xl border px-3 py-2 text-xs font-semibold ${
            messageStyles[message.type] || 'border-slate-200 bg-slate-100 text-slate-700'
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Doctor
          <span className="relative">
            <FaUserMd className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              name="doctor"
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              {doctors.map((doctor) => (
                <option key={doctor.DoctorID} value={doctor.DoctorID}>
                  {doctor.FullName}
                  {doctor.Specialization ? ` — ${doctor.Specialization}` : ''}
                </option>
              ))}
            </select>
          </span>
        </label>

        {selectedDoctor ? (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">
              {selectedDoctor.Specialization
                ? `${selectedDoctor.FullName} • ${selectedDoctor.Specialization}`
                : `${selectedDoctor.FullName} • General consultation`}
            </span>
            <span className="mt-1 block text-[11px] text-slate-500">
              Consultation fee:{' '}
              <span className="font-semibold text-brand-primary">BDT {formattedConsultationFee}</span>
            </span>
            <span className="block text-[11px] text-slate-500">Payment is completed securely on the next step.</span>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Date
            <span className="relative">
              <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                name="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedSlotId('');
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:cursor-not-allowed"
                disabled={!uniqueDates.length}
              >
                <option value="">-- Select --</option>
                {uniqueDates.map(({ date, dayName }) => (
                  <option key={date} value={date}>
                    {dayName ? `${dayName} • ` : ''}
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Time
            <span className="relative">
              <FaClock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                name="time"
                value={selectedSlotId}
                onChange={(event) => setSelectedSlotId(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:cursor-not-allowed"
                disabled={!selectedDate || !slotsForSelectedDate.length}
              >
                <option value="">-- Select --</option>
                {slotsForSelectedDate.map((slot) => (
                  <option key={slot.AvailableTimeID} value={slot.AvailableTimeID}>
                    {slot.DayName ? `${slot.DayName} • ` : ''}
                    {slot.StartTime} - {slot.EndTime}
                  </option>
                ))}
              </select>
            </span>
          </label>
        </div>

        {availabilityStatus === 'loading' ? (
          <p className="text-xs text-slate-500">Checking the latest availability…</p>
        ) : null}
        {!uniqueDates.length && availabilityStatus === 'succeeded' ? (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
            No upcoming slots right now. Try another doctor or check back soon.
          </p>
        ) : null}

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Quick note for the doctor (optional)
          <textarea
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            placeholder="Describe your primary concern."
          />
        </label>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-2xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={availabilityStatus === 'loading' || !selectedSlotId}
        >
          {auth.token ? 'Proceed to checkout' : 'Continue to booking'}
        </button>
      </form>
    </div>
  );
}

export default BookingCard;
