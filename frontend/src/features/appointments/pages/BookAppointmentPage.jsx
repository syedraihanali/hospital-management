import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../auth/context/AuthContext';

const normalizeSpecialization = (value) => {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return 'General practice';
  }
  return value.trim();
};

function BookAppointmentPage() {
  const { auth, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState([]);
  const [documentInputKey, setDocumentInputKey] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState('idle');
  const [submissionStatus, setSubmissionStatus] = useState('idle');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    fullName: '',
    birthdate: '',
    gender: '',
    phoneNumber: '',
    nidNumber: '',
    email: '',
    password: '',
    address: '',
    termsAccepted: false,
  });
  const [prefillState, setPrefillState] = useState(location.state || null);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    if (location.state) {
      setPrefillState(location.state);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const loadDoctors = async () => {
      setDoctorsLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/doctors`);
        if (!response.ok) {
          throw new Error('Unable to load doctors.');
        }
        const data = await response.json();
        setDoctors(data);
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load doctors.' });
      } finally {
        setDoctorsLoading(false);
      }
    };

    loadDoctors();
  }, [apiBaseUrl, prefillState]);

  const specializationOptions = useMemo(() => {
    if (!doctors.length) {
      return [];
    }

    const grouped = doctors.reduce((acc, doctor) => {
      const key = normalizeSpecialization(doctor.Specialization);
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key).push(doctor);
      return acc;
    }, new Map());

    return Array.from(grouped.entries())
      .map(([label, docs]) => ({
        label,
        doctors: docs.slice().sort((a, b) => a.FullName.localeCompare(b.FullName)),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [doctors]);

  const doctorsForSpecialization = useMemo(() => {
    const group = specializationOptions.find((item) => item.label === selectedSpecialization);
    return group ? group.doctors : [];
  }, [selectedSpecialization, specializationOptions]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setAvailableTimes([]);
      setUniqueDates([]);
      setSelectedDate('');
      setSelectedSlotId('');
      return;
    }

    const loadAvailability = async () => {
      setAvailabilityStatus('loading');
      setUniqueDates([]);
      setSelectedDate('');
      setSelectedSlotId('');

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/appointments/available-times?doctorId=${selectedDoctorId}`
        );
        if (!response.ok) {
          throw new Error('Unable to load appointment slots.');
        }
        const data = await response.json();
        setAvailableTimes(data);
        const uniqueDateMap = new Map();
        data.forEach((slot) => {
          if (!uniqueDateMap.has(slot.ScheduleDate)) {
            uniqueDateMap.set(slot.ScheduleDate, slot.DayName || '');
          }
        });
        const dates = Array.from(uniqueDateMap.entries())
          .map(([date, dayName]) => ({ date, dayName }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setUniqueDates(dates);
        setAvailabilityStatus('succeeded');
      } catch (error) {
        setAvailableTimes([]);
        setUniqueDates([]);
        setAvailabilityStatus('failed');
        setMessage({ type: 'error', text: error.message || 'Failed to load appointment slots.' });
      }
    };

    loadAvailability();
  }, [apiBaseUrl, selectedDoctorId]);

  useEffect(() => {
    if (prefillState?.notes) {
      setNotes(prefillState.notes);
    }
  }, [prefillState]);

  useEffect(() => {
    if (!doctors.length) {
      setSelectedSpecialization('');
      setSelectedDoctorId('');
      return;
    }

    const targetDoctorId = prefillState?.doctorId ? String(prefillState.doctorId) : '';
    if (targetDoctorId) {
      const matchingDoctor = doctors.find((doctor) => String(doctor.DoctorID) === targetDoctorId);
      if (matchingDoctor) {
        const normalized = normalizeSpecialization(matchingDoctor.Specialization);
        if (
          selectedSpecialization !== normalized ||
          selectedDoctorId !== String(matchingDoctor.DoctorID)
        ) {
          setSelectedSpecialization(normalized);
          setSelectedDoctorId(String(matchingDoctor.DoctorID));
        }
        return;
      }
    }

    if (!selectedSpecialization) {
      const firstOption = specializationOptions[0];
      const firstDoctor = firstOption?.doctors?.[0];
      setSelectedSpecialization(firstOption?.label || '');
      setSelectedDoctorId(firstDoctor ? String(firstDoctor.DoctorID) : '');
    }
  }, [
    doctors,
    prefillState,
    selectedSpecialization,
    selectedDoctorId,
    specializationOptions,
  ]);

  useEffect(() => {
    if (!selectedSpecialization) {
      setSelectedDoctorId('');
      return;
    }

    if (!doctorsForSpecialization.length) {
      setSelectedDoctorId('');
      return;
    }

    const exists = doctorsForSpecialization.some(
      (doctor) => String(doctor.DoctorID) === selectedDoctorId
    );

    if (!exists) {
      const fallback = doctorsForSpecialization[0];
      setSelectedDoctorId(fallback ? String(fallback.DoctorID) : '');
    }
  }, [doctorsForSpecialization, selectedDoctorId, selectedSpecialization]);

  useEffect(() => {
    if (!prefillState?.date) {
      return;
    }
    if (uniqueDates.some((item) => item.date === prefillState.date)) {
      setSelectedDate(prefillState.date);
    }
  }, [prefillState, uniqueDates]);

  useEffect(() => {
    if (!prefillState?.slotId) {
      return;
    }
    const match = availableTimes.find(
      (slot) => String(slot.AvailableTimeID) === String(prefillState.slotId)
    );
    if (match) {
      setSelectedDate(match.ScheduleDate);
      setSelectedSlotId(String(match.AvailableTimeID));
    }
  }, [availableTimes, prefillState]);

  useEffect(() => {
    if (auth.user) {
      setRegistrationData((prev) => ({
        ...prev,
        fullName: auth.user.fullName || auth.user.firstName || prev.fullName,
        email: auth.user.email || prev.email,
      }));
      setShowRegistrationForm(false);
    }
  }, [auth.user]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.DoctorID) === String(selectedDoctorId)) || null,
    [doctors, selectedDoctorId]
  );

  const slotsForSelectedDate = useMemo(
    () => availableTimes.filter((slot) => slot.ScheduleDate === selectedDate),
    [availableTimes, selectedDate]
  );

  const consultationFee = useMemo(() => {
    if (!selectedDoctor || selectedDoctor.ConsultationFee === undefined || selectedDoctor.ConsultationFee === null) {
      return 0;
    }
    const fee = Number.parseFloat(selectedDoctor.ConsultationFee);
    return Number.isNaN(fee) ? 0 : fee;
  }, [selectedDoctor]);

  const formattedConsultationFee = useMemo(
    () =>
      consultationFee.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [consultationFee]
  );

  const paymentReferencePlaceholder = useMemo(() => {
    if (paymentMethod === 'card') {
      return 'Card reference or last 4 digits (optional)';
    }
    if (paymentMethod === 'nagad') {
      return 'Nagad transaction ID';
    }
    return 'bKash transaction ID';
  }, [paymentMethod]);

  const phonePattern = /^(\+?88)?01[3-9]\d{8}$/;

  const validateRegistration = () => {
    const requiredFields = [
      'fullName',
      'birthdate',
      'gender',
      'phoneNumber',
      'nidNumber',
      'email',
      'password',
      'address',
    ];

    const missingField = requiredFields.find((field) => !String(registrationData[field] || '').trim());
    if (missingField) {
      return 'Please complete all required patient information fields.';
    }

    if (registrationData.password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }

    if (!phonePattern.test(registrationData.phoneNumber)) {
      return 'Please provide a valid Bangladeshi mobile number.';
    }

    if (!registrationData.termsAccepted) {
      return 'Please accept the terms of service to continue.';
    }

    return '';
  };

  const handleDoctorChange = (event) => {
    setSelectedDoctorId(event.target.value);
  };

  const handleSpecializationChange = (event) => {
    setSelectedSpecialization(event.target.value);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedSlotId('');
  };

  const handleTimeChange = (event) => {
    setSelectedSlotId(event.target.value);
  };

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
    setPaymentReference('');
  };

  const handleRegistrationChange = (event) => {
    const { name, value, type, checked } = event.target;
    setRegistrationData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDocumentChange = (event) => {
    const files = Array.from(event.target.files || []);
    setDocuments(files);
  };

  const messageStyles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedSlotId) {
      setMessage({ type: 'error', text: 'Select a time slot to continue.' });
      return;
    }

    const normalizedPaymentMethod = paymentMethod.trim().toLowerCase();
    if (!normalizedPaymentMethod) {
      setMessage({ type: 'error', text: 'Choose a payment method to continue.' });
      return;
    }

    const paymentAmountValue = consultationFee;
    const paymentAmountString = paymentAmountValue.toFixed(2);
    const trimmedReference = paymentReference.trim();

    if (['bkash', 'nagad'].includes(normalizedPaymentMethod) && !trimmedReference) {
      setMessage({ type: 'error', text: 'Enter the mobile wallet transaction ID to confirm your payment.' });
      return;
    }

    if (normalizedPaymentMethod === 'card' && trimmedReference && trimmedReference.length < 4) {
      setMessage({
        type: 'error',
        text: 'Provide the last four digits or transaction reference for your card payment.',
      });
      return;
    }

    if (!auth.token) {
      if (!showRegistrationForm) {
        setShowRegistrationForm(true);
        setMessage({
          type: 'info',
          text: 'Complete your patient information so we can create your account and confirm the booking.',
        });
        return;
      }
      const registrationError = validateRegistration();
      if (registrationError) {
        setMessage({ type: 'error', text: registrationError });
        return;
      }
    }

    const formData = new FormData();
    formData.append('availableTimeID', selectedSlotId);
    if (notes.trim()) {
      formData.append('notes', notes.trim());
    }
    formData.append('paymentMethod', normalizedPaymentMethod);
    formData.append('paymentAmount', paymentAmountString);
    formData.append('paymentCurrency', 'BDT');
    if (trimmedReference) {
      formData.append('paymentReference', trimmedReference);
    }
    documents.forEach((file) => {
      formData.append('documents', file);
    });

    if (!auth.token) {
      Object.entries(registrationData).forEach(([key, value]) => {
        if (key === 'termsAccepted') {
          return;
        }
        formData.append(key, value);
      });
    }

    setSubmissionStatus('submitting');
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/appointments/book`, {
        method: 'POST',
        headers: auth.token
          ? {
            Authorization: `Bearer ${auth.token}`,
          }
          : undefined,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Unable to book the appointment.');
      }

      if (data.token && data.user) {
        login(data.token, data.user);
      }

      setSubmissionStatus('succeeded');
      setMessage({
        type: 'success',
        text: data.message || 'Appointment booked successfully! Redirecting to your profile...',
      });
      setDocuments([]);
      setDocumentInputKey((prev) => prev + 1);
      setNotes('');
      setShowRegistrationForm(false);
      setPaymentReference('');
      setTimeout(() => navigate('/myprofile'), 2200);
    } catch (error) {
      setSubmissionStatus('failed');
      setMessage({ type: 'error', text: error.message || 'Failed to book the appointment.' });
    }
  };

  return (
    <div className="bg-slate-50/60 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-card backdrop-blur">
          <h1 className="text-3xl font-semibold text-slate-900">Reserve your visit</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Choose your preferred specialist, pick an available slot, and share any information you would like your care team to review ahead of the appointment.
          </p>
          {message.text ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${messageStyles[message.type] || 'border-slate-200 bg-slate-100 text-slate-700'
                }`}
            >
              {message.text}
            </div>
          ) : null}
        </div>

        <form
          className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-card backdrop-blur">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Specialist
                    <select
                      value={selectedSpecialization}
                      onChange={handleSpecializationChange}
                      disabled={doctorsLoading || !specializationOptions.length}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:cursor-not-allowed"
                    >
                      {doctorsLoading ? (
                        <option value="">Loading specialists…</option>
                      ) : !specializationOptions.length ? (
                        <option value="">No specialists available</option>
                      ) : (
                        specializationOptions.map((option) => (
                          <option key={option.label} value={option.label}>
                            {option.label}
                          </option>
                        ))
                      )}
                    </select>
                  </label>

                  <label className="flex flex-col text-sm font-semibold text-slate-700">
                    Doctor
                    <select
                      value={selectedDoctorId}
                      onChange={handleDoctorChange}
                      disabled={doctorsLoading || !doctorsForSpecialization.length}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:cursor-not-allowed"
                    >
                      {doctorsLoading ? (
                        <option value="">Loading doctors…</option>
                      ) : !doctorsForSpecialization.length ? (
                        <option value="">No doctors available</option>
                      ) : (
                        doctorsForSpecialization.map((doctor) => (
                          <option key={doctor.DoctorID} value={doctor.DoctorID}>
                            {doctor.FullName}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                </div>
                {selectedDoctor ? (
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">
                      {selectedDoctor.Specialization
                        ? `${selectedDoctor.FullName} • ${selectedDoctor.Specialization}`
                        : `${selectedDoctor.FullName} • General consultation`}
                    </span>
                    <span className="mt-1 block text-[11px] text-slate-500">
                      Consultation fee:{' '}
                      <span className="font-semibold text-brand-primary">BDT {formattedConsultationFee}</span>
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="flex flex-col text-sm font-semibold text-slate-700">
                  Appointment date
                  <select
                    value={selectedDate}
                    onChange={handleDateChange}
                    disabled={!uniqueDates.length}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select a date --</option>
                    {uniqueDates.map(({ date, dayName }) => (
                      <option key={date} value={date}>
                        {dayName ? `${dayName} • ` : ''}
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col text-sm font-semibold text-slate-700">
                  Time
                  <select
                    value={selectedSlotId}
                    onChange={handleTimeChange}
                    disabled={!selectedDate || !slotsForSelectedDate.length}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select a time --</option>
                    {slotsForSelectedDate.map((slot) => (
                      <option key={slot.AvailableTimeID} value={slot.AvailableTimeID}>
                        {slot.DayName ? `${slot.DayName} • ` : ''}
                        {slot.StartTime} - {slot.EndTime}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <h3 className="text-sm font-semibold text-emerald-900">Payment details</h3>
                <p className="mt-1 text-xs">
                  Consultation fee:{' '}
                  <span className="font-semibold">BDT {formattedConsultationFee}</span>
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col text-xs font-semibold text-emerald-900">
                    Payment method
                    <select
                      value={paymentMethod}
                      onChange={handlePaymentMethodChange}
                      className="mt-2 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    >
                      <option value="bkash">bKash (Mobile Wallet)</option>
                      <option value="nagad">Nagad (Mobile Wallet)</option>
                      <option value="card">Debit / Credit Card</option>
                    </select>
                  </label>
                  <label className="flex flex-col text-xs font-semibold text-emerald-900">
                    Transaction reference
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(event) => setPaymentReference(event.target.value)}
                      placeholder={paymentReferencePlaceholder}
                      className="mt-2 w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm text-emerald-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    />
                    <span className="mt-1 text-[11px] font-normal text-emerald-700">
                      {paymentMethod === 'card'
                        ? 'Optional: share the last four digits or reference number for your card payment.'
                        : 'Required: enter the mobile wallet transaction ID to verify your payment.'}
                    </span>
                  </label>
                </div>
                <p className="mt-3 text-[11px] text-emerald-700">
                  Payments are processed instantly. You&apos;ll receive an email confirmation once the booking is secured.
                </p>
              </div>

              {availabilityStatus === 'loading' ? (
                <p className="text-sm text-slate-500">Loading the latest availability…</p>
              ) : null}
              {!uniqueDates.length && availabilityStatus === 'succeeded' ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  This doctor has no open slots at the moment. Try another doctor or check back soon.
                </p>
              ) : null}

              <div>
                <label className="flex flex-col text-sm font-semibold text-slate-700">
                  Notes for your care team (optional)
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Share symptoms, ongoing treatments, or goals for this visit."
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </label>
              </div>

              <div>
                <label className="flex flex-col text-sm font-semibold text-slate-700">
                  Recent medical documents (PDF, image, max 10 MB each)
                  <input
                    key={documentInputKey}
                    type="file"
                    multiple
                    onChange={handleDocumentChange}
                    className="mt-2 w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-blue-700"
                  />
                </label>
                {documents.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {documents.map((file) => (
                      <li key={file.name} className="truncate">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    submissionStatus === 'submitting' ||
                    availabilityStatus === 'loading' ||
                    !selectedSlotId
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-primary/30 transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                >
                  {submissionStatus === 'submitting' ? 'Reserving appointment…' : 'Reserve appointment'}
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {auth.token ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 text-sm text-emerald-800 shadow-inner">
                <h2 className="text-base font-semibold text-emerald-900">Booking as</h2>
                <p className="mt-2 font-semibold">{auth.user?.fullName || auth.user?.firstName}</p>
                <p className="text-sm">{auth.user?.email}</p>
                <p className="mt-4 text-xs text-emerald-700">
                  We'll confirm your reservation in your patient portal and notify you via email.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-card">
                <h2 className="text-base font-semibold text-slate-900">New patient information</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Complete the details below to create your patient account while reserving this slot.
                </p>

                {showRegistrationForm ? (
                  <div className="mt-4 space-y-4">
                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Full name
                      <input
                        type="text"
                        name="fullName"
                        value={registrationData.fullName}
                        onChange={handleRegistrationChange}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col text-sm font-semibold text-slate-700">
                        Birthdate
                        <input
                          type="date"
                          name="birthdate"
                          value={registrationData.birthdate}
                          onChange={handleRegistrationChange}
                          required
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                      </label>

                      <label className="flex flex-col text-sm font-semibold text-slate-700">
                        Gender
                        <select
                          name="gender"
                          value={registrationData.gender}
                          onChange={handleRegistrationChange}
                          required
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        >
                          <option value="">-- Select gender --</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </label>
                    </div>

                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Mobile number
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={registrationData.phoneNumber}
                        onChange={handleRegistrationChange}
                        placeholder="e.g. +8801XXXXXXXXX"
                        required
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </label>

                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      National ID (NID)
                      <input
                        type="text"
                        name="nidNumber"
                        value={registrationData.nidNumber}
                        onChange={handleRegistrationChange}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </label>

                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Email
                      <input
                        type="email"
                        name="email"
                        value={registrationData.email}
                        onChange={handleRegistrationChange}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </label>

                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Password
                      <input
                        type="password"
                        name="password"
                        value={registrationData.password}
                        onChange={handleRegistrationChange}
                        required
                        minLength={8}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </label>

                    <label className="flex flex-col text-sm font-semibold text-slate-700">
                      Address
                      <textarea
                        name="address"
                        value={registrationData.address}
                        onChange={handleRegistrationChange}
                        rows={3}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={registrationData.termsAccepted}
                        onChange={handleRegistrationChange}
                        className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-accent"
                      />
                      I agree to the Destination Health terms of service and privacy policy.
                    </label>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRegistrationForm(true)}
                    className="mt-4 inline-flex items-center justify-center rounded-xl border border-brand-primary px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
                  >
                    Enter patient information
                  </button>
                )}
              </div>
            )}
          </section>
        </form>
      </div>
    </div>
  );
}

export default BookAppointmentPage;
