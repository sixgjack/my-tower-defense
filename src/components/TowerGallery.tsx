// src/components/TowerGallery.tsx
import React, { useState } from 'react';
import { TOWERS } from '../engine/data';
import { getTowerPersonality, TOWER_PERSONALITIES } from '../data/towerPersonalities';
import { TowerLiveDemo } from './TowerLiveDemo';
import { useLanguage } from '../i18n/useTranslation';

interface TowerGalleryProps {
  unlockedTowers: string[];
  onBack: () => void;
}

export const TowerGallery: React.FC<TowerGalleryProps> = ({ unlockedTowers, onBack }) => {
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const towerKeys = Object.keys(TOWERS);
  const { language, t } = useLanguage();

  const isUnlocked = (key: string) => unlockedTowers.includes(key);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              🏰 {t('tower.title')} / Tower Gallery
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {}}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600 text-sm"
              >
                {language === 'en' ? '中文' : 'EN'}
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600"
              >
                ← {t('common.back')} / Back
              </button>
            </div>
          </div>

          {/* Tower Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
            {towerKeys.map((key) => {
              const tower = TOWERS[key];
              const unlocked = isUnlocked(key);
              const personality = getTowerPersonality(key, tower.name);
              
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
                  <div className="text-white font-bold text-sm mb-1">
                    {language === 'zh-TW' && personality.nameZh ? personality.nameZh : tower.name}
                  </div>
                  <div className="text-slate-400 text-xs">${tower.cost}</div>
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
                className="bg-slate-800 rounded-2xl p-8 max-w-4xl w-full border-2 border-blue-500/50 shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const tower = TOWERS[selectedTower];
                  const personality = getTowerPersonality(selectedTower, tower.name);
                  const displayName = language === 'zh-TW' && personality.nameZh ? personality.nameZh : tower.name;
                  const displayPersonality = language === 'zh-TW' ? personality.personalityZh : personality.personality;
                  const displayCatchphrase = language === 'zh-TW' ? personality.catchphraseZh : personality.catchphrase;
                  const displayLore = language === 'zh-TW' ? personality.loreZh : personality.lore;
                  
                  return (
                    <>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="text-8xl">{tower.icon}</div>
                          <div>
                            <h2 className="text-3xl font-bold text-white mb-2">{displayName}</h2>
                            <div className="text-lg text-blue-300 font-semibold mb-2 italic">
                              "{displayCatchphrase}"
                            </div>
                            <div className={`inline-block px-3 py-1 rounded-full ${
                              isUnlocked(selectedTower) ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700 text-slate-400'
                            }`}>
                              {isUnlocked(selectedTower) ? t('tower.unlocked') : t('tower.locked')}
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

                      <div className="space-y-6">
                        {/* Personality Section - Clash Royale Style */}
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-xl p-6">
                          <div className="text-purple-300 font-bold text-xl mb-2">
                            {displayPersonality}
                          </div>
                          <p className="text-slate-200 text-base leading-relaxed">
                            {displayLore}
                          </p>
                        </div>

                        {/* Live Demo */}
                        {isUnlocked(selectedTower) && (
                          <TowerLiveDemo tower={tower} />
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/50 rounded-xl p-4">
                          <div>
                            <div className="text-slate-400 text-sm">{t('tower.damage')} / Damage</div>
                            <div className="text-white font-bold text-xl">{tower.damage}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-sm">{t('tower.range')} / Range</div>
                            <div className="text-white font-bold text-xl">{tower.range}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-sm">{t('tower.cooldown')} / Cooldown</div>
                            <div className="text-white font-bold text-xl">{tower.cooldown}ms</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-sm">{t('tower.cost')} / Cost</div>
                            <div className="text-yellow-400 font-bold text-xl">${tower.cost}</div>
                          </div>
                        </div>

                        {/* Special Ability */}
                        {tower.specialAbility && (
                          <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
                            <div className="text-purple-300 font-bold mb-2">
                              {t('tower.specialAbility')} / Special Ability
                            </div>
                            <div className="text-white capitalize">{tower.specialAbility}</div>
                          </div>
                        )}

                        {/* Description */}
                        <div className="bg-slate-900/30 rounded-xl p-4">
                          <p className="text-slate-300 text-sm">{tower.description}</p>
                        </div>
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
