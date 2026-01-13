// src/components/ModeSelection.tsx
// Mode selection screen - choose which question set to play
import React, { useState, useEffect } from 'react';
import { getAllQuestionSets, initializeDefaultQuestionSets } from '../services/questionSetService';
import { useLanguage } from '../i18n/useTranslation';

export interface GameMode {
  id?: string;
  name: string;
  description: string;
  questionSetId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  color: string;
  nameZh?: string;
  descriptionZh?: string;
}

interface ModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode, onBack }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [gameModes, setGameModes] = useState<GameMode[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    loadQuestionSets();
  }, []);

  const loadQuestionSets = async () => {
    try {
      // Initialize default sets if needed
      await initializeDefaultQuestionSets();
      
      // Load all question sets
      const sets = await getAllQuestionSets();
      
      // Convert to GameMode format
      const modes: GameMode[] = sets.map(set => ({
        id: set.id,
        name: set.name,
        description: set.description,
        questionSetId: set.questionSetId,
        difficulty: set.difficulty,
        icon: set.icon,
        color: set.color,
        nameZh: set.nameZh,
        descriptionZh: set.descriptionZh
      }));
      
      setGameModes(modes);
    } catch (error) {
      console.error('Error loading question sets:', error);
      // Fallback to default modes if loading fails
      setGameModes([
        {
          id: 'math-basics',
          name: 'Math Basics',
          nameZh: '數學基礎',
          description: 'Basic arithmetic and algebra questions',
          descriptionZh: '基礎算術和代數題目',
          questionSetId: 'math-basics',
          difficulty: 'easy',
          icon: '🔢',
          color: '#3b82f6'
        },
        {
          id: 'mixed',
          name: 'Mixed Challenge',
          nameZh: '混合挑戰',
          description: 'Random questions from all categories',
          descriptionZh: '所有類別的隨機題目',
          questionSetId: 'mixed',
          difficulty: 'hard',
          icon: '🎯',
          color: '#ec4899'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl font-mono animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
      {/* Retro-style background pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        backgroundSize: '100% 4px'
      }}></div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Retro Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 mb-4 drop-shadow-2xl" style={{
            fontFamily: 'monospace',
            textShadow: '0 0 20px rgba(255,165,0,0.5), 0 0 40px rgba(255,165,0,0.3)',
            letterSpacing: '0.1em'
          }}>
            {t('mode.select')} / SELECT MODE
          </h1>
          <p className="text-yellow-400 text-lg md:text-xl font-mono">
            {t('mode.choose')} / Choose your question set
          </p>
        </div>

        {/* Mode Cards Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {gameModes.map((mode) => {
            const displayName = (language === 'zh-TW' && mode.nameZh) ? mode.nameZh : mode.name;
            const displayDesc = (language === 'zh-TW' && mode.descriptionZh) ? mode.descriptionZh : mode.description;
            
            return (
              <button
                key={mode.id || mode.questionSetId}
                onClick={() => setSelectedMode(mode)}
                className={`relative p-6 rounded-lg border-4 transition-all duration-200 transform hover:scale-105 ${
                  selectedMode?.questionSetId === mode.questionSetId
                    ? 'border-yellow-400 shadow-2xl shadow-yellow-400/50'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                style={{
                  background: selectedMode?.questionSetId === mode.questionSetId
                    ? `linear-gradient(135deg, ${mode.color}22, ${mode.color}11)`
                    : 'linear-gradient(135deg, rgba(30,30,30,0.8), rgba(20,20,20,0.8))',
                  boxShadow: selectedMode?.questionSetId === mode.questionSetId
                    ? `0 0 30px ${mode.color}66, inset 0 0 20px ${mode.color}33`
                    : '0 4px 6px rgba(0,0,0,0.3)'
                }}
              >
                {/* Retro scanline effect */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)'
                }}></div>

                <div className="relative z-10">
                  <div className="text-5xl mb-4">{mode.icon}</div>
                  <h2 className="text-2xl font-bold text-white mb-2 font-mono">{displayName}</h2>
                  <p className="text-slate-300 text-sm mb-4">{displayDesc}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded text-xs font-bold ${
                      mode.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                      mode.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {mode.difficulty.toUpperCase()}
                    </span>
                    {selectedMode?.questionSetId === mode.questionSetId && (
                      <span className="text-yellow-400 text-2xl animate-pulse">✓</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg border-2 border-slate-600 hover:border-slate-500 transition-all duration-200 transform hover:scale-105 font-mono"
          >
            ← {t('common.back')} / BACK
          </button>
          <button
            onClick={() => selectedMode && onSelectMode(selectedMode)}
            disabled={!selectedMode}
            className={`px-8 py-4 font-bold rounded-lg border-2 transition-all duration-200 transform hover:scale-105 font-mono ${
              selectedMode
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-400 shadow-lg shadow-yellow-500/50'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
          >
            {t('mode.startCombat')} / START COMBAT →
          </button>
        </div>
      </div>
    </div>
  );
};
