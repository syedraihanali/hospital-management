import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';

const navigationLinks = [
  { label: 'Home', to: '/' },
  { label: 'Book', to: '/book-appointment' },
  { label: 'Services', to: '/services' },
  { label: 'Get Reports', to: '/reports' },
  { label: 'About Us', to: '/about-us' },
];

function Header() {
  const { auth, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const userFirstName = useMemo(() => {
    if (!auth.user) return '';
    if (auth.user.firstName) return auth.user.firstName;
    if (auth.user.given_name) return auth.user.given_name;
    if (auth.user.name) return auth.user.name.split(' ')[0];
    if (auth.user.fullName) return auth.user.fullName.split(' ')[0];
    if (auth.user.email) return auth.user.email.split('@')[0];
    return '';
  }, [auth.user]);

  const userAvatar = auth.user?.avatarUrl || auth.user?.photoURL || auth.user?.picture || '';

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinkClasses = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
      isActive
        ? 'bg-white/70 text-brand-dark shadow-soft'
        : 'text-slate-600 hover:bg-white/60 hover:text-brand-dark'
    }`;

  const renderAuthAction = (isMobile = false) => {
    if (!auth.token) {
      return (
        <Link
          to="/signin"
          onClick={() => {
            closeDropdown();
            if (isMobile) closeMobileMenu();
          }}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Login
        </Link>
      );
    }

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={toggleDropdown}
          className="flex items-center gap-3 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-sm font-semibold text-brand-dark shadow-soft transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userFirstName || 'User avatar'}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/20 text-sm font-semibold text-brand-dark">
              {userFirstName ? userFirstName[0].toUpperCase() : 'U'}
            </span>
          )}
          <span className="hidden sm:inline-block">{userFirstName || 'My Account'}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 z-50 mt-3 w-48 rounded-2xl border border-emerald-100 bg-white/95 p-2 shadow-glass">
            <Link
              to="/myprofile"
              onClick={() => {
                closeDropdown();
                if (isMobile) closeMobileMenu();
              }}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-secondary/60 hover:text-brand-dark"
            >
              My Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-6 flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-4 py-3 shadow-glass backdrop-blur-xl">
          <Link
            to="/"
            className="text-lg font-semibold text-brand-dark transition hover:text-brand-primary"
            onClick={() => {
              closeMobileMenu();
              closeDropdown();
            }}
          >
            Destination Health
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigationLinks.map((link) => (
              <NavLink key={link.label} to={link.to} className={navLinkClasses}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">{renderAuthAction()}</div>

          <button
            type="button"
            onClick={toggleMobileMenu}
            className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/60 p-2 text-brand-dark shadow-soft transition hover:bg-white lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mx-auto mt-3 max-w-6xl px-4 sm:px-6 lg:hidden">
          <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-glass backdrop-blur-xl">
            <nav className="flex flex-col gap-2">
              {navigationLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-base font-medium transition ${
                      isActive
                        ? 'bg-brand-secondary text-brand-dark shadow-soft'
                        : 'text-slate-600 hover:bg-brand-secondary/70 hover:text-brand-dark'
                    }`
                  }
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4">{renderAuthAction(true)}</div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
