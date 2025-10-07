import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../features/home/pages/HomePage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import PatientProfile from '../features/patient/pages/PatientProfile';
import SignInPage from '../features/auth/pages/SignInPage';
import SignInLandingPage from '../features/auth/pages/SignInLandingPage';
import Header from '../shared/components/Header';
import BookAppointmentPage from '../features/appointments/pages/BookAppointmentPage';
import StaffPortal from '../features/staff/pages/StaffPortal';
import { AuthContext } from '../features/auth/context/AuthContext';
import AboutUs from '../features/about/pages/AboutUsPage';
import ServicesPage from '../features/services/pages/ServicesPage';
import ReportsPage from '../features/reports/pages/ReportsPage';
import AdminDashboard from '../features/admin/pages/AdminDashboard';
import { SiteSettingsProvider } from '../shared/context/SiteSettingsContext';
import DoctorApplicationPage from '../features/staff/pages/DoctorApplicationPage';
import SupportButtons from '../shared/components/SupportButtons';
import MedicalHistoryPage from '../features/patient/pages/MedicalHistoryPage';
import SpecialistsPage from '../features/specialists/pages/SpecialistsPage';

function App() {
  const { auth } = useContext(AuthContext);
  const getDefaultRoute = (role) => {
    switch (role) {
      case 'doctor':
        return '/staff-portal';
      case 'admin':
        return '/admin';
      case 'patient':
      default:
        return '/myprofile';
    }
  };

  const defaultRedirect = getDefaultRoute(auth.user?.role);
  const isManagementUser = auth.token && ['doctor', 'admin'].includes(auth.user?.role);
  const guardPublicPage = (page) => (isManagementUser ? <Navigate to={defaultRedirect} replace /> : page);

  return (
    <Router>
      <SiteSettingsProvider>
        <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-brand-secondary via-white to-emerald-50">
          <Header />
          <main className="flex-1 px-4 pb-12 pt-28 sm:px-8">
            <Routes>
              <Route path="/" element={guardPublicPage(<HomePage />)} />
              <Route path="/register" element={guardPublicPage(<RegisterPage />)} />
              <Route path="/about-us" element={guardPublicPage(<AboutUs />)} />
              <Route path="/services" element={guardPublicPage(<ServicesPage />)} />
              <Route path="/specialists" element={guardPublicPage(<SpecialistsPage />)} />
              <Route path="/reports" element={guardPublicPage(<ReportsPage />)} />
              <Route path="/apply-as-doctor" element={guardPublicPage(<DoctorApplicationPage />)} />
              <Route
                path="/signin"
                element={!auth.token ? <SignInLandingPage /> : <Navigate to={defaultRedirect} />}
              />
              <Route
                path="/signin/:role"
                element={!auth.token ? <SignInPage /> : <Navigate to={defaultRedirect} />}
              />
              <Route
                path="/book-appointment"
                element={
                  isManagementUser ? <Navigate to={defaultRedirect} replace /> : <BookAppointmentPage />
                }
              />
              <Route path="/medical-history" element={guardPublicPage(<MedicalHistoryPage />)} />
              <Route
                path="/staff-portal/*"
                element={
                  auth.token && auth.user?.role === 'doctor' ? (
                    <StaffPortal />
                  ) : (
                    <Navigate to={auth.token ? defaultRedirect : '/signin/doctor'} />
                  )
                }
              />
              <Route
                path="/myprofile"
                element={
                  auth.token && auth.user?.role === 'patient' ? (
                    <PatientProfile />
                  ) : (
                    <Navigate to={auth.token ? defaultRedirect : '/signin/patient'} />
                  )
                }
              />
              <Route
                path="/admin"
                element={
                  auth.token && auth.user?.role === 'admin' ? (
                    <AdminDashboard />
                  ) : (
                    <Navigate to={auth.token ? defaultRedirect : '/signin/admin'} />
                  )
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <SupportButtons />
        </div>
      </SiteSettingsProvider>
    </Router>
  );
}

export default App;
