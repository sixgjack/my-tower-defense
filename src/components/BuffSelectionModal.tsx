// src/components/BuffSelectionModal.tsx
// 3-pick-1 roguelike buff selection modal

import React from 'react';
import { generateBuffChoices, getBuffDescription, type BuffDefinition } from '../engine/buffSystem';
import { i18n } from '../utils/i18n';

interface BuffSelectionModalProps {
  isOpen: boolean;
  onSelect: (buff: BuffDefinition) => void;
  wave: number;
}

export const BuffSelectionModal: React.FC<BuffSelectionModalProps> = ({ isOpen, onSelect, wave }) => {
  const [choices, setChoices] = React.useState<BuffDefinition[]>([]);
  const [language, setLanguage] = React.useState<'en' | 'zh'>(i18n.getLanguage());

  React.useEffect(() => {
    if (isOpen) {
      // Determine rarity based on wave
      let rarity: 'common' | 'rare' | 'epic' | 'legendary' | undefined = undefined;
      if (wave >= 20) {
        rarity = Math.random() < 0.3 ? 'legendary' : Math.random() < 0.5 ? 'epic' : 'rare';
      } else if (wave >= 10) {
        rarity = Math.random() < 0.2 ? 'epic' : Math.random() < 0.5 ? 'rare' : 'common';
      } else if (wave >= 5) {
        rarity = Math.random() < 0.3 ? 'rare' : 'common';
      }
      
      const buffChoices = generateBuffChoices(rarity);
      setChoices(buffChoices);
    }
  }, [isOpen, wave]);

  React.useEffect(() => {
    setLanguage(i18n.getLanguage());
  }, [isOpen]);

  if (!isOpen || choices.length === 0) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-600';
      case 'epic': return 'from-purple-400 via-pink-500 to-purple-600';
      case 'rare': return 'from-blue-400 via-cyan-500 to-blue-600';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 shadow-yellow-500/50';
      case 'epic': return 'border-purple-400 shadow-purple-500/50';
      case 'rare': return 'border-blue-400 shadow-blue-500/50';
      default: return 'border-gray-400 shadow-gray-500/50';
    }
  };

  const getRarityLabel = (rarity: string, lang: 'en' | 'zh') => {
    if (lang === 'zh') {
      switch (rarity) {
        case 'legendary': return '傳說';
        case 'epic': return '史詩';
        case 'rare': return '稀有';
        default: return '普通';
      }
    } else {
      return rarity.charAt(0).toUpperCase() + rarity.slice(1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl border-4 border-purple-500 shadow-2xl p-8 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 mb-2">
            {language === 'zh' ? '選擇強化' : 'Choose Your Power'}
          </h2>
          <p className="text-slate-400 text-lg">
            {language === 'zh' 
              ? `第 ${wave} 波完成！選擇一個強化效果` 
              : `Wave ${wave} Complete! Choose a power-up`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {choices.map((buff) => (
            <button
              key={buff.id}
              onClick={() => onSelect(buff)}
              className={`
                relative group p-6 rounded-xl border-4 transition-all duration-300
                bg-gradient-to-br ${getRarityColor(buff.rarity)}
                ${getRarityBorder(buff.rarity)}
                hover:scale-105 hover:shadow-2xl hover:shadow-current
                active:scale-95
                transform
              `}
            >
              {/* Rarity Badge */}
              <div className="absolute -top-3 -right-3 bg-slate-900 px-3 py-1 rounded-full border-2 border-current">
                <span className="text-xs font-bold text-white">
                  {getRarityLabel(buff.rarity, language)}
                </span>
              </div>

              {/* Buff Icon/Emoji */}
              <div className="text-5xl mb-4 text-center">
                {buff.damageMultiplier ? '⚔️' :
                 buff.attackSpeedMultiplier ? '⚡' :
                 buff.rangeMultiplier ? '🎯' :
                 buff.moneyMultiplier ? '💰' :
                 buff.enemySpeedMultiplier ? '🐌' :
                 buff.enemyHpMultiplier ? '🛡️' :
                 buff.livesChange ? '❤️' : '✨'}
              </div>

              {/* Buff Name */}
              <h3 className="text-2xl font-black text-white mb-3 text-center">
                {language === 'zh' ? buff.nameZh : buff.name}
              </h3>

              {/* Buff Description */}
              <div className="text-sm text-white/90 mb-4 space-y-1">
                {getBuffDescription(buff, language)
                  .split(' - ')
                  .map((part, i) => (
                    <div key={i} className={i === 0 ? 'font-semibold' : 'text-xs opacity-80'}>
                      {part}
                    </div>
                  ))}
              </div>

              {/* Duration Badge */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/40 rounded px-2 py-1 text-xs text-white/80">
                  {buff.durationType === 'permanent' 
                    ? (language === 'zh' ? '永久' : 'Permanent')
                    : buff.waves 
                      ? (language === 'zh' ? `持續 ${buff.waves} 波` : `${buff.waves} waves`)
                      : ''}
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300" />
            </button>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-slate-400 text-sm">
          {language === 'zh' 
            ? '點擊其中一個選項來選擇你的強化效果'
            : 'Click one of the options above to select your power-up'}
        </div>
      </div>
    </div>
  );
};
