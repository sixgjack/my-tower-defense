// src/components/MenuScreen.tsx
import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signOut, onAuthStateChanged, type GoogleUser } from '../services/googleAuth';
import { getStudentStatus, createStudentStatus } from '../services/studentService';
import * as db from '../services/postgresDatabase';
import { LobbyScreen } from './LobbyScreen';
import {
  DEMO_LOCAL_USER_ID,
  isGoogleAuthDisabled,
  isGoogleAuthDisabledByEnv,
} from '../config/authMode';
import { readLocalEncountered } from '../config/localEncounteredEnemies';

const viteBase = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;
const GODOT_WEB_HREF = `${viteBase}godot/index.html`;

interface StudentStatus {
  totalGames: number;
  totalWaves: number;
  totalEnemiesKilled: number;
  totalMoneyEarned: number;
  highestWave: number;
  credits: number;
  unlockedTowers: string[];
  encounteredEnemies?: string[];
  lastPlayed: any;
}

const BASIC_TOWER_KEYS = [
  'BASIC_RIFLE', 'BASIC_CANNON', 'BASIC_SNIPER', 'BASIC_SHOTGUN',
  'BASIC_FREEZE', 'BASIC_BURN', 'BASIC_STUN', 'BASIC_HEAL',
] as const;

const DEMO_GOOGLE_USER: GoogleUser = {
  uid: DEMO_LOCAL_USER_ID,
  email: 'demo@local.play',
  displayName: 'Demo Player',
};
const DEV_CREDIT_EMAILS = new Set(['ttn@cpss.edu.hk']);
const DEV_CREDIT_BALANCE = 99_999;

function buildDemoStudentStatus(): StudentStatus {
  return {
    totalGames: 0,
    totalWaves: 0,
    totalEnemiesKilled: 0,
    totalMoneyEarned: 0,
    highestWave: 0,
    credits: 9999,
    unlockedTowers: [...BASIC_TOWER_KEYS],
    encounteredEnemies: readLocalEncountered(),
    lastPlayed: new Date().toISOString(),
  };
}

// Animated hex grid background — same as Lobby
const HEX_COLS = 18;
const HEX_ROWS = 10;
const HEX_SIZE = 36;
const HEX_W = HEX_SIZE * 2;
const HEX_H = Math.sqrt(3) * HEX_SIZE;

function hexPoint(cx: number, cy: number, s: number, i: number) {
  const a = (Math.PI / 180) * (60 * i - 30);
  return `${cx + s * Math.cos(a)},${cy + s * Math.sin(a)}`;
}

