import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';

function DoctorReportCenter({
  appointments,
  reportForm,
  onReportFieldChange,
  onReportSubmit,
  onSelectAppointment,
  onReset,
  feedback,
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const requestedId = searchParams.get('appointmentId');
    if (requestedId) {
      const parsedId = Number.parseInt(requestedId, 10);
      if (!Number.isNaN(parsedId) && parsedId !== reportForm.appointmentId) {
        const appointmentExists = appointments.some((appt) => appt.AppointmentID === parsedId);
        if (appointmentExists) {
          onSelectAppointment(parsedId);
        }
      }
      const updatedParams = new URLSearchParams(searchParams);
      updatedParams.delete('appointmentId');
      setSearchParams(updatedParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

  useEffect(() => {
    if (!reportForm.appointmentId && appointments.length) {
      onSelectAppointment(appointments[0].AppointmentID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, reportForm.appointmentId]);

  const selectedAppointment = appointments.find(
    (appointment) => appointment.AppointmentID === reportForm.appointmentId
  );

  if (!appointments.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
        <h2 className="text-xl font-semibold text-brand-primary">Send prescription or medical report</h2>
        <p className="mt-2 text-sm text-slate-600">
          You need at least one booked appointment before you can share documents with patients.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <h2 className="text-xl font-semibold text-brand-primary">Send prescription or medical report</h2>
      <p className="mt-1 text-sm text-slate-600">
        Choose an appointment, add a note, and upload a PDF or image to share with the patient.
      </p>
      {feedback ? (
        <div
          className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </div>
      ) : null}
      <form className="mt-4 grid gap-4" onSubmit={onReportSubmit}>
        <label className="flex flex-col text-xs font-semibold text-slate-600">
          Select appointment
          <select
            name="appointmentId"
            value={reportForm.appointmentId || ''}
            onChange={(event) => onSelectAppointment(Number.parseInt(event.target.value, 10) || null)}
            required
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="" disabled>
              Choose a patient
            </option>
            {appointments.map((appointment) => (
              <option key={appointment.AppointmentID} value={appointment.AppointmentID}>
                {appointment.PatientName} — {appointment.ScheduleDate} {appointment.StartTime}
              </option>
            ))}
          </select>
        </label>
        {selectedAppointment ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">{selectedAppointment.PatientName}</p>
            <p className="mt-1 text-slate-500">
              Appointment on {selectedAppointment.ScheduleDate} from {selectedAppointment.StartTime} to{' '}
              {selectedAppointment.EndTime}
            </p>
          </div>
        ) : null}
        <label className="flex flex-col text-xs font-semibold text-slate-600">
          Report title
          <input
            type="text"
            name="title"
            value={reportForm.title}
            onChange={onReportFieldChange}
            required
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold text-slate-600">
          Notes for patient (optional)
          <textarea
            name="description"
            value={reportForm.description}
            onChange={onReportFieldChange}
            rows={3}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold text-slate-600">
          Upload PDF or image
          <input
            type="file"
            name="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={onReportFieldChange}
            required
            className="mt-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
          >
            Send to patient
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Clear form
          </button>
        </div>
      </form>
    </section>
  );
}

DoctorReportCenter.propTypes = {
  appointments: PropTypes.arrayOf(
    PropTypes.shape({
      AppointmentID: PropTypes.number.isRequired,
      PatientName: PropTypes.string.isRequired,
      ScheduleDate: PropTypes.string,
      StartTime: PropTypes.string,
      EndTime: PropTypes.string,
    })
  ).isRequired,
  reportForm: PropTypes.shape({
    appointmentId: PropTypes.number,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    file: PropTypes.any,
  }).isRequired,
  onReportFieldChange: PropTypes.func.isRequired,
  onReportSubmit: PropTypes.func.isRequired,
  onSelectAppointment: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  feedback: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired,
  }),
};

DoctorReportCenter.defaultProps = {
  feedback: null,
};

export default DoctorReportCenter;
