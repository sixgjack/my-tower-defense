// src/pages/TeacherDashboard.tsx
// Teacher dashboard for managing question sets
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../firebase';
import { AdminLogin, isAuthorizedTeacher } from '../components/AdminLogin';
import { TeacherQuestionSetManager } from '../components/TeacherQuestionSetManager';
import { AdminPanel } from '../components/AdminPanel';
import { useLanguage } from '../i18n/useTranslation';

export const TeacherDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'questionSets' | 'questions'>('questionSets');
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    // Check session storage first
    const sessionAuth = sessionStorage.getItem('teacher_authenticated') === 'true';
    if (sessionAuth) {
      setIsAuthorized(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        let organizationDomain: string | null = null;
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          organizationDomain = idTokenResult.claims.hd as string | undefined || null;
        } catch (e) {
          console.error('Error getting ID token:', e);
        }
        
        const authorized = isAuthorizedTeacher(currentUser.email || null, organizationDomain);
        setIsAuthorized(authorized);
        
        if (authorized) {
          sessionStorage.setItem('teacher_authenticated', 'true');
          sessionStorage.setItem('teacher_uid', currentUser.uid);
          sessionStorage.setItem('teacher_email', currentUser.email || '');
        } else {
          signOut(auth);
        }
      } else {
        setIsAuthorized(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem('teacher_authenticated');
      sessionStorage.removeItem('teacher_uid');
      sessionStorage.removeItem('teacher_email');
      await signOut(auth);
      setIsAuthorized(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl font-mono animate-pulse">{t('common.loading')}</div>
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

  const teacherUid = sessionStorage.getItem('teacher_uid') || user?.uid || '';

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                {t('teacher.manage')} / Teacher Dashboard
              </h1>
              <p className="text-slate-300 text-sm">
                {user?.displayName || user?.email || 'Teacher'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'zh-TW' : 'en')}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600"
              >
                {language === 'en' ? '中文' : 'EN'}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600/50 hover:bg-red-600 text-white rounded-lg transition-all backdrop-blur-sm border border-red-500"
              >
                {t('menu.signOut')}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('questionSets')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'questionSets'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {t('teacher.questionSets')} / Question Sets
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'questions'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {t('admin.questions')} / Questions
            </button>
          </div>

          {/* Content */}
          {activeTab === 'questionSets' ? (
            <TeacherQuestionSetManager teacherUid={teacherUid} />
          ) : (
            <AdminPanel onBack={() => {}} showSignOut={false} />
          )}
        </div>
      </div>
    </div>
  );
};
