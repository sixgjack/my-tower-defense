// src/components/BuffSelectionModal.tsx
// Hades-style wave boon selection modal
import React from 'react';
import { generateBuffChoices, getBuffDescription, type BuffDefinition } from '../engine/buffSystem';
import { i18n } from '../utils/i18n';

interface BuffSelectionModalProps {
  isOpen: boolean;
  onSelect: (buff: BuffDefinition) => void;
  wave: number;
  gold?: number;
  onSpendGold?: (amount: number) => void;
}

const REROLL_COST = 50;

const RARITY_CONFIG = {
  legendary: {
    gradient: 'from-yellow-900/80 via-amber-800/80 to-yellow-900/80',
    border: 'border-yellow-400',
    glow: 'shadow-yellow-500/60',
    badge: 'bg-gradient-to-r from-yellow-500 to-orange-400 text-black',
    icon: '✦',
    titleColor: 'text-yellow-300',
    labelEn: 'Legendary',
    labelZh: '傳說',
  },
  epic: {
    gradient: 'from-purple-900/80 via-violet-800/80 to-purple-900/80',
    border: 'border-purple-400',
    glow: 'shadow-purple-500/60',
    badge: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    icon: '◆',
    titleColor: 'text-purple-300',
    labelEn: 'Epic',
    labelZh: '史詩',
  },
  rare: {
    gradient: 'from-blue-900/80 via-cyan-800/80 to-blue-900/80',
    border: 'border-blue-400',
    glow: 'shadow-blue-500/50',
    badge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    icon: '●',
    titleColor: 'text-blue-300',
    labelEn: 'Rare',
    labelZh: '稀有',
  },
  common: {
    gradient: 'from-slate-800/80 via-slate-700/80 to-slate-800/80',
    border: 'border-slate-500',
    glow: 'shadow-slate-500/30',
    badge: 'bg-slate-600 text-slate-200',
    icon: '○',
    titleColor: 'text-slate-200',
    labelEn: 'Common',
    labelZh: '普通',
  },
};

const BUFF_ICONS: Record<string, string> = {
  damageMultiplier: '⚔️',
  attackSpeedMultiplier: '⚡',
  rangeMultiplier: '🎯',
  moneyMultiplier: '💰',
  enemySpeedMultiplier: '🐌',
  enemyHpMultiplier: '🛡️',
  livesChange: '❤️',
};

function getBoonIcon(buff: BuffDefinition): string {
  for (const [key, icon] of Object.entries(BUFF_ICONS)) {
    if ((buff as any)[key] !== undefined) return icon;
  }
  return '✨';
}

// Hades-style flavor quotes per boon type
const BOON_FLAVOR: Record<string, { en: string; zh: string }> = {
  damageMultiplier:     { en: 'Strike with greater fury.', zh: '以更強的怒火出擊。' },
  attackSpeedMultiplier:{ en: 'Move like lightning itself.', zh: '如閃電般疾速。' },
  rangeMultiplier:      { en: 'Your reach extends beyond mortal limits.', zh: '你的射程超越凡人極限。' },
  moneyMultiplier:      { en: 'Wealth flows to the worthy.', zh: '財富流向有價值的人。' },
  enemySpeedMultiplier: { en: 'Time bends to your will.', zh: '時間向你的意志屈服。' },
  enemyHpMultiplier:    { en: 'Enemies crumble before you.', zh: '敵人在你面前崩潰。' },
  livesChange:          { en: 'Another chance to prevail.', zh: '又一次勝利的機會。' },
};

function getFlavorKey(buff: BuffDefinition): string {
  for (const key of Object.keys(BUFF_ICONS)) {
    if ((buff as any)[key] !== undefined) return key;
  }
  return 'damageMultiplier';
}