const HexGrid: React.FC = () => {
  const hexes: { cx: number; cy: number; key: string }[] = [];
  for (let row = 0; row < HEX_ROWS; row++) {
    for (let col = 0; col < HEX_COLS; col++) {
      const cx = col * HEX_W * 0.75 + HEX_W / 2;
      const cy = row * HEX_H + (col % 2 === 1 ? HEX_H / 2 : 0) + HEX_H / 2;
      hexes.push({ cx, cy, key: `${row}-${col}` });
    }
  }
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.07 }} preserveAspectRatio="xMidYMid slice">
      {hexes.map(({ cx, cy, key }) => (
        <polygon
          key={key}
          points={[0,1,2,3,4,5].map(i => hexPoint(cx, cy, HEX_SIZE - 1, i)).join(' ')}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
};

export const MenuScreen: React.FC = () => {
  const authOff = isGoogleAuthDisabled();
  const [user, setUser] = useState<GoogleUser | null>(() => (authOff ? DEMO_GOOGLE_USER : null));
  const [loading, setLoading] = useState(() => !authOff);
  const [studentStatus, setStudentStatus] = useState<StudentStatus | null>(() =>
    authOff ? buildDemoStudentStatus() : null
  );
  const [showLobby, setShowLobby] = useState(false);
  const [glitch, setGlitch] = useState(false);

  // Occasional glitch effect on title
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  const loadStudentStatus = async (uid: string, email?: string | null) => {
    try {
      const status = await getStudentStatus(uid);
      const isDevUser = Boolean(email && DEV_CREDIT_EMAILS.has(email.toLowerCase()));
      if (status) {
        if (isDevUser && (status.credits || 0) < DEV_CREDIT_BALANCE) {
          await db.updateStudentStatus(uid, { credits: DEV_CREDIT_BALANCE });
          const refreshed = await getStudentStatus(uid);
          if (refreshed) {
            const mergedUnlocked = [...new Set([...(refreshed.unlockedTowers || []), ...BASIC_TOWER_KEYS])];
            setStudentStatus({ ...refreshed, unlockedTowers: mergedUnlocked });
            return;
          }
        }
        const mergedUnlocked = [...new Set([...(status.unlockedTowers || []), ...BASIC_TOWER_KEYS])];
        setStudentStatus({
          ...status,
          credits: isDevUser ? Math.max(status.credits || 0, DEV_CREDIT_BALANCE) : status.credits,
          unlockedTowers: mergedUnlocked,
        });
      } else {
        const newStatus: StudentStatus = {
          totalGames: 0, totalWaves: 0, totalEnemiesKilled: 0, totalMoneyEarned: 0,
          highestWave: 0,
          credits: isDevUser ? DEV_CREDIT_BALANCE : 0,
          unlockedTowers: [...BASIC_TOWER_KEYS],
          encounteredEnemies: [],
          lastPlayed: new Date().toISOString(),
        };
        await createStudentStatus(uid, newStatus);
        setStudentStatus(newStatus);
      }
    } catch (error) {
      console.error('Error loading student status:', error);
    }
  };

  useEffect(() => {
    if (isGoogleAuthDisabled()) {
      localStorage.removeItem('google_user');
      localStorage.removeItem('google_access_token');
      return;
    }
    const unsubscribe = onAuthStateChanged(async (currentUser) => {
      if (isGoogleAuthDisabled()) {
        setUser(DEMO_GOOGLE_USER);
        setStudentStatus(buildDemoStudentStatus());
        setLoading(false);
        return;
      }
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        await loadStudentStatus(currentUser.uid, currentUser.email);
      } else {
        setStudentStatus(null);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = async () => {
    try { await signInWithGoogle(); }
    catch (error: any) {
      console.error('Sign in error:', error);
      alert('Failed to sign in: ' + error.message);
    }
  };

  const handleSignOut = async () => {
    if (isGoogleAuthDisabledByEnv()) return;
    try { await signOut(); setStudentStatus(null); }
    catch (error) { console.error('Sign out error:', error); }
  };

  const handleStatusUpdate = async () => {
    if (!user) return;
    await loadStudentStatus(user.uid, user.email);
  };

  if (showLobby && user) {
    return (
      <LobbyScreen
        user={user}
        studentStatus={studentStatus}
        onSignOut={async () => { await handleSignOut(); setShowLobby(false); }}
        onStatusUpdate={handleStatusUpdate}
      />
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#050e1c' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-sm text-cyan-400/70 tracking-widest">INITIALIZING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto font-mono select-none" style={{ background: 'linear-gradient(160deg, #061428 0%, #091a38 50%, #050e1c 100%)' }}>
      {/* Hex grid background */}
      <HexGrid />

      {/* Scan line overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
      }} />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #38bdf8, #818cf8, transparent)' }} />

      {/* Demo mode banner */}
      {isGoogleAuthDisabled() && (
        <div className="relative z-10 mx-auto mt-3 max-w-lg rounded border border-amber-600/60 bg-amber-950/80 px-4 py-2 text-center text-[11px] text-amber-300">
          {isGoogleAuthDisabledByEnv() ? (
            <>Demo mode · Google SSO off (<code className="text-amber-400">VITE_DISABLE_GOOGLE_AUTH=true</code>). Progress saved to local profile <code className="text-amber-400">{DEMO_LOCAL_USER_ID}</code>.</>
          ) : (
            <>Playing without Google — progress saved to local backend. Sign out to use Google later.</>
          )}
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">

        {/* ── TITLE ── */}
        <div className="text-center mb-10">
          {/* Cyber bracket decoration */}
          <div className="flex items-center justify-center gap-4 mb-3 text-slate-500 text-xs tracking-widest">
            <span>━━ ◈ ━━</span>
            <span className="text-cyan-500/60">CLASSIFIED</span>
            <span>━━ ◈ ━━</span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-black tracking-[0.15em] uppercase leading-none"
            style={{
              color: glitch ? '#f0abfc' : '#e2e8f0',
              textShadow: glitch
                ? '3px 0 #38bdf8, -3px 0 #f0abfc, 0 0 30px rgba(226,232,240,0.6)'
                : '0 0 20px rgba(226,232,240,0.25), 0 0 60px rgba(56,189,248,0.15)',
              transition: glitch ? 'none' : 'color 0.2s, text-shadow 0.2s',
              fontFamily: 'monospace',
            }}
          >
            GRID<span style={{ color: '#38bdf8' }}>LOCK</span>
          </h1>
          <div className="mt-2 text-xs tracking-[0.4em] text-slate-400 uppercase">
            Tower Defense · Tactical Operations
          </div>

          {/* Animated underline */}
          <div className="mt-3 mx-auto h-px w-48 relative overflow-hidden" style={{ background: 'rgba(56,189,248,0.15)' }}>
            <div className="absolute inset-y-0 left-0 w-16 bg-cyan-400" style={{ animation: 'scanBar 2.5s linear infinite' }} />
          </div>
        </div>

        {/* ── MAIN CARD ── */}
        <div
          className="w-full max-w-sm relative"
          style={{
            background: 'rgba(6,20,40,0.92)',
            border: '1px solid rgba(56,189,248,0.25)',
            boxShadow: '0 0 0 1px rgba(56,189,248,0.08), 0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(56,189,248,0.1)',
          }}
        >
          {/* Card corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400/60" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400/60" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-400/60" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-400/60" />

          <div className="p-7">
            {!user ? (
              /* ── LOGIN ── */
              <div className="text-center space-y-6">
                <div>
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full"
                    style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)' }}>
                    {/* Shield icon */}
                    <svg viewBox="0 0 32 32" width="32" height="32" fill="none">
                      <path d="M16 3 L28 8 L28 18 Q28 26 16 30 Q4 26 4 18 L4 8 Z" stroke="#38bdf8" strokeWidth="1.5" fill="rgba(56,189,248,0.1)" />
                      <path d="M11 16 L14 19 L21 12" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold tracking-widest text-slate-100 mb-1">COMMANDER</h2>
                  <p className="text-xs text-slate-500">Authentication required to access ops</p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-none font-bold text-sm tracking-wider transition-all duration-150 group"
                  style={{
                    background: 'rgba(56,189,248,0.08)',
                    border: '1px solid rgba(56,189,248,0.35)',
                    color: '#7dd3fc',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(56,189,248,0.16)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(56,189,248,0.08)'; }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#7dd3fc" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#7dd3fc" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#7dd3fc" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#7dd3fc" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  SIGN IN WITH GOOGLE
                </button>

                <a
                  href={GODOT_WEB_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 py-2.5 px-5 text-xs tracking-wider transition-all duration-150"
                  style={{
                    background: 'rgba(129,140,248,0.06)',
                    border: '1px solid rgba(129,140,248,0.25)',
                    color: '#a5b4fc',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.06)'; }}
                >
                  ◈ GODOT WEB (PIXEL BUILD)
                </a>
                <p className="text-[10px] text-slate-600 -mt-3">Export Godot → Web to <code className="text-slate-500">public/godot/</code> first.</p>
              </div>
            ) : (
              /* ── USER MENU ── */
              <div className="space-y-5">
                {/* User header */}
                <div className="flex items-center gap-4 pb-4" style={{ borderBottom: '1px solid rgba(56,189,248,0.12)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 overflow-hidden"
                    style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8' }}>
                    {user.photoURL
                      ? <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-full object-cover" />
                      : (user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'C')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold tracking-widest text-slate-100 truncate">{user.displayName || 'COMMANDER'}</div>
                    <div className="text-[11px] text-cyan-400/70 truncate">{user.email}</div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[9px] tracking-widest text-emerald-400/80">ONLINE</span>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                {studentStatus && (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'GAMES', value: studentStatus.totalGames },
                      { label: 'WAVE', value: studentStatus.highestWave },
                      { label: 'KILLS', value: studentStatus.totalEnemiesKilled.toLocaleString() },
                      { label: 'CR', value: studentStatus.credits.toLocaleString(), accent: true },
                    ].map(({ label, value, accent }) => (
                      <div key={label} className="text-center py-2 px-1 rounded-none"
                        style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.1)' }}>
                        <div className={`text-base font-black ${accent ? 'text-yellow-400' : 'text-slate-100'}`}>{value}</div>
                        <div className="text-[8px] tracking-widest text-slate-500">{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tower unlock bar */}
                {studentStatus && (
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                      <span>TOWERS UNLOCKED</span>
                      <span className="text-cyan-400">{studentStatus.unlockedTowers.length}</span>
                    </div>
                    <div className="h-1 rounded-none overflow-hidden" style={{ background: 'rgba(56,189,248,0.1)' }}>
                      <div className="h-full transition-all"
                        style={{ width: `${Math.min(100, (studentStatus.unlockedTowers.length / 20) * 100)}%`, background: 'linear-gradient(90deg, #0ea5e9, #818cf8)' }} />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowLobby(true)}
                    className="w-full py-3 px-5 font-black text-sm tracking-[0.2em] transition-all duration-150 relative overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(129,140,248,0.15))',
                      border: '1px solid rgba(56,189,248,0.5)',
                      color: '#e2e8f0',
                      boxShadow: '0 0 20px rgba(56,189,248,0.1)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(56,189,248,0.25)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(56,189,248,0.1)'; }}
                  >
                    ▶ ENTER OPERATIONS
                  </button>

                  <a
                    href={GODOT_WEB_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 py-2.5 px-5 text-xs tracking-wider transition-all duration-150"
                    style={{
                      background: 'rgba(129,140,248,0.06)',
                      border: '1px solid rgba(129,140,248,0.25)',
                      color: '#a5b4fc',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.12)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.06)'; }}
                  >
                    ◈ GODOT WEB (PIXEL BUILD)
                  </a>

                  {!isGoogleAuthDisabledByEnv() ? (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full py-2 px-5 text-xs tracking-widest transition-all duration-150"
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(148,163,184,0.15)',
                        color: '#64748b',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                    >
                      SIGN OUT
                    </button>
                  ) : (
                    <p className="text-center text-[10px] text-slate-600">Sign-in disabled in demo mode.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[10px] tracking-[0.3em] text-slate-600 uppercase">
          Build Towers · Defend the Grid · Survive
        </div>
      </div>

      <style>{`
        @keyframes scanBar {
          0%   { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};
