// src/components/LobbyScreen.tsx
// Redesigned lobby with modern UI/UX principles and bilingual support
import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { GameBoard } from './GameBoard';
import { LuckyDraw } from './LuckyDraw';
import { TowerGallery } from './TowerGallery';
import { EnemyDictionary } from './EnemyDictionary';
import { ModeSelection, type GameMode } from './ModeSelection';
import { useLanguage } from '../i18n/useTranslation';

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
  user: User;
  studentStatus: StudentStatus | null;
  onSignOut: () => void;
  onStatusUpdate: () => Promise<void>;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ user, studentStatus, onSignOut, onStatusUpdate }) => {
  const [activeView, setActiveView] = useState<'lobby' | 'game' | 'mode-selection' | 'lucky-draw' | 'towers' | 'enemies'>('lobby');
  const [showGame, setShowGame] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const { language, setLanguage, t } = useLanguage();

  const handleStartCombat = () => {
    setActiveView('mode-selection');
  };

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
    setShowGame(true);
    setActiveView('game');
  };

  const handleGameEnd = async (gameResult?: { wave: number; enemiesKilled: number; moneyEarned: number; towersBuilt: number }) => {
    setShowGame(false);
    setActiveView('lobby');
    setSelectedMode(null);
    if (gameResult) {
      await onStatusUpdate();
    }
  };

  if (showGame && selectedMode) {
    return <GameBoard onGameEnd={handleGameEnd} questionSetId={selectedMode.questionSetId} />;
  }

  if (activeView === 'mode-selection') {
    return <ModeSelection onSelectMode={handleModeSelect} onBack={() => setActiveView('lobby')} />;
  }

  if (activeView === 'lucky-draw') {
    return <LuckyDraw user={user} credits={studentStatus?.credits || 0} onBack={() => setActiveView('lobby')} onStatusUpdate={onStatusUpdate} />;
  }

  if (activeView === 'towers') {
    return <TowerGallery unlockedTowers={studentStatus?.unlockedTowers || []} onBack={() => setActiveView('lobby')} />;
  }

  if (activeView === 'enemies') {
    return <EnemyDictionary 
      onBack={() => setActiveView('lobby')} 
      encounteredEnemies={studentStatus?.encounteredEnemies || []}
    />;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 overflow-y-auto">
      {/* Modern Glassmorphism Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section - Modern Glassmorphism */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 mb-3 drop-shadow-2xl">
                  {language === 'zh-TW' ? t('lobby.title') : 'COMMAND CENTER'}
                </h1>
                <p className="text-slate-300 text-base md:text-lg">
                  {language === 'zh-TW' ? t('lobby.welcome') : 'Welcome back'}, <span className="text-yellow-400 font-semibold">{user.displayName || (language === 'zh-TW' ? '指揮官' : 'Commander')}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Language Toggle */}
                <button
                  onClick={() => setLanguage(language === 'en' ? 'zh-TW' : 'en')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl transition-all border border-white/20 font-semibold text-sm"
                >
                  {language === 'en' ? '中文' : 'EN'}
                </button>
                <button
                  onClick={onSignOut}
                  className="px-5 py-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md text-white rounded-xl transition-all border border-red-500/30 font-semibold"
                >
                  {t('menu.signOut')}
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Glassmorphism Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Credits Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/20 shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center text-3xl shadow-lg">
                  💰
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 text-sm mb-1">{t('lobby.credits')}</div>
                  <div className="text-3xl font-bold text-yellow-400">{studentStatus?.credits || 0}</div>
                </div>
              </div>
            </div>

            {/* Highest Wave Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-xl flex items-center justify-center text-3xl shadow-lg">
                  🌊
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 text-sm mb-1">{t('lobby.highestWave')}</div>
                  <div className="text-3xl font-bold text-blue-400">{studentStatus?.highestWave || 0}</div>
                </div>
              </div>
            </div>

            {/* Games Played Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center text-3xl shadow-lg">
                  🎮
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 text-sm mb-1">{t('lobby.gamesPlayed')}</div>
                  <div className="text-3xl font-bold text-purple-400">{studentStatus?.totalGames || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Action Cards - Modern Bento Grid Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Start Combat - Hero Card (Larger) */}
            <button
              onClick={handleStartCombat}
              className="group relative md:col-span-2 lg:col-span-1 bg-gradient-to-br from-purple-600/40 via-pink-600/40 to-purple-700/40 backdrop-blur-xl rounded-3xl p-8 border-2 border-purple-400/30 shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 hover:scale-[1.02] hover:border-purple-300/50 overflow-hidden"
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">⚔️</div>
                <h2 className="text-3xl font-bold text-white mb-3">{t('lobby.startCombat')}</h2>
                <p className="text-purple-100 text-base mb-4">{language === 'zh-TW' ? '開始新的防禦任務' : 'Begin a new defense mission'}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                  <span className="text-purple-200 text-sm font-semibold">{language === 'zh-TW' ? '選擇模式 →' : 'Select Mode →'}</span>
                </div>
              </div>
            </button>

            {/* Lucky Draw Card */}
            <button
              onClick={() => setActiveView('lucky-draw')}
              className="group relative bg-gradient-to-br from-yellow-500/40 via-orange-500/40 to-amber-600/40 backdrop-blur-xl rounded-3xl p-8 border-2 border-yellow-400/30 shadow-2xl hover:shadow-yellow-500/50 transition-all duration-500 hover:scale-[1.02] hover:border-yellow-300/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300 animate-spin-slow">🎰</div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('lobby.luckyDraw')}</h2>
                <p className="text-yellow-100 text-sm mb-3">{language === 'zh-TW' ? '使用積分抽取強大的防禦塔' : 'Draw powerful towers with credits'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-200 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
                    {language === 'zh-TW' ? '100 積分' : '100 credits'}
                  </span>
                  <span className="text-yellow-300 text-2xl">→</span>
                </div>
              </div>
            </button>

            {/* Tower Gallery Card */}
            <button
              onClick={() => setActiveView('towers')}
              className="group relative bg-gradient-to-br from-blue-600/40 via-cyan-600/40 to-blue-700/40 backdrop-blur-xl rounded-3xl p-8 border-2 border-blue-400/30 shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 hover:scale-[1.02] hover:border-blue-300/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">🏰</div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('lobby.towerGallery')}</h2>
                <p className="text-blue-100 text-sm mb-3">{language === 'zh-TW' ? '查看所有可用的防禦塔' : 'View all available towers'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-200 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
                    {studentStatus?.unlockedTowers.length || 0} {language === 'zh-TW' ? '已解鎖' : 'unlocked'}
                  </span>
                  <span className="text-blue-300 text-2xl">→</span>
                </div>
              </div>
            </button>

            {/* Enemy Dictionary Card */}
            <button
              onClick={() => setActiveView('enemies')}
              className="group relative bg-gradient-to-br from-red-600/40 via-rose-600/40 to-red-700/40 backdrop-blur-xl rounded-3xl p-8 border-2 border-red-400/30 shadow-2xl hover:shadow-red-500/50 transition-all duration-500 hover:scale-[1.02] hover:border-red-300/50 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📖</div>
                <h2 className="text-2xl font-bold text-white mb-2">{t('lobby.enemyDictionary')}</h2>
                <p className="text-red-100 text-sm mb-3">{t('enemy.study')}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-200 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
                    {studentStatus?.encounteredEnemies?.length || 0} {language === 'zh-TW' ? '已發現' : 'discovered'}
                  </span>
                  <span className="text-red-300 text-2xl">→</span>
                </div>
              </div>
            </button>

            {/* Statistics Card - Detailed */}
            <div className="group relative bg-gradient-to-br from-slate-800/40 via-slate-700/40 to-slate-800/40 backdrop-blur-xl rounded-3xl p-8 border-2 border-slate-600/30 shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-5xl">📊</div>
                  <h2 className="text-2xl font-bold text-white">{t('lobby.stats')}</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-300 text-sm">{t('lobby.totalWaves')}</span>
                    <span className="text-white font-bold text-lg">{studentStatus?.totalWaves || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-300 text-sm">{t('lobby.enemiesKilled')}</span>
                    <span className="text-white font-bold text-lg">{studentStatus?.totalEnemiesKilled.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-300 text-sm">{t('lobby.totalEarned')}</span>
                    <span className="text-green-400 font-bold text-lg">${studentStatus?.totalMoneyEarned.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Card (Future) */}
            <div className="group relative bg-gradient-to-br from-emerald-600/20 via-teal-600/20 to-emerald-700/20 backdrop-blur-xl rounded-3xl p-8 border-2 border-emerald-400/20 shadow-xl opacity-60 cursor-not-allowed">
              <div className="relative z-10">
                <div className="text-6xl mb-4 opacity-50">🏆</div>
                <h2 className="text-2xl font-bold text-white mb-2 opacity-70">{language === 'zh-TW' ? '排行榜' : 'Leaderboard'}</h2>
                <p className="text-emerald-100 text-sm opacity-70">{language === 'zh-TW' ? '即將推出' : 'Coming Soon'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
