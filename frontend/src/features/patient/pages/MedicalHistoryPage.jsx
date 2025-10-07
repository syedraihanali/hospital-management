import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaFileMedical, FaNotesMedical, FaPrescriptionBottle, FaUserShield } from 'react-icons/fa';

function MedicalHistoryPage() {
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
  const [nidInput, setNidInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctorReports, setDoctorReports] = useState([]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedNid = nidInput.trim();

    if (!trimmedNid) {
      setError('Enter a valid NID number to continue.');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/patient-access/medical-history?nid=${encodeURIComponent(trimmedNid)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load medical history for this NID number.');
      }

      setPatient(data.patient);
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
      setDoctorReports(Array.isArray(data.doctorReports) ? data.doctorReports : []);
      setStatus('succeeded');
    } catch (err) {
      setStatus('failed');
      setPatient(null);
      setDocuments([]);
      setPrescriptions([]);
      setDoctorReports([]);
      setError(err.message || 'Something went wrong while looking up medical history.');
    }
  };

  const resetSearch = () => {
    setPatient(null);
    setDocuments([]);
    setPrescriptions([]);
    setDoctorReports([]);
    setError('');
    setStatus('idle');
  };

  const hasRecords = useMemo(
    () => documents.length > 0 || prescriptions.length > 0 || doctorReports.length > 0,
    [documents, prescriptions, doctorReports]
  );

  const formatDate = (value) => {
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
              <FaUserShield aria-hidden="true" /> Secure access
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Verify medical history with your NID</h1>
            <p className="text-base text-slate-600">
              Enter the national identification number linked to the patient to review uploaded lab reports, prescriptions, and doctor summaries in one place.
            </p>
          </div>
          <form className="flex w-full max-w-md flex-col gap-3" onSubmit={handleSubmit}>
            <label className="text-sm font-semibold text-slate-700" htmlFor="medical-history-nid">
              National ID number
            </label>
            <input
              id="medical-history-nid"
              type="text"
              value={nidInput}
              onChange={(event) => setNidInput(event.target.value)}
              placeholder="Enter patient NID"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Checking...' : 'Show medical history'}
            </button>
            {error ? (
              <p className="text-sm font-medium text-rose-600">{error}</p>
            ) : null}
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
                <div>
                  <dt className="font-semibold text-slate-700">Email</dt>
                  <dd>{patient.email || '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <button
                type="button"
                onClick={resetSearch}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Search another patient
              </button>
              <Link
                to="/reports"
                className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
              >
                Go to Get Reports
              </Link>
            </div>
          </div>

          {!hasRecords && status === 'succeeded' ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
              No medical history was found for this patient yet. Upload documents from the patient dashboard or ask your care team to share reports.
            </div>
          ) : null}

          {documents.length ? (
            <article className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card">
              <header className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-secondary text-brand-primary">
                  <FaFileMedical aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Uploaded documents</h3>
                  <p className="text-sm text-slate-600">Lab slips, imaging results, referrals, and other supporting files.</p>
                </div>
              </header>
              <ul className="grid gap-3">
                {documents.map((doc) => (
                  <li
                    key={doc.DocumentID}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{doc.DocumentName}</p>
                      <p className="text-xs text-slate-500">Uploaded {formatDate(doc.UploadedAt)}</p>
                    </div>
                    <a
                      href={doc.FileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                    >
                      View document
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {prescriptions.length ? (
            <article className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card">
              <header className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <FaPrescriptionBottle aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Prescriptions</h3>
                  <p className="text-sm text-slate-600">Medication instructions and pharmacy-ready documents shared with the patient.</p>
                </div>
              </header>
              <ul className="grid gap-3">
                {prescriptions.map((doc) => (
                  <li
                    key={`prescription-${doc.DocumentID}`}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{doc.DocumentName}</p>
                      <p className="text-xs text-slate-500">Uploaded {formatDate(doc.UploadedAt)}</p>
                    </div>
                    <a
                      href={doc.FileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                    >
                      View prescription
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {doctorReports.length ? (
            <article className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card">
              <header className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <FaNotesMedical aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Doctor reports</h3>
                  <p className="text-sm text-slate-600">Summary notes and diagnostic impressions provided after consultations.</p>
                </div>
              </header>
              <ul className="grid gap-3">
                {doctorReports.map((report) => (
                  <li
                    key={report.ReportID}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{report.Title}</p>
                        <p className="text-xs text-slate-500">
                          {report.DoctorName ? `By ${report.DoctorName}` : 'Doctor report'} · {formatDate(report.CreatedAt)}
                        </p>
                      </div>
                      <a
                        href={report.FileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                      >
                        View report
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
        </section>
      ) : null}
    </div>
  );
}

export default MedicalHistoryPage;
