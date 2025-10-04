import React from 'react';

function HistoryCard({ history }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <h3 className="text-xl font-semibold text-brand-primary">History</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {history.map((appointment, index) => (
          <li key={index} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="font-semibold text-slate-900">Doctor: {appointment.doctor}</p>
            <p>Date: {appointment.date}</p>
            <p>Time: {appointment.time}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HistoryCard;
