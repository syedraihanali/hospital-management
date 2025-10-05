import React, { useCallback, useEffect, useState } from 'react';

const apiBaseUrl = process.env.REACT_APP_API_URL;

function OverviewPanel({ token }) {
  const [overview, setOverview] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const fetchOverview = useCallback(async () => {
    if (!token) {
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/overview`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load dashboard metrics.');
      }

      const data = await response.json();
      setOverview(data);
      setStatus('succeeded');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while loading metrics.');
      setStatus('failed');
    }
  }, [token]);

  useEffect(() => {
    if (status === 'idle' && token) {
      fetchOverview();
    }
  }, [fetchOverview, status, token]);

  const renderMetricCard = (title, value) => (
    <div className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-soft" key={title}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-primary">{value}</p>
    </div>
  );

  if (!token) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-slate-600">
        Sign in as an administrator to view metrics.
      </div>
    );
  }

  if (status === 'loading') {
    return <div className="flex min-h-[12rem] items-center justify-center text-slate-600">Loading dashboard...</div>;
  }

  if (status === 'failed') {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-red-600">
        <span>{error}</span>
        <button
          type="button"
          onClick={fetchOverview}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-dark"
        >
          Retry loading metrics
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-primary">Hospital performance overview</h2>
        <button
          type="button"
          onClick={fetchOverview}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-primary hover:text-brand-primary"
        >
          Refresh metrics
        </button>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
        {renderMetricCard('Total Patients', overview?.metrics?.totalPatients ?? 0)}
        {renderMetricCard('Total Doctors', overview?.metrics?.totalDoctors ?? 0)}
        {renderMetricCard('Appointments Booked', overview?.metrics?.totalAppointments ?? 0)}
        {renderMetricCard('Upcoming Appointments', overview?.metrics?.upcomingAppointments ?? 0)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <h2 className="text-xl font-semibold text-brand-primary">Most Active Doctors</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {overview?.topDoctors?.length ? (
              overview.topDoctors.map((doctor) => (
                <li key={doctor.DoctorID} className="flex items-center justify-between">
                  <span>{doctor.FullName}</span>
                  <span className="font-semibold text-brand-primary">
                    {doctor.CurrentPatientNumber}/{doctor.MaxPatientNumber}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No doctor data available.</li>
            )}
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <h2 className="text-xl font-semibold text-brand-primary">Upcoming Appointments</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {overview?.upcomingAppointmentsList?.length ? (
              overview.upcomingAppointmentsList.map((appointment) => (
                <li key={appointment.AppointmentID} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-sm font-semibold text-brand-primary">{appointment.PatientName}</span>
                  <span className="text-xs text-slate-500">{appointment.DoctorName}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(appointment.AppointmentDate).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No upcoming appointments available.</li>
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}

export default OverviewPanel;
