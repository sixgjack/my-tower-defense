// src/components/TowerLoadoutSelection.tsx
// Component for selecting a fixed core + optional towers before starting a game
import React, { useEffect, useMemo, useState } from 'react';
import { TOWERS } from '../engine/data';
import { TowerLiveDemo } from './TowerLiveDemo';
import { useLanguage } from '../i18n/useTranslation';
import { getTowerPersonality } from '../data/towerPersonalities';
import { STARTER_CORE_TOWERS, STARTER_CORE_TOWER_SET } from '../config/starterTowers';

interface TowerLoadoutSelectionProps {
  unlockedTowers: string[];
  onConfirm: (selectedTowers: string[]) => void;
  onBack: () => void;
}

const OPTIONAL_TOWERS = 2;

export const TowerLoadoutSelection: React.FC<TowerLoadoutSelectionProps> = ({
  unlockedTowers,
  onConfirm,
  onBack
}) => {
  const effectiveUnlocked = useMemo(
    () => [...new Set([...STARTER_CORE_TOWERS, ...(unlockedTowers || [])])],
    [unlockedTowers]
  );
  const coreTowers = useMemo(
    () => STARTER_CORE_TOWERS.filter((key) => effectiveUnlocked.includes(key)),
    [effectiveUnlocked]
  );
  const [selectedTowers, setSelectedTowers] = useState<string[]>(coreTowers);
  const [previewTower, setPreviewTower] = useState<string | null>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    // Keep core towers always selected, and preserve optional picks when possible.
    setSelectedTowers((prev) => {
      const optionalPrev = prev.filter((k) => !STARTER_CORE_TOWER_SET.has(k));
      const optionalAllowed = optionalPrev.filter((k) => effectiveUnlocked.includes(k));
      return [...coreTowers, ...optionalAllowed.slice(0, OPTIONAL_TOWERS)];
    });
  }, [coreTowers, effectiveUnlocked]);

  const isUnlocked = (key: string) => effectiveUnlocked.includes(key);
  const availableTowers = Object.keys(TOWERS).filter(isUnlocked);
  const maxTowers = coreTowers.length + OPTIONAL_TOWERS;
  const optionalRemaining = Math.max(0, maxTowers - selectedTowers.length);

  const toggleTower = (towerKey: string) => {
    if (STARTER_CORE_TOWER_SET.has(towerKey)) {
      return;
    }
    if (selectedTowers.includes(towerKey)) {
      // Deselect
      setSelectedTowers(selectedTowers.filter(k => k !== towerKey));
    } else {
      // Select (if under optional limit)
      if (selectedTowers.length < maxTowers) {
        setSelectedTowers([...selectedTowers, towerKey]);
      }
    }
  };

  const canConfirm = coreTowers.length > 0 && selectedTowers.length >= coreTowers.length;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-2">
                🎯 {language === 'zh-TW' ? '選擇防禦塔' : 'Select Your Loadout'}
              </h1>
              <p className="text-slate-300 text-lg">
                {language === 'zh-TW' 
                  ? `固定 6 座核心塔 + 可選 2 座額外塔` 
                  : `6 fixed core towers + up to 2 optional towers`}
              </p>
              <div className="mt-2 text-yellow-400 font-semibold">
                {language === 'zh-TW' 
                  ? `已選擇: ${selectedTowers.length}/${maxTowers}（額外可選: ${optionalRemaining}）` 
                  : `Selected: ${selectedTowers.length}/${maxTowers} (optional left: ${optionalRemaining})`}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all backdrop-blur-sm border border-slate-600"
              >
                ← {t('common.back')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tower Selection Grid */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-6 border-2 border-slate-700/50">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {language === 'zh-TW' ? '可用防禦塔' : 'Available Towers'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableTowers.map((key) => {
                    const tower = TOWERS[key];
                    const isSelected = selectedTowers.includes(key);
                    const isCore = STARTER_CORE_TOWER_SET.has(key);
                    const personality = getTowerPersonality(key, tower.name);
                    const displayName = language === 'zh-TW' && personality.nameZh 
                      ? personality.nameZh 
                      : tower.name;

                    return (
                      <button
                        key={key}
                        onClick={() => toggleTower(key)}
                        onMouseEnter={() => setPreviewTower(key)}
                        disabled={isCore}
                        className={`relative group bg-slate-700/50 backdrop-blur-lg rounded-xl p-4 border-2 transition-all duration-300 hover:scale-105 ${
                          isSelected
                            ? 'border-yellow-500 bg-yellow-500/20'
                            : 'border-slate-600 hover:border-blue-400'
                        } ${isCore ? 'cursor-default' : ''}`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">
                            {selectedTowers.indexOf(key) + 1}
                          </div>
                        )}
                        {isCore && (
                          <div className="absolute top-2 left-2 bg-cyan-500 text-white rounded px-2 py-0.5 font-bold text-[10px]">
                            {language === 'zh-TW' ? '核心' : 'Core'}
                          </div>
                        )}
                        <div className="text-5xl mb-2">{tower.icon}</div>
                        <div className="text-white font-bold text-sm mb-1 truncate">
                          {displayName}
                        </div>
                        <div className="text-slate-400 text-xs">${tower.cost}</div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-yellow-500/10 rounded-xl animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-6 border-2 border-slate-700/50 sticky top-4">
                {previewTower ? (
                  <>
                    {(() => {
                      const tower = TOWERS[previewTower];
                      const personality = getTowerPersonality(previewTower, tower.name);
                      const displayName = language === 'zh-TW' && personality.nameZh 
                        ? personality.nameZh 
                        : tower.name;
                      const displayCatchphrase = language === 'zh-TW' 
                        ? personality.catchphraseZh 
                        : personality.catchphrase;
                      const displayLore = language === 'zh-TW' 
                        ? personality.loreZh 
                        : personality.lore;

                      return (
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-6xl">{tower.icon}</div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{displayName}</h3>
                              <p className="text-blue-300 text-sm italic">"{displayCatchphrase}"</p>
                            </div>
                          </div>

                          {/* Live Demo */}
                          <div className="mb-4">
                            <TowerLiveDemo tower={tower} width={300} height={200} />
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-900/50 rounded-lg p-2">
                              <div className="text-slate-400 text-xs">{language === 'zh-TW' ? '傷害' : 'Damage'}</div>
                              <div className="text-white font-bold">{tower.damage}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2">
                              <div className="text-slate-400 text-xs">{language === 'zh-TW' ? '射程' : 'Range'}</div>
                              <div className="text-white font-bold">{tower.range}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2">
                              <div className="text-slate-400 text-xs">{language === 'zh-TW' ? '冷卻' : 'Cooldown'}</div>
                              <div className="text-white font-bold">{tower.cooldown}ms</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-2">
                              <div className="text-slate-400 text-xs">{language === 'zh-TW' ? '成本' : 'Cost'}</div>
                              <div className="text-yellow-400 font-bold">${tower.cost}</div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="bg-slate-900/30 rounded-lg p-3 mb-4">
                            <p className="text-slate-300 text-sm">{tower.description}</p>
                          </div>

                          {/* Personality */}
                          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg p-3">
                            <div className="text-purple-300 font-bold text-sm mb-1">
                              {language === 'zh-TW' ? personality.personalityZh : personality.personality}
                            </div>
                            <p className="text-slate-200 text-xs leading-relaxed">{displayLore}</p>
                          </div>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <div className="text-4xl mb-2">👆</div>
                    <p>{language === 'zh-TW' ? '懸停查看防禦塔詳情' : 'Hover over a tower to see details'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Selected Towers Summary */}
          {selectedTowers.length > 0 && (
            <div className="mt-6 bg-slate-800/90 backdrop-blur-lg rounded-xl p-6 border-2 border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4">
                {language === 'zh-TW' ? '已選擇的防禦塔' : 'Selected Towers'}
              </h3>
              <div className="flex flex-wrap gap-3">
                {selectedTowers.map((key, index) => {
                  const tower = TOWERS[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-2 border-2 border-yellow-500/50"
                    >
                      <span className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className="text-2xl">{tower.icon}</span>
                      <span className="text-white font-semibold text-sm">{tower.name}</span>
                      <button
                        onClick={() => toggleTower(key)}
                        disabled={STARTER_CORE_TOWER_SET.has(key)}
                        className="text-red-400 hover:text-red-300 ml-2 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => canConfirm && onConfirm(selectedTowers)}
              disabled={!canConfirm}
              className={`px-12 py-4 rounded-lg font-bold text-xl transition-all duration-200 ${
                canConfirm
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/50 hover:scale-105'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {canConfirm
                ? (language === 'zh-TW' ? '開始戰鬥 →' : 'Start Battle →')
                : (language === 'zh-TW' 
                    ? '至少需要核心防禦塔' 
                    : 'Core towers are required')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
