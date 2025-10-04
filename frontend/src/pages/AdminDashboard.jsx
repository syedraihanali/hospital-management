import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContext';

function AdminDashboard() {
  const { auth } = useContext(AuthContext);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const role = auth.user?.role;

  useEffect(() => {
    const fetchOverview = async () => {
      if (!auth.token) {
        return;
      }

      if (role !== 'admin') {
        setError('Access restricted to administrator accounts.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/overview`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Unable to load dashboard metrics.');
        }

        const data = await response.json();
        setOverview(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [auth.token, role]);

  const renderMetricCard = (title, value) => (
    <div className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-soft">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-brand-primary">{value}</p>
    </div>
  );

  if (loading) {
    return <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-600">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-red-600">{error}</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">Key metrics and recent activity across Destination Health.</p>
      </header>

      <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
        {renderMetricCard('Total Patients', overview?.metrics?.totalPatients ?? 0)}
        {renderMetricCard('Total Doctors', overview?.metrics?.totalDoctors ?? 0)}
        {renderMetricCard('Appointments Booked', overview?.metrics?.totalAppointments ?? 0)}
        {renderMetricCard('Upcoming Appointments', overview?.metrics?.upcomingAppointments ?? 0)}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
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
          <h2 className="text-xl font-semibold text-brand-primary">Recent Patients</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {overview?.recentPatients?.length ? (
              overview.recentPatients.map((patient) => (
                <li key={patient.PatientID} className="flex flex-col rounded-xl bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-900">{patient.FullName}</span>
                  <span className="text-slate-500">{patient.Email}</span>
                  <span className="text-slate-500">{patient.PhoneNumber}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500">No recent patients found.</li>
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}

export default AdminDashboard;
