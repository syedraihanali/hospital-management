import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HomeFooter from '../components/HomeFooter';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';

const testimonials = [
  {
    quote:
      'Booking my cardiology visits takes less than a minute. Destination Health keeps every report ready for my specialists.',
    name: 'Sierra Lawson',
    role: 'Patient Partner',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=160&h=160&q=80',
  },
  {
    quote:
      'Our clinic loves the seamless scheduling tools. The emergency escalation pathway has genuinely saved lives.',
    name: 'Dr. Priya Menon',
    role: 'Cardiology Lead, Summit Health',
    avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=facearea&w=160&h=160&q=80',
  },
  {
    quote:
      'Patients can self-serve and our care team monitors everything in real time. It feels modern, safe, and compassionate.',
    name: 'Jordan Blake',
    role: 'Nursing Director',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb468fb9f89?auto=format&fit=facearea&w=160&h=160&q=80',
  },
];

const formatReadableDate = (value) => {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return value;
  }
};

const formatTimeLabel = (timeString) => {
  if (!timeString) {
    return '';
  }

  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0);

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatTimeRange = (start, end) => {
  if (!start || !end) {
    return '';
  }

  return `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;
};

const sanitizeTel = (value = '') => value.replace(/[^+\d]/g, '');

function HomePage() {
  const apiBaseUrl = useMemo(() => {
    const url = process.env.REACT_APP_API_URL || '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }, []);
  const { siteSettings } = useSiteSettings();
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const siteName = siteSettings?.siteName ?? 'Destination Health';
  const emergencyContactName = siteSettings?.emergencyContactName ?? 'Emergency coordination desk';
  const emergencyPhone = siteSettings?.emergencyContactPhone ?? '';
  const emergencyEmail = siteSettings?.emergencyContactEmail ?? '';
  const emergencyAddress = siteSettings?.emergencyContactAddress ?? '';

  useEffect(() => {
    let isMounted = true;

    const fetchDoctors = async () => {
      setDoctorsLoading(true);
      setDoctorsError('');
      try {
        const response = await fetch(`${apiBaseUrl}/api/doctors`);
        if (!response.ok) {
          throw new Error('Failed to load doctors.');
        }

        const data = await response.json();
        if (isMounted) {
          setDoctors(data);
          setSelectedDoctorId(data[0]?.DoctorID ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setDoctorsError(error.message || 'Unable to retrieve doctors at the moment.');
          setDoctors([]);
          setSelectedDoctorId(null);
        }
      } finally {
        if (isMounted) {
          setDoctorsLoading(false);
        }
      }
    };

    fetchDoctors();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setAvailability([]);
      setSelectedDate('');
      setSelectedSlotId('');
      return;
    }

    let isMounted = true;

    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError('');
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/doctors/${selectedDoctorId}/available-times?limit=25`
        );
        if (!response.ok) {
          throw new Error('Failed to load availability.');
        }

        const data = await response.json();
        if (isMounted) {
          setAvailability(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setAvailability([]);
          setAvailabilityError(error.message || 'Unable to load available times.');
        }
      } finally {
        if (isMounted) {
          setAvailabilityLoading(false);
        }
      }
    };

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, selectedDoctorId]);

  useEffect(() => {
    if (!selectedDate && availability.length > 0) {
      setSelectedDate(availability[0].ScheduleDate);
    }
  }, [availability, selectedDate]);

  useEffect(() => {
    const slotsForCurrentDate = availability.filter((slot) => slot.ScheduleDate === selectedDate);

    if (slotsForCurrentDate.length === 0) {
      setSelectedSlotId('');
      return;
    }

    if (!slotsForCurrentDate.some((slot) => String(slot.AvailableTimeID) === selectedSlotId)) {
      setSelectedSlotId(String(slotsForCurrentDate[0].AvailableTimeID));
    }
  }, [availability, selectedDate, selectedSlotId]);

  const availableDates = useMemo(
    () => [...new Set(availability.map((slot) => slot.ScheduleDate))],
    [availability]
  );

  const slotsForSelectedDate = useMemo(
    () => availability.filter((slot) => slot.ScheduleDate === selectedDate),
    [availability, selectedDate]
  );

  const activeDoctorDetails = useMemo(
    () => doctors.find((doctor) => doctor.DoctorID === selectedDoctorId) || null,
    [doctors, selectedDoctorId]
  );

  const nextAvailability = useMemo(() => {
    if (availability.length > 0) {
      return availability[0];
    }

    if (activeDoctorDetails?.NextScheduleDate) {
      return {
        ScheduleDate: activeDoctorDetails.NextScheduleDate,
        StartTime: activeDoctorDetails.NextStartTime,
        EndTime: activeDoctorDetails.NextEndTime,
      };
    }

    return null;
  }, [availability, activeDoctorDetails]);

  const handleDoctorChange = (event) => {
    const value = Number.parseInt(event.target.value, 10);
    setSelectedDoctorId(Number.isNaN(value) ? null : value);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleTimeChange = (event) => {
    setSelectedSlotId(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const slot = availability.find((item) => String(item.AvailableTimeID) === selectedSlotId);
    const doctorName = activeDoctorDetails?.FullName || 'the selected doctor';

    if (!slot) {
      setConfirmation('Please choose an available appointment time to continue.');
      return;
    }

    setConfirmation(
      `Appointment request saved for ${doctorName} on ${formatReadableDate(
        slot.ScheduleDate,
      )} at ${formatTimeRange(slot.StartTime, slot.EndTime)}. Sign in as a patient to confirm.`
    );
    setTimeout(() => setConfirmation(''), 6000);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <section className="relative mt-6 rounded-[40px] border border-white/60 bg-white/70 p-8 shadow-glass backdrop-blur-2xl sm:p-12">
        <div className="pointer-events-none absolute inset-0 rounded-[40px] bg-gradient-to-br from-brand-primary/15 via-transparent to-brand-secondary mix-blend-screen" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="text-center text-3xl font-semibold text-brand-dark sm:text-4xl">Book an appointment</h1>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Doctor
                <select
                  value={selectedDoctorId ?? ''}
                  onChange={handleDoctorChange}
                  disabled={doctorsLoading || doctors.length === 0}
                  className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-base text-brand-dark shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {doctorsLoading ? (
                    <option value="">Loading doctors...</option>
                  ) : doctors.length === 0 ? (
                    <option value="">No doctors available</option>
                  ) : (
                    doctors.map((doctor) => (
                      <option key={doctor.DoctorID} value={doctor.DoctorID}>
                        {doctor.FullName}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Date
                <select
                  value={selectedDate}
                  onChange={handleDateChange}
                  disabled={availabilityLoading || availableDates.length === 0}
                  className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-base text-brand-dark shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {availabilityLoading ? (
                    <option value="">Loading dates...</option>
                  ) : availableDates.length === 0 ? (
                    <option value="">No upcoming availability</option>
                  ) : (
                    availableDates.map((date) => (
                      <option key={date} value={date}>
                        {formatReadableDate(date)}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Time
                <select
                  value={selectedSlotId}
                  onChange={handleTimeChange}
                  disabled={slotsForSelectedDate.length === 0}
                  className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-base text-brand-dark shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {slotsForSelectedDate.length === 0 ? (
                    <option value="">No time slots available</option>
                  ) : (
                    slotsForSelectedDate.map((slot) => (
                      <option key={slot.AvailableTimeID} value={slot.AvailableTimeID}>
                        {formatTimeRange(slot.StartTime, slot.EndTime)}
                      </option>
                    ))
                  )}
                </select>
              </label>

              {doctorsError && (
                <div className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {doctorsError}
                </div>
              )}

              {availabilityError && !availabilityLoading && (
                <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  {availabilityError}
                </div>
              )}
            </div>

            {activeDoctorDetails && (
              <div className="grid gap-4 rounded-3xl border border-brand-primary/20 bg-brand-secondary/60 p-6 text-sm text-brand-dark shadow-soft sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-brand-dark">{activeDoctorDetails.FullName}</p>
                  <p className="mt-1 text-slate-600">
                    {activeDoctorDetails.AvailableSlotCount > 0
                      ? `${activeDoctorDetails.AvailableSlotCount} available time slot${
                          activeDoctorDetails.AvailableSlotCount === 1 ? '' : 's'
                        }`
                      : 'No upcoming availability listed'}
                  </p>
                </div>
                <div className="flex items-center justify-start sm:justify-end">
                  {nextAvailability ? (
                    <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-dark">
                      Next availability · {formatReadableDate(nextAvailability.ScheduleDate)} ·{' '}
                      {formatTimeLabel(nextAvailability.StartTime)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Availability information not yet published
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                doctorsLoading ||
                availabilityLoading ||
                !selectedDoctorId ||
                slotsForSelectedDate.length === 0 ||
                !selectedSlotId
              }
              className="w-full rounded-full bg-brand-primary px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {doctorsLoading || availabilityLoading ? 'Loading...' : 'Reserve appointment'}
            </button>

            {confirmation && (
              <p className="rounded-2xl border border-brand-primary/30 bg-white/70 px-4 py-3 text-center text-sm text-brand-dark shadow-soft">
                {confirmation}
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="mt-16 rounded-[36px] border border-brand-primary/30 bg-gradient-to-br from-brand-primary to-brand-dark p-10 text-white shadow-glass">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm uppercase tracking-[0.35em] text-white/70">Need emergency medical care?</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{emergencyContactName} is one tap away</h2>
            <p className="text-white/80">
              Call our emergency coordination desk for immediate triage and ambulance dispatch across our hospital network.
            </p>
            <div className="flex flex-col gap-2 text-white/80 sm:flex-row sm:items-center sm:gap-6">
              {emergencyPhone ? (
                <span className="text-lg font-semibold tracking-wide">
                  24/7 hotline:{' '}
                  <a className="underline-offset-4 hover:underline" href={`tel:${sanitizeTel(emergencyPhone)}`}>
                    {emergencyPhone}
                  </a>
                </span>
              ) : null}
              {emergencyEmail ? <span>{emergencyEmail}</span> : null}
            </div>
            {emergencyAddress ? (
              <p className="text-sm text-white/70">{emergencyAddress}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={emergencyPhone ? `tel:${sanitizeTel(emergencyPhone)}` : '#'}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-brand-dark shadow-soft transition hover:bg-brand-secondary/90"
            >
              Call now
            </a>
            <Link
              to="/about-us"
              className="inline-flex items-center justify-center rounded-full border border-white/60 bg-transparent px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-white/10"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16 space-y-8">
        <div className="flex flex-col gap-2 text-center">
          <span className="mx-auto inline-flex items-center rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
            Trusted voices
          </span>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">What our patients and partners say</h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
            Stories from the people who rely on {siteName} for fast booking, compassionate care, and secure records.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="flex flex-col gap-5 rounded-3xl border border-white/60 bg-white/80 p-6 text-left shadow-soft backdrop-blur">
              <p className="text-sm leading-relaxed text-slate-600">“{item.quote}”</p>
              <div className="flex items-center gap-3">
                <img src={item.avatar} alt={item.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-20">
        <HomeFooter />
      </div>
    </div>
  );
}

export default HomePage;
