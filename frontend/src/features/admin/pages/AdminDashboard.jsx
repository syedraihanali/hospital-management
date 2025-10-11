import React, { useContext, useState } from 'react';
import { AuthContext } from '../../auth/context/AuthContext';
import { useSiteSettings } from '../../../shared/context/SiteSettingsContext';
import OverviewPanel from '../components/OverviewPanel';
import DoctorApplicationsTab from '../components/DoctorApplicationsTab';
import AboutContentTab from '../components/AboutContentTab';
import SiteSettingsTab from '../components/SiteSettingsTab';
import HomeHeroTab from '../components/HomeHeroTab';
import DoctorDirectoryTab from '../components/DoctorDirectoryTab';
import LabReportsTab from '../components/LabReportsTab';
import ServicePackagesTab from '../components/ServicePackagesTab';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'doctor-applications', label: 'Doctor Applications' },
  { id: 'about', label: 'About Page' },
  { id: 'lab-reports', label: 'Lab Reports' },
  { id: 'service-packages', label: 'Service Packages' },
  { id: 'home-hero', label: 'Homepage Hero' },
  { id: 'site-settings', label: 'Site Settings' },
  { id: 'doctor-directory', label: 'Doctor Directory' },
];

function AdminDashboard() {
  const { auth } = useContext(AuthContext);
  const { siteSettings, refreshSiteSettings, setCachedSiteSettings } = useSiteSettings();
  const role = auth.user?.role;
  const [activeTab, setActiveTab] = useState('overview');

  if (role !== 'admin') {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center text-red-600">
        Access restricted to administrator accounts.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Manage operations, site content, and patient resources from a single workspace.
        </p>
      </header>

      <nav className="mx-auto flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-soft'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-primary/50 hover:text-brand-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' ? <OverviewPanel token={auth.token} /> : null}
      {activeTab === 'doctor-applications' ? <DoctorApplicationsTab token={auth.token} /> : null}
      {activeTab === 'about' ? <AboutContentTab token={auth.token} /> : null}
      {activeTab === 'lab-reports' ? <LabReportsTab token={auth.token} /> : null}
      {activeTab === 'home-hero' ? <HomeHeroTab token={auth.token} /> : null}
      {activeTab === 'service-packages' ? <ServicePackagesTab token={auth.token} /> : null}
      {activeTab === 'site-settings' ? (
        <SiteSettingsTab
          token={auth.token}
          siteSettings={siteSettings}
          refreshSiteSettings={refreshSiteSettings}
          setCachedSiteSettings={setCachedSiteSettings}
        />
      ) : null}
      {activeTab === 'doctor-directory' ? <DoctorDirectoryTab token={auth.token} /> : null}
    </div>
  );
}

export default AdminDashboard;
