// src/components/MenuScreen.tsx
import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signOut, onAuthStateChanged, type GoogleUser } from '../services/googleAuth';
import { getStudentStatus, createStudentStatus } from '../services/studentService';
import { LobbyScreen } from './LobbyScreen';

interface StudentStatus {
  totalGames: number;
  totalWaves: number;
  totalEnemiesKilled: number;
  totalMoneyEarned: number;
  highestWave: number;
  credits: number;
  unlockedTowers: string[];
  lastPlayed: any;
}

export const MenuScreen: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentStatus, setStudentStatus] = useState<StudentStatus | null>(null);
  const [showLobby, setShowLobby] = useState(false);

  const loadStudentStatus = async (uid: string) => {
    try {
      const status = await getStudentStatus(uid);
      
      if (status) {
        setStudentStatus(status);
      } else {
        // Create new student status with 8 basic towers unlocked
        const basicTowers = [
          'BASIC_RIFLE', 'BASIC_CANNON', 'BASIC_SNIPER', 'BASIC_SHOTGUN',
          'BASIC_FREEZE', 'BASIC_BURN', 'BASIC_STUN', 'BASIC_HEAL'
        ];
        const newStatus: StudentStatus = {
          totalGames: 0,
          totalWaves: 0,
          totalEnemiesKilled: 0,
          totalMoneyEarned: 0,
          highestWave: 0,
          credits: 0,
          unlockedTowers: basicTowers,
          lastPlayed: new Date().toISOString()
        };
        await createStudentStatus(uid, newStatus);
        setStudentStatus(newStatus);
      }
    } catch (error) {
      console.error('Error loading student status:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Load or create student status
        await loadStudentStatus(currentUser.uid);
      } else {
        setStudentStatus(null);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Sign in error:', error);
      alert('Failed to sign in: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setStudentStatus(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleEnterLobby = () => {
    setShowLobby(true);
  };

  const handleStatusUpdate = async () => {
    if (user) {
      await loadStudentStatus(user.uid);
    }
  };

  if (showLobby && user) {
    return (
      <LobbyScreen
        user={user}
        studentStatus={studentStatus}
        onSignOut={async () => {
          await handleSignOut();
          setShowLobby(false);
        }}
        onStatusUpdate={handleStatusUpdate}
      />
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
      {/* Retro-style background pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        backgroundSize: '100% 4px'
      }}></div>

      {/* Retro scanline effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)'
      }}></div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Retro Game Title */}
        <div className="text-center mb-12">
          <h1 className="text-7xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 mb-4 drop-shadow-2xl" style={{
            fontFamily: 'monospace',
            textShadow: '0 0 20px rgba(255,165,0,0.8), 0 0 40px rgba(255,165,0,0.5), 0 0 60px rgba(255,165,0,0.3)',
            letterSpacing: '0.2em',
            animation: 'glow 2s ease-in-out infinite alternate'
          }}>
            NEON DEFENSE
          </h1>
          <p className="text-yellow-400 text-xl md:text-2xl font-mono mb-2" style={{ textShadow: '0 0 10px rgba(255,255,0,0.5)' }}>
            TOWER DEFENSE
          </p>
          <p className="text-green-400 text-sm md:text-base font-mono" style={{ textShadow: '0 0 5px rgba(0,255,0,0.5)' }}>
            RETRO EDITION
          </p>
        </div>

        {/* Main Menu Card - Retro Style */}
        <div className="w-full max-w-md bg-black/80 backdrop-blur-sm rounded-lg border-4 border-yellow-500 p-8 mb-8 shadow-2xl" style={{
          boxShadow: '0 0 30px rgba(255,165,0,0.5), inset 0 0 20px rgba(255,165,0,0.1)'
        }}>
          {/* Scanline overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none rounded-lg" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)'
          }}></div>

          <div className="relative z-10">
            {!user ? (
              /* Login Section */
              <div className="text-center">
                <div className="mb-8">
                  <div className="text-6xl mb-4 animate-pulse">🎮</div>
                  <h2 className="text-3xl font-bold text-yellow-400 mb-3 font-mono" style={{ textShadow: '0 0 10px rgba(255,255,0,0.5)' }}>
                    WELCOME, COMMANDER
                  </h2>
                  <p className="text-green-400 text-sm mb-2 font-mono">Defend the base from invaders</p>
                  <p className="text-slate-400 text-xs font-mono">Sign in to save your progress</p>
                </div>
                
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded border-2 border-white/20 hover:border-white/40 transition-all duration-200 flex items-center justify-center gap-3 group transform hover:scale-105 active:scale-95 font-mono shadow-lg"
                  style={{ boxShadow: '0 0 20px rgba(59,130,246,0.5)' }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-lg">CONTINUE WITH GOOGLE</span>
                </button>
              </div>
            ) : (
              /* User Menu Section */
              <div className="space-y-6">
                {/* User Info */}
                <div className="text-center border-b-2 border-yellow-500/30 pb-4">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-3xl font-bold text-black shadow-lg border-4 border-yellow-400">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-full" />
                    ) : (
                      user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-yellow-400 mb-1 font-mono">{user.displayName || 'COMMANDER'}</h2>
                  <p className="text-green-400 text-sm font-mono">{user.email}</p>
                </div>

                {/* Stats */}
                {studentStatus && (
                  <div className="bg-black/60 rounded border-2 border-yellow-500/30 p-4 space-y-3">
                    <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-wider mb-3 font-mono">STATS</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-green-400 font-mono">Games</div>
                        <div className="text-white font-bold text-lg font-mono">{studentStatus.totalGames}</div>
                      </div>
                      <div>
                        <div className="text-green-400 font-mono">Wave</div>
                        <div className="text-white font-bold text-lg font-mono">{studentStatus.highestWave}</div>
                      </div>
                      <div>
                        <div className="text-green-400 font-mono">Kills</div>
                        <div className="text-white font-bold text-lg font-mono">{studentStatus.totalEnemiesKilled.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-green-400 font-mono">Credits</div>
                        <div className="text-yellow-400 font-bold text-lg font-mono">💰 {studentStatus.credits}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleEnterLobby}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-4 px-6 rounded border-2 border-yellow-400 hover:border-yellow-300 transition-all duration-200 transform hover:scale-105 active:scale-95 text-lg font-mono shadow-lg"
                    style={{ boxShadow: '0 0 20px rgba(255,165,0,0.5)' }}
                  >
                    ⚡ ENTER LOBBY
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded border-2 border-slate-600 hover:border-slate-500 transition-all duration-200 font-mono"
                  >
                    SIGN OUT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-yellow-400/60 text-sm font-mono">
          <p>DEFEND YOUR BASE • BUILD YOUR STRATEGY</p>
        </div>
      </div>

      <style>{`
        @keyframes glow {
          from {
            text-shadow: 0 0 20px rgba(255,165,0,0.8), 0 0 40px rgba(255,165,0,0.5), 0 0 60px rgba(255,165,0,0.3);
          }
          to {
            text-shadow: 0 0 30px rgba(255,165,0,1), 0 0 50px rgba(255,165,0,0.7), 0 0 70px rgba(255,165,0,0.5);
          }
        }
      `}</style>
    </div>
  );
};
