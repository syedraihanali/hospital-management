import React from 'react';
import PropTypes from 'prop-types';

function DoctorAvailabilityPlanner({
  dayOptions,
  planner,
  availabilityFeedback,
  onToggleDay,
  onSelectAllDays,
  onClearDays,
  onPlannerFieldChange,
  onCustomTimeToggle,
  onCustomDateChange,
  onAddCustomDate,
  onRemoveCustomDate,
  onSubmit,
  startTimeOptions,
  endTimeOptions,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-brand-primary">Plan your availability</h2>
          <p className="mt-1 text-xs text-slate-500">
            Select weekly days or custom dates, then choose the hours you are available for appointments.
          </p>
        </div>
      </div>
      {availabilityFeedback ? (
        <div
          className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
            availabilityFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {availabilityFeedback.message}
        </div>
      ) : null}
      <form className="mt-4 space-y-5" onSubmit={onSubmit}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Days of the week</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dayOptions.map((day) => {
              const isSelected = planner.selectedDays.includes(day.value);
              return (
                <button
                  type="button"
                  key={day.value}
                  onClick={() => onToggleDay(day.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/15 text-brand-dark shadow-sm'
                      : 'border-slate-300 text-slate-600 hover:border-brand-primary hover:text-brand-dark'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onSelectAllDays}
              className="rounded-full border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={onClearDays}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
            >
              Clear
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom dates</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="date"
              value={planner.customDateInput}
              onChange={onCustomDateChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent sm:max-w-xs"
            />
            <button
              type="button"
              onClick={onAddCustomDate}
              className="inline-flex items-center justify-center rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
            >
              Add date
            </button>
          </div>
          {planner.customDates.length ? (
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              {planner.customDates.map((date) => (
                <li
                  key={date}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                >
                  <span>
                    {new Date(`${date}T00:00`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveCustomDate(date)}
                    className="text-slate-400 transition hover:text-rose-500"
                    aria-label={`Remove ${date}`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-400">Optional: select specific dates outside your weekly routine.</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-xs font-semibold text-slate-600">
            Start time
            {planner.useCustomTime ? (
              <input
                type="time"
                name="customStartTime"
                value={planner.customStartTime || planner.startTime}
                onChange={onPlannerFieldChange}
                required
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            ) : (
              <select
                name="startTime"
                value={planner.startTime}
                onChange={onPlannerFieldChange}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                {startTimeOptions.map((time) => (
                  <option key={time} value={time}>
                    {new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="flex flex-col text-xs font-semibold text-slate-600">
            End time
            {planner.useCustomTime ? (
              <input
                type="time"
                name="customEndTime"
                value={planner.customEndTime || planner.endTime}
                onChange={onPlannerFieldChange}
                required
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
            ) : (
              <select
                name="endTime"
                value={planner.endTime}
                onChange={onPlannerFieldChange}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                {endTimeOptions.map((time) => (
                  <option key={time} value={time}>
                    {new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </option>
                ))}
              </select>
            )}
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={planner.useCustomTime}
            onChange={onCustomTimeToggle}
            className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
          />
          Use custom time inputs (for non-hourly schedules)
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
        >
          Save availability
        </button>
      </form>
    </section>
  );
}

DoctorAvailabilityPlanner.propTypes = {
  dayOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  planner: PropTypes.shape({
    selectedDays: PropTypes.arrayOf(PropTypes.number).isRequired,
    customDates: PropTypes.arrayOf(PropTypes.string).isRequired,
    customDateInput: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    useCustomTime: PropTypes.bool.isRequired,
    customStartTime: PropTypes.string,
    customEndTime: PropTypes.string,
  }).isRequired,
  availabilityFeedback: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired,
  }),
  onToggleDay: PropTypes.func.isRequired,
  onSelectAllDays: PropTypes.func.isRequired,
  onClearDays: PropTypes.func.isRequired,
  onPlannerFieldChange: PropTypes.func.isRequired,
  onCustomTimeToggle: PropTypes.func.isRequired,
  onCustomDateChange: PropTypes.func.isRequired,
  onAddCustomDate: PropTypes.func.isRequired,
  onRemoveCustomDate: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  startTimeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  endTimeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

DoctorAvailabilityPlanner.defaultProps = {
  availabilityFeedback: null,
};

export default DoctorAvailabilityPlanner;
