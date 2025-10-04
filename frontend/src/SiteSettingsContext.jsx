import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const defaultSiteSettings = {
  siteName: 'Destination Health',
  siteTagline: 'Seamless booking, coordinated care teams, and secure records—designed for modern health journeys.',
  primaryContactPhone: '1-800-123-456',
  primaryContactEmail: 'care@destinationhealth.com',
  emergencyContactName: 'Emergency coordination desk',
  emergencyContactPhone: '1-800-123-456',
  emergencyContactEmail: 'emergency@destinationhealth.com',
  emergencyContactAddress: '221B Harbor Street, Seattle, WA',
  footerNote: 'Secured with HIPAA-compliant infrastructure.',
};

export const SiteSettingsContext = createContext({
  siteSettings: defaultSiteSettings,
  status: 'idle',
  error: '',
  refreshSiteSettings: async () => {},
  setCachedSiteSettings: () => {},
});

function mergeWithDefaults(value) {
  if (!value || typeof value !== 'object') {
    return { ...defaultSiteSettings };
  }

  return {
    ...defaultSiteSettings,
    ...Object.entries(value).reduce((acc, [key, val]) => {
      acc[key] = typeof val === 'string' ? val : defaultSiteSettings[key] ?? '';
      return acc;
    }, {}),
  };
}

export function SiteSettingsProvider({ children }) {
  const apiBaseUrl = process.env.REACT_APP_API_URL;
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const refreshSiteSettings = useCallback(async () => {
    if (!apiBaseUrl) {
      setSiteSettings(defaultSiteSettings);
      setStatus('succeeded');
      setError('');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/content/site-settings`);
      if (!response.ok) {
        throw new Error('Unable to load site settings.');
      }

      const data = await response.json();
      setSiteSettings(mergeWithDefaults(data));
      setStatus('succeeded');
    } catch (err) {
      setSiteSettings(defaultSiteSettings);
      setStatus('failed');
      setError(err.message || 'Unable to load site settings.');
    }
  }, [apiBaseUrl]);

  const setCachedSiteSettings = useCallback((nextSettings) => {
    setSiteSettings(mergeWithDefaults(nextSettings));
  }, []);

  useEffect(() => {
    refreshSiteSettings();
  }, [refreshSiteSettings]);

  const value = useMemo(
    () => ({ siteSettings, status, error, refreshSiteSettings, setCachedSiteSettings }),
    [error, refreshSiteSettings, siteSettings, status, setCachedSiteSettings]
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

