import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCalendarCheck,
  FaClipboardList,
  FaFileMedical,
  FaInfoCircle,
  FaNotesMedical,
  FaUserCheck,
} from 'react-icons/fa';

function ReportsPage() {
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const [nidInput, setNidInput] = useState('');
  const [lookupStatus, setLookupStatus] = useState('idle');
  const [lookupError, setLookupError] = useState('');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [verifiedNid, setVerifiedNid] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [assetsStatus, setAssetsStatus] = useState('idle');
  const [assetsError, setAssetsError] = useState('');
  const [appointmentAssets, setAppointmentAssets] = useState(null);

  const handleLookup = async (event) => {
    event.preventDefault();
    const trimmedNid = nidInput.trim();

    if (!trimmedNid) {
      setLookupError('Enter a valid NID number to continue.');
      return;
    }

    setLookupStatus('loading');
    setLookupError('');
    setAssetsError('');
    setAppointmentAssets(null);
    setSelectedAppointmentId('');
    setAssetsStatus('idle');

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/patient-access/appointments?nid=${encodeURIComponent(trimmedNid)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to locate appointments for that NID number.');
      }

      setLookupStatus('succeeded');
      setPatient(data.patient);
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      setVerifiedNid(trimmedNid);
    } catch (error) {
      setLookupStatus('failed');
      setPatient(null);
      setAppointments([]);
      setVerifiedNid('');
      setLookupError(error.message || 'Something went wrong while searching for appointments.');
    }
  };

  const handleAppointmentChange = async (event) => {
    const { value } = event.target;
    setSelectedAppointmentId(value);
    setAssetsError('');

    if (!value) {
      setAppointmentAssets(null);
      setAssetsStatus('idle');
      return;
    }

    setAssetsStatus('loading');

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/patient-access/appointments/${value}/assets?nid=${encodeURIComponent(verifiedNid)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load the selected appointment report.');
      }

      setAppointmentAssets(data);
      setAssetsStatus('succeeded');
    } catch (error) {
      setAssetsStatus('failed');
      setAppointmentAssets(null);
      setAssetsError(error.message || 'Something went wrong while fetching the appointment details.');
    }
  };

  const resetLookup = () => {
    setPatient(null);
    setAppointments([]);
    setVerifiedNid('');
    setSelectedAppointmentId('');
    setAppointmentAssets(null);
    setLookupError('');
    setAssetsError('');
    setLookupStatus('idle');
    setAssetsStatus('idle');
  };

  const selectedAppointment = useMemo(() => {
    if (!appointmentAssets?.appointment) {
      return null;
    }
    return appointmentAssets.appointment;
  }, [appointmentAssets]);

  const formatDate = (value) => {
    if (!value) {
      return '—';
    }
    const date = new Date(`${value}`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (value) => {
    if (!value) {
      return '—';
    }
    return value;
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-glass backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
              <FaClipboardList aria-hidden="true" /> Retrieve reports
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Access appointment reports with your NID</h1>
            <p className="text-base text-slate-600">
              Look up any consultation by entering the national identification number on file. Choose an appointment to download doctor notes, prescriptions, and supporting documents.
            </p>
          </div>
          <form className="flex w-full max-w-md flex-col gap-3" onSubmit={handleLookup}>
            <label className="text-sm font-semibold text-slate-700" htmlFor="reports-nid">
              National ID number
            </label>
            <input
              id="reports-nid"
              type="text"
              value={nidInput}
              onChange={(event) => setNidInput(event.target.value)}
              placeholder="Enter patient NID"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
              disabled={lookupStatus === 'loading'}
            >
              {lookupStatus === 'loading' ? 'Searching…' : 'Find appointments'}
            </button>
            {lookupError ? <p className="text-sm font-medium text-rose-600">{lookupError}</p> : null}
          </form>
        </div>
      </section>

      {patient ? (
        <section className="space-y-8">
          <div className="flex flex-col justify-between gap-4 rounded-3xl border border-emerald-100 bg-white/95 p-6 shadow-card sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Patient verified</p>
              <h2 className="mt-1 text-2xl font-semibold text-brand-primary">{patient.fullName}</h2>
              <dl className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-700">NID number</dt>
                  <dd>{patient.nidNumber}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Contact</dt>
                  <dd>{patient.phoneNumber || '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <button
                type="button"
                onClick={resetLookup}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Search another patient
              </button>
              <Link
                to="/medical-history"
                className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
              >
                View medical history
              </Link>
            </div>
          </div>

          <article className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card">
            <header className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-secondary text-brand-primary">
                <FaCalendarCheck aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Select an appointment</h3>
                <p className="text-sm text-slate-600">Choose a visit to load associated doctor notes, prescriptions, and uploads.</p>
              </div>
            </header>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedAppointmentId}
                onChange={handleAppointmentChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent sm:max-w-md"
              >
                <option value="">-- Choose appointment --</option>
                {appointments.map((appointment) => (
                  <option key={appointment.AppointmentID} value={appointment.AppointmentID}>
                    {formatDate(appointment.ScheduleDate)} · {appointment.DoctorName}
                  </option>
                ))}
              </select>
              {appointments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No appointments found yet. Book a consultation first to receive reports.
                </p>
              ) : null}
            </div>
            {assetsError ? <p className="text-sm font-medium text-rose-600">{assetsError}</p> : null}
          </article>

          {assetsStatus === 'loading' ? (
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600 shadow-card">
              Loading appointment details…
            </div>
          ) : null}

          {selectedAppointment && assetsStatus === 'succeeded' ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <article className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card">
                <header className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <FaInfoCircle aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Appointment summary</h3>
                    <p className="text-sm text-slate-600">Review the key details for this visit.</p>
                  </div>
                </header>
                <dl className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-600">Doctor</dt>
                    <dd>{selectedAppointment.DoctorName}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Status</dt>
                    <dd className="capitalize">{selectedAppointment.Status || 'pending'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Date</dt>
                    <dd>{formatDate(selectedAppointment.ScheduleDate)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-600">Time</dt>
                    <dd>
                      {formatTime(selectedAppointment.StartTime)} – {formatTime(selectedAppointment.EndTime)}
                    </dd>
                  </div>
                </dl>
                {selectedAppointment.Notes ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor notes</p>
                    <p className="mt-1 whitespace-pre-line text-sm">{selectedAppointment.Notes}</p>
                  </div>
                ) : null}
              </article>

              <article className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card">
                <header className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-secondary text-brand-primary">
                    <FaFileMedical aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Documents & prescriptions</h3>
                    <p className="text-sm text-slate-600">Files uploaded specifically for this visit.</p>
                  </div>
                </header>
                {appointmentAssets.documents?.length ? (
                  <ul className="grid gap-3 text-sm text-slate-700">
                    {appointmentAssets.documents.map((document) => (
                      <li
                        key={document.DocumentID}
                        className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-1">
                          <p className="font-semibold text-slate-900">{document.DocumentName}</p>
                          <p className="text-xs text-slate-500">Uploaded {formatDateTime(document.UploadedAt)}</p>
                        </div>
                        <a
                          href={document.FileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                        >
                          View document
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No additional documents were shared for this appointment.</p>
                )}
              </article>
            </div>
          ) : null}

          {appointmentAssets?.doctorReports?.length ? (
            <article className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card">
              <header className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <FaNotesMedical aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Doctor reports</h3>
                  <p className="text-sm text-slate-600">Download the official consultation notes prepared by your doctor.</p>
                </div>
              </header>
              <ul className="grid gap-3">
                {appointmentAssets.doctorReports.map((report) => (
                  <li
                    key={report.ReportID}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{report.Title}</p>
                        <p className="text-xs text-slate-500">
                          {report.DoctorName ? `By ${report.DoctorName}` : 'Doctor report'} · {formatDateTime(report.CreatedAt)}
                        </p>
                      </div>
                      <a
                        href={report.FileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                      >
                        Download report
                      </a>
                    </div>
                    {report.Description ? (
                      <p className="text-xs text-slate-600">{report.Description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {appointmentAssets && !appointmentAssets.doctorReports?.length && assetsStatus === 'succeeded' ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
              No doctor reports were attached to this appointment. Contact your provider if you were expecting one.
            </div>
          ) : null}

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-6 text-sm text-emerald-700">
            <p className="flex items-center gap-2 font-semibold">
              <FaUserCheck aria-hidden="true" /> Need older records?
            </p>
            <p className="mt-1 text-sm">
              Visit the <Link to="/medical-history" className="font-semibold text-brand-primary underline">medical history page</Link> to browse every document linked to this NID, including prescriptions and lab results.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ReportsPage;
