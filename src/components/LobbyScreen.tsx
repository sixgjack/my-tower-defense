// src/components/LobbyScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
// @ts-ignore
import { gsap } from 'gsap';
import type { GoogleUser } from '../services/googleAuth';
import { GameBoard } from './GameBoard';
import { LuckyDraw } from './LuckyDraw';
import { TowerGallery } from './TowerGallery';
import { EnemyDictionary } from './EnemyDictionary';
import { ModeSelection, type GameMode } from './ModeSelection';
import { TowerLoadoutSelection } from './TowerLoadoutSelection';
import { useLanguage } from '../i18n/useTranslation';
import { updateStudentStatusAfterGame } from '../services/studentService';
import { isGoogleAuthDisabled } from '../config/authMode';
import { mergeIntoLocalEncountered } from '../config/localEncounteredEnemies';
import { getAllQuestions, getQuestionsBySet } from '../services/questionService';
import { Leaderboard } from './Leaderboard';
import { updateStudentDisplayName } from '../services/postgresDatabase';
import { COMMANDERS, COMMANDER_LIST, DEFAULT_COMMANDER, type Commander } from '../config/characters';
import { CardCollection } from './CardCollection';
import { loadTowerCards, saveTowerCards, getOrInitCard, addCardXp } from '../config/towerCards';
import { game } from '../engine/GameEngine';

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

interface LobbyScreenProps {
  user: GoogleUser;
  studentStatus: StudentStatus | null;
  onSignOut: () => void;
  onStatusUpdate: () => Promise<void>;
}

