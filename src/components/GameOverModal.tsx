// src/components/GameOverModal.tsx
import React from 'react';
import { i18n } from '../utils/i18n';

interface GameOverModalProps {
  isOpen: boolean;
  onRestart: () => void;
  stats: {
    wave: number;
    towersBuilt: number;
    enemiesKilled: number;
    moneyEarned: number;
  };
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ isOpen, onRestart, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-red-500/50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-red-500 mb-2 animate-pulse">
            {i18n.t('gameOver.title')}
          </h1>
          <div className="text-2xl mb-4">💀</div>
          <p className="text-slate-400 text-sm">
            {i18n.t('gameOver.subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 space-y-3 border border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">{i18n.t('gameOver.waveReached')}:</span>
            <span className="text-white font-bold text-lg">{stats.wave}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">{i18n.t('gameOver.towersBuilt')}:</span>
            <span className="text-white font-bold text-lg">{stats.towersBuilt}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">{i18n.t('gameOver.enemiesKilled')}:</span>
            <span className="text-white font-bold text-lg">{stats.enemiesKilled}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-700 pt-3">
            <span className="text-slate-400">{i18n.t('gameOver.totalEarned')}:</span>
            <span className="text-green-400 font-bold text-xl">${stats.moneyEarned}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          >
            {i18n.t('gameOver.restart')}
          </button>
        </div>
      </div>
    </div>
  );
};
