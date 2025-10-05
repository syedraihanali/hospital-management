import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';

function DoctorPatientHistory({ token, doctorId }) {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const apiBaseUrl = useMemo(() => {
    const url = process.env.REACT_APP_API_URL || '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }, []);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!token || !doctorId || !patientId || status !== 'loading') {
      return;
    }

    let isMounted = true;

    const loadHistory = async () => {
      setStatus('loading');
      setError('');
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/doctors/${doctorId}/patients/${patientId}/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.message || 'Unable to load patient history.');
        }

        const data = await response.json();
        if (isMounted) {
          setHistory(data);
          setStatus('succeeded');
        }
      } catch (err) {
        if (isMounted) {
          setStatus('failed');
          setError(err.message || 'Unable to load patient history.');
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, doctorId, patientId, token, status]);

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

  const sortedAppointments = history?.appointments
    ? [...history.appointments].sort(
        (a, b) => new Date(`${b.ScheduleDate}T${b.StartTime}`) - new Date(`${a.ScheduleDate}T${a.StartTime}`)
      )
    : [];

  const documents = Array.isArray(history?.documents) ? history.documents : [];
  const reports = Array.isArray(history?.reports) ? history.reports : [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('../', { replace: false })}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-dark"
          >
            ← Back to appointments
          </button>
          <h2 className="mt-3 text-xl font-semibold text-brand-primary">Patient medical history</h2>
          <p className="text-sm text-slate-600">
            Review appointments, documents, and reports shared with this patient.
          </p>
        </div>
      </div>

      {status === 'loading' ? (
        <div className="mt-8 flex min-h-[12rem] items-center justify-center text-slate-500">
          Loading patient timeline…
        </div>
      ) : null}

      {status === 'failed' ? (
        <div className="mt-8 flex min-h-[12rem] flex-col items-center justify-center gap-3 text-rose-600">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setStatus('loading')}
            className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            Retry
          </button>
        </div>
      ) : null}

      {status === 'succeeded' && history ? (
        <div className="mt-8 space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-brand-primary">{history.patient.FullName}</h3>
            <dl className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="font-semibold text-slate-500">Email:</dt>
                <dd>{history.patient.Email || 'Not provided'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-semibold text-slate-500">Phone:</dt>
                <dd>{history.patient.PhoneNumber || 'Not provided'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-semibold text-slate-500">Gender:</dt>
                <dd>{history.patient.Gender || 'Not provided'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-semibold text-slate-500">NID:</dt>
                <dd>{history.patient.NidNumber || 'Not provided'}</dd>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <dt className="font-semibold text-slate-500">Address:</dt>
                <dd>{history.patient.Address || 'Not provided'}</dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-brand-primary">Appointment timeline</h3>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                {sortedAppointments.length ? (
                  sortedAppointments.map((appointment) => (
                    <li key={appointment.AppointmentID} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-brand-dark">
                          {formatSchedule(appointment)} with {appointment.DoctorName}
                        </p>
                        <span className="rounded-full bg-brand-secondary/60 px-3 py-1 text-xs font-semibold text-brand-dark">
                          {appointment.Status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Notes: {appointment.Notes || 'No notes provided.'}</p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-slate-400">
                    No appointments recorded for this patient.
                  </li>
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-brand-primary">Uploaded documents</h4>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  {documents.length ? (
                    documents.map((document) => (
                      <li key={document.DocumentID} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="truncate font-medium" title={document.DocumentName}>
                          {document.DocumentName}
                        </span>
                        <a
                          href={document.FileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded-full border border-brand-primary px-3 py-1 font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                        >
                          View
                        </a>
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-center text-slate-400">
                      No documents uploaded yet.
                    </li>
                  )}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                <h4 className="text-sm font-semibold text-brand-primary">Doctor reports</h4>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  {reports.length ? (
                    reports.map((report) => (
                      <li key={report.ReportID} className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <span className="font-semibold text-brand-dark">{report.Title}</span>
                        <span>By {report.DoctorName}</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(report.CreatedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                        {report.FileUrl ? (
                          <a
                            href={report.FileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-max rounded-full border border-brand-primary px-3 py-1 font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                          >
                            View report
                          </a>
                        ) : null}
                        {report.Description ? <p className="text-[11px] text-slate-500">{report.Description}</p> : null}
                      </li>
                    ))
                  ) : (
                    <li className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-center text-slate-400">
                      No reports submitted yet.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

DoctorPatientHistory.propTypes = {
  token: PropTypes.string,
  doctorId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

DoctorPatientHistory.defaultProps = {
  token: '',
  doctorId: null,
};

export default DoctorPatientHistory;
