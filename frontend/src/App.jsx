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

function App() {
  const { auth } = useContext(AuthContext);

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
              element={!auth.token ? <SignInPage /> : <Navigate to="/myprofile" />}
            />
            <Route
              path="/book-appointment"
              element={auth.token ? <BookAppointmentPage /> : <Navigate to="/signin" />}
            />
            <Route
              path="/staff-portal"
              element={auth.token ? <StaffPortal /> : <Navigate to="/staff-portal" />}
            />
            <Route
              path="/myprofile"
              element={auth.token ? <PatientProfile /> : <Navigate to="/signin" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
