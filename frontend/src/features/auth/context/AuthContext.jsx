import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

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

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: null,
    user: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          localStorage.removeItem('token');
        } else {
          setAuth({
            token,
            user: normalizeUser({
              id: decoded.id,
              email: decoded.email,
              role: decoded.role,
              fullName: decoded.fullName,
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

  const login = (token, user) => {
    localStorage.setItem('token', token);
    setAuth({
      token,
      user: normalizeUser(user),
    });
  };

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
