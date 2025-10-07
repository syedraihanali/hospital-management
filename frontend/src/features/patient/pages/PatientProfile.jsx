import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../auth/context/AuthContext';
import { FaCalendarCheck } from 'react-icons/fa';

function PatientProfile() {
  const { auth } = useContext(AuthContext);
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const patientId = auth.user?.id;

  const [profile, setProfile] = useState(null);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState(null);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [docFeedback, setDocFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchProfileAndTimeline = useCallback(async () => {
    if (!patientId || !auth.token) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [profileRes, timelineRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/patients/${patientId}`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }),
        fetch(`${apiBaseUrl}/api/patients/${patientId}/timeline`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }),
      ]);

      if (!profileRes.ok) {
        throw new Error('Unable to load patient profile.');
      }
      if (!timelineRes.ok) {
        throw new Error('Unable to load medical history.');
      }

      const profileData = await profileRes.json();
      const timelineData = await timelineRes.json();
      setProfile(profileData);
      setAppointmentHistory(
        Array.isArray(timelineData.appointments) ? timelineData.appointments : []
      );
      setLabReports(Array.isArray(timelineData.labReports) ? timelineData.labReports : []);
      setProfileForm({
        fullName: profileData.FullName || '',
        phoneNumber: profileData.PhoneNumber || '',
        email: profileData.Email || '',
        address: profileData.Address || '',
        nidNumber: profileData.NidNumber || '',
        avatarUrl: profileData.AvatarUrl || '',
        avatarFile: null,
      });
    } catch (err) {
      setError(err.message || 'Failed to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, auth.token, patientId]);

  const refreshTimeline = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/patients/${patientId}/timeline`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Unable to refresh history.');
      }
      const data = await response.json();
      setAppointmentHistory(Array.isArray(data.appointments) ? data.appointments : []);
      setLabReports(Array.isArray(data.labReports) ? data.labReports : []);
    } catch (err) {
      setError(err.message || 'Failed to refresh history.');
    }
  };

  useEffect(() => {
    fetchProfileAndTimeline();
  }, [fetchProfileAndTimeline]);

  const appointmentEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const entries = (appointmentHistory || []).map((appointment) => {
      const startTime = appointment.StartTime || '00:00';
      const entryDate = new Date(`${appointment.ScheduleDate}T${startTime}`);
      const displayDate = entryDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const timeRange = appointment.EndTime
        ? `${appointment.StartTime || '—'} – ${appointment.EndTime}`
        : appointment.StartTime || '';

      return {
        id: `appointment-${appointment.AppointmentID}`,
        appointmentId: appointment.AppointmentID,
        doctorName: appointment.DoctorName,
        status: appointment.Status || 'pending',
        notes: appointment.Notes || '',
        dateValue: entryDate,
        displayDate,
        timeRange,
      };
    });

    const filtered = normalizedSearch
      ? entries.filter((entry) =>
          [entry.doctorName, entry.status, entry.notes, entry.displayDate]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch))
        )
      : entries;

    return filtered.sort((a, b) =>
      sortOrder === 'asc'
        ? a.dateValue.getTime() - b.dateValue.getTime()
        : b.dateValue.getTime() - a.dateValue.getTime()
    );
  }, [appointmentHistory, searchTerm, sortOrder]);

  const recentLabReports = useMemo(() => {
    return (labReports || [])
      .map((report) => ({
        id: report.LabReportID ?? `lab-${report.Title}`,
        title: report.Title,
        testName: report.TestName || '',
        adminName: report.AdminName || 'Administrator',
        createdAt: report.CreatedAt,
        baseCharge: report.BaseCharge,
        discountAmount: report.DiscountAmount,
        finalCharge: report.FinalCharge,
        packageName: report.PackageName || '',
        description: report.Description || '',
        fileUrl: report.FileUrl,
      }))
      .slice(0, 5);
  }, [labReports]);

  const formatCurrency = (value) => {
    const amount = Number.parseFloat(value ?? 0) || 0;
    return `BDT ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = (value) => {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleProfileInputChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null;
    setProfileForm((prev) => ({ ...prev, avatarFile: file }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileFeedback(null);

    try {
      const payload = new FormData();
      payload.append('fullName', profileForm.fullName);
      payload.append('phoneNumber', profileForm.phoneNumber);
      payload.append('email', profileForm.email);
      payload.append('address', profileForm.address);
      payload.append('nidNumber', profileForm.nidNumber);
      if (profileForm.avatarFile) {
        payload.append('avatar', profileForm.avatarFile);
      }

      const response = await fetch(`${apiBaseUrl}/api/patients/${patientId}/profile`, {
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
      await fetchProfileAndTimeline();
    } catch (err) {
      setProfileFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    }
  };

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    setDocFeedback(null);

    const file = event.target.elements.document?.files?.[0];
    if (!file) {
      setDocFeedback({ type: 'error', message: 'Choose a document to upload.' });
      return;
    }

    try {
      const payload = new FormData();
      payload.append('document', file);

      const response = await fetch(`${apiBaseUrl}/api/patients/${patientId}/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Unable to upload document.');
      }

      event.target.reset();
      setDocFeedback({ type: 'success', message: 'Document uploaded successfully.' });
      await refreshTimeline();
    } catch (err) {
      setDocFeedback({ type: 'error', message: err.message || 'Failed to upload document.' });
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
      const response = await fetch(`${apiBaseUrl}/api/patients/${patientId}/password`, {
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
        Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  if (!profile || !profileForm) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-500">
        No patient data available.
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
              profileForm.fullName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {profile.FullName}</h1>
            <p className="text-sm text-slate-600">Stay on top of appointments, prescriptions, and your medical history.</p>
          </div>
        </div>
        <div className="grid gap-1 text-sm text-slate-600">
          <span>Email: {profile.Email}</span>
          <span>Phone: {profile.PhoneNumber}</span>
          <span>NID: {profile.NidNumber}</span>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <h2 className="text-xl font-semibold text-brand-primary">Update profile</h2>
          {profileFeedback ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                profileFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {profileFeedback.message}
            </div>
          ) : null}
          <form className="mt-4 grid gap-4" onSubmit={handleProfileSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Full name
                <input
                  type="text"
                  name="fullName"
                  value={profileForm.fullName}
                  onChange={handleProfileInputChange}
                  required
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Mobile number
                <input
                  type="tel"
                  name="phoneNumber"
                  value={profileForm.phoneNumber}
                  onChange={handleProfileInputChange}
                  required
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                Email address
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileInputChange}
                  required
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-slate-700">
                National ID
                <input
                  type="text"
                  name="nidNumber"
                  value={profileForm.nidNumber}
                  onChange={handleProfileInputChange}
                  required
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </label>
            </div>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Address
              <input
                type="text"
                name="address"
                value={profileForm.address}
                onChange={handleProfileInputChange}
                required
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Update profile picture
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleAvatarChange}
                className="mt-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow hover:bg-brand-dark"
            >
              Save profile
            </button>
          </form>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <h2 className="text-xl font-semibold text-brand-primary">Account security</h2>
          {passwordFeedback ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                passwordFeedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {passwordFeedback.message}
            </div>
          ) : null}
          <form className="mt-4 grid gap-4" onSubmit={handlePasswordSubmit}>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              New password
              <input
                type="password"
                value={passwordValue}
                onChange={(event) => setPasswordValue(event.target.value)}
                minLength={8}
                required
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-slate-700"
            >
              Change password
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-brand-primary">Upload additional records</h3>
            {docFeedback ? (
              <div
                className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                  docFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {docFeedback.message}
              </div>
            ) : null}
            <form className="mt-3 grid gap-3" onSubmit={handleDocumentUpload}>
              <input
                type="file"
                name="document"
                accept=".pdf,.jpg,.jpeg,.png"
                className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
              >
                Upload document
              </button>
              <p className="text-xs text-slate-500">
                Uploaded files will appear on the{' '}
                <Link to="/medical-history" className="font-semibold text-brand-primary underline">
                  medical history page
                </Link>
                .
              </p>
            </form>
          </div>
        </article>
      </section>

      {recentLabReports.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-brand-primary">Latest lab reports</h2>
              <p className="text-sm text-slate-600">See the most recent diagnostics shared by the admin team.</p>
            </div>
            <Link
              to="/medical-history"
              className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
            >
              Browse all records
            </Link>
          </div>
          <ul className="mt-6 grid gap-4">
            {recentLabReports.map((report) => (
              <li
                key={report.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 text-sm text-slate-700 shadow-sm"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                    <p className="text-xs text-slate-500">
                      {report.testName ? `${report.testName} · ` : ''}
                      Shared {formatDateTime(report.createdAt)} by {report.adminName}
                    </p>
                  </div>
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                  >
                    Download
                  </a>
                </div>
                <div className="grid gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600 sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-slate-700">Base charge</p>
                    <p className="text-sm text-brand-primary">{formatCurrency(report.baseCharge)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Discount</p>
                    <p className="text-sm text-emerald-600">{formatCurrency(report.discountAmount)}</p>
                    {report.packageName ? (
                      <p className="text-[11px] text-slate-500">{report.packageName}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Final payable</p>
                    <p className="text-sm text-brand-dark">{formatCurrency(report.finalCharge)}</p>
                  </div>
                </div>
                {report.description ? (
                  <p className="text-xs text-slate-600">{report.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand-primary">Appointment history</h2>
            <p className="text-sm text-slate-600">
              Search across your confirmed and completed visits. For medical documents and prescriptions, head to the{' '}
              <Link to="/medical-history" className="font-semibold text-brand-primary underline">
                medical history page
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              placeholder="Search by doctor, status, or note"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            <Link
              to="/medical-history"
              className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
            >
              View medical records
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {appointmentEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              No appointments in your history yet. Book a visit to see it appear here.
            </div>
          ) : (
            appointmentEntries.map((entry) => (
              <article
                key={entry.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-full bg-brand-secondary text-brand-primary">
                    <FaCalendarCheck aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Appointment with {entry.doctorName}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status: {entry.status.toUpperCase()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.displayDate}
                      {entry.timeRange ? ` · ${entry.timeRange}` : ''}
                    </p>
                    {entry.notes ? <p className="mt-2 text-xs text-slate-600">{entry.notes}</p> : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default PatientProfile;
