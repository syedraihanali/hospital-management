import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

function DoctorDirectoryTab({ token }) {
  const apiBaseUrl = useMemo(() => {
    const url = process.env.REACT_APP_API_URL || '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }, []);

  const [searchValue, setSearchValue] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [directoryStatus, setDirectoryStatus] = useState('idle');
  const [directoryError, setDirectoryError] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [historyAppointments, setHistoryAppointments] = useState([]);
  const [detailsStatus, setDetailsStatus] = useState('idle');
  const [detailsError, setDetailsError] = useState('');

  const fetchDoctors = async (query = '') => {
    if (!token) {
      return;
    }

    setDirectoryStatus('loading');
    setDirectoryError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/admin/doctors${query ? `?search=${encodeURIComponent(query)}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Unable to load doctor directory.');
      }

      const data = await response.json();
      setDoctors(Array.isArray(data) ? data : []);
      setDirectoryStatus('succeeded');
      if (data.length && !selectedDoctorId) {
        setSelectedDoctorId(data[0].DoctorID);
      }
    } catch (error) {
      setDoctors([]);
      setDirectoryStatus('failed');
      setDirectoryError(error.message || 'Unable to load doctor directory.');
    }
  };

  const fetchDoctorDetails = async (doctorId) => {
    if (!token || !doctorId) {
      return;
    }

    setDetailsStatus('loading');
    setDetailsError('');

    try {
      const [profileRes, upcomingRes, historyRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/doctors/${doctorId}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/admin/doctors/${doctorId}/appointments?scope=upcoming`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBaseUrl}/api/admin/doctors/${doctorId}/appointments?scope=history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!profileRes.ok) {
        throw new Error('Unable to load doctor profile.');
      }
      if (!upcomingRes.ok || !historyRes.ok) {
        throw new Error('Unable to load appointment records.');
      }

      const profileData = await profileRes.json();
      const upcomingData = await upcomingRes.json();
      const historyData = await historyRes.json();

      setSelectedDoctorProfile(profileData);
      setUpcomingAppointments(Array.isArray(upcomingData) ? upcomingData : []);
      setHistoryAppointments(Array.isArray(historyData) ? historyData : []);
      setDetailsStatus('succeeded');
    } catch (error) {
      setDetailsStatus('failed');
      setDetailsError(error.message || 'Unable to load doctor details.');
      setSelectedDoctorProfile(null);
      setUpcomingAppointments([]);
      setHistoryAppointments([]);
    }
  };

  useEffect(() => {
    if (directoryStatus === 'idle' && token) {
      fetchDoctors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directoryStatus, token]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchDoctorDetails(selectedDoctorId);
    } else {
      setSelectedDoctorProfile(null);
      setUpcomingAppointments([]);
      setHistoryAppointments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctorId]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchDoctors(searchValue.trim());
  };

  const formatSchedule = (appointment) => {
    if (!appointment.ScheduleDate || !appointment.StartTime) {
      return 'Unknown schedule';
    }

    try {
      return new Date(`${appointment.ScheduleDate}T${appointment.StartTime}`).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      return `${appointment.ScheduleDate} ${appointment.StartTime}`;
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand-primary">Doctor directory</h2>
          <p className="text-sm text-slate-600">
            Search doctors, review their profiles, and monitor appointment workloads from a single workspace.
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-md gap-2">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by name, email, or specialization"
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          <button
            type="submit"
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
          >
            Search
          </button>
        </form>
      </header>

      {directoryStatus === 'failed' ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {directoryError}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,260px)_1fr]">
        <aside className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-600">Doctors ({doctors.length})</h3>
          <div className="flex flex-col gap-2">
            {directoryStatus === 'loading' ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Loading directory…
              </div>
            ) : null}
            {directoryStatus === 'succeeded' && !doctors.length ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                No doctors match this search.
              </div>
            ) : null}
            {doctors.map((doctor) => {
              const isActive = doctor.DoctorID === selectedDoctorId;
              return (
                <button
                  key={doctor.DoctorID}
                  type="button"
                  onClick={() => setSelectedDoctorId(doctor.DoctorID)}
                  className={`flex flex-col rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    isActive
                      ? 'border-brand-primary bg-brand-secondary/60 text-brand-dark shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand-primary/60 hover:text-brand-primary'
                  }`}
                >
                  <span className="font-semibold">{doctor.FullName}</span>
                  <span className="text-xs text-slate-500">{doctor.Specialization || 'General medicine'}</span>
                  <span className="mt-1 text-xs text-slate-500">
                    Upcoming: {doctor.UpcomingAppointments || 0} · Total appointments: {doctor.TotalAppointments || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-card backdrop-blur">
          {detailsStatus === 'loading' ? (
            <div className="flex min-h-[12rem] items-center justify-center text-slate-500">Loading doctor details…</div>
          ) : null}
          {detailsStatus === 'failed' ? (
            <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-rose-600">
              <span>{detailsError}</span>
              <button
                type="button"
                onClick={() => fetchDoctorDetails(selectedDoctorId)}
                className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                Retry loading
              </button>
            </div>
          ) : null}
          {detailsStatus !== 'loading' && !selectedDoctorProfile ? (
            <div className="flex min-h-[12rem] items-center justify-center text-slate-500">
              Select a doctor to view profile and appointments.
            </div>
          ) : null}
          {detailsStatus === 'succeeded' && selectedDoctorProfile ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-brand-primary">{selectedDoctorProfile.FullName}</h3>
                  <p className="text-sm text-slate-600">{selectedDoctorProfile.Specialization || 'General medicine'}</p>
                  <dl className="mt-3 grid gap-2 text-xs text-slate-600">
                    <div className="flex gap-2">
                      <dt className="font-semibold text-slate-500">Email:</dt>
                      <dd>{selectedDoctorProfile.Email || 'Not provided'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold text-slate-500">Phone:</dt>
                      <dd>{selectedDoctorProfile.PhoneNumber || 'Not provided'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-semibold text-slate-500">Capacity:</dt>
                      <dd>
                        {selectedDoctorProfile.CurrentPatientNumber || 0} /{' '}
                        {selectedDoctorProfile.MaxPatientNumber || 0} active patients
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl border border-brand-primary/20 bg-white px-4 py-3 text-xs text-slate-600 shadow-inner">
                  <p className="font-semibold uppercase tracking-wide text-brand-primary">Snapshot</p>
                  <ul className="mt-2 space-y-1">
                    <li>Total appointments: {selectedDoctorProfile.TotalAppointments || 0}</li>
                    <li>Upcoming appointments: {upcomingAppointments.length}</li>
                    <li>Past appointments: {historyAppointments.length}</li>
                  </ul>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-brand-primary">Upcoming appointments</h4>
                  <ul className="mt-3 space-y-3 text-xs text-slate-600">
                    {upcomingAppointments.length ? (
                      upcomingAppointments.map((appointment) => (
                        <li key={appointment.AppointmentID} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="font-semibold text-brand-dark">{appointment.PatientName}</p>
                          <p>{formatSchedule(appointment)}</p>
                          <p>Status: {appointment.Status?.toUpperCase() || 'PENDING'}</p>
                          <p>Notes: {appointment.Notes || '—'}</p>
                        </li>
                      ))
                    ) : (
                      <li className="rounded-2xl border border-dashed border-slate-200 p-3 text-center text-slate-400">
                        No upcoming appointments.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                  <h4 className="text-sm font-semibold text-brand-primary">Appointment history</h4>
                  <ul className="mt-3 space-y-3 text-xs text-slate-600">
                    {historyAppointments.length ? (
                      historyAppointments.map((appointment) => (
                        <li key={appointment.AppointmentID} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="font-semibold text-brand-dark">{appointment.PatientName}</p>
                          <p>{formatSchedule(appointment)}</p>
                          <p>Status: {appointment.Status?.toUpperCase() || 'PENDING'}</p>
                          <p>Notes: {appointment.Notes || '—'}</p>
                        </li>
                      ))
                    ) : (
                      <li className="rounded-2xl border border-dashed border-slate-200 p-3 text-center text-slate-400">
                        No historical appointments found.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}

DoctorDirectoryTab.propTypes = {
  token: PropTypes.string,
};

DoctorDirectoryTab.defaultProps = {
  token: '',
};

export default DoctorDirectoryTab;
