import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HomeFooter from '../components/home/HomeFooter';

const specialties = [
  {
    name: 'Cardiology',
    doctors: [
      { name: 'Dr. Ainsley Morgan', location: 'Green Valley Heart Center', nextAvailability: 'Tomorrow · 9:30 AM' },
      { name: 'Dr. Naveen Patel', location: 'Heart & Vascular Pavilion', nextAvailability: 'Thu · 2:00 PM' },
    ],
  },
  {
    name: 'Neurology',
    doctors: [
      { name: 'Dr. Lila Thompson', location: 'Summit Neurology Clinic', nextAvailability: 'Today · 4:00 PM' },
      { name: 'Dr. Emmett Ruiz', location: 'NeuroWell Institute', nextAvailability: 'Fri · 10:15 AM' },
    ],
  },
  {
    name: 'Pediatrics',
    doctors: [
      { name: 'Dr. Hana Ibrahim', location: 'Sunrise Pediatrics', nextAvailability: 'Tomorrow · 11:45 AM' },
      { name: 'Dr. Quinn Reynolds', location: 'Evergreen Family Practice', nextAvailability: 'Mon · 8:50 AM' },
    ],
  },
  {
    name: 'Orthopedics',
    doctors: [
      { name: 'Dr. Mateo Chen', location: 'Motion Plus Orthopedics', nextAvailability: 'Wed · 1:30 PM' },
      { name: 'Dr. Kylie Anders', location: 'Joint Care Alliance', nextAvailability: 'Fri · 3:20 PM' },
    ],
  },
];

const appointmentTimes = [
  '08:00 AM',
  '08:45 AM',
  '09:30 AM',
  '10:15 AM',
  '11:00 AM',
  '01:30 PM',
  '02:15 PM',
  '03:00 PM',
  '04:30 PM',
];

const testimonials = [
  {
    quote:
      'Booking my cardiology visits takes less than a minute. Destination Health keeps every report ready for my specialists.',
    name: 'Sierra Lawson',
    role: 'Patient Partner',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=160&h=160&q=80',
  },
  {
    quote:
      'Our clinic loves the seamless scheduling tools. The emergency escalation pathway has genuinely saved lives.',
    name: 'Dr. Priya Menon',
    role: 'Cardiology Lead, Summit Health',
    avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=facearea&w=160&h=160&q=80',
  },
  {
    quote:
      'Patients can self-serve and our care team monitors everything in real time. It feels modern, safe, and compassionate.',
    name: 'Jordan Blake',
    role: 'Nursing Director',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb468fb9f89?auto=format&fit=facearea&w=160&h=160&q=80',
  },
];

const formatDateInput = (date) => date.toISOString().split('T')[0];

const formatReadableDate = (value) => {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return value;
  }
};

