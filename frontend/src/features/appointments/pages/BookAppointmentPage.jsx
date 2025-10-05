import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/context/AuthContext';

function BookAppointmentPage() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState({ type: '', text: '' });

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.DoctorID) === String(selectedDoctorId)) || null,
    [doctors, selectedDoctorId]
  );

  useEffect(() => {
    if (!auth.token) {
      navigate('/signin/patient', { replace: true });
    }
  }, [auth.token, navigate]);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/doctors`);
        if (!response.ok) {
          throw new Error('Unable to load doctors.');
        }
        const data = await response.json();
        setDoctors(data);
        if (data.length > 0) {
          setSelectedDoctorId(String(data[0].DoctorID));
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load doctors.' });
      }
    };

    loadDoctors();
  }, [apiBaseUrl]);

  useEffect(() => {
    const loadAvailability = async () => {
      if (!selectedDoctorId || !auth.token) {
        setAvailableTimes([]);
        setUniqueDates([]);
        setSelectedDate('');
        setSelectedSlotId('');
        return;
      }

      setStatus('loading');
      setMessage({ type: '', text: '' });

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/appointments/available-times?doctorId=${selectedDoctorId}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Unable to load appointment slots.');
        }

        const data = await response.json();
        setAvailableTimes(data);
        const dates = [...new Set(data.map((slot) => slot.ScheduleDate))].sort();
        setUniqueDates(dates);
        setSelectedDate('');
        setSelectedSlotId('');
        setStatus('succeeded');
      } catch (error) {
        setAvailableTimes([]);
        setUniqueDates([]);
        setMessage({ type: 'error', text: error.message || 'Failed to load appointment slots.' });
        setStatus('failed');
      }
    };

    loadAvailability();
  }, [apiBaseUrl, auth.token, selectedDoctorId]);

  const handleDoctorChange = (event) => {
    setSelectedDoctorId(event.target.value);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedSlotId('');
  };

  const handleTimeChange = (event) => {
    setSelectedSlotId(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSlotId) {
      setMessage({ type: 'error', text: 'Select a time slot to proceed.' });
      return;
    }

    setStatus('submitting');
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ availableTimeID: Number.parseInt(selectedSlotId, 10) }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to book the appointment.');
      }

      setMessage({ type: 'success', text: 'Appointment booked successfully!' });
      setTimeout(() => navigate('/myprofile'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to book the appointment.' });
    } finally {
      setStatus('succeeded');
    }
  };

  const slotsForSelectedDate = useMemo(
    () => availableTimes.filter((slot) => slot.ScheduleDate === selectedDate),
    [availableTimes, selectedDate]
  );

  if (!auth.token) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-card backdrop-blur">
        <h1 className="text-3xl font-semibold text-slate-900">Book an appointment</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select a specialist and choose from their current availability. You will receive confirmation once the doctor approves the request.
        </p>

        {message.text ? (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${
              message.type === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700">
            Choose a doctor
            <select
              value={selectedDoctorId}
              onChange={handleDoctorChange}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {doctors.map((doctor) => (
                <option key={doctor.DoctorID} value={doctor.DoctorID}>
                  {doctor.FullName} {doctor.Specialization ? `— ${doctor.Specialization}` : ''}
                </option>
              ))}
            </select>
          </label>

          {selectedDoctor ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {selectedDoctor.Specialization ? (
                <span className="font-semibold text-slate-800">Specialty:</span>
              ) : null}{' '}
              {selectedDoctor.Specialization || 'General consultation'}
            </div>
          ) : null}

          <label className="block text-sm font-semibold text-slate-700">
            Appointment date
            <select
              value={selectedDate}
              onChange={handleDateChange}
              disabled={!uniqueDates.length}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="">-- Select a date --</option>
              {uniqueDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </option>
              ))}
            </select>
          </label>

          {selectedDate ? (
            <label className="block text-sm font-semibold text-slate-700">
              Available time slots
              <select
                value={selectedSlotId}
                onChange={handleTimeChange}
                disabled={!slotsForSelectedDate.length}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="">-- Select a time --</option>
                {slotsForSelectedDate.map((slot) => (
                  <option key={slot.AvailableTimeID} value={slot.AvailableTimeID}>
                    {slot.StartTime} - {slot.EndTime}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            type="submit"
            disabled={status === 'loading' || status === 'submitting' || !selectedSlotId}
            className="w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            {status === 'submitting' ? 'Booking appointment...' : 'Book appointment'}
          </button>
        </form>

        {status === 'loading' ? (
          <p className="mt-4 text-sm text-slate-500">Loading latest availability...</p>
        ) : null}

        {!uniqueDates.length && status === 'succeeded' ? (
          <p className="mt-4 text-sm text-slate-500">No open slots for this doctor right now. Please try another doctor or check back later.</p>
        ) : null}
      </div>
    </div>
  );
}

export default BookAppointmentPage;
