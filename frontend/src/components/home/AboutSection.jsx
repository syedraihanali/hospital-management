import React from 'react';
import { FaHeartbeat, FaLaptopMedical, FaShieldAlt } from 'react-icons/fa';

const highlights = [
  {
    icon: <FaHeartbeat className="text-xl text-brand-primary" />,
    title: 'Personalized care teams',
    description: 'Match with specialists that align with your conditions, preferences, and goals.',
  },
  {
    icon: <FaLaptopMedical className="text-xl text-brand-primary" />,
    title: 'Digital-first experience',
    description: 'Virtual visits, easy messaging, and smart reminders keep you connected to your providers.',
  },
  {
    icon: <FaShieldAlt className="text-xl text-brand-primary" />,
    title: 'Privacy you can trust',
    description: 'Enterprise-grade security ensures your data stays encrypted and protected.',
  },
];

function AboutSection() {
  return (
    <section className="grid gap-10 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-card shadow-blue-100/50 backdrop-blur lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          About Destination Health
        </span>
        <h2 className="text-3xl font-semibold leading-tight text-slate-900">
          We designed a connected care platform for every stage of your health journey.
        </h2>
        <p className="text-base leading-relaxed text-slate-600">
          Destination Health helps you coordinate appointments, share health records, and collaborate with doctors from a single, easy-to-use home base. From everyday checkups to long-term care plans, our tools support better decisions and stronger relationships with your care team.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {highlights.map((item) => (
            <article key={item.title} className="flex gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100/80">
                {item.icon}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="relative flex h-full min-h-[320px] items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-100 via-white to-transparent" />
        <div className="relative grid gap-4">
          <img
            src="https://images.unsplash.com/photo-1580281658629-79a702ba8a4d?auto=format&fit=crop&w=800&q=80"
            alt="Doctor talking to patient with tablet"
            className="h-48 w-64 rounded-3xl object-cover shadow-xl shadow-blue-200/50"
          />
          <img
            src="https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=700&q=80"
            alt="Medical team collaboration"
            className="h-36 w-52 translate-x-12 rounded-3xl object-cover shadow-lg shadow-blue-200/40"
          />
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