export const BuffSelectionModal: React.FC<BuffSelectionModalProps> = ({
  isOpen,
  onSelect,
  wave,
  gold = 0,
  onSpendGold,
}) => {
  const [choices, setChoices] = React.useState<BuffDefinition[]>([]);
  const [language, setLanguage] = React.useState<'en' | 'zh'>(i18n.getLanguage());
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [rerollsUsed, setRerollsUsed] = React.useState(0);

  const generateChoices = React.useCallback(() => {
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' | undefined;
    if (wave >= 20) rarity = Math.random() < 0.3 ? 'legendary' : Math.random() < 0.5 ? 'epic' : 'rare';
    else if (wave >= 10) rarity = Math.random() < 0.2 ? 'epic' : Math.random() < 0.5 ? 'rare' : 'common';
    else if (wave >= 5) rarity = Math.random() < 0.3 ? 'rare' : 'common';
    setChoices(generateBuffChoices(rarity));
  }, [wave]);

  React.useEffect(() => {
    if (isOpen) {
      setRerollsUsed(0);
      setLanguage(i18n.getLanguage());
      generateChoices();
    }
  }, [isOpen, generateChoices]);

  const handleReroll = () => {
    if (onSpendGold && gold >= REROLL_COST) {
      onSpendGold(REROLL_COST);
      setRerollsUsed(r => r + 1);
      generateChoices();
    }
  };

  if (!isOpen || choices.length === 0) return null;

  const zh = language === 'zh';
  const canReroll = !!onSpendGold && gold >= REROLL_COST;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Atmospheric background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-900/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header — Hades-style title */}
        <div className="text-center mb-8">
          <div className="text-slate-400 text-sm tracking-[0.3em] uppercase mb-2">
            {zh ? `第 ${wave} 波完成` : `Wave ${wave} Complete`}
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-lg mb-2">
            {zh ? '選擇恩惠' : 'Choose a Boon'}
          </h2>
          <p className="text-slate-400 text-base">
            {zh ? '從神祇力量中選擇一項強化，賦予你的防禦' : 'Select one divine gift to empower your defenses'}
          </p>
        </div>

        {/* Boon cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {choices.map((buff, idx) => {
            const cfg = RARITY_CONFIG[buff.rarity];
            const icon = getBoonIcon(buff);
            const flavorKey = getFlavorKey(buff);
            const flavor = BOON_FLAVOR[flavorKey];
            const desc = getBuffDescription(buff, language);
            const isHov = hovered === idx;

            return (
              <button
                key={buff.id}
                type="button"
                onClick={() => onSelect(buff)}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  relative group text-left p-6 rounded-2xl border-2 transition-all duration-300
                  bg-gradient-to-b ${cfg.gradient}
                  ${cfg.border}
                  ${isHov ? `shadow-2xl ${cfg.glow} scale-105` : 'shadow-lg scale-100'}
                  focus:outline-none focus:ring-2 focus:ring-white/30
                `}
              >
                {/* Rarity badge */}
                <div className={`absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-black ${cfg.badge}`}>
                  {cfg.icon} {zh ? cfg.labelZh : cfg.labelEn}
                </div>

                {/* Shimmer overlay for legendary */}
                {buff.rarity === 'legendary' && (
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/10 to-transparent animate-[shimmer_2s_infinite]" />
                  </div>
                )}

                {/* Icon */}
                <div className={`text-5xl mb-3 transition-transform duration-300 ${isHov ? 'scale-125' : ''}`}>
                  {icon}
                </div>

                {/* Boon name */}
                <h3 className={`text-xl font-black mb-1 ${cfg.titleColor}`}>
                  {zh ? buff.nameZh : buff.name}
                </h3>

                {/* Flavor quote */}
                <p className="text-slate-400 text-xs italic mb-3 leading-relaxed">
                  "{zh ? flavor.zh : flavor.en}"
                </p>

                {/* Stat lines */}
                <div className="space-y-1">
                  {desc.split(' - ')[0].replace(/^[^(]*\(/, '').replace(/\).*$/, '').split(', ').filter(Boolean).map((part, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-400 font-bold">+</span>
                      <span className="text-white/90">{part}</span>
                    </div>
                  ))}
                </div>

                {/* Duration */}
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {buff.durationType === 'permanent'
                      ? (zh ? '永久效果' : 'Permanent')
                      : buff.waves
                      ? (zh ? `持續 ${buff.waves} 波` : `${buff.waves} waves`)
                      : ''}
                  </span>
                  <span className={`text-xs font-bold ${cfg.titleColor} opacity-70`}>
                    {zh ? '點擊選擇 →' : 'Click to choose →'}
                  </span>
                </div>

                {/* Hover glow border */}
                {isHov && (
                  <div className={`absolute inset-0 rounded-2xl border-2 ${cfg.border} opacity-60 pointer-events-none`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Reroll row */}
        <div className="flex items-center justify-center gap-4">
          {onSpendGold && (
            <button
              type="button"
              onClick={handleReroll}
              disabled={!canReroll}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all border ${
                canReroll
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-600 cursor-not-allowed'
              }`}
            >
              🔄 {zh ? `重抽 (-${REROLL_COST} 金)` : `Reroll (-${REROLL_COST} gold)`}
              {rerollsUsed > 0 && <span className="ml-2 text-xs opacity-70">×{rerollsUsed}</span>}
            </button>
          )}
          <div className="text-slate-600 text-xs">
            {zh ? '選擇一項，繼續戰鬥' : 'Choose one to continue the fight'}
          </div>
        </div>
      </div>
    </div>
  );
};