function HomePage() {
  const today = useMemo(() => formatDateInput(new Date()), []);
  const [selectedSpecialty, setSelectedSpecialty] = useState(specialties[0].name);
  const [selectedDoctor, setSelectedDoctor] = useState(specialties[0].doctors[0].name);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState(appointmentTimes[2]);
  const [confirmation, setConfirmation] = useState('');

  const doctorsForSpecialty = useMemo(() => {
    const specialty = specialties.find((item) => item.name === selectedSpecialty);
    return specialty ? specialty.doctors : [];
  }, [selectedSpecialty]);

  const activeDoctorDetails = useMemo(
    () => doctorsForSpecialty.find((doctor) => doctor.name === selectedDoctor) || doctorsForSpecialty[0],
    [doctorsForSpecialty, selectedDoctor],
  );

  const handleSpecialtyChange = (event) => {
    const value = event.target.value;
    setSelectedSpecialty(value);
    const specialty = specialties.find((item) => item.name === value);
    if (specialty && specialty.doctors.length) {
      setSelectedDoctor(specialty.doctors[0].name);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setConfirmation(
      `Appointment request saved for ${selectedDoctor} on ${formatReadableDate(selectedDate)} at ${selectedTime}. Our care team will confirm shortly.`,
    );
    setTimeout(() => setConfirmation(''), 6000);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <section className="relative mt-6 rounded-[40px] border border-white/60 bg-white/70 p-8 shadow-glass backdrop-blur-2xl sm:p-12">
        <div className="pointer-events-none absolute inset-0 rounded-[40px] bg-gradient-to-br from-brand-primary/15 via-transparent to-brand-secondary mix-blend-screen" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="text-center text-3xl font-semibold text-brand-dark sm:text-4xl">Book an appointment</h1>
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Speciality
                <select
                  value={selectedSpecialty}
                  onChange={handleSpecialtyChange}
                  className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-base text-brand-dark shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                >
                  {specialties.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Doctor
                <select
                  value={selectedDoctor}
                  onChange={(event) => setSelectedDoctor(event.target.value)}
                  className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-base text-brand-dark shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                >
                  {doctorsForSpecialty.map((doctor) => (
                    <option key={doctor.name} value={doctor.name}>
                      {doctor.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Date
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-base text-brand-dark shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Time
                <select
                  value={selectedTime}
                  onChange={(event) => setSelectedTime(event.target.value)}
                  className="w-full rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-base text-brand-dark shadow-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                >
                  {appointmentTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {activeDoctorDetails && (
              <div className="grid gap-4 rounded-3xl border border-brand-primary/20 bg-brand-secondary/60 p-6 text-sm text-brand-dark shadow-soft sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-brand-dark">{activeDoctorDetails.name}</p>
                  <p className="mt-1 text-slate-600">{activeDoctorDetails.location}</p>
                </div>
                <div className="flex items-center justify-start sm:justify-end">
                  <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand-dark">
                    Next availability · {activeDoctorDetails.nextAvailability}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-brand-primary px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Reserve appointment
            </button>

            {confirmation && (
              <p className="rounded-2xl border border-brand-primary/30 bg-white/70 px-4 py-3 text-center text-sm text-brand-dark shadow-soft">
                {confirmation}
              </p>
            )}
          </form>
        </div>
      </section>

      <section className="mt-16 rounded-[36px] border border-brand-primary/30 bg-gradient-to-br from-brand-primary to-brand-dark p-10 text-white shadow-glass">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm uppercase tracking-[0.35em] text-white/70">Need emergency medical care?</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Our rapid response clinicians are one tap away</h2>
            <p className="text-white/80">
              Call our emergency coordination desk for immediate triage and ambulance dispatch across our hospital network.
            </p>
            <div className="flex flex-col gap-2 text-white/80 sm:flex-row sm:items-center sm:gap-6">
              <span className="text-lg font-semibold tracking-wide">24/7 hotline: <a className="underline-offset-4 hover:underline" href="tel:1800123456">1-800-123-456</a></span>
              <span>emergency@destinationhealth.com</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="tel:1800123456"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-brand-dark shadow-soft transition hover:bg-brand-secondary/90"
            >
              Call now
            </a>
            <Link
              to="/about-us"
              className="inline-flex items-center justify-center rounded-full border border-white/60 bg-transparent px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-white/10"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16 space-y-8">
        <div className="flex flex-col gap-2 text-center">
          <span className="mx-auto inline-flex items-center rounded-full bg-brand-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
            Trusted voices
          </span>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">What our patients and partners say</h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
            Stories from the people who rely on Destination Health for fast booking, compassionate care, and secure records.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.name} className="flex flex-col gap-5 rounded-3xl border border-white/60 bg-white/80 p-6 text-left shadow-soft backdrop-blur">
              <p className="text-sm leading-relaxed text-slate-600">“{item.quote}”</p>
              <div className="flex items-center gap-3">
                <img src={item.avatar} alt={item.name} className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-20">
        <HomeFooter />
      </div>
    </div>
  );
}

export default HomePage;
