import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';
import { FaBan, FaCalendarCheck, FaCalendarPlus, FaUndo, FaUserMd } from 'react-icons/fa';

function StaffPortal() {
  const { auth } = useContext(AuthContext);
  const doctorId = auth.user?.id;
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const createDefaultPlannerState = () => ({
    selectedDays: [],
    customDates: [],
    customDateInput: '',
    startTime: '09:00',
    endTime: '17:00',
    useCustomTime: false,
    customStartTime: '',
    customEndTime: '',
  });
  const [availabilityPlanner, setAvailabilityPlanner] = useState(createDefaultPlannerState);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilityFeedback, setAvailabilityFeedback] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [reportForm, setReportForm] = useState({ appointmentId: null, title: '', description: '', file: null });
  const [reportFeedback, setReportFeedback] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  const dayOptions = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const startTimeOptions = useMemo(
    () =>
      Array.from({ length: 16 }, (_value, index) => {
        const hour = 6 + index;
        return `${hour.toString().padStart(2, '0')}:00`;
      }),
    []
  );

  const endTimeOptions = useMemo(
    () =>
      Array.from({ length: 16 }, (_value, index) => {
        const hour = 7 + index;
        return `${hour.toString().padStart(2, '0')}:00`;
      }),
    []
  );

  const formatTimeLabel = (time) =>
    new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

  const parseTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatDateValue = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadAvailability = async () => {
    if (!doctorId || !auth.token) {
      setAvailabilitySlots([]);
      setAvailabilityLoading(false);
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/doctors/${doctorId}/availability/manage`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to load availability schedule.');
      }

      setAvailabilitySlots(Array.isArray(data) ? data : []);
    } catch (err) {
      setAvailabilityError(err.message || 'Failed to load availability schedule.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const fetchDoctorData = async () => {
    if (!doctorId || !auth.token) {
      return;
    }

    setLoading(true);
    setError('');
    setAvailabilityFeedback(null);

    try {
      const [profileRes, appointmentsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/doctors/${doctorId}/profile`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }),
        fetch(`${apiBaseUrl}/api/doctors/${doctorId}/appointments`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }),
      ]);

      if (!profileRes.ok) {
        throw new Error('Unable to load doctor profile.');
      }
      if (!appointmentsRes.ok) {
        throw new Error('Unable to load appointments.');
      }

      const profileData = await profileRes.json();
      const appointmentData = await appointmentsRes.json();
      setDoctorProfile(profileData);
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
      setProfileForm({
        fullName: profileData.FullName || '',
        email: profileData.Email || '',
        phoneNumber: profileData.PhoneNumber || '',
        specialization: profileData.Specialization || '',
        avatarUrl: profileData.AvatarUrl || '',
        avatarFile: null,
      });
      await loadAvailability();
    } catch (err) {
      setError(err.message || 'Failed to load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAppointments = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/doctors/${doctorId}/appointments`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Unable to refresh appointments.');
      }
      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatusFeedback({ type: 'error', message: err.message || 'Failed to refresh appointments.' });
    }
  };

  useEffect(() => {
    fetchDoctorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        new Date(`${b.ScheduleDate}T${b.StartTime}`) - new Date(`${a.ScheduleDate}T${a.StartTime}`)
      ),
    [appointments]
  );

  const sortedAvailabilitySlots = useMemo(
    () =>
      [...availabilitySlots].sort(
        (a, b) =>
          new Date(`${a.ScheduleDate}T${a.StartTime}`) - new Date(`${b.ScheduleDate}T${b.StartTime}`)
      ),
    [availabilitySlots]
  );

  const toggleDaySelection = (dayValue) => {
    setAvailabilityPlanner((prev) => {
      const alreadySelected = prev.selectedDays.includes(dayValue);
      const updatedDays = alreadySelected
        ? prev.selectedDays.filter((value) => value !== dayValue)
        : [...prev.selectedDays, dayValue];
      updatedDays.sort((a, b) => a - b);
      return { ...prev, selectedDays: updatedDays };
    });
  };

  const handleSelectAllDays = () => {
    setAvailabilityPlanner((prev) => ({
      ...prev,
      selectedDays: dayOptions.map((day) => day.value),
    }));
  };

  const handleClearDays = () => {
    setAvailabilityPlanner((prev) => ({ ...prev, selectedDays: [] }));
  };

  const handlePlannerFieldChange = (event) => {
    const { name, value } = event.target;
    setAvailabilityPlanner((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomTimeToggle = (event) => {
    const useCustomTime = event.target.checked;
    setAvailabilityPlanner((prev) => ({
      ...prev,
      useCustomTime,
      customStartTime: useCustomTime ? prev.customStartTime || prev.startTime : prev.customStartTime,
      customEndTime: useCustomTime ? prev.customEndTime || prev.endTime : prev.customEndTime,
    }));
  };

  const handleCustomDateInputChange = (event) => {
    setAvailabilityPlanner((prev) => ({ ...prev, customDateInput: event.target.value }));
  };

  const handleAddCustomDate = () => {
    const dateValue = availabilityPlanner.customDateInput;
    if (!dateValue) {
      return;
    }

    const selectedDate = new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
      setAvailabilityFeedback({ type: 'error', message: 'Choose a future date for custom availability.' });
      return;
    }

    if (availabilityPlanner.customDates.includes(dateValue)) {
      setAvailabilityPlanner((prev) => ({ ...prev, customDateInput: '' }));
      return;
    }

    setAvailabilityPlanner((prev) => ({
      ...prev,
      customDates: [...prev.customDates, dateValue].sort(),
      customDateInput: '',
    }));
  };

  const handleRemoveCustomDate = (date) => {
    setAvailabilityPlanner((prev) => ({
      ...prev,
      customDates: prev.customDates.filter((item) => item !== date),
    }));
  };

  const handleAvailabilitySubmit = async (event) => {
    event.preventDefault();
    setAvailabilityFeedback(null);

    const {
      selectedDays,
      customDates,
      startTime,
      endTime,
      useCustomTime,
      customStartTime,
      customEndTime,
    } = availabilityPlanner;

    const startValue = useCustomTime ? customStartTime : startTime;
    const endValue = useCustomTime ? customEndTime : endTime;

    if (!startValue || !endValue) {
      setAvailabilityFeedback({ type: 'error', message: 'Select both a start time and an end time.' });
      return;
    }

    if (parseTimeToMinutes(endValue) <= parseTimeToMinutes(startValue)) {
      setAvailabilityFeedback({ type: 'error', message: 'End time must be later than the start time.' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDatesSet = new Set(customDates);

    if (selectedDays.length) {
      for (let offset = 0; offset < 28; offset += 1) {
        const candidate = new Date(today);
        candidate.setDate(today.getDate() + offset);
        if (selectedDays.includes(candidate.getDay())) {
          selectedDatesSet.add(formatDateValue(candidate));
        }
      }
    }

    const plannedDates = [...selectedDatesSet]
      .map((dateString) => dateString)
      .filter((dateString) => {
        const parsed = new Date(dateString);
        return !Number.isNaN(parsed.getTime()) && parsed >= today;
      })
      .sort();

    if (!plannedDates.length) {
      setAvailabilityFeedback({ type: 'error', message: 'Select at least one day or custom date.' });
      return;
    }

    const availabilityMap = new Map(
      availabilitySlots.map((slot) => [
        `${slot.ScheduleDate}|${slot.StartTime}|${slot.EndTime}`,
        slot,
      ])
    );

    const slotsToCreate = [];
    const slotsToRestore = [];

    plannedDates.forEach((date) => {
      const key = `${date}|${startValue}|${endValue}`;
      const existingSlot = availabilityMap.get(key);
      if (!existingSlot) {
        slotsToCreate.push({ date, startTime: startValue, endTime: endValue });
      } else if (!existingSlot.IsAvailable) {
        slotsToRestore.push(existingSlot.AvailableTimeID);
      }
    });

    if (!slotsToCreate.length && !slotsToRestore.length) {
      setAvailabilityFeedback({ type: 'error', message: 'Those availability slots already exist.' });
      return;
    }

    try {
      if (slotsToCreate.length) {
        const response = await fetch(`${apiBaseUrl}/api/doctors/${doctorId}/availability`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ slots: slotsToCreate }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Unable to add availability.');
        }
      }

      if (slotsToRestore.length) {
        await Promise.all(
          slotsToRestore.map(async (slotId) => {
            const response = await fetch(
              `${apiBaseUrl}/api/doctors/${doctorId}/availability/${slotId}`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${auth.token}`,
                },
                body: JSON.stringify({ isAvailable: true }),
              }
            );

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(payload.error || payload.message || 'Unable to update availability.');
            }
          })
        );
      }

      const totalUpdated = slotsToCreate.length + slotsToRestore.length;
      setAvailabilityFeedback({
        type: 'success',
        message: `Availability updated for ${totalUpdated} slot${totalUpdated === 1 ? '' : 's'}.`,
      });
      setAvailabilityPlanner((prev) => ({ ...prev, customDates: [], customDateInput: '' }));
      await loadAvailability();
    } catch (err) {
      setAvailabilityFeedback({ type: 'error', message: err.message || 'Failed to update availability.' });
    }
  };

  const handleToggleSlotAvailability = async (slotId, makeAvailable) => {
    setAvailabilityFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/doctors/${doctorId}/availability/${slotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ isAvailable: makeAvailable }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to update availability.');
      }

      setAvailabilityFeedback({
        type: 'success',
        message: data.message || 'Availability updated successfully.',
      });
      await loadAvailability();
    } catch (err) {
      setAvailabilityFeedback({ type: 'error', message: err.message || 'Failed to update availability.' });
    }
  };

  const handleAppointmentStatus = async (appointmentId, status) => {
    setStatusFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/doctors/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Unable to update appointment status.');
      }

      setStatusFeedback({ type: 'success', message: 'Appointment updated successfully.' });
      await refreshAppointments();
    } catch (err) {
      setStatusFeedback({ type: 'error', message: err.message || 'Failed to update appointment.' });
    }
  };

  const openReportForm = (appointment) => {
    setReportFeedback(null);
    setReportForm({ appointmentId: appointment.AppointmentID, title: '', description: '', file: null });
  };

  const handleReportFieldChange = (event) => {
    const { name, value, files } = event.target;
    if (name === 'file') {
      setReportForm((prev) => ({ ...prev, file: files?.[0] || null }));
    } else {
      setReportForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    if (!reportForm.appointmentId || !reportForm.title || !reportForm.file) {
      setReportFeedback({ type: 'error', message: 'Title and report file are required.' });
      return;
    }

    try {
      const payload = new FormData();
      payload.append('title', reportForm.title);
      if (reportForm.description) {
        payload.append('description', reportForm.description);
      }
      payload.append('report', reportForm.file);

      const response = await fetch(
        `${apiBaseUrl}/api/doctors/appointments/${reportForm.appointmentId}/report`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
          body: payload,
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Unable to upload report.');
      }

      setReportFeedback({ type: 'success', message: 'Report uploaded successfully.' });
      setReportForm({ appointmentId: null, title: '', description: '', file: null });
      await refreshAppointments();
    } catch (err) {
      setReportFeedback({ type: 'error', message: err.message || 'Failed to upload report.' });
    }
  };

  const handleProfileChange = (event) => {
    const { name, value, files } = event.target;
    if (name === 'avatar') {
      setProfileForm((prev) => ({ ...prev, avatarFile: files?.[0] || null }));
    } else {
      setProfileForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileFeedback(null);

    try {
      const payload = new FormData();
      payload.append('fullName', profileForm.fullName);
      payload.append('email', profileForm.email);
      payload.append('phoneNumber', profileForm.phoneNumber);
      payload.append('specialization', profileForm.specialization);
      if (profileForm.avatarFile) {
        payload.append('avatar', profileForm.avatarFile);
      }

      const response = await fetch(`${apiBaseUrl}/api/doctors/${doctorId}/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Unable to update profile.');
      }

      setProfileFeedback({ type: 'success', message: 'Profile updated successfully.' });
      await fetchDoctorData();
    } catch (err) {
      setProfileFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (!passwordValue || passwordValue.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/doctors/${doctorId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ newPassword: passwordValue }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Unable to update password.');
      }

      setPasswordValue('');
      setPasswordFeedback({ type: 'success', message: 'Password updated successfully.' });
    } catch (err) {
      setPasswordFeedback({ type: 'error', message: err.message || 'Failed to update password.' });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-600">
        Loading your schedule...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-red-600">{error}</div>
    );
  }

  if (!doctorProfile || !profileForm) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-500">
        No doctor profile available.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-14">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-brand-secondary text-2xl font-semibold text-brand-dark">
            {profileForm.avatarUrl ? (
              <img src={profileForm.avatarUrl} alt={profileForm.fullName} className="h-full w-full object-cover" />
            ) : (
              <FaUserMd aria-hidden="true" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Good day, {doctorProfile.FullName}</h1>
            <p className="text-sm text-slate-600">
              Manage appointments, publish reports, and keep your availability up to date.
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          <p>Specialization: {doctorProfile.Specialization || 'General medicine'}</p>
          <p>Email: {doctorProfile.Email}</p>
          <p>Phone: {doctorProfile.PhoneNumber || 'Not set'}</p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-brand-primary">Upcoming & recent appointments</h2>
            <FaCalendarCheck className="text-brand-primary" aria-hidden="true" />
          </div>
          {statusFeedback ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                statusFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {statusFeedback.message}
            </div>
          ) : null}
          <div className="mt-4 grid gap-3">
            {sortedAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                No appointments booked yet. Add availability to receive bookings.
              </div>
            ) : (
              sortedAppointments.map((appointment) => {
                const status = appointment.Status || 'pending';
                const isPending = status === 'pending';
                const isConfirmed = status === 'confirmed';
                const isCompleted = status === 'completed';
                const isCancelled = status === 'cancelled';
                return (
                  <article
                    key={appointment.AppointmentID}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{appointment.PatientName}</h3>
                      <p className="text-xs text-slate-600">Phone: {appointment.PhoneNumber || 'N/A'}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(`${appointment.ScheduleDate}T${appointment.StartTime}`).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        — {appointment.EndTime}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 font-semibold ${
                          isPending
                            ? 'bg-amber-100 text-amber-700'
                            : isConfirmed
                            ? 'bg-sky-100 text-sky-700'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {status.toUpperCase()}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAppointmentStatus(appointment.AppointmentID, 'confirmed')}
                              className="rounded-full bg-brand-primary px-3 py-2 font-semibold text-white shadow hover:bg-brand-dark"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAppointmentStatus(appointment.AppointmentID, 'cancelled')}
                              className="rounded-full border border-rose-300 px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              Decline
                            </button>
                          </>
                        ) : null}
                        {isConfirmed ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAppointmentStatus(appointment.AppointmentID, 'completed')}
                              className="rounded-full bg-emerald-500 px-3 py-2 font-semibold text-white shadow hover:bg-emerald-600"
                            >
                              Mark completed
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAppointmentStatus(appointment.AppointmentID, 'cancelled')}
                              className="rounded-full border border-rose-300 px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : null}
                        {(!isCancelled && !isCompleted) ? (
                          <button
                            type="button"
                            onClick={() => openReportForm(appointment)}
                            className="rounded-full border border-slate-300 px-3 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Upload report
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-brand-primary">
                  <FaCalendarPlus aria-hidden="true" />
                  Plan your availability
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Select weekly days or custom dates, then choose the hours you are available for appointments.
                </p>
              </div>
            </div>
            {availabilityFeedback ? (
              <div
                className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                  availabilityFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {availabilityFeedback.message}
              </div>
            ) : null}
            <form className="mt-4 space-y-5" onSubmit={handleAvailabilitySubmit}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Days of the week</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dayOptions.map((day) => {
                    const isSelected = availabilityPlanner.selectedDays.includes(day.value);
                    return (
                      <button
                        type="button"
                        key={day.value}
                        onClick={() => toggleDaySelection(day.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? 'border-brand-primary bg-brand-primary/15 text-brand-dark shadow-sm'
                            : 'border-slate-300 text-slate-600 hover:border-brand-primary hover:text-brand-dark'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleSelectAllDays}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-brand-primary hover:text-brand-dark"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDays}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom dates</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="date"
                    value={availabilityPlanner.customDateInput}
                    onChange={handleCustomDateInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent sm:max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDate}
                    className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                  >
                    Add date
                  </button>
                </div>
                {availabilityPlanner.customDates.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    {availabilityPlanner.customDates.map((date) => (
                      <li
                        key={date}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                      >
                        <span>
                          {new Date(`${date}T00:00`).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomDate(date)}
                          className="text-slate-400 transition hover:text-rose-500"
                          aria-label={`Remove ${date}`}
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">Optional: select specific dates outside your weekly routine.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  Start time
                  {availabilityPlanner.useCustomTime ? (
                    <input
                      type="time"
                      name="customStartTime"
                      value={availabilityPlanner.customStartTime || availabilityPlanner.startTime}
                      onChange={handlePlannerFieldChange}
                      required
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  ) : (
                    <select
                      name="startTime"
                      value={availabilityPlanner.startTime}
                      onChange={handlePlannerFieldChange}
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    >
                      {startTimeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTimeLabel(time)}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
                <label className="flex flex-col text-xs font-semibold text-slate-600">
                  End time
                  {availabilityPlanner.useCustomTime ? (
                    <input
                      type="time"
                      name="customEndTime"
                      value={availabilityPlanner.customEndTime || availabilityPlanner.endTime}
                      onChange={handlePlannerFieldChange}
                      required
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  ) : (
                    <select
                      name="endTime"
                      value={availabilityPlanner.endTime}
                      onChange={handlePlannerFieldChange}
                      className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    >
                      {endTimeOptions.map((time) => (
                        <option key={time} value={time}>
                          {formatTimeLabel(time)}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={availabilityPlanner.useCustomTime}
                  onChange={handleCustomTimeToggle}
                  className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                />
                Use custom time inputs (for non-hourly schedules)
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
              >
                Save availability
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-700">Upcoming availability</h4>
                <span className="text-xs text-slate-400">
                  {availabilitySlots.length} slot{availabilitySlots.length === 1 ? '' : 's'} scheduled
                </span>
              </div>
              {availabilityError ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {availabilityError}
                </div>
              ) : null}
              {availabilityLoading ? (
                <p className="mt-3 text-xs text-slate-500">Loading availability...</p>
              ) : sortedAvailabilitySlots.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">
                  You have not set any availability yet. Add weekly days or custom dates to get appointment requests.
                </p>
              ) : (
                <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {sortedAvailabilitySlots.map((slot) => {
                    const isAvailable = Boolean(slot.IsAvailable);
                    const slotDate = new Date(`${slot.ScheduleDate}T00:00`);
                    return (
                      <li
                        key={slot.AvailableTimeID}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-700">
                            {slotDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatTimeLabel(slot.StartTime)} — {formatTimeLabel(slot.EndTime)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${
                              isAvailable
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isAvailable ? 'Available' : 'Unavailable'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleSlotAvailability(slot.AvailableTimeID, !isAvailable)}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${
                              isAvailable
                                ? 'border border-rose-300 text-rose-600 hover:bg-rose-50'
                                : 'border border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {isAvailable ? <FaBan aria-hidden="true" /> : <FaUndo aria-hidden="true" />}
                            {isAvailable ? 'Mark unavailable' : 'Restore'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <h2 className="text-xl font-semibold text-brand-primary">Profile & security</h2>
          {profileFeedback ? (
            <div
              className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                profileFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {profileFeedback.message}
            </div>
          ) : null}
          <form className="mt-3 grid gap-3" onSubmit={handleProfileSubmit}>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Full name
              <input
                type="text"
                name="fullName"
                value={profileForm.fullName}
                onChange={handleProfileChange}
                required
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Email address
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Phone number
              <input
                type="tel"
                name="phoneNumber"
                value={profileForm.phoneNumber}
                onChange={handleProfileChange}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Specialization
              <input
                type="text"
                name="specialization"
                value={profileForm.specialization}
                onChange={handleProfileChange}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Update profile photo
              <input
                type="file"
                name="avatar"
                accept=".jpg,.jpeg,.png"
                onChange={handleProfileChange}
                className="mt-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
            >
              Save details
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-brand-primary">Change password</h3>
            {passwordFeedback ? (
              <div
                className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                  passwordFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {passwordFeedback.message}
              </div>
            ) : null}
            <form className="mt-3 grid gap-3" onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={passwordValue}
                onChange={(event) => setPasswordValue(event.target.value)}
                minLength={8}
                placeholder="New password"
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-slate-700"
              >
                Update password
              </button>
            </form>
          </div>
        </article>
      </section>

      {reportForm.appointmentId ? (
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <h2 className="text-xl font-semibold text-brand-primary">Upload prescription or report</h2>
          {reportFeedback ? (
            <div
              className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                reportFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {reportFeedback.message}
            </div>
          ) : null}
          <form className="mt-3 grid gap-3" onSubmit={handleReportSubmit}>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Report title
              <input
                type="text"
                name="title"
                value={reportForm.title}
                onChange={handleReportFieldChange}
                required
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Notes for patient (optional)
              <textarea
                name="description"
                value={reportForm.description}
                onChange={handleReportFieldChange}
                rows={3}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-col text-xs font-semibold text-slate-600">
              Upload PDF or image
              <input
                type="file"
                name="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleReportFieldChange}
                required
                className="mt-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
              >
                Send to patient
              </button>
              <button
                type="button"
                onClick={() => setReportForm({ appointmentId: null, title: '', description: '', file: null })}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

export default StaffPortal;
