import React from 'react';

function AppointmentCard({ appointments }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-brand-primary">Upcoming Appointments</h3>
        <button
          type="button"
          className="rounded-md bg-brand-primary px-3 py-1 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          Book Now
        </button>
      </div>
      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {appointments.map((appointment, index) => (
          <li key={index} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="font-semibold text-slate-900">Doctor: {appointment.doctor}</p>
            <p>Date: {appointment.date}</p>
            <p>Time: {appointment.startTime} - {appointment.endTime}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AppointmentCard;
