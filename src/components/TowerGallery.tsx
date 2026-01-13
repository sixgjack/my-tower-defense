// src/components/TowerGallery.tsx
import React, { useState } from 'react';
import { TOWERS } from '../engine/data';

interface TowerGalleryProps {
  unlockedTowers: string[];
  onBack: () => void;
}

export const TowerGallery: React.FC<TowerGalleryProps> = ({ unlockedTowers, onBack }) => {
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const towerKeys = Object.keys(TOWERS);

  const isUnlocked = (key: string) => unlockedTowers.includes(key);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              🏰 Tower Gallery
            </h1>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600"
            >
              ← Back
            </button>
          </div>

          {/* Tower Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
            {towerKeys.map((key) => {
              const tower = TOWERS[key];
              const unlocked = isUnlocked(key);
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedTower(key)}
                  className={`relative group bg-slate-800/90 backdrop-blur-lg rounded-xl p-4 border-2 transition-all duration-300 hover:scale-105 ${
                    unlocked
                      ? 'border-blue-500/50 hover:border-blue-400'
                      : 'border-slate-700/50 opacity-50'
                  }`}
                >
                  {!unlocked && (
                    <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center z-10">
                      <div className="text-4xl">🔒</div>
                    </div>
                  )}
                  <div className="text-5xl mb-2">{tower.icon}</div>
                  <div className="text-white font-bold text-sm mb-1">{tower.name}</div>
                  <div className="text-slate-400 text-xs">Cost: ${tower.cost}</div>
                  {unlocked && (
                    <div className="absolute top-2 right-2 text-blue-400 text-xs">✓</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tower Detail Modal */}
          {selectedTower && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedTower(null)}>
              <div
                className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border-2 border-blue-500/50 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const tower = TOWERS[selectedTower];
                  return (
                    <>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="text-8xl">{tower.icon}</div>
                          <div>
                            <h2 className="text-3xl font-bold text-white mb-2">{tower.name}</h2>
                            <div className={`inline-block px-3 py-1 rounded-full ${
                              isUnlocked(selectedTower) ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'
                            }`}>
                              {isUnlocked(selectedTower) ? 'Unlocked' : 'Locked'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedTower(null)}
                          className="text-slate-400 hover:text-white text-2xl"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4">
                        <p className="text-slate-300 text-lg">{tower.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 bg-slate-900/50 rounded-xl p-4">
                          <div>
                            <div className="text-slate-400 text-sm">Damage</div>
                            <div className="text-white font-bold text-xl">{tower.damage}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-sm">Range</div>
                            <div className="text-white font-bold text-xl">{tower.range}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-sm">Cooldown</div>
                            <div className="text-white font-bold text-xl">{tower.cooldown}ms</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-sm">Cost</div>
                            <div className="text-yellow-400 font-bold text-xl">${tower.cost}</div>
                          </div>
                        </div>

                        {tower.specialAbility && (
                          <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
                            <div className="text-purple-300 font-bold mb-2">Special Ability</div>
                            <div className="text-white capitalize">{tower.specialAbility}</div>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
