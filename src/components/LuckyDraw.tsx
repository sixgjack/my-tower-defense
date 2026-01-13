// src/components/LuckyDraw.tsx
import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { TOWERS } from '../engine/data';

interface LuckyDrawProps {
  user: User;
  credits: number;
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

function selectTowerByRarity(rarity: string): string {
  const towerKeys = Object.keys(TOWERS);
  // Simple rarity assignment based on cost
  const sortedTowers = towerKeys.sort((a, b) => TOWERS[a].cost - TOWERS[b].cost);
  
  switch (rarity) {
    case 'legendary':
      return sortedTowers[Math.floor(Math.random() * sortedTowers.length * 0.1)]; // Top 10%
    case 'epic':
      return sortedTowers[Math.floor(Math.random() * sortedTowers.length * 0.3) + sortedTowers.length * 0.1];
    case 'rare':
      return sortedTowers[Math.floor(Math.random() * sortedTowers.length * 0.3) + sortedTowers.length * 0.4];
    default:
      return sortedTowers[Math.floor(Math.random() * sortedTowers.length * 0.3) + sortedTowers.length * 0.7];
  }
}

export const LuckyDraw: React.FC<LuckyDrawProps> = ({ user, credits, onBack, onStatusUpdate }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnTower, setDrawnTower] = useState<string | null>(null);
  const [drawnRarity, setDrawnRarity] = useState<'common' | 'rare' | 'epic' | 'legendary' | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'spinning' | 'reveal'>('idle');

  const handleDraw = async () => {
    if (credits < DRAW_COST) {
      alert('Not enough credits! Need 100 credits to draw.');
      return;
    }

    setIsDrawing(true);
    setAnimationPhase('spinning');
    setDrawnTower(null);
    setDrawnRarity(null);

    // Spinning animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reveal
    const rarity = getRarity();
    const towerKey = selectTowerByRarity(rarity);
    setDrawnRarity(rarity);
    setDrawnTower(towerKey);
    setAnimationPhase('reveal');

    // Update credits and unlock tower
    try {
      const statusRef = doc(db, 'students', user.uid);
      const statusSnap = await getDoc(statusRef);
      
      if (statusSnap.exists()) {
        const currentStatus = statusSnap.data();
        const unlockedTowers = currentStatus.unlockedTowers || [];
        
        if (!unlockedTowers.includes(towerKey)) {
          await updateDoc(statusRef, {
            credits: increment(-DRAW_COST),
            unlockedTowers: [...unlockedTowers, towerKey]
          });
          await onStatusUpdate();
        } else {
          await updateDoc(statusRef, {
            credits: increment(-DRAW_COST)
          });
          await onStatusUpdate();
        }
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

  const rarityNames = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary'
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              🎰 Lucky Draw
            </h1>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600"
            >
              ← Back
            </button>
          </div>

          {/* Draw Box */}
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 shadow-2xl mb-6">
            <div className="aspect-square bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-slate-700 flex items-center justify-center relative overflow-hidden">
              {animationPhase === 'idle' && (
                <div className="text-center">
                  <div className="text-8xl mb-4">🎁</div>
                  <p className="text-slate-400">Click Draw to get a tower!</p>
                </div>
              )}
              
              {animationPhase === 'spinning' && (
                <div className="text-center animate-spin">
                  <div className="text-8xl mb-4">⚡</div>
                  <p className="text-slate-300 font-bold">Drawing...</p>
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
                    {rarityNames[drawnRarity]}
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
              {isDrawing ? 'Drawing...' : `Draw (${DRAW_COST} credits)`}
            </button>

            {/* Credits Display */}
            <div className="mt-4 text-center text-slate-300">
              Your Credits: <span className="text-yellow-400 font-bold text-xl">{credits}</span>
            </div>
          </div>

          {/* Rarity Info */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-white font-bold mb-4">Rarity Chances</h3>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">⚪</div>
                <div className="text-slate-300">Common</div>
                <div className="text-slate-400">{RARITY_WEIGHTS.common}%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔵</div>
                <div className="text-blue-300">Rare</div>
                <div className="text-blue-400">{RARITY_WEIGHTS.rare}%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🟣</div>
                <div className="text-purple-300">Epic</div>
                <div className="text-purple-400">{RARITY_WEIGHTS.epic}%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🟡</div>
                <div className="text-yellow-300">Legendary</div>
                <div className="text-yellow-400">{RARITY_WEIGHTS.legendary}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
