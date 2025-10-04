import React from 'react';

const sections = [
  {
    title: 'What is the Doctor’s Portal?',
    content:
      'The Doctor’s Portal is a modern healthcare management system that makes healthcare more accessible and organized. It allows patients to easily register, choose their family doctor, book appointments online, and manage their health records — all in one secure place.',
  },
  {
    title: 'Key Features',
    list: [
      { heading: 'Patient Registration', text: 'New patients can sign up quickly and securely.' },
      { heading: 'Doctor Management', text: 'Each patient is assigned to a family doctor with a maximum patient capacity.' },
      { heading: 'Appointment Booking', text: 'Patients can view available time slots and book appointments instantly.' },
      { heading: 'Upcoming Appointments', text: 'Patients can view their upcoming visits in an organized schedule.' },
      { heading: 'Appointment History', text: 'Past consultations are recorded for reference and follow-ups.' },
      { heading: 'Secure Authentication', text: 'Encrypted login ensures data privacy and security.' },
    ],
  },
  {
    title: 'Our Mission',
    content:
      'We aim to simplify healthcare management by reducing wait times, removing paperwork, and providing patients with an easy-to-use digital system for booking and managing their appointments. At the same time, we empower doctors with tools to organize their schedules and manage patient loads efficiently.',
  },
  {
    title: 'Technology Stack',
    list: [
      { heading: 'Frontend', text: 'React.js for a dynamic and user-friendly interface.' },
      { heading: 'Backend', text: 'Node.js + Express.js for APIs and business logic.' },
      { heading: 'Database', text: 'MySQL/MariaDB for secure data storage.' },
      { heading: 'Authentication', text: 'JWT (JSON Web Tokens) with bcrypt for password security.' },
    ],
  },
  {
    title: 'Why Choose Us?',
    content:
      'Healthcare should be simple, fast, and secure. Our Doctor’s Portal bridges the gap between patients and doctors, offering an efficient and reliable way to manage appointments and patient-doctor relationships.',
  },
];

function AboutUs() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-2 text-slate-800">
      <section className="rounded-3xl bg-gradient-to-tr from-brand-primary via-sky-500 to-brand-accent px-6 py-12 text-center text-white shadow-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">About Our Doctor’s Portal</h1>
        <p className="mt-3 text-base text-sky-100 sm:text-lg">
          Connecting patients and doctors with ease and simplicity.
        </p>
      </section>

      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-card backdrop-blur"
        >
          <h2 className="text-xl font-semibold text-brand-primary">
            {section.title}
          </h2>
          {section.content ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">{section.content}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700 sm:text-base">
              {section.list.map((item) => (
                <li key={item.heading} className="flex flex-col gap-1">
                  <span className="font-semibold text-brand-primary">{item.heading}:</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export default AboutUs;
