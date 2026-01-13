// src/components/AdminLogin.tsx
// Hidden login page for teachers to access admin panel
import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AdminLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

// List of authorized teacher organization domains (Google Workspace domains)
const AUTHORIZED_TEACHER_ORGS = [
  'cpss.edu.hk'
];

// Check if user is authorized as a teacher based on Google organization
export const isAuthorizedTeacher = (
  email: string | null | undefined,
  hostedDomain: string | null | undefined
): boolean => {
  if (!email) return false;
  
  // First check: If hosted domain (organization) is provided, check against authorized orgs
  if (hostedDomain) {
    if (AUTHORIZED_TEACHER_ORGS.length > 0) {
      return AUTHORIZED_TEACHER_ORGS.some(org => 
        hostedDomain.toLowerCase() === org.toLowerCase()
      );
    }
  }
  
  // Fallback: Check email domain if no hosted domain is available
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (emailDomain) {
    if (AUTHORIZED_TEACHER_ORGS.length > 0) {
      return AUTHORIZED_TEACHER_ORGS.some(org => 
        emailDomain === org.toLowerCase()
      );
    }
  }
  
  return false;
};

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get the hosted domain (organization) from the ID token
      let organizationDomain: string | null = null;
      try {
        const idTokenResult = await user.getIdTokenResult();
        organizationDomain = (idTokenResult.claims.hd as string | undefined) || null;
      } catch (e) {
        console.warn('Could not retrieve organization domain from ID token:', e);
      }
      
      // Check authorization based on organization domain and email
      const isAuthorized = isAuthorizedTeacher(user.email || null, organizationDomain);
      
      if (isAuthorized) {
        // Store teacher authentication
        sessionStorage.setItem('teacher_authenticated', 'true');
        sessionStorage.setItem('teacher_uid', user.uid);
        sessionStorage.setItem('teacher_email', user.email || '');
        onSuccess();
      } else {
        const orgInfo = organizationDomain 
          ? ` Your organization: ${organizationDomain}` 
          : user.email 
            ? ` Your email domain: ${user.email.split('@')[1]}` 
            : '';
        setError(`Access denied. Only authorized teachers from approved organizations can access this page.${orgInfo}`);
        await auth.signOut();
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError('Failed to sign in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl border-4 border-red-500 p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-red-400 mb-2 font-mono">TEACHER ACCESS</h1>
          <p className="text-slate-300 text-sm">Authorized personnel only</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-3 group transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-lg">{loading ? 'Verifying...' : 'Sign in with Google'}</span>
        </button>

        <button
          onClick={onBack}
          className="w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
        >
          Back to Game
        </button>

        <div className="mt-6 text-center text-slate-500 text-xs">
          <p>This page is restricted to authorized teachers only.</p>
          <p className="mt-2">If you are a teacher, contact the administrator for access.</p>
        </div>
      </div>
    </div>
  );
};