// Pixel art portrait — detailed sci-fi soldier (viewBox 64×96)
function CommanderPortrait({ commander, size = 72 }: { commander: Commander; size?: number }) {
  const c = commander.accentColor;
  const dark  = '#07101f';
  const armor = '#111e33';
  const plate = '#192d4a';
  const hi    = '#223d64';
  const h = Math.round(size * 96 / 64);
  return (
    <svg width={size} height={h} viewBox="0 0 64 96" style={{ imageRendering: 'pixelated' }}>
      {/* ── LEGS ── */}
      <rect x="18" y="64" width="12" height="24" fill={armor} />
      <rect x="34" y="64" width="12" height="24" fill={armor} />
      {/* thigh armor */}
      <rect x="17" y="64" width="14" height="10" fill={plate} />
      <rect x="33" y="64" width="14" height="10" fill={plate} />
      {/* knee cap */}
      <rect x="20" y="73" width="8"  height="4"  fill={hi} />
      <rect x="36" y="73" width="8"  height="4"  fill={hi} />
      {/* shin stripe */}
      <rect x="22" y="77" width="4"  height="11" fill={c} opacity="0.5" />
      <rect x="38" y="77" width="4"  height="11" fill={c} opacity="0.5" />
      {/* boots */}
      <rect x="17" y="86" width="14" height="6"  fill={dark} />
      <rect x="33" y="86" width="14" height="6"  fill={dark} />
      <rect x="16" y="90" width="16" height="3"  fill={armor} />
      <rect x="32" y="90" width="16" height="3"  fill={armor} />

      {/* ── WAIST / BELT ── */}
      <rect x="16" y="59" width="32" height="7"  fill={dark} />
      <rect x="18" y="60" width="28" height="5"  fill={armor} />
      <rect x="28" y="59" width="8"  height="7"  fill={c} opacity="0.55" />
      {/* belt pouches */}
      <rect x="18" y="61" width="5"  height="4"  fill={plate} />
      <rect x="41" y="61" width="5"  height="4"  fill={plate} />

      {/* ── TORSO ── */}
      <rect x="14" y="36" width="36" height="25" fill={plate} />
      <rect x="16" y="37" width="32" height="23" fill={armor} />
      {/* chest armor plate */}
      <rect x="19" y="38" width="26" height="16" fill={dark} />
      <rect x="21" y="40" width="22" height="12" fill={plate} />
      {/* center emblem */}
      <rect x="27" y="42" width="10" height="7"  fill={c} opacity="0.85" />
      <rect x="29" y="43" width="6"  height="5"  fill={c} />
      {/* side vents */}
      <rect x="16" y="44" width="4"  height="2"  fill={c} opacity="0.5" />
      <rect x="16" y="48" width="4"  height="2"  fill={c} opacity="0.5" />
      <rect x="44" y="44" width="4"  height="2"  fill={c} opacity="0.5" />
      <rect x="44" y="48" width="4"  height="2"  fill={c} opacity="0.5" />
      {/* collar */}
      <rect x="22" y="35" width="20" height="4"  fill={plate} />
      <rect x="24" y="34" width="16" height="3"  fill={hi} />

      {/* ── SHOULDER PADS ── */}
      <rect x="6"  y="33" width="12" height="18" fill={plate} />
      <rect x="46" y="33" width="12" height="18" fill={plate} />
      <rect x="6"  y="33" width="12" height="4"  fill={c} opacity="0.8" />
      <rect x="46" y="33" width="12" height="4"  fill={c} opacity="0.8" />
      {/* shoulder edge bevel */}
      <rect x="5"  y="35" width="3"  height="12" fill={armor} />
      <rect x="56" y="35" width="3"  height="12" fill={armor} />

      {/* ── ARMS ── */}
      <rect x="4"  y="49" width="7"  height="14" fill={armor} />
      <rect x="53" y="49" width="7"  height="14" fill={armor} />
      {/* elbow pads */}
      <rect x="3"  y="55" width="9"  height="4"  fill={plate} />
      <rect x="52" y="55" width="9"  height="4"  fill={plate} />
      {/* gloves */}
      <rect x="4"  y="61" width="7"  height="5"  fill={dark} />
      <rect x="53" y="61" width="7"  height="5"  fill={dark} />

      {/* ── NECK ── */}
      <rect x="25" y="28" width="14" height="7"  fill={armor} />
      <rect x="27" y="27" width="10" height="3"  fill={plate} />

      {/* ── HEAD ── */}
      <rect x="16" y="8"  width="32" height="22" fill={armor} />
      <rect x="18" y="10" width="28" height="18" fill={dark} />
      {/* helmet top crest */}
      <rect x="18" y="6"  width="28" height="5"  fill={plate} />
      <rect x="22" y="4"  width="20" height="4"  fill={armor} />
      <rect x="26" y="3"  width="12" height="3"  fill={c} opacity="0.7" />
      <rect x="30" y="2"  width="4"  height="3"  fill={c} />
      {/* helmet side panels */}
      <rect x="14" y="10" width="5"  height="14" fill={plate} />
      <rect x="45" y="10" width="5"  height="14" fill={plate} />
      {/* ear comm units */}
      <rect x="12" y="14" width="4"  height="6"  fill={dark} />
      <rect x="48" y="14" width="4"  height="6"  fill={dark} />
      <rect x="11" y="15" width="2"  height="4"  fill={c} opacity="0.9" />
      <rect x="51" y="15" width="2"  height="4"  fill={c} opacity="0.9" />
      {/* visor */}
      <rect x="18" y="17" width="28" height="8"  fill={c} opacity="0.7" />
      <rect x="20" y="18" width="24" height="6"  fill={c} opacity="0.35" />
      {/* visor inner glare */}
      <rect x="22" y="19" width="8"  height="2"  fill="white" opacity="0.18" />
      {/* chin guard */}
      <rect x="20" y="25" width="24" height="5"  fill={plate} />
      <rect x="24" y="26" width="16" height="3"  fill={armor} />

      {/* ── GLOW HALO behind head ── */}
      <ellipse cx="32" cy="16" rx="20" ry="18" fill={c} opacity="0.06" />
    </svg>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-slate-400 w-12 tracking-widest">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-4 h-2 rounded-none" style={{
            background: i < value ? color : '#1e293b',
            boxShadow: i < value ? `0 0 4px ${color}80` : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

function HexGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.09 }}>
      <defs>
        <pattern id="hex-pat" x="0" y="0" width="52" height="60" patternUnits="userSpaceOnUse">
          <polygon points="26,2 50,16 50,44 26,58 2,44 2,16" fill="none" stroke="#00d4ff" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex-pat)" />
    </svg>
  );
}

