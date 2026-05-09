// src/components/WaveShopModal.tsx
// Environment transition shop — appears every 10 waves
import React, { useState } from 'react';
import { generateBuffChoices, getBuffDescription, type BuffDefinition } from '../engine/buffSystem';
import { THEMES } from '../engine/data';
import { i18n } from '../utils/i18n';

interface WaveShopModalProps {
  isOpen: boolean;
  wave: number;
  gold: number;
  lives: number;
  onPurchase: (itemId: string) => void;
  onSelectBuff: (buff: BuffDefinition) => void;
  onSpendGold: (amount: number) => void;
  onClose: () => void;
}

const RARITY_STYLE: Record<string, { border: string; bg: string; badge: string; title: string }> = {
  legendary: { border: '#facc15', bg: 'rgba(120,60,0,0.7)', badge: 'bg-yellow-500 text-black', title: 'text-yellow-300' },
  epic:      { border: '#a855f7', bg: 'rgba(80,20,100,0.7)', badge: 'bg-purple-500 text-white', title: 'text-purple-300' },
  rare:      { border: '#38bdf8', bg: 'rgba(10,60,100,0.7)', badge: 'bg-sky-500 text-white', title: 'text-sky-300' },
  common:    { border: '#475569', bg: 'rgba(20,30,45,0.7)', badge: 'bg-slate-600 text-slate-200', title: 'text-slate-200' },
};

const BUFF_STAT_ICON: Record<string, string> = {
  damageMultiplier: '⚔',
  attackSpeedMultiplier: '⚡',
  rangeMultiplier: '◎',
  moneyMultiplier: '$',
  enemySpeedMultiplier: '☽',
  enemyHpMultiplier: '▼',
  livesChange: '♥',
};

function getBoonIcon(buff: BuffDefinition): string {
  for (const [key, icon] of Object.entries(BUFF_STAT_ICON)) {
    if ((buff as any)[key] !== undefined) return icon;
  }
  return '✦';
}

function getRarityForWave(wave: number): 'common' | 'rare' | 'epic' | 'legendary' | undefined {
  if (wave >= 20) return Math.random() < 0.3 ? 'legendary' : Math.random() < 0.5 ? 'epic' : 'rare';
  if (wave >= 10) return Math.random() < 0.2 ? 'epic' : Math.random() < 0.5 ? 'rare' : 'common';
  return Math.random() < 0.3 ? 'rare' : 'common';
}

