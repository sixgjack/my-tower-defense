// src/components/TowerGallery.tsx
import React, { useState, useMemo } from 'react';
import { TOWERS } from '../engine/data';
import { getTowerPersonality } from '../data/towerPersonalities';
import { TowerLiveDemo } from './TowerLiveDemo';
import { useLanguage } from '../i18n/useTranslation';
import type { TowerStats } from '../engine/types';

interface TowerGalleryProps {
  unlockedTowers: string[];
  onBack: () => void;
}

type FilterCategory = 'all' | 'projectile' | 'area' | 'beam' | 'spread' | 'aura' | 'pull' | 'farm' | 'summon';

interface RarityInfo {
  tier: 'SSR' | 'SR' | 'R' | 'N';
  label: string;
  borderClass: string;
  glowClass: string;
  badgeClass: string;
  textClass: string;
}

function getRarity(cost: number): RarityInfo {
  if (cost >= 800) return {
    tier: 'SSR',
    label: 'SSR',
    borderClass: 'border-yellow-400',
    glowClass: 'shadow-yellow-400/40',
    badgeClass: 'bg-yellow-400/20 border-yellow-400/80',
    textClass: 'text-yellow-300',
  };
  if (cost >= 400) return {
    tier: 'SR',
    label: 'SR',
    borderClass: 'border-purple-400',
    glowClass: 'shadow-purple-400/40',
    badgeClass: 'bg-purple-400/20 border-purple-400/80',
    textClass: 'text-purple-300',
  };
  if (cost >= 150) return {
    tier: 'R',
    label: 'R',
    borderClass: 'border-blue-400',
    glowClass: 'shadow-blue-400/40',
    badgeClass: 'bg-blue-400/20 border-blue-400/80',
    textClass: 'text-blue-300',
  };
  return {
    tier: 'N',
    label: 'N',
    borderClass: 'border-slate-500',
    glowClass: 'shadow-slate-500/30',
    badgeClass: 'bg-slate-500/20 border-slate-500/60',
    textClass: 'text-slate-400',
  };
}

const ELEMENT_BADGES: Record<string, string> = {
  fire: '🔥',
  ice: '❄️',
  electric: '⚡',
  poison: '☠️',
  physical: '💢',
  explosive: '💣',
  arcane: '✨',
};

const FILTER_LABELS: Record<FilterCategory, { en: string; zh: string }> = {
  all:       { en: 'All', zh: 'すべて' },
  projectile:{ en: 'Attack', zh: '攻擊' },
  area:      { en: 'Area', zh: '範圍' },
  beam:      { en: 'Beam', zh: '光束' },
  spread:    { en: 'Spread', zh: '散射' },
  aura:      { en: 'Aura', zh: '光環' },
  pull:      { en: 'Control', zh: '控制' },
  farm:      { en: 'Economy', zh: '經濟' },
  summon:    { en: 'Summon', zh: '召喚' },
};

const STAT_BAR_MAX = { atk: 200, rng: 6, spd: 200, cost: 1500 };

type StatVariant = 'atk' | 'rng' | 'spd' | 'cost';

