import React, { useContext, useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { FaUserMd } from 'react-icons/fa';
import { AuthContext } from '../../auth/context/AuthContext';
import DoctorAppointmentsOverview from '../components/DoctorAppointmentsOverview';
import DoctorReportCenter from '../components/DoctorReportCenter';
import DoctorAvailabilityPlanner from '../components/DoctorAvailabilityPlanner';
import DoctorProfileSettings from '../components/DoctorProfileSettings';
import DoctorPatientHistory from '../components/DoctorPatientHistory';

function StaffPortal() {
  const { auth } = useContext(AuthContext);
  const doctorId = auth.user?.id;
  const navigate = useNavigate();
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
  const [availabilityFeedback, setAvailabilityFeedback] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [reportForm, setReportForm] = useState({
    appointmentId: null,
    title: '',
    description: '',
    file: null,
  });
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

  const normalizeDocuments = (raw) => {
    if (!raw) {
      return [];
    }
    if (Array.isArray(raw)) {
      return raw;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  };

  const normalizeAppointments = (data) =>
    data.map((appointment) => ({
      ...appointment,
      PatientDocuments: normalizeDocuments(appointment.PatientDocuments),
    }));

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
      return;
    }

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
      setAvailabilityFeedback({ type: 'error', message: err.message || 'Failed to load availability schedule.' });
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
      const normalizedAppointments = Array.isArray(appointmentData) ? normalizeAppointments(appointmentData) : [];

      setDoctorProfile(profileData);
      setAppointments(normalizedAppointments);
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
      const normalizedAppointments = Array.isArray(data) ? normalizeAppointments(data) : [];
      setAppointments(normalizedAppointments);
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
      [...appointments].sort(
        (a, b) => new Date(`${b.ScheduleDate}T${b.StartTime}`) - new Date(`${a.ScheduleDate}T${a.StartTime}`)
      ),
    [appointments]
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
            const response = await fetch(`${apiBaseUrl}/api/doctors/${doctorId}/availability/${slotId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth.token}`,
              },
              body: JSON.stringify({ isAvailable: true }),
            });

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

  const handleReportFieldChange = (event) => {
    const { name, value, files } = event.target;
    if (name === 'file') {
      setReportForm((prev) => ({ ...prev, file: files?.[0] || null }));
    } else {
      setReportForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectReportAppointment = (appointmentId) => {
    setReportForm((prev) => ({
      ...prev,
      appointmentId: appointmentId || null,
    }));
  };

  const handleViewPatientHistory = (patientId) => {
    if (!patientId) {
      return;
    }
    navigate(`patients/${patientId}`);
  };

  const handleReportSubmit = async (event) => {
    event.preventDefault();
    if (!reportForm.appointmentId || !reportForm.title || !reportForm.file) {
      setReportFeedback({ type: 'error', message: 'Appointment, title, and report file are required.' });
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
      setReportForm({ appointmentId: reportForm.appointmentId, title: '', description: '', file: null });
      await refreshAppointments();
    } catch (err) {
      setReportFeedback({ type: 'error', message: err.message || 'Failed to upload report.' });
    }
  };

  const resetReportForm = () => {
    setReportForm({ appointmentId: null, title: '', description: '', file: null });
    setReportFeedback(null);
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
    if (!profileForm) {
      return;
    }

    setProfileFeedback(null);

    try {
      const formData = new FormData();
      formData.append('fullName', profileForm.fullName);
      formData.append('email', profileForm.email);
      formData.append('phoneNumber', profileForm.phoneNumber);
      formData.append('specialization', profileForm.specialization || '');
      if (profileForm.avatarFile) {
        formData.append('avatar', profileForm.avatarFile);
      }

      const response = await fetch(`${apiBaseUrl}/api/doctors/${doctorId}/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to update profile.');
      }

      setProfileFeedback({ type: 'success', message: data.message || 'Profile updated successfully.' });
      if (data.avatarUrl) {
        setProfileForm((prev) => ({ ...prev, avatarUrl: data.avatarUrl, avatarFile: null }));
      } else {
        setProfileForm((prev) => ({ ...prev, avatarFile: null }));
      }
      await fetchDoctorData();
    } catch (err) {
      setProfileFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwordValue) {
      return;
    }

    setPasswordFeedback(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/doctors/${doctorId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ newPassword: passwordValue }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to update password.');
      }

      setPasswordFeedback({ type: 'success', message: data.message || 'Password updated successfully.' });
      setPasswordValue('');
    } catch (err) {
      setPasswordFeedback({ type: 'error', message: err.message || 'Failed to update password.' });
    }
  };

  const handleStartReport = (appointment) => {
    setReportFeedback(null);
    setReportForm({ appointmentId: appointment.AppointmentID, title: '', description: '', file: null });
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-500">
        Loading your portal...
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

  const navLinkClasses = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive
        ? 'bg-brand-primary text-white shadow'
        : 'text-brand-primary hover:bg-brand-primary/10 hover:text-brand-dark'
    }`;

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

      <nav className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-card backdrop-blur">
        <NavLink to="." end className={navLinkClasses}>
          Appointments
        </NavLink>
        <NavLink to="appointments" className={navLinkClasses}>
          Send reports
        </NavLink>
        <NavLink to="availability" className={navLinkClasses}>
          Availability
        </NavLink>
        <NavLink to="profile" className={navLinkClasses}>
          Profile
        </NavLink>
      </nav>

      <Routes>
        <Route
          index
          element={
            <DoctorAppointmentsOverview
              appointments={sortedAppointments}
              statusFeedback={statusFeedback}
              onUpdateStatus={handleAppointmentStatus}
              onComposeReport={handleStartReport}
              onViewPatientHistory={handleViewPatientHistory}
            />
          }
        />
        <Route
          path="appointments"
          element={
            <DoctorReportCenter
              appointments={sortedAppointments}
              reportForm={reportForm}
              onReportFieldChange={handleReportFieldChange}
              onReportSubmit={handleReportSubmit}
              onSelectAppointment={handleSelectReportAppointment}
              onReset={resetReportForm}
              feedback={reportFeedback}
            />
          }
        />
        <Route
          path="availability"
          element={
            <DoctorAvailabilityPlanner
              dayOptions={dayOptions}
              planner={availabilityPlanner}
              availabilityFeedback={availabilityFeedback}
              onToggleDay={toggleDaySelection}
              onSelectAllDays={handleSelectAllDays}
              onClearDays={handleClearDays}
              onPlannerFieldChange={handlePlannerFieldChange}
              onCustomTimeToggle={handleCustomTimeToggle}
              onCustomDateChange={handleCustomDateInputChange}
              onAddCustomDate={handleAddCustomDate}
              onRemoveCustomDate={handleRemoveCustomDate}
              onSubmit={handleAvailabilitySubmit}
              startTimeOptions={startTimeOptions}
              endTimeOptions={endTimeOptions}
            />
          }
        />
        <Route
          path="profile"
          element={
            <DoctorProfileSettings
              profileForm={profileForm}
              onProfileChange={handleProfileChange}
              onProfileSubmit={handleProfileSubmit}
              profileFeedback={profileFeedback}
              passwordValue={passwordValue}
              onPasswordChange={(event) => setPasswordValue(event.target.value)}
              onPasswordSubmit={handlePasswordSubmit}
              passwordFeedback={passwordFeedback}
            />
          }
        />
        <Route
          path="patients/:patientId"
          element={<DoctorPatientHistory token={auth.token} doctorId={doctorId} />}
        />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </div>
  );
}

export default StaffPortal;