export const WaveShopModal: React.FC<WaveShopModalProps> = ({
  isOpen, wave, gold, lives, onPurchase, onSelectBuff, onSpendGold, onClose
}) => {
  const [purchasedBoons, setPurchasedBoons] = useState<Set<string>>(new Set());
  const [rerolls, setRerolls] = useState(0);
  const [currentBoons, setCurrentBoons] = useState<BuffDefinition[]>(() => generateBuffChoices(getRarityForWave(wave)));

  if (!isOpen) return null;

  const lang = i18n.getLanguage();

  const nextThemeIndex = Math.min(Math.floor(wave / 10), THEMES.length - 1);
  const nextTheme = THEMES[nextThemeIndex];
  const currentThemeIndex = Math.max(0, nextThemeIndex - 1);
  const currentTheme = THEMES[currentThemeIndex];

  const canBuy1Life = gold >= 60 && lives < 20;
  const canBuy3Lives = gold >= 150 && lives < 18;
  const canRestoreLives = gold >= 300 && lives < 10;

  const handleReroll = () => {
    const cost = 50 + rerolls * 25;
    if (gold >= cost) {
      onSpendGold(cost);
      setCurrentBoons(generateBuffChoices(getRarityForWave(wave)));
      setRerolls(r => r + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}>
      <div className="relative flex flex-col gap-0 max-w-2xl w-full mx-4 overflow-hidden"
           style={{ background: '#060c16', border: '2px solid #f59e0b', boxShadow: '0 0 60px rgba(245,158,11,0.3), 0 0 120px rgba(245,158,11,0.1)' }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between"
             style={{ background: 'linear-gradient(90deg, #1c0a00 0%, #0c1020 50%, #1c0a00 100%)', borderBottom: '1px solid #f59e0b40' }}>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: '#f59e0b' }}>
              ENVIRONMENT TRANSITION — WAVE {wave - 1} COMPLETE
            </div>
            <div className="text-xl font-black text-white mt-0.5">
              {currentTheme.name} → <span style={{ color: '#f59e0b' }}>{nextTheme.name}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Treasury</div>
            <div className="text-2xl font-black" style={{ color: '#fbbf24' }}>${gold}</div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 gap-5">

          {/* Life Recovery Section */}
          <div>
            <div className="text-[9px] tracking-[0.25em] uppercase font-bold text-slate-400 mb-2">
              LIFE SUPPORT
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => { if (canBuy1Life) { onPurchase('life_1'); } }}
                disabled={!canBuy1Life}
                className="flex-1 min-w-[120px] px-4 py-3 flex flex-col items-center gap-1 transition-all"
                style={{
                  background: canBuy1Life ? '#0f2010' : '#0a0f18',
                  border: `1px solid ${canBuy1Life ? '#22c55e' : '#1e293b'}`,
                  opacity: canBuy1Life ? 1 : 0.5,
                  cursor: canBuy1Life ? 'pointer' : 'not-allowed',
                }}
              >
                <span className="text-2xl">♥</span>
                <span className="text-xs font-black text-white">+1 Life</span>
                <span className="text-[10px]" style={{ color: '#4ade80' }}>60g</span>
              </button>

              <button
                onClick={() => { if (canBuy3Lives) { onPurchase('life_3'); } }}
                disabled={!canBuy3Lives}
                className="flex-1 min-w-[120px] px-4 py-3 flex flex-col items-center gap-1 transition-all"
                style={{
                  background: canBuy3Lives ? '#0f2010' : '#0a0f18',
                  border: `1px solid ${canBuy3Lives ? '#22c55e' : '#1e293b'}`,
                  opacity: canBuy3Lives ? 1 : 0.5,
                  cursor: canBuy3Lives ? 'pointer' : 'not-allowed',
                }}
              >
                <span className="text-2xl">♥♥♥</span>
                <span className="text-xs font-black text-white">+3 Lives</span>
                <span className="text-[10px]" style={{ color: '#4ade80' }}>150g</span>
              </button>

              <button
                onClick={() => { if (canRestoreLives) { onPurchase('life_restore'); } }}
                disabled={!canRestoreLives}
                className="flex-1 min-w-[140px] px-4 py-3 flex flex-col items-center gap-1 transition-all"
                style={{
                  background: canRestoreLives ? '#100f20' : '#0a0f18',
                  border: `1px solid ${canRestoreLives ? '#a78bfa' : '#1e293b'}`,
                  opacity: canRestoreLives ? 1 : 0.5,
                  cursor: canRestoreLives ? 'pointer' : 'not-allowed',
                }}
              >
                <span className="text-2xl">🛡</span>
                <span className="text-xs font-black text-white">Restore to 10</span>
                <span className="text-[9px] text-slate-400">if below 10</span>
                <span className="text-[10px]" style={{ color: '#c4b5fd' }}>300g</span>
              </button>
            </div>
          </div>

          {/* Boon Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] tracking-[0.25em] uppercase font-bold text-slate-400">
                TACTICAL BOONS — CHOOSE ONE FREE
              </div>
              <button
                onClick={handleReroll}
                disabled={gold < 50 + rerolls * 25}
                className="text-[9px] px-2 py-0.5 font-bold transition-all"
                style={{
                  background: gold >= 50 + rerolls * 25 ? '#1e1a00' : '#0a0f18',
                  border: `1px solid ${gold >= 50 + rerolls * 25 ? '#f59e0b' : '#1e293b'}`,
                  color: gold >= 50 + rerolls * 25 ? '#fbbf24' : '#475569',
                }}
              >
                REROLL {50 + rerolls * 25}g
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {currentBoons.map((buff) => {
                const style = RARITY_STYLE[buff.rarity] ?? RARITY_STYLE.common;
                const alreadyPicked = purchasedBoons.size > 0;
                return (
                  <button
                    key={buff.id}
                    disabled={alreadyPicked}
                    onClick={() => {
                      if (!alreadyPicked) {
                        setPurchasedBoons(new Set([buff.id]));
                        onSelectBuff(buff);
                      }
                    }}
                    className="flex flex-col gap-2 p-3 text-left transition-all"
                    style={{
                      background: purchasedBoons.has(buff.id) ? 'rgba(30,60,30,0.8)' : style.bg,
                      border: `1px solid ${purchasedBoons.has(buff.id) ? '#22c55e' : style.border}`,
                      opacity: alreadyPicked && !purchasedBoons.has(buff.id) ? 0.35 : 1,
                      cursor: alreadyPicked ? 'default' : 'pointer',
                      boxShadow: purchasedBoons.has(buff.id) ? `0 0 12px #22c55e40` : `0 0 8px ${style.border}20`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black" style={{ color: style.border }}>{getBoonIcon(buff)}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase ${style.badge}`}>{buff.rarity}</span>
                    </div>
                    <div className={`text-[11px] font-black leading-tight ${style.title}`}>
                      {lang === 'zh' ? buff.nameZh : buff.name}
                    </div>
                    <div className="text-[9px] text-slate-400 leading-snug">
                      {getBuffDescription(buff, lang === 'zh' ? 'zh' : 'en')}
                    </div>
                    {purchasedBoons.has(buff.id) && (
                      <div className="text-[9px] text-green-400 font-bold">ACQUIRED ✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between"
             style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid #f59e0b30' }}>
          <div className="text-[10px] text-slate-500">
            Lives: {lives}/20
          </div>
          <button
            onClick={onClose}
            className="px-8 py-3 font-black text-sm tracking-widest transition-all hover:scale-105"
            style={{ background: 'linear-gradient(90deg, #92400e, #b45309)', border: '1px solid #f59e0b', color: '#fef3c7', boxShadow: '0 0 16px rgba(245,158,11,0.3)' }}
          >
            ADVANCE TO WAVE {wave} →
          </button>
        </div>
      </div>
    </div>
  );
};
