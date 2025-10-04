// /frontend/src/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Create the context
export const AuthContext = createContext();

const normalizeUser = (user) => {
  if (!user) return null;
  const firstName =
    user.firstName ||
    user.given_name ||
    user.name?.split(' ')[0] ||
    user.fullName?.split(' ')[0] ||
    (user.email ? user.email.split('@')[0] : undefined);

  const avatarUrl = user.avatarUrl || user.photoURL || user.picture || null;

  return {
    ...user,
    ...(firstName ? { firstName } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
  };
};

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: null,
    user: null,
  });

  // On component mount, check for token in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token); // Updated usage
        // Optional: Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          // Token expired
          localStorage.removeItem('token');
        } else {
          setAuth({
            token,
            user: normalizeUser({
              id: decoded.id,
              email: decoded.email,
              firstName: decoded.firstName || decoded.given_name,
              avatarUrl: decoded.avatarUrl || decoded.picture,
            }),
          });
        }
      } catch (err) {
        console.error('Error decoding token:', err);
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Function to handle login
  const login = (token, user) => {
    localStorage.setItem('token', token);
    setAuth({
      token,
      user: normalizeUser(user),
    });
  };

  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('token');
    setAuth({
      token: null,
      user: null,
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
