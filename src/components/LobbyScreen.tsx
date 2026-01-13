// src/components/LobbyScreen.tsx
import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { GameBoard } from './GameBoard';
import { LuckyDraw } from './LuckyDraw';
import { TowerGallery } from './TowerGallery';
import { EnemyDictionary } from './EnemyDictionary';
import { ModeSelection, type GameMode } from './ModeSelection';

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
    return <EnemyDictionary onBack={() => setActiveView('lobby')} />;
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 overflow-y-auto">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 mb-2">
                COMMAND CENTER
              </h1>
              <p className="text-slate-300 text-sm md:text-base">Welcome back, {user.displayName || 'Commander'}</p>
            </div>
            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600"
            >
              Sign Out
            </button>
          </div>

          {/* Credits Display */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">💰</div>
                <div>
                  <div className="text-slate-300 text-sm">Available Credits</div>
                  <div className="text-3xl font-bold text-yellow-400">{studentStatus?.credits || 0}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-300 text-sm">Highest Wave</div>
                <div className="text-2xl font-bold text-white">{studentStatus?.highestWave || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Lobby Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Start Combat Card */}
          <button
            onClick={handleStartCombat}
            className="group relative bg-gradient-to-br from-purple-600/90 to-pink-600/90 backdrop-blur-lg rounded-2xl p-8 border border-purple-400/30 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 hover:border-purple-300/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">⚔️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Start Combat</h2>
              <p className="text-purple-100 text-sm">Begin a new defense mission</p>
            </div>
          </button>

          {/* Lucky Draw Card */}
          <button
            onClick={() => setActiveView('lucky-draw')}
            className="group relative bg-gradient-to-br from-yellow-500/90 to-orange-500/90 backdrop-blur-lg rounded-2xl p-8 border border-yellow-400/30 shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 hover:border-yellow-300/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300 animate-spin-slow">🎰</div>
              <h2 className="text-2xl font-bold text-white mb-2">Lucky Draw</h2>
              <p className="text-yellow-100 text-sm">Draw powerful towers with credits</p>
              <div className="mt-2 text-xs text-yellow-200">Cost: 100 credits</div>
            </div>
          </button>

          {/* Tower Gallery Card */}
          <button
            onClick={() => setActiveView('towers')}
            className="group relative bg-gradient-to-br from-blue-600/90 to-cyan-600/90 backdrop-blur-lg rounded-2xl p-8 border border-blue-400/30 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 hover:border-blue-300/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">🏰</div>
              <h2 className="text-2xl font-bold text-white mb-2">Tower Gallery</h2>
              <p className="text-blue-100 text-sm">View all available towers</p>
              <div className="mt-2 text-xs text-blue-200">
                {studentStatus?.unlockedTowers.length || 0} unlocked
              </div>
            </div>
          </button>

          {/* Enemy Dictionary Card */}
          <button
            onClick={() => setActiveView('enemies')}
            className="group relative bg-gradient-to-br from-red-600/90 to-rose-600/90 backdrop-blur-lg rounded-2xl p-8 border border-red-400/30 shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 hover:border-red-300/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">📖</div>
              <h2 className="text-2xl font-bold text-white mb-2">Enemy Dictionary</h2>
              <p className="text-red-100 text-sm">Study enemy types and abilities</p>
            </div>
          </button>

          {/* Stats Card */}
          <div className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <div className="relative z-10">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-white mb-4">Statistics</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Games Played</span>
                  <span className="text-white font-bold">{studentStatus?.totalGames || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Waves</span>
                  <span className="text-white font-bold">{studentStatus?.totalWaves || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Enemies Killed</span>
                  <span className="text-white font-bold">{studentStatus?.totalEnemiesKilled.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Earned</span>
                  <span className="text-green-400 font-bold">${studentStatus?.totalMoneyEarned.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Card (Future) */}
          <div className="group relative bg-gradient-to-br from-emerald-600/90 to-teal-600/90 backdrop-blur-lg rounded-2xl p-8 border border-emerald-400/30 shadow-2xl opacity-50 cursor-not-allowed">
            <div className="relative z-10">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-2">Leaderboard</h2>
              <p className="text-emerald-100 text-sm">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
