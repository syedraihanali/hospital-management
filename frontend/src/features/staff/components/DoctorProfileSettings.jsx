import React from 'react';
import PropTypes from 'prop-types';

function DoctorProfileSettings({
  profileForm,
  onProfileChange,
  onProfileSubmit,
  profileFeedback,
  passwordValue,
  onPasswordChange,
  onPasswordSubmit,
  passwordFeedback,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur">
      <h2 className="text-xl font-semibold text-brand-primary">Profile &amp; security</h2>
      {profileFeedback ? (
        <div
          className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
            profileFeedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {profileFeedback.message}
        </div>
      ) : null}
      <form className="mt-3 grid gap-3" onSubmit={onProfileSubmit}>
        <label className="flex flex-col text-xs font-semibold text-slate-600">
          Full name
          <input
            type="text"
            name="fullName"
            value={profileForm.fullName}
            onChange={onProfileChange}
            required
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold text-slate-600">
          Email address
          <input
            type="email"
            name="email"
            value={profileForm.email}
            onChange={onProfileChange}
            required
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold text-slate-600">
          Phone number
          <input
            type="tel"
            name="phoneNumber"
            value={profileForm.phoneNumber}
            onChange={onProfileChange}
            required
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold text-slate-600">
          Specialization
          <input
            type="text"
            name="specialization"
            value={profileForm.specialization}
            onChange={onProfileChange}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold text-slate-600">
          Profile photo
          <input
            type="file"
            name="avatar"
            accept="image/png,image/jpeg"
            onChange={onProfileChange}
            className="mt-1 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </label>
        <button
          type="submit"
          className="mt-1 inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark"
        >
          Save details
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="text-lg font-semibold text-brand-primary">Change password</h3>
        {passwordFeedback ? (
          <div
            className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
              passwordFeedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {passwordFeedback.message}
          </div>
        ) : null}
        <form className="mt-3 grid gap-3" onSubmit={onPasswordSubmit}>
          <input
            type="password"
            value={passwordValue}
            onChange={onPasswordChange}
            minLength={8}
            placeholder="New password"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-slate-700"
          >
            Update password
          </button>
        </form>
      </div>
    </section>
  );
}

DoctorProfileSettings.propTypes = {
  profileForm: PropTypes.shape({
    fullName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phoneNumber: PropTypes.string.isRequired,
    specialization: PropTypes.string,
    avatarUrl: PropTypes.string,
  }).isRequired,
  onProfileChange: PropTypes.func.isRequired,
  onProfileSubmit: PropTypes.func.isRequired,
  profileFeedback: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired,
  }),
  passwordValue: PropTypes.string.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onPasswordSubmit: PropTypes.func.isRequired,
  passwordFeedback: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'error']).isRequired,
    message: PropTypes.string.isRequired,
  }),
};

DoctorProfileSettings.defaultProps = {
  profileFeedback: null,
  passwordFeedback: null,
};

export default DoctorProfileSettings;