function StatBar({ label, value, max, variant }: { label: string; value: number; max: number; variant: StatVariant }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs text-slate-400 font-medium tracking-wide">{label}</span>
        <span className="text-xs text-slate-300 font-bold">{value}</span>
      </div>
      <div className="h-2 bg-slate-700/60 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 stat-bar-${variant}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TowerCard({
  towerKey,
  tower,
  unlocked,
  selected,
  language,
  onClick,
}: {
  towerKey: string;
  tower: TowerStats;
  unlocked: boolean;
  selected: boolean;
  language: string;
  onClick: () => void;
}) {
  const rarity = getRarity(tower.cost);
  const personality = getTowerPersonality(towerKey, tower.name);
  const displayName = language === 'zh-TW' && tower.nameZh ? tower.nameZh : tower.name;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`tower-card-bg relative group rounded-xl border-2 transition-all duration-300 overflow-hidden text-left
        ${unlocked ? 'cursor-pointer hover:scale-[1.03]' : 'cursor-default'}
        ${selected
          ? `${rarity.borderClass} shadow-lg ${rarity.glowClass}`
          : unlocked
            ? `border-slate-600/60 hover:${rarity.borderClass}`
            : 'border-slate-700/40 opacity-55'}
      `}
    >
      {/* Rarity top bar */}
      <div
        className={`h-0.5 w-full ${rarity.tier === 'SSR' ? 'bg-yellow-400' : rarity.tier === 'SR' ? 'bg-purple-400' : rarity.tier === 'R' ? 'bg-blue-400' : 'bg-slate-500'}`}
      />

      {/* Lock overlay */}
      {!unlocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-[2px]">
          <span className="text-3xl mb-1">🔒</span>
          <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Locked</span>
        </div>
      )}

      <div className="p-3">
        {/* Rarity badge */}
        <div className="absolute top-2 right-2 z-20">
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${rarity.badgeClass} ${rarity.textClass}`}>
            {rarity.label}
          </span>
        </div>

        {/* Icon */}
        <div className={`text-4xl mb-2 leading-none ${!unlocked ? 'blur-sm' : ''}`}>{tower.icon}</div>

        {/* Name */}
        <div className={`font-bold text-xs leading-tight mb-1.5 ${!unlocked ? 'blur-sm text-slate-500' : 'text-white'}`}>
          {!unlocked ? '???' : displayName}
        </div>

        {/* Tags */}
        {unlocked && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {tower.element && (
              <span className="text-[10px] bg-slate-700/70 border border-slate-600/50 text-slate-300 px-1.5 py-0.5 rounded">
                {ELEMENT_BADGES[tower.element] ?? ''} {tower.element}
              </span>
            )}
            <span className="text-[10px] bg-slate-700/70 border border-slate-600/50 text-slate-300 px-1.5 py-0.5 rounded capitalize">
              {tower.type}
            </span>
          </div>
        )}

        {/* Cost */}
        {unlocked && (
          <div className="text-yellow-400 text-[11px] font-bold">${tower.cost}</div>
        )}

        {/* Selected personality tagline */}
        {unlocked && selected && (
          <div className="mt-1.5 text-[10px] text-slate-400 italic truncate">
            {language === 'zh-TW' ? personality.catchphraseZh : personality.catchphrase}
          </div>
        )}
      </div>
    </button>
  );
}

export const TowerGallery: React.FC<TowerGalleryProps> = ({ unlockedTowers, onBack }) => {
  const { language, setLanguage, t } = useLanguage();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [unlockedOnly, setUnlockedOnly] = useState(false);

  const towerEntries = useMemo(() => Object.entries(TOWERS), []);

  const filteredEntries = useMemo(() => {
    return towerEntries.filter(([key, tower]) => {
      const passFilter = filter === 'all' || tower.type === filter;
      const passUnlocked = !unlockedOnly || unlockedTowers.includes(key);
      return passFilter && passUnlocked;
    });
  }, [towerEntries, filter, unlockedOnly, unlockedTowers]);

  const selectedTower = selectedKey ? TOWERS[selectedKey] : null;
  const selectedPersonality = selectedKey && selectedTower
    ? getTowerPersonality(selectedKey, selectedTower.name)
    : null;

  const isUnlocked = (key: string) => unlockedTowers.includes(key);

  const handleCardClick = (key: string) => {
    if (isUnlocked(key)) setSelectedKey(key);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#060b1a] via-[#0d1b3e] to-[#0a1628] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none px-4 pt-4 pb-2 flex items-center justify-between border-b border-indigo-900/40">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-blue-300 to-cyan-300 tracking-tight">
            {language === 'zh-TW' ? '防禦塔圖鑑' : 'Tower Gallery'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {language === 'zh-TW' ? '解鎖並研究所有防禦塔' : 'Unlock and master all towers'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'zh-TW' : 'en')}
            className="px-3 py-1.5 text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg border border-slate-600/50 transition-all"
          >
            {language === 'en' ? '中文' : 'EN'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-1.5 text-sm bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-lg border border-slate-600/50 transition-all"
          >
            ← {t('common.back')}
          </button>
        </div>
      </div>

      {/* Main split pane */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">

        {/* LEFT: filter + grid */}
        <div className="md:w-[42%] flex flex-col border-r border-indigo-900/30">
          {/* Filter bar */}
          <div className="flex-none px-3 py-2 border-b border-indigo-900/30 flex flex-wrap items-center gap-1.5">
            {(Object.keys(FILTER_LABELS) as FilterCategory[]).map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${
                  filter === cat
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                {language === 'zh-TW' ? FILTER_LABELS[cat].zh : FILTER_LABELS[cat].en}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUnlockedOnly(v => !v)}
              className={`ml-auto px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${
                unlockedOnly
                  ? 'bg-emerald-700/50 border-emerald-400/70 text-emerald-200'
                  : 'bg-slate-800/60 border-slate-600/50 text-slate-400 hover:text-white'
              }`}
            >
              {language === 'zh-TW' ? '僅已解鎖' : 'Unlocked Only'}
            </button>
          </div>

          {/* Card grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredEntries.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                {language === 'zh-TW' ? '沒有符合條件的防禦塔' : 'No towers match this filter'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredEntries.map(([key, tower]) => (
                  <TowerCard
                    key={key}
                    towerKey={key}
                    tower={tower}
                    unlocked={isUnlocked(key)}
                    selected={selectedKey === key}
                    language={language}
                    onClick={() => handleCardClick(key)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: detail panel */}
        <div className="md:w-[58%] overflow-y-auto">
          {!selectedTower || !selectedPersonality ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-8">
              <div className="text-6xl mb-4 opacity-20">🏰</div>
              <p className="text-slate-500 text-base font-medium">
                {language === 'zh-TW' ? '選擇一座防禦塔查看詳情' : 'Select a tower to view details'}
              </p>
              <p className="text-slate-600 text-xs mt-1">
                {language === 'zh-TW' ? '僅已解鎖的砲台可以查看' : 'Only unlocked towers can be inspected'}
              </p>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-4">
              {/* Tower name hero */}
              <div className="flex items-start gap-4">
                <div className="text-6xl md:text-7xl leading-none flex-none">{selectedTower.icon}</div>
                <div className="flex-1 min-w-0">
                  {/* Rarity + element + type row */}
                  {(() => {
                    const rarity = getRarity(selectedTower.cost);
                    return (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${rarity.badgeClass} ${rarity.textClass}`}>
                          {rarity.label}
                        </span>
                        {selectedTower.element && (
                          <span className="text-xs bg-slate-700/60 border border-slate-600/50 text-slate-300 px-2 py-0.5 rounded">
                            {ELEMENT_BADGES[selectedTower.element] ?? ''} {selectedTower.element}
                          </span>
                        )}
                        <span className="text-xs bg-slate-700/60 border border-slate-600/50 text-slate-300 px-2 py-0.5 rounded capitalize">
                          {selectedTower.type}
                        </span>
                      </div>
                    );
                  })()}
                  {/* Chinese name large, English below */}
                  <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
                    {language === 'zh-TW' && selectedTower.nameZh ? selectedTower.nameZh : selectedTower.name}
                  </h2>
                  {selectedTower.nameZh && language !== 'zh-TW' && (
                    <p className="text-slate-500 text-xs mt-0.5">{selectedTower.nameZh}</p>
                  )}
                  {selectedTower.nameZh && language === 'zh-TW' && (
                    <p className="text-slate-500 text-xs mt-0.5">{selectedTower.name}</p>
                  )}
                  {/* Catchphrase */}
                  <p className="text-indigo-300 text-sm italic mt-1.5 leading-snug">
                    {language === 'zh-TW' ? selectedPersonality.catchphraseZh : selectedPersonality.catchphrase}
                  </p>
                </div>
              </div>

              {/* Personality / lore */}
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-xl p-4">
                <div className="text-purple-300 text-xs font-bold uppercase tracking-widest mb-1">
                  {language === 'zh-TW' ? selectedPersonality.personalityZh : selectedPersonality.personality}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {language === 'zh-TW' ? selectedPersonality.loreZh : selectedPersonality.lore}
                </p>
              </div>

              {/* Stat bars */}
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
                  {language === 'zh-TW' ? '屬性' : 'Stats'}
                </div>
                <StatBar
                  label={language === 'zh-TW' ? '攻擊力 ATK' : 'ATK 攻擊力'}
                  value={selectedTower.damage}
                  max={STAT_BAR_MAX.atk}
                  variant="atk"
                />
                <StatBar
                  label={language === 'zh-TW' ? '射程 RNG' : 'RNG 射程'}
                  value={selectedTower.range}
                  max={STAT_BAR_MAX.rng}
                  variant="rng"
                />
                <StatBar
                  label={language === 'zh-TW' ? '速度 SPD' : 'SPD 速度'}
                  value={Math.max(0, STAT_BAR_MAX.spd - selectedTower.cooldown)}
                  max={STAT_BAR_MAX.spd}
                  variant="spd"
                />
                <StatBar
                  label={language === 'zh-TW' ? '費用 COST' : 'COST 費用'}
                  value={selectedTower.cost}
                  max={STAT_BAR_MAX.cost}
                  variant="cost"
                />
              </div>

              {/* Special ability badge */}
              {selectedTower.specialAbility && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                    {language === 'zh-TW' ? '特殊能力' : 'Special'}
                  </span>
                  <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-200 text-xs rounded-full font-bold capitalize">
                    ✦ {selectedTower.specialAbility}
                  </span>
                </div>
              )}

              {/* Description */}
              <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-3">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {language === 'zh-TW' && selectedTower.descriptionZh
                    ? selectedTower.descriptionZh
                    : selectedTower.description}
                </p>
                {selectedTower.quote && (
                  <p className="mt-2 text-indigo-400/80 text-xs italic border-t border-slate-700/40 pt-2">
                    {selectedTower.quote}
                  </p>
                )}
              </div>

              {/* Live Demo */}
              <TowerLiveDemo tower={selectedTower} width={500} height={220} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
