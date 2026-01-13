// src/components/EnemyDictionary.tsx
import React, { useState } from 'react';
import { ENEMY_TYPES } from '../engine/data';

export const EnemyDictionary: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selectedEnemy, setSelectedEnemy] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'basic' | 'boss' | 'special'>('all');

  const filteredEnemies = ENEMY_TYPES.filter(enemy => {
    if (filter === 'boss') return enemy.isBoss;
    if (filter === 'basic') return !enemy.isBoss && !enemy.abilities?.length;
    if (filter === 'special') return enemy.abilities && enemy.abilities.length > 0 && !enemy.isBoss;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-red-900 to-rose-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">
              📖 Enemy Dictionary
            </h1>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600"
            >
              ← Back
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            {(['all', 'basic', 'special', 'boss'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all capitalize ${
                  filter === f
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Enemy Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
            {filteredEnemies.map((enemy, index) => (
              <button
                key={index}
                onClick={() => setSelectedEnemy(index)}
                className={`relative group bg-slate-800/90 backdrop-blur-lg rounded-xl p-4 border-2 transition-all duration-300 hover:scale-105 ${
                  enemy.isBoss
                    ? 'border-yellow-500/50 hover:border-yellow-400'
                    : 'border-red-500/50 hover:border-red-400'
                }`}
                style={{ borderColor: enemy.color + '80' }}
              >
                {enemy.isBoss && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                    BOSS
                  </div>
                )}
                <div className="text-5xl mb-2">{enemy.icon}</div>
                <div className="text-white font-bold text-sm mb-1">{enemy.name}</div>
                <div className="text-slate-400 text-xs">HP: {enemy.hp}</div>
                <div className="text-slate-400 text-xs">Reward: ${enemy.reward}</div>
              </button>
            ))}
          </div>

          {/* Enemy Detail Modal */}
          {selectedEnemy !== null && filteredEnemies[selectedEnemy] && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEnemy(null)}>
              <div
                className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border-2 border-red-500/50 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const enemy = filteredEnemies[selectedEnemy];
                  return (
                    <>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="text-8xl">{enemy.icon}</div>
                          <div>
                            <h2 className="text-3xl font-bold text-white mb-2">{enemy.name}</h2>
                            {enemy.isBoss && (
                              <div className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 mb-2">
                                BOSS
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedEnemy(null)}
                          className="text-slate-400 hover:text-white text-2xl"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4">
                        {enemy.description && (
                          <p className="text-slate-300 text-lg italic">"{enemy.description}"</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 bg-slate-900/50 rounded-xl p-4">
                          <div>
                            <div className="text-slate-400 text-sm">Health Points</div>
                            <div className="text-white font-bold text-xl">{enemy.hp}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-sm">Speed</div>
                            <div className="text-white font-bold text-xl">{enemy.speed.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-sm">Reward</div>
                            <div className="text-yellow-400 font-bold text-xl">${enemy.reward}</div>
                          </div>
                          {enemy.minWave && (
                            <div>
                              <div className="text-slate-400 text-sm">Min Wave</div>
                              <div className="text-white font-bold text-xl">{enemy.minWave}</div>
                            </div>
                          )}
                        </div>

                        {enemy.abilities && enemy.abilities.length > 0 && (
                          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                            <div className="text-red-300 font-bold mb-2">Special Abilities</div>
                            <div className="flex flex-wrap gap-2">
                              {enemy.abilities.map((ability, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-1 bg-red-500/30 rounded-full text-white text-sm capitalize"
                                >
                                  {ability.replace(/_/g, ' ')}
                                </div>
                              ))}
                            </div>
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
