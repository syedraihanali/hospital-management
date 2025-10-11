import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function SignInPage() {
  const { role: roleParam } = useParams();
  const normalizedRole = (roleParam || 'patient').toLowerCase();

  const roleConfig = useMemo(
    () => ({
      patient: {
        title: 'Patient sign in',
        subtitle: 'Access your appointments, medical history, and records securely.',
        showRegistration: true,
      },
      doctor: {
        title: 'Doctor sign in',
        subtitle: 'Review your upcoming schedule and manage patient care.',
        showRegistration: false,
      },
      admin: {
        title: 'Administrator sign in',
        subtitle: 'Oversee hospital operations, staff, and reporting.',
        showRegistration: false,
      },
    }),
    []
  );

  const selectedRole = roleConfig[normalizedRole] ? normalizedRole : 'patient';
  const selectedRoleConfig = roleConfig[selectedRole];

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const apiBaseUrl = useMemo(() => {
    const url = process.env.REACT_APP_API_URL || '';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }, []);

  useEffect(() => {
    if (!roleConfig[normalizedRole] && normalizedRole !== 'patient') {
      navigate('/signin/patient', { replace: true });
    }
  }, [navigate, normalizedRole, roleConfig]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    fetch(`${apiBaseUrl}/api/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || data.message || 'Sign-in failed');
        }
        return data;
      })
      .then((data) => {
        login(data.token, data.user);
        const redirectPath = getDefaultRoute(data.user?.role);
        navigate(redirectPath);
      })
      .catch((error) => {
        console.error('Error during sign-in:', error);
        setErrorMessage(error.message || 'Something went wrong. Please try again.');
      });
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-card backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">{selectedRoleConfig.title}</h1>
          <nav className="flex gap-2 text-xs font-semibold text-slate-500">
            {Object.keys(roleConfig).map((roleKey) => (
              <Link
                key={roleKey}
                to={`/signin/${roleKey}`}
                className={`rounded-full px-3 py-1 transition ${roleKey === selectedRole
                  ? 'bg-brand-primary text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-brand-secondary/80 hover:text-brand-dark'
                  }`}
              >
                {roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-2 text-sm text-slate-600">{selectedRoleConfig.subtitle}</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>
          {errorMessage && (
            <p className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-600">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            Sign In
          </button>
        </form>
        {selectedRoleConfig.showRegistration && (
          <p className="mt-4 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-primary hover:text-brand-accent">
              Register here
            </Link>
          </p>
        )}
        {selectedRole === 'doctor' ? (
          <p className="mt-4 text-center text-sm text-slate-600">
            Want to practice with us?{' '}
            <Link to="/apply-as-doctor" className="font-semibold text-brand-primary hover:text-brand-accent">
              Apply as a doctor
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default SignInPage;
