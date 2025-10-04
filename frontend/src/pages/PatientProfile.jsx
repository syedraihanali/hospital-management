import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';

function PatientProfile() {
  const { auth } = useContext(AuthContext);
  const [patient, setPatient] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const patientResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/patients/${auth.user.id}`, {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });

        if (!patientResponse.ok) {
          throw new Error('Failed to fetch patient data');
        }

        const patientData = await patientResponse.json();
        setPatient(patientData);

        const upcomingResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/api/patients/${auth.user.id}/upcomingAppointments`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          },
        );

        if (!upcomingResponse.ok) {
          throw new Error('Failed to fetch upcoming appointments');
        }

        const upcomingData = await upcomingResponse.json();
        setUpcomingAppointments(upcomingData);

        const historyResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/api/patients/${auth.user.id}/appointmentHistory`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          },
        );

        if (!historyResponse.ok) {
          throw new Error('Failed to fetch appointment history');
        }

        const historyData = await historyResponse.json();
        setAppointmentHistory(historyData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [auth.user.id, auth.token]);

  if (loading) {
    return <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-600">Loading patient data...</div>;
  }

  if (error) {
    return <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-red-600">{error}</div>;
  }

  if (!patient) {
    return <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-slate-600">No patient data available.</div>;
  }

  const tableCellClasses = 'border-b border-slate-200 px-4 py-3 text-sm text-slate-700';

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-12">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Welcome back, {patient.FullName}</h1>
        <h2 className="mt-2 text-lg text-slate-600">Welcome to Destination Health. How can we help you today?</h2>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <h3 className="text-xl font-semibold text-brand-primary">Your Details</h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-start justify-between gap-4">
              <dt className="font-semibold text-slate-900">Full Name</dt>
              <dd>{patient.FullName}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-semibold text-slate-900">Email</dt>
              <dd>{patient.Email}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-semibold text-slate-900">Phone Number</dt>
              <dd>{patient.PhoneNumber}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-semibold text-slate-900">Birth Date</dt>
              <dd>{patient.BirthDate}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-semibold text-slate-900">Address</dt>
              <dd className="text-right">{patient.Address}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="font-semibold text-slate-900">Gender</dt>
              <dd>{patient.Gender}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
          <h3 className="text-xl font-semibold text-brand-primary">Upcoming Appointments</h3>
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
                {upcomingAppointments && upcomingAppointments.length > 0 ? (
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
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
        <h3 className="text-xl font-semibold text-brand-primary">Appointment History</h3>
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
              {appointmentHistory && appointmentHistory.length > 0 ? (
                appointmentHistory.map((appointment) => (
                  <tr key={appointment.AppointmentID} className="odd:bg-white even:bg-slate-50">
                    <td className={tableCellClasses}>{appointment.doctor}</td>
                    <td className={tableCellClasses}>{appointment.date}</td>
                    <td className={tableCellClasses}>{appointment.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-center text-sm text-slate-500" colSpan="3">
                    No appointment history.
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

export default PatientProfile;
