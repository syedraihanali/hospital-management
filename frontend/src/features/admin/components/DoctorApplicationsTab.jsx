import React, { useCallback, useEffect, useMemo, useState } from 'react';

const apiBaseUrl = process.env.REACT_APP_API_URL;

const statusFilters = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

function DoctorApplicationsTab({ token }) {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [reviewingId, setReviewingId] = useState(null);

  const normalizedFilter = useMemo(() => filter || 'pending', [filter]);

  const fetchApplications = useCallback(
    async (selectedStatus = normalizedFilter) => {
      if (!token) {
        return;
      }

      setStatus('loading');
      setError('');
      setFeedback(null);

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/admin/doctor-applications?status=${selectedStatus}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Unable to load doctor applications.');
        }

        const data = await response.json();
        setApplications(Array.isArray(data) ? data : []);
        setStatus('succeeded');
      } catch (err) {
        setError(err.message || 'Failed to load applications.');
        setStatus('failed');
      }
    },
    [normalizedFilter, token],
  );

  useEffect(() => {
    if (status === 'idle' && token) {
      fetchApplications(normalizedFilter);
    }
  }, [fetchApplications, normalizedFilter, status, token]);

  useEffect(() => {
    if (status !== 'idle' && token) {
      fetchApplications(normalizedFilter);
    }
  }, [fetchApplications, normalizedFilter, token]);

  const handleReview = async (applicationId, nextStatus) => {
    if (!token) {
      return;
    }

    setFeedback(null);
    setReviewingId(applicationId);

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/doctor-applications/${applicationId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Unable to update application.');
      }

      setFeedback({
        type: 'success',
        message:
          nextStatus === 'approved'
            ? 'Application approved and doctor account created.'
            : 'Application rejected successfully.',
      });
      await fetchApplications(normalizedFilter);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update application.' });
    } finally {
      setReviewingId(null);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-slate-600">
        Sign in as an administrator to review doctor applications.
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[12rem] items-center justify-center text-slate-600">
        Loading doctor applications...
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-red-600">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => fetchApplications(normalizedFilter)}
          className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-brand-dark"
        >
          Retry loading applications
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand-primary">Doctor onboarding</h2>
          <p className="text-sm text-slate-600">
            Review applications from clinicians and approve or reject their access to the portal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter by status</label>
          <select
            value={normalizedFilter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            {statusFilters.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-4">
        {applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            No applications found for this status.
          </div>
        ) : (
          applications.map((application) => {
            const submittedDate = application.SubmittedAt ? new Date(application.SubmittedAt) : null;
            const isPending = application.Status === 'pending';
            const documentButtonClasses =
              'inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100';

            return (
              <article key={application.ApplicationID} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{application.FullName}</h3>
                    <p className="text-sm text-slate-600">{application.Specialization}</p>
                    <div className="mt-2 grid gap-1 text-xs text-slate-600">
                      <span>Email: {application.Email}</span>
                      <span>Phone: {application.PhoneNumber}</span>
                      <span>License: {application.LicenseNumber}</span>
                      <span>NID: {application.NidNumber}</span>
                      <span>
                        Submitted:{' '}
                        {submittedDate
                          ? submittedDate.toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-slate-600">
                    <a
                      href={application.LicenseDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={documentButtonClasses}
                    >
                      License document
                    </a>
                    <a
                      href={application.NidDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={documentButtonClasses}
                    >
                      NID document
                    </a>
                    {application.ResumeUrl ? (
                      <a
                        href={application.ResumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={documentButtonClasses}
                      >
                        Resume/CV
                      </a>
                    ) : null}
                    <span
                      className={`mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 font-semibold ${
                        application.Status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : application.Status === 'rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {application.Status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {application.ReviewNotes ? (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Admin notes: {application.ReviewNotes}
                  </p>
                ) : null}

                {isPending ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleReview(application.ApplicationID, 'approved')}
                      disabled={reviewingId === application.ApplicationID}
                      className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {reviewingId === application.ApplicationID ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReview(application.ApplicationID, 'rejected')}
                      disabled={reviewingId === application.ApplicationID}
                      className="inline-flex items-center justify-center rounded-full border border-rose-300 px-5 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      {reviewingId === application.ApplicationID ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                ) : application.Status === 'approved' && application.DoctorID ? (
                  <p className="mt-4 text-xs font-medium text-emerald-600">Doctor account created (ID #{application.DoctorID}).</p>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default DoctorApplicationsTab;
