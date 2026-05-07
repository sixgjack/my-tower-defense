// src/components/LuckyDraw.tsx
import React, { useState } from 'react';
import type { GoogleUser } from '../services/googleAuth';
import * as db from '../services/postgresDatabase';
import { TOWERS } from '../engine/data';
import { useLanguage } from '../i18n/useTranslation';

interface LuckyDrawProps {
  user: GoogleUser;
  credits: number;
  unlockedTowers: string[];
  onBack: () => void;
  onStatusUpdate: () => Promise<void>;
}

const DRAW_COST = 100;
const RARITY_WEIGHTS = {
  common: 60,
  rare: 25,
  epic: 12,
  legendary: 3
};

function getRarity(): 'common' | 'rare' | 'epic' | 'legendary' {
  const rand = Math.random() * 100;
  if (rand < RARITY_WEIGHTS.legendary) return 'legendary';
  if (rand < RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.epic) return 'epic';
  if (rand < RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.epic + RARITY_WEIGHTS.rare) return 'rare';
  return 'common';
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeUnlocked(input: string[]): string[] {
  const valid = new Set(Object.keys(TOWERS));
  return Array.from(new Set((input || []).filter((k) => valid.has(k))));
}

function splitPoolsByRarity(allKeys: string[]) {
  const sorted = [...allKeys].sort((a, b) => TOWERS[b].cost - TOWERS[a].cost); // Expensive first
  const len = sorted.length;
  const legendaryEnd = Math.max(1, Math.floor(len * 0.1));
  const epicEnd = Math.max(legendaryEnd + 1, Math.floor(len * 0.4));
  const rareEnd = Math.max(epicEnd + 1, Math.floor(len * 0.7));

  const pools = {
    legendary: sorted.slice(0, legendaryEnd),
    epic: sorted.slice(legendaryEnd, epicEnd),
    rare: sorted.slice(epicEnd, rareEnd),
    common: sorted.slice(rareEnd),
  };

  // Guard against empty groups in tiny datasets.
  if (pools.common.length === 0) pools.common = [...sorted];
  if (pools.rare.length === 0) pools.rare = [...pools.common];
  if (pools.epic.length === 0) pools.epic = [...pools.rare];
  if (pools.legendary.length === 0) pools.legendary = [...pools.epic];
  return pools;
}

export const LuckyDraw: React.FC<LuckyDrawProps> = ({ user, credits, unlockedTowers, onBack, onStatusUpdate }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnTower, setDrawnTower] = useState<string | null>(null);
  const [drawnRarity, setDrawnRarity] = useState<'common' | 'rare' | 'epic' | 'legendary' | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'spinning' | 'reveal'>('idle');
  const { language, t } = useLanguage();
  const allTowerKeys = Object.keys(TOWERS);
  const normalizedPropUnlocked = normalizeUnlocked(unlockedTowers || []);
  const lockedTowers = allTowerKeys.filter((k) => !normalizedPropUnlocked.includes(k));
  const sourceKeys = lockedTowers.length > 0 ? lockedTowers : allTowerKeys;
  const pools = splitPoolsByRarity(sourceKeys);

  const handleDraw = async () => {
    if (credits < DRAW_COST) {
      alert(t('luckyDraw.notEnough'));
      return;
    }

    setIsDrawing(true);
    setAnimationPhase('spinning');
    setDrawnTower(null);
    setDrawnRarity(null);

    // Spinning animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const statusResult = await db.getStudentStatus(user.uid);

      if (statusResult.success && statusResult.data) {
        const currentStatus = statusResult.data;
        const currentUnlocked = normalizeUnlocked(currentStatus.unlockedTowers || []);
        const currentLocked = allTowerKeys.filter((k) => !currentUnlocked.includes(k));
        const currentSource = currentLocked.length > 0 ? currentLocked : allTowerKeys;
        const currentPools = splitPoolsByRarity(currentSource);
        const rarity = getRarity();
        const towerKey = pickOne(currentPools[rarity]);

        // Reveal after final pick is resolved from latest DB state
        setDrawnRarity(rarity);
        setDrawnTower(towerKey);
        setAnimationPhase('reveal');

        const nextUnlocked = Array.from(new Set([...currentUnlocked, towerKey]));
        const updateResult = await db.updateStudentStatus(user.uid, {
          increment: {
            credits: -DRAW_COST
          },
          unlockedTowers: nextUnlocked
        });
        if (!updateResult.success) {
          throw new Error(updateResult.error || 'Failed to save draw result');
        }
        await onStatusUpdate();
      } else {
        throw new Error(statusResult.error || 'Cannot load student status');
      }
    } catch (error) {
      console.error('Error updating credits:', error);
    }

    setIsDrawing(false);
  };

  const rarityColors = {
    common: 'from-gray-500 to-gray-600',
    rare: 'from-blue-500 to-blue-600',
    epic: 'from-purple-500 to-purple-600',
    legendary: 'from-yellow-500 to-orange-500'
  };

  const getRarityName = (rarity: string) => {
    return t(`rarity.${rarity}`);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              {t('luckyDraw.title')}
            </h1>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600"
            >
              {t('luckyDraw.back')}
            </button>
          </div>

          {/* Draw Box */}
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 shadow-2xl mb-6">
            <div className="aspect-square bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-700 flex items-center justify-center relative overflow-hidden">
              {animationPhase === 'idle' && (
                <div className="text-center">
                  <div className="text-8xl mb-4">🎁</div>
                  <p className="text-slate-400">{t('luckyDraw.clickToDraw')}</p>
                </div>
              )}
              
              {animationPhase === 'spinning' && (
                <div className="text-center animate-spin">
                  <div className="text-8xl mb-4">⚡</div>
                  <p className="text-slate-300 font-bold">{t('luckyDraw.drawing')}</p>
                </div>
              )}

              {animationPhase === 'reveal' && drawnTower && drawnRarity && (
                <div className={`text-center p-8 bg-gradient-to-br ${rarityColors[drawnRarity]} rounded-xl border-4 border-white/50 shadow-2xl animate-in zoom-in duration-500`}>
                  <div className="text-8xl mb-4">{TOWERS[drawnTower].icon}</div>
                  <div className={`text-2xl font-bold text-white mb-2 ${rarityColors[drawnRarity].includes('yellow') ? 'text-yellow-900' : ''}`}>
                    {TOWERS[drawnTower].name}
                  </div>
                  <div className="text-lg text-white/90 mb-4">{TOWERS[drawnTower].description}</div>
                  <div className={`inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold`}>
                    {getRarityName(drawnRarity)}
                  </div>
                </div>
              )}
            </div>

            {/* Draw Button */}
            <button
              onClick={handleDraw}
              disabled={isDrawing || credits < DRAW_COST}
              className={`w-full mt-6 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                credits >= DRAW_COST && !isDrawing
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:scale-105 active:scale-95'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isDrawing ? t('luckyDraw.drawing') : `${language === 'zh-TW' ? '抽獎' : 'Draw'} (${DRAW_COST} ${language === 'zh-TW' ? '積分' : 'credits'})`}
            </button>

            {/* Credits Display */}
            <div className="mt-4 text-center text-slate-300">
              {t('luckyDraw.yourCredits')} <span className="text-yellow-400 font-bold text-xl">{credits}</span>
            </div>
          </div>

          {/* Rarity Info */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white font-bold mb-4">{t('luckyDraw.rarityChances')}</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">⚪</div>
                <div className="text-slate-300">{t('rarity.common')}</div>
                <div className="text-slate-400">{RARITY_WEIGHTS.common}%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔵</div>
                <div className="text-blue-300">{t('rarity.rare')}</div>
                <div className="text-blue-400">{RARITY_WEIGHTS.rare}%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🟣</div>
                <div className="text-purple-300">{t('rarity.epic')}</div>
                <div className="text-purple-400">{RARITY_WEIGHTS.epic}%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🟡</div>
                <div className="text-yellow-300">{t('rarity.legendary')}</div>
                <div className="text-yellow-400">{RARITY_WEIGHTS.legendary}%</div>
              </div>
            </div>
            <div className="mt-5 border-t border-slate-700/60 pt-4">
              <h4 className="text-slate-200 font-semibold mb-3">
                {language === 'zh-TW' ? '本次可抽取獎池' : 'Current draw pool'}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {(['legendary', 'epic', 'rare', 'common'] as const).map((rarity) => (
                  <div key={rarity} className="rounded-lg border border-slate-700 bg-slate-900/40 p-2">
                    <div className="mb-1 font-bold text-slate-300">
                      {getRarityName(rarity)} ({pools[rarity].length})
                    </div>
                    <div className="space-y-1 max-h-24 overflow-auto">
                      {pools[rarity].slice(0, 5).map((k) => (
                        <div key={k} className="flex items-center gap-1.5 text-slate-300">
                          <span>{TOWERS[k].icon}</span>
                          <span className="truncate">{TOWERS[k].name}</span>
                        </div>
                      ))}
                      {pools[rarity].length > 5 && (
                        <div className="text-slate-500">+{pools[rarity].length - 5} more</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {lockedTowers.length === 0 && (
                <div className="mt-3 text-[11px] text-amber-300">
                  {language === 'zh-TW'
                    ? '已全部解鎖：現在會抽到重複塔（僅扣積分）。'
                    : 'All towers unlocked: draws can repeat towers (credits still spent).'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
