// src/pages/AdminPage.tsx
// Hidden admin page - only accessible to teachers
import React, { useState, useEffect } from 'react';
import { AdminLogin } from '../components/AdminLogin';
import { AdminPanel } from '../components/AdminPanel';

export const AdminPage: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated via sessionStorage
    const authenticated = sessionStorage.getItem('admin_authenticated') === 'true';
    setIsAuthorized(authenticated);
    setLoading(false);
  }, []);

  const handleSignOut = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthorized(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <AdminLogin
        onSuccess={() => setIsAuthorized(true)}
        onBack={() => window.location.href = '/'}
      />
    );
  }

  return (
    <AdminPanel onBack={handleSignOut} showSignOut={true} />
  );
};
