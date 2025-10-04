import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

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

    const API_URL = process.env.REACT_APP_API_URL;

    fetch(`${API_URL}/api/signin`, {
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
          throw new Error(data.message || 'Sign-in failed');
        }
        return data;
      })
      .then((data) => {
        login(data.token, data.user);
        navigate('/myprofile');
      })
      .catch((error) => {
        console.error('Error during sign-in:', error);
        setErrorMessage(error.message || 'Something went wrong. Please try again.');
      });
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-card backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-900">Sign In</h1>
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
            className="w-full rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
          >
            Sign In
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-primary hover:text-brand-accent">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignInPage;