function RadarSweep() {
  const sweepRef = useRef<SVGLineElement>(null);
  useEffect(() => {
    if (!sweepRef.current) return;
    gsap.to(sweepRef.current, {
      rotation: 360,
      duration: 5,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 100%',
    });
  }, []);
  return (
    <svg className="absolute pointer-events-none" style={{ right: '4%', top: '4%', width: 180, height: 180, opacity: 0.12 }}>
      <circle cx="90" cy="90" r="88" fill="none" stroke="#00ff88" strokeWidth="1" />
      <circle cx="90" cy="90" r="60" fill="none" stroke="#00ff88" strokeWidth="0.5" />
      <circle cx="90" cy="90" r="30" fill="none" stroke="#00ff88" strokeWidth="0.5" />
      <line ref={sweepRef} x1="90" y1="90" x2="90" y2="2" stroke="#00ff88" strokeWidth="1.5" />
      <defs>
        <radialGradient id="radar-fade">
          <stop offset="0%" stopColor="#00ff88" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ user, studentStatus, onSignOut, onStatusUpdate }) => {
  const [activeView, setActiveView] = useState<'lobby' | 'game' | 'mode-selection' | 'tower-loadout' | 'lucky-draw' | 'towers' | 'enemies' | 'leaderboard' | 'cards'>('lobby');
  const [showGame, setShowGame] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedTowers, setSelectedTowers] = useState<string[]>([]);
  const [selectedCommander, setSelectedCommander] = useState<string>(DEFAULT_COMMANDER);
  const { language, setLanguage } = useLanguage();
  const godotQuestionCacheRef = useRef<Record<string, { correct: string }>>({});
  const lobbyRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const commanderRowRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const commander = COMMANDERS[selectedCommander];

  // ---- KEEP ALL EXISTING LOGIC ----
  useEffect(() => {
    if (user?.uid && user.displayName) {
      updateStudentDisplayName(user.uid, user.displayName).catch(() => {});
    }
  }, [user?.uid, user?.displayName]);

  useEffect(() => {
    const onMessage = async (evt: MessageEvent) => {
      if (evt.origin !== window.location.origin) return;
      const data = evt.data as { type?: string; payload?: any };
      if (!data?.type || !data.payload || !user) return;
      if (data.type === 'godot.runResult') {
        const result = data.payload;
        try {
          await updateStudentStatusAfterGame(user.uid, { wave: Number(result.wave || 1), enemiesKilled: Number(result.enemiesKilled || 0), moneyEarned: Number(result.moneyEarned || 0), towersBuilt: Number(result.towersBuilt || 0) });
          await onStatusUpdate();
        } catch {}
        return;
      }
      if (data.type === 'godot.questionRequest') {
        const requestId = String(data.payload.requestId || '');
        const questionSetId = String(data.payload.questionSetId || 'mixed');
        if (!requestId) return;
        try {
          let questions = questionSetId === 'mixed' ? await getAllQuestions() : await getQuestionsBySet(questionSetId);
          if (!questions || questions.length === 0) questions = await getAllQuestions();
          if (!questions || questions.length === 0) return;
          const q = questions[Math.floor(Math.random() * questions.length)];
          godotQuestionCacheRef.current[requestId] = { correct: String(q.correct ?? '') };
          window.postMessage({ type: 'godot.questionPayload', payload: { requestId, questionId: String(q.id ?? q.question ?? requestId), prompt: String(q.question ?? 'Question'), choices: Array.isArray(q.options) ? q.options : [] } }, window.location.origin);
        } catch {}
        return;
      }
      if (data.type === 'godot.questionAnswer') {
        const requestId = String(data.payload.requestId || '');
        if (!requestId) return;
        const selected = String(data.payload.selected ?? '');
        const entry = godotQuestionCacheRef.current[requestId];
        const allow = !!entry && selected === entry.correct;
        window.postMessage({ type: 'godot.questionJudgement', payload: { requestId, allow, correctAnswer: entry?.correct ?? '' } }, window.location.origin);
        delete godotQuestionCacheRef.current[requestId];
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onStatusUpdate, user]);

  const handleStartCombat = () => setActiveView('mode-selection');
  const handleModeSelect = (mode: GameMode) => { setSelectedMode(mode); setActiveView('tower-loadout'); };
  const handleTowerLoadoutConfirm = (towers: string[]) => {
    setSelectedTowers(towers);
    // Push current card data into the engine before the game starts
    const savedCards = loadTowerCards(user.uid);
    const cardSnapshot: Record<string, { level: number; stars: number; bondLevel: number }> = {};
    for (const key of Object.keys(savedCards)) {
      const c = savedCards[key];
      cardSnapshot[key] = { level: c.level, stars: c.stars, bondLevel: c.bondLevel };
    }
    game.activeCardData = cardSnapshot;
    setShowGame(true);
    setActiveView('game');
  };

  const handleGameEnd = async (gameResult?: { wave: number; enemiesKilled: number; moneyEarned: number; towersBuilt: number; encounteredEnemies?: string[] }) => {
    setShowGame(false);
    setActiveView('lobby');
    setSelectedMode(null);

    // Persist tower card XP earned this session
    if (user) {
      const xpMap = game.sessionCardXp;
      if (Object.keys(xpMap).length > 0) {
        const cards = loadTowerCards(user.uid);
        for (const [towerKey, xpGain] of Object.entries(xpMap)) {
          const card = getOrInitCard(cards, towerKey, (studentStatus?.unlockedTowers || []).includes(towerKey));
          let updated = card;
          for (let i = 0; i < xpGain; i++) {
            const res = addCardXp(updated, 1);
            updated = res.card;
          }
          cards[towerKey] = updated;
        }
        saveTowerCards(user.uid, cards);
      }
    }

    if (!gameResult || !user) return;
    try {
      await updateStudentStatusAfterGame(user.uid, gameResult);
    } catch {
      if (isGoogleAuthDisabled()) mergeIntoLocalEncountered(gameResult.encounteredEnemies || []);
    }
    await onStatusUpdate();
  };

  // ---- GSAP ENTRANCE ANIMATION ----
  useEffect(() => {
    if (activeView !== 'lobby') return;
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
      gsap.fromTo('.cmd-card', { opacity: 0, y: 32, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(1.4)', delay: 0.2 });
      gsap.fromTo(detailRef.current, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, delay: 0.6, ease: 'power2.out' });
      gsap.fromTo(navRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.7, ease: 'power2.out' });
    }, lobbyRef);
    return () => ctx.revert();
  }, [activeView]);

  const handleSelectCommander = useCallback((id: string) => {
    if (id === selectedCommander) return;
    setSelectedCommander(id);
    gsap.fromTo(detailRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, [selectedCommander]);

  // ---- NON-LOBBY VIEWS ----
  if (activeView === 'game' && showGame) {
    return (
      <GameBoard
        onGameEnd={handleGameEnd}
        questionSetId={selectedMode?.questionSetId || 'mixed'}
        allowedTowers={selectedTowers.length > 0 ? selectedTowers : undefined}
        selectedCommander={selectedCommander}
      />
    );
  }
  if (activeView === 'mode-selection') {
    return <ModeSelection onSelectMode={handleModeSelect} onBack={() => setActiveView('lobby')} />;
  }
  if (activeView === 'tower-loadout') {
    return (
      <TowerLoadoutSelection
        unlockedTowers={studentStatus?.unlockedTowers || []}
        onConfirm={handleTowerLoadoutConfirm}
        onBack={() => setActiveView('mode-selection')}
      />
    );
  }
  if (activeView === 'lucky-draw') {
    return (
      <LuckyDraw
        user={user}
        unlockedTowers={studentStatus?.unlockedTowers || []}
        credits={studentStatus?.credits || 0}
        onBack={() => setActiveView('lobby')}
        onStatusUpdate={onStatusUpdate}
      />
    );
  }
  if (activeView === 'towers') {
    return <TowerGallery unlockedTowers={studentStatus?.unlockedTowers || []} onBack={() => setActiveView('lobby')} />;
  }
  if (activeView === 'cards') {
    return <CardCollection user={user} unlockedTowers={studentStatus?.unlockedTowers || []} onBack={() => setActiveView('lobby')} />;
  }
  if (activeView === 'enemies') {
    return <EnemyDictionary encounteredEnemies={studentStatus?.encounteredEnemies || []} onBack={() => setActiveView('lobby')} />;
  }
  if (activeView === 'leaderboard') {
    return <Leaderboard user={user} onBack={() => setActiveView('lobby')} language={language} />;
  }

  // ---- MAIN MILITARY CYBER LOBBY ----
  return (
    <div
      ref={lobbyRef}
      className="min-h-screen w-screen overflow-hidden relative flex flex-col select-none"
      style={{ background: 'linear-gradient(160deg, #061428 0%, #091a38 50%, #050e1c 100%)' }}
    >
      {/* Background layers */}
      <HexGrid />
      <RadarSweep />
      {/* Scan line overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.012) 3px, rgba(0,212,255,0.012) 4px)',
      }} />

      {/* TOP BAR */}
      <div ref={headerRef} className="relative z-10 flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'rgba(0,212,255,0.15)', background: 'rgba(3,12,24,0.8)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-cyan-300 uppercase" style={{ textShadow: '0 0 8px rgba(0,212,255,0.6)' }}>CYBER DEFENSE COMMAND</span>
          <span className="font-mono text-[10px] text-slate-400">// CLASSIFIED</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[10px] text-slate-400">
            {language === 'zh-TW' ? '指揮官' : 'CMDR'}:
            <span className="text-cyan-300 ml-1">{user.displayName || user.email?.split('@')[0] || 'OPERATIVE'}</span>
          </div>
          <div className="font-mono text-[10px] text-slate-500">
            {language === 'zh-TW' ? '最高波次' : 'BEST'}:
            <span className="text-yellow-400 ml-1">{studentStatus?.highestWave || 0}</span>
          </div>
          <button
            type="button"
            onClick={() => setLanguage(language === 'zh-TW' ? 'en' : 'zh-TW')}
            className="px-2 py-0.5 border font-mono text-[9px] tracking-wider transition-colors"
            style={{ borderColor: 'rgba(0,212,255,0.3)', color: '#00d4ff', background: 'rgba(0,212,255,0.05)' }}
          >
            {language === 'zh-TW' ? 'EN' : 'ZH'}
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="px-2 py-0.5 border font-mono text-[9px] tracking-wider transition-colors"
            style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', background: 'rgba(239,68,68,0.05)' }}
          >
            {language === 'zh-TW' ? '登出' : 'LOG OUT'}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 py-6 gap-6 relative z-10">

        {/* COMMANDER SELECT HEADER */}
        <div className="w-full max-w-5xl">
          <div className="font-mono text-[10px] tracking-[0.25em] text-slate-500 mb-3 flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: 'rgba(0,212,255,0.15)' }} />
            <span>SELECT COMMANDER</span>
            <div className="h-px flex-1" style={{ background: 'rgba(0,212,255,0.15)' }} />
          </div>

          {/* Commander Cards Row */}
          <div ref={commanderRowRef} className="grid grid-cols-6 gap-3">
            {COMMANDER_LIST.map((cmd) => {
              const isSelected = cmd.id === selectedCommander;
              return (
                <button
                  type="button"
                  key={cmd.id}
                  className="cmd-card relative flex flex-col items-center gap-1 p-2 transition-all duration-200 border cursor-pointer group"
                  style={{
                    background: isSelected
                      ? `linear-gradient(160deg, ${cmd.bgFrom}, ${cmd.bgTo})`
                      : 'rgba(10,20,40,0.6)',
                    borderColor: isSelected ? cmd.accentColor : 'rgba(255,255,255,0.06)',
                    boxShadow: isSelected ? `0 0 20px ${cmd.accentColor}30, inset 0 0 20px ${cmd.accentColor}08` : 'none',
                    transform: isSelected ? 'translateY(-4px)' : 'none',
                  }}
                  onClick={() => handleSelectCommander(cmd.id)}
                  onMouseEnter={(e) => {
                    if (!isSelected) gsap.to(e.currentTarget, { y: -4, duration: 0.2, ease: 'power2.out' });
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) gsap.to(e.currentTarget, { y: 0, duration: 0.2, ease: 'power2.in' });
                  }}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cmd.accentColor }} />
                  )}
                  <CommanderPortrait commander={cmd} size={80} />
                  <div className="text-center">
                    <div className="font-mono text-xs font-bold tracking-wider" style={{ color: isSelected ? cmd.accentColor : '#94a3b8' }}>
                      {cmd.name}
                    </div>
                    <div className="font-mono text-[8px] tracking-wide text-slate-600 mt-0.5">
                      {language === 'zh-TW' ? cmd.titleZh : cmd.title}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: cmd.accentColor }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* COMMANDER DETAIL + PLAY */}
        <div ref={detailRef} className="w-full max-w-5xl grid grid-cols-5 gap-4">
          {/* Detail panel */}
          <div className="col-span-3 border p-4 relative overflow-hidden" style={{
            background: `linear-gradient(160deg, ${commander.bgFrom}, ${commander.bgTo})`,
            borderColor: commander.accentColor + '40',
            boxShadow: `inset 0 0 40px ${commander.accentColor}08`,
          }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: commander.accentColor + '60' }} />
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <CommanderPortrait commander={commander} size={130} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono font-black text-2xl tracking-wider" style={{ color: commander.accentColor }}>
                  {commander.name}
                </div>
                <div className="font-mono text-[10px] text-slate-400 tracking-widest mb-2">
                  {language === 'zh-TW' ? commander.titleZh : commander.title}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3 italic"
                   style={{ borderLeft: `2px solid ${commander.accentColor}40`, paddingLeft: 8 }}>
                  {commander.lore}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  <StatBar label="INTEL" value={commander.stats.intel} color={commander.accentColor} />
                  <StatBar label="CMD" value={commander.stats.command} color={commander.accentColor} />
                  <StatBar label="TECH" value={commander.stats.tech} color={commander.accentColor} />
                  <StatBar label="COMB" value={commander.stats.combat} color={commander.accentColor} />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Passive */}
              <div className="p-3 border" style={{ borderColor: commander.accentColor + '30', background: 'rgba(0,0,0,0.3)' }}>
                <div className="font-mono text-[8px] tracking-widest text-slate-500 mb-1">PASSIVE ABILITY</div>
                <div className="font-mono text-[11px] font-bold mb-1" style={{ color: commander.accentColor }}>
                  {language === 'zh-TW' ? commander.passive.nameZh : commander.passive.name}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {language === 'zh-TW' ? commander.passive.descriptionZh : commander.passive.description}
                </p>
              </div>
              {/* Active */}
              <div className="p-3 border relative" style={{ borderColor: '#ef4444' + '40', background: 'rgba(0,0,0,0.3)' }}>
                <div className="font-mono text-[8px] tracking-widest text-slate-500 mb-1">ACTIVE ABILITY</div>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-mono text-[11px] font-bold text-red-400">
                    {language === 'zh-TW' ? commander.active.nameZh : commander.active.name}
                  </div>
                  <span className="font-mono text-[8px] text-slate-500 border border-slate-700 px-1">{commander.active.cooldown}s CD</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {language === 'zh-TW' ? commander.active.descriptionZh : commander.active.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right column: Stats + Actions */}
          <div className="col-span-2 flex flex-col gap-3">
            {/* Operator Status */}
            <div className="border p-3" style={{ borderColor: 'rgba(0,212,255,0.15)', background: 'rgba(3,12,24,0.6)' }}>
              <div className="font-mono text-[9px] tracking-widest text-slate-500 mb-2">OPERATOR STATUS</div>
              <div className="space-y-1.5">
                {[
                  { label: 'GAMES', value: studentStatus?.totalGames || 0 },
                  { label: 'KILLS', value: studentStatus?.totalEnemiesKilled || 0 },
                  { label: 'BEST WAVE', value: studentStatus?.highestWave || 0 },
                  { label: 'CREDITS', value: studentStatus?.credits || 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-500 tracking-wider">{label}</span>
                    <span className="font-mono text-[11px] font-bold text-cyan-400">{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deploy button */}
            <button
              type="button"
              onClick={handleStartCombat}
              className="relative overflow-hidden border-2 py-4 font-mono font-black text-lg tracking-[0.2em] transition-all duration-200 group"
              style={{
                borderColor: commander.accentColor,
                color: commander.accentColor,
                background: `linear-gradient(135deg, ${commander.bgFrom}, ${commander.bgTo})`,
                boxShadow: `0 0 30px ${commander.accentColor}20`,
                textShadow: `0 0 12px ${commander.accentColor}80`,
              }}
              onMouseEnter={(e) => {
                gsap.to(e.currentTarget, { scale: 1.03, duration: 0.15 });
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, { scale: 1, duration: 0.15 });
              }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                background: `linear-gradient(135deg, ${commander.accentColor}20, transparent)`,
              }} />
              <span className="relative">{language === 'zh-TW' ? '>> 出擊 <<' : '>> DEPLOY <<'}</span>
            </button>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveView('lucky-draw')}
                className="border py-2 font-mono text-[10px] tracking-wider transition-colors hover:bg-yellow-950/30"
                style={{ borderColor: '#facc1540', color: '#facc15' }}
              >
                {language === 'zh-TW' ? '幸運抽卡' : 'LUCKY DRAW'}
              </button>
              <button
                type="button"
                onClick={() => setActiveView('towers')}
                className="border py-2 font-mono text-[10px] tracking-wider transition-colors hover:bg-blue-950/30"
                style={{ borderColor: '#3b82f640', color: '#60a5fa' }}
              >
                {language === 'zh-TW' ? '武器庫' : 'ARSENAL'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div ref={navRef} className="relative z-10 border-t" style={{ borderColor: 'rgba(0,212,255,0.12)', background: 'rgba(3,12,24,0.9)' }}>
        <div className="flex items-center justify-center gap-1 px-4 py-2">
          {[
            { id: 'lobby', label: language === 'zh-TW' ? '指揮中心' : 'COMMAND', icon: '[CMD]' },
            { id: 'cards', label: language === 'zh-TW' ? '卡牌圖鑑' : 'CARDS', icon: '[CRD]' },
            { id: 'towers', label: language === 'zh-TW' ? '武器庫' : 'ARSENAL', icon: '[WPN]' },
            { id: 'enemies', label: language === 'zh-TW' ? '敵方情報' : 'INTEL', icon: '[INT]' },
            { id: 'leaderboard', label: language === 'zh-TW' ? '排行榜' : 'RANKINGS', icon: '[RNK]' },
          ].map(({ id, label, icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setActiveView(id as any)}
              className="flex flex-col items-center gap-0.5 px-6 py-2 font-mono transition-colors group"
              style={{
                color: activeView === id ? '#00d4ff' : '#475569',
                borderTop: activeView === id ? '2px solid #00d4ff' : '2px solid transparent',
              }}
              onMouseEnter={(e) => gsap.to(e.currentTarget, { color: '#00d4ff', duration: 0.15 })}
              onMouseLeave={(e) => { if (activeView !== id) gsap.to(e.currentTarget, { color: '#475569', duration: 0.15 }); }}
            >
              <span className="text-[10px] tracking-widest">{icon}</span>
              <span className="text-[9px] tracking-[0.15em]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
