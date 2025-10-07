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
            Select the days you are available each week and we&apos;ll automatically schedule the upcoming weeks for you.
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

        <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Planning horizon</p>
            <p className="mt-1 text-xs text-slate-400">
              We&apos;ll duplicate your selected weekdays for the upcoming weeks so patients can book recurring slots.
            </p>
          </div>
          <label className="flex flex-col text-xs font-semibold text-slate-600">
            Generate availability for
            <select
              name="weeksToGenerate"
              value={planner.weeksToGenerate}
              onChange={onPlannerFieldChange}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {[1, 2, 3, 4, 5, 6].map((weeks) => (
                <option key={weeks} value={weeks}>
                  {weeks} week{weeks === 1 ? '' : 's'} ahead
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-slate-500">
          New slots will be added for the next {planner.weeksToGenerate}{' '}
          week{planner.weeksToGenerate === 1 ? '' : 's'} on the selected days.
        </p>

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
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    useCustomTime: PropTypes.bool.isRequired,
    customStartTime: PropTypes.string,
    customEndTime: PropTypes.string,
    weeksToGenerate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
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
  onSubmit: PropTypes.func.isRequired,
  startTimeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  endTimeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
};

DoctorAvailabilityPlanner.defaultProps = {
  availabilityFeedback: null,
};

export default DoctorAvailabilityPlanner;
