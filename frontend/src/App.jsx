import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import PatientProfile from './pages/PatientProfile';
import SignInPage from './pages/SignInPage';
import Header from './components/Header';
import BookAppointmentPage from './pages/BookAppointmentPage';
import StaffPortal from './pages/StaffPortal';
import { AuthContext } from './AuthContext';
import AboutUs from './pages/AboutUs';
import ServicesPage from './pages/ServicesPage';
import ReportsPage from './pages/ReportsPage';
import AdminDashboard from './pages/AdminDashboard';

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

  return (
    <Router basename="/Capstone-Project">
      <div className="relative flex min-h-screen flex-col bg-gradient-to-br from-brand-secondary via-white to-emerald-50">
        <Header />
        <main className="flex-1 px-4 pb-12 pt-28 sm:px-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route
              path="/signin"
              element={!auth.token ? <SignInPage /> : <Navigate to={defaultRedirect} />}
            />
            <Route
              path="/book-appointment"
              element={
                auth.token && auth.user?.role === 'patient' ? (
                  <BookAppointmentPage />
                ) : (
                  <Navigate to={auth.token ? defaultRedirect : '/signin'} />
                )
              }
            />
            <Route
              path="/staff-portal"
              element={
                auth.token && auth.user?.role === 'doctor' ? (
                  <StaffPortal />
                ) : (
                  <Navigate to={auth.token ? defaultRedirect : '/signin'} />
                )
              }
            />
            <Route
              path="/myprofile"
              element={
                auth.token && auth.user?.role === 'patient' ? (
                  <PatientProfile />
                ) : (
                  <Navigate to={auth.token ? defaultRedirect : '/signin'} />
                )
              }
            />
            <Route
              path="/admin"
              element={
                auth.token && auth.user?.role === 'admin' ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to={auth.token ? defaultRedirect : '/signin'} />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
