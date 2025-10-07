import React from 'react';
import PropTypes from 'prop-types';
import { FaCalendarCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function formatAppointmentDate(date, startTime) {
  if (!date || !startTime) {
    return 'Unknown time';
  }

  try {
    return new Date(`${date}T${startTime}`).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return `${date} ${startTime}`;
  }
}

function DoctorAppointmentsOverview({
  appointments,
  statusFeedback,
  onUpdateStatus,
  onComposeReport,
  onViewPatientHistory,
}) {
  const navigate = useNavigate();

  const handleComposeReport = (appointment) => {
    if (onComposeReport) {
      onComposeReport(appointment);
      navigate(`appointments?appointmentId=${appointment.AppointmentID}`);
    }
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-primary">Upcoming & recent appointments</h2>
        <FaCalendarCheck className="text-brand-primary" aria-hidden="true" />
      </div>
      {statusFeedback ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            statusFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {statusFeedback.message}
        </div>
      ) : null}
      <div className="mt-4 grid gap-3">
        {appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            No appointments booked yet. Add availability to receive bookings.
          </div>
        ) : (
          appointments.map((appointment) => {
            const status = appointment.Status || 'pending';
            const isPending = status === 'pending';
            const isConfirmed = status === 'confirmed';
            const isCompleted = status === 'completed';
            const isCancelled = status === 'cancelled';
            const patientDocuments = Array.isArray(appointment.PatientDocuments)
              ? appointment.PatientDocuments
              : [];
            const paymentAmount = appointment.PaymentAmount;
            const paymentStatus = appointment.PaymentStatus || 'paid';
            const paymentMethod = appointment.PaymentMethod || '';
            const paymentReference = appointment.PaymentReference || '';
            const paymentStatusClass =
              paymentStatus === 'paid'
                ? 'bg-emerald-100 text-emerald-700'
                : paymentStatus === 'refunded'
                ? 'bg-slate-200 text-slate-600'
                : 'bg-amber-100 text-amber-700';
            const paymentAmountLabel =
              typeof paymentAmount === 'number' || (typeof paymentAmount === 'string' && paymentAmount !== '')
                ? Number(paymentAmount).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : null;
            const paymentMethodLabel = paymentMethod
              ? `${paymentMethod.charAt(0).toUpperCase()}${paymentMethod.slice(1)}`
              : 'Not recorded';

            const viewHistory = () => {
              if (onViewPatientHistory) {
                onViewPatientHistory(appointment.PatientID);
              }
            };

            return (
              <article
                key={appointment.AppointmentID}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="space-y-2">
                  <div>
                    <button
                      type="button"
                      onClick={viewHistory}
                      className="text-left text-sm font-semibold text-brand-primary transition hover:text-brand-dark"
                    >
                      {appointment.PatientName}
                    </button>
                    <p className="text-xs text-slate-600">Phone: {appointment.PhoneNumber || 'N/A'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatAppointmentDate(appointment.ScheduleDate, appointment.StartTime)} — {appointment.EndTime}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient uploads
                    </p>
                    {patientDocuments.length ? (
                      <ul className="mt-2 space-y-1 text-xs text-slate-600">
                        {patientDocuments.map((document) => (
                          <li key={document.DocumentID} className="flex items-center justify-between gap-2">
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
                        ))}
                      </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">No medical reports uploaded for this appointment.</p>
                  )}
                </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <p className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Payment
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${paymentStatusClass}`}>
                        {paymentStatus.toUpperCase()}
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-emerald-700">
                      {paymentAmountLabel ? `BDT ${paymentAmountLabel}` : 'Amount pending'} • {paymentMethodLabel}
                    </p>
                    {paymentReference ? (
                      <p className="text-[11px] text-emerald-600">Ref: {paymentReference}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-xs sm:flex-row sm:items-center">
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 font-semibold ${
                      isPending
                        ? 'bg-amber-100 text-amber-700'
                        : isConfirmed
                        ? 'bg-sky-100 text-sky-700'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {status.toUpperCase()}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(appointment.AppointmentID, 'confirmed')}
                          className="rounded-full bg-brand-primary px-3 py-2 font-semibold text-white shadow hover:bg-brand-dark"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(appointment.AppointmentID, 'cancelled')}
                          className="rounded-full border border-rose-300 px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Decline
                        </button>
                      </>
                    ) : null}
                    {isConfirmed ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(appointment.AppointmentID, 'completed')}
                          className="rounded-full bg-emerald-500 px-3 py-2 font-semibold text-white shadow hover:bg-emerald-600"
                        >
                          Mark completed
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(appointment.AppointmentID, 'cancelled')}
                          className="rounded-full border border-rose-300 px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Cancel
                        </button>
                      </>
                    ) : null}
                    {!isCancelled && !isCompleted ? (
                      <button
                        type="button"
                        onClick={() => handleComposeReport(appointment)}
                        className="rounded-full border border-slate-300 px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-100"
                      >
                        Send report
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={viewHistory}
                      className="rounded-full border border-brand-primary/40 px-3 py-2 font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                    >
                      View history
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </article>
  );
}

DoctorAppointmentsOverview.propTypes = {
  appointments: PropTypes.arrayOf(
    PropTypes.shape({
      AppointmentID: PropTypes.number.isRequired,
      PatientName: PropTypes.string.isRequired,
      PhoneNumber: PropTypes.string,
      ScheduleDate: PropTypes.string,
      StartTime: PropTypes.string,
      EndTime: PropTypes.string,
      Status: PropTypes.string,
      PatientDocuments: PropTypes.arrayOf(
        PropTypes.shape({
          DocumentID: PropTypes.number.isRequired,
          DocumentName: PropTypes.string.isRequired,
          FileUrl: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
  statusFeedback: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired,
  }),
  onUpdateStatus: PropTypes.func.isRequired,
  onComposeReport: PropTypes.func,
  onViewPatientHistory: PropTypes.func,
};

DoctorAppointmentsOverview.defaultProps = {
  statusFeedback: null,
  onComposeReport: undefined,
  onViewPatientHistory: undefined,
};

export default DoctorAppointmentsOverview;
