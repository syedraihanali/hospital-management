import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../AuthContext';

function StaffPortal() {
  const { auth } = useContext(AuthContext);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getUpcomingAppointments = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/patients/${auth.user.id}/upcomingAppointments`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error('Unable to load appointments');
        }

        const data = await res.json();
        setUpcomingAppointments(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (auth.user && auth.token) {
      getUpcomingAppointments();
    }
  }, [auth.user, auth.token]);

  const tableCellClasses = 'border-b border-slate-200 px-4 py-3 text-sm text-slate-700';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-12">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Staff Portal</h1>
        <p className="mt-2 text-slate-600">Review upcoming appointments at a glance.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
        <h2 className="text-xl font-semibold text-brand-primary">Upcoming Appointments</h2>
        {error && (
          <div className="mt-4 rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
        )}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-center text-sm text-slate-500" colSpan="3">
                    Loading...
                  </td>
                </tr>
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <tr key={appointment.AppointmentID} className="odd:bg-white even:bg-slate-50">
                    <td className={tableCellClasses}>{appointment.doctor}</td>
                    <td className={tableCellClasses}>{appointment.date}</td>
                    <td className={tableCellClasses}>{`${appointment.startTime} - ${appointment.endTime}`}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-center text-sm text-slate-500" colSpan="3">
                    No upcoming appointments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default StaffPortal;
