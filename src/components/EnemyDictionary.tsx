// src/components/EnemyDictionary.tsx
import React, { useState, useMemo } from 'react';
import { ENEMY_TYPES } from '../engine/data';
import type { EnemyType } from '../engine/data';
import { useLanguage } from '../i18n/useTranslation';

interface EnemyDictionaryProps {
  onBack: () => void;
  encounteredEnemies?: string[];
}

type FilterCategory = 'all' | 'basic' | 'special' | 'boss' | 'air' | 'ground';

interface ThreatInfo {
  tier: 'Grunt' | 'Soldier' | 'Elite' | 'Boss';
  label: string;
  labelZh: string;
  borderClass: string;
  badgeClass: string;
  textClass: string;
  glowClass: string;
}

function getThreat(enemy: EnemyType): ThreatInfo {
  if (enemy.isBoss || enemy.hp > 2000) return {
    tier: 'Boss',
    label: 'BOSS',
    labelZh: '首領',
    borderClass: 'border-red-400',
    badgeClass: 'bg-red-500/20 border-red-400/80',
    textClass: 'text-red-300',
    glowClass: 'shadow-red-500/30',
  };
  if (enemy.hp >= 500) return {
    tier: 'Elite',
    label: 'ELITE',
    labelZh: '精英',
    borderClass: 'border-purple-400',
    badgeClass: 'bg-purple-500/20 border-purple-400/80',
    textClass: 'text-purple-300',
    glowClass: 'shadow-purple-500/30',
  };
  if (enemy.hp >= 100) return {
    tier: 'Soldier',
    label: 'SOLDIER',
    labelZh: '士兵',
    borderClass: 'border-blue-400',
    badgeClass: 'bg-blue-500/20 border-blue-400/80',
    textClass: 'text-blue-300',
    glowClass: 'shadow-blue-500/30',
  };
  return {
    tier: 'Grunt',
    label: 'GRUNT',
    labelZh: '雜兵',
    borderClass: 'border-emerald-500',
    badgeClass: 'bg-emerald-500/20 border-emerald-500/70',
    textClass: 'text-emerald-300',
    glowClass: 'shadow-emerald-500/20',
  };
}

const FILTER_LABELS: Record<FilterCategory, { en: string; zh: string }> = {
  all:     { en: 'All', zh: 'すべて' },
  basic:   { en: 'Basic', zh: '基礎' },
  special: { en: 'Special', zh: '特殊' },
  boss:    { en: 'Boss', zh: '首領' },
  air:     { en: 'Air', zh: '飛行' },
  ground:  { en: 'Ground', zh: '地面' },
};

const ABILITY_COLORS: Record<string, string> = {
  fly:              'text-sky-300 border-sky-500/50 bg-sky-500/10',
  shield:           'text-blue-300 border-blue-500/50 bg-blue-500/10',
  regenerate:       'text-emerald-300 border-emerald-500/50 bg-emerald-500/10',
  teleport:         'text-violet-300 border-violet-500/50 bg-violet-500/10',
  invisible:        'text-slate-300 border-slate-500/50 bg-slate-500/10',
  poison_aura:      'text-green-300 border-green-500/50 bg-green-500/10',
  freeze_aura:      'text-cyan-300 border-cyan-500/50 bg-cyan-500/10',
  explode:          'text-orange-300 border-orange-500/50 bg-orange-500/10',
  berserk:          'text-red-300 border-red-500/50 bg-red-500/10',
  spawn_minions:    'text-purple-300 border-purple-500/50 bg-purple-500/10',
  damage_reflect:   'text-yellow-300 border-yellow-500/50 bg-yellow-500/10',
  heal_allies:      'text-pink-300 border-pink-500/50 bg-pink-500/10',
  deactivate_towers:'text-rose-300 border-rose-500/50 bg-rose-500/10',
  stun_attack:      'text-amber-300 border-amber-500/50 bg-amber-500/10',
  split:            'text-teal-300 border-teal-500/50 bg-teal-500/10',
};

function getAbilityClass(ability: string): string {
  return ABILITY_COLORS[ability] ?? 'text-slate-300 border-slate-500/50 bg-slate-500/10';
}

// Radar/spider chart using SVG — 5 axes: HP, Speed, Armor, Special, Boss
function ThreatRadar({ enemy }: { enemy: EnemyType }) {
  const HP_MAX = 1000;
  const SPEED_MAX = 0.08;
  const axes = [
    { label: 'HP',      value: Math.min(1, enemy.hp / HP_MAX) },
    { label: 'Speed',   value: Math.min(1, enemy.speed / SPEED_MAX) },
    { label: 'Armor',   value: Math.min(1, (enemy.reward ?? 0) / 200) },
    { label: 'Special', value: Math.min(1, ((enemy.abilities?.length ?? 0) * 20) / 100) },
    { label: 'Threat',  value: enemy.isBoss ? 1 : 0.15 },
  ];
  const N = axes.length;
  const CX = 70;
  const CY = 70;
  const R = 52;

  const toXY = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = axes.map((a, i) => toXY(i, a.value * R));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <svg viewBox="0 0 140 140" className="w-full max-w-[140px] h-auto">
      {/* Grid rings */}
      {gridLevels.map((lvl) => {
        const pts = axes.map((_, i) => toXY(i, lvl * R));
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={lvl} d={path} fill="none" stroke="#334155" strokeWidth="0.6" />;
      })}
      {/* Axis spokes */}
      {axes.map((_, i) => {
        const end = toXY(i, R);
        return <line key={i} x1={CX} y1={CY} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke="#334155" strokeWidth="0.6" />;
      })}
      {/* Data polygon */}
      <path d={dataPath} fill="rgba(239,68,68,0.18)" stroke="#ef4444" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill="#ef4444" />
      ))}
      {/* Labels */}
      {axes.map((a, i) => {
        const pos = toXY(i, R + 12);
        return (
          <text key={i} x={pos.x.toFixed(1)} y={pos.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
            fontSize="7" fill="#94a3b8" fontFamily="sans-serif">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

type EnemyStatVariant = 'hp' | 'rng' | 'gold';

function StatBar({ label, value, max, variant }: { label: string; value: number; max: number; variant: EnemyStatVariant }) {
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

function EnemyCard({
  enemy,
  encountered,
  selected,
  language,
  onClick,
}: {
  enemy: EnemyType;
  encountered: boolean;
  selected: boolean;
  language: string;
  onClick: () => void;
}) {
  const threat = getThreat(enemy);
  const isAir = enemy.movementType === 'air' || enemy.abilities?.includes('fly');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!encountered}
      className={`enemy-card-bg relative rounded-xl border-2 text-left transition-all duration-300 overflow-hidden
        ${encountered ? 'cursor-pointer hover:scale-[1.03]' : 'cursor-default opacity-50'}
        ${selected && encountered ? `${threat.borderClass} shadow-lg ${threat.glowClass}` : 'border-slate-700/50'}
      `}
    >
      {/* Threat color top bar */}
      <div className={`h-0.5 w-full ${
        threat.tier === 'Boss' ? 'bg-red-400' :
        threat.tier === 'Elite' ? 'bg-purple-400' :
        threat.tier === 'Soldier' ? 'bg-blue-400' : 'bg-emerald-400'
      }`} />

      {/* Lock overlay */}
      {!encountered && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-[3px]">
          <span className="text-3xl mb-1">❓</span>
          <span className="text-slate-600 text-[10px] font-semibold uppercase tracking-wider">???</span>
        </div>
      )}

      <div className="p-3">
        {/* Threat badge */}
        <div className="absolute top-2 right-2 z-20">
          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${threat.badgeClass} ${threat.textClass}`}>
            {threat.label}
          </span>
        </div>

        {/* Boss badge */}
        {enemy.isBoss && encountered && (
          <div className="absolute top-2 left-2 z-20">
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border bg-yellow-500/20 border-yellow-400/80 text-yellow-300">
              {language === 'zh-TW' ? '首領' : 'BOSS'}
            </span>
          </div>
        )}

        {/* Icon */}
        <div className={`text-4xl mb-2 leading-none ${!encountered ? 'blur-sm' : ''}`}>
          {encountered ? enemy.icon : '❓'}
        </div>

        {/* Name */}
        <div className={`font-bold text-xs leading-tight mb-1.5 ${!encountered ? 'blur-sm text-slate-600' : 'text-white'}`}>
          {encountered ? enemy.name : '???'}
        </div>

        {/* HP bar snippet */}
        {encountered && (
          <div className="mb-1">
            <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  threat.tier === 'Boss' ? 'stat-bar-boss' :
                  threat.tier === 'Elite' ? 'stat-bar-elite' : 'stat-bar-soldier'
                }`}
                style={{ width: `${Math.min(100, Math.round((enemy.hp / 1000) * 100))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">HP {enemy.hp}</div>
          </div>
        )}

        {/* Air badge */}
        {encountered && isAir && (
          <span className="text-[10px] bg-sky-500/10 border border-sky-500/40 text-sky-300 px-1.5 py-0.5 rounded">
            ✈ Air
          </span>
        )}
      </div>
    </button>
  );
}

export const EnemyDictionary: React.FC<EnemyDictionaryProps> = ({ onBack, encounteredEnemies = [] }) => {
  const { language, setLanguage, t } = useLanguage();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterCategory>('all');

  const filteredEnemies = useMemo(() => {
    return ENEMY_TYPES.filter((e) => {
      if (filter === 'boss')    return e.isBoss;
      if (filter === 'basic')   return !e.isBoss && !(e.abilities?.length);
      if (filter === 'special') return !e.isBoss && (e.abilities?.length ?? 0) > 0;
      if (filter === 'air')     return e.movementType === 'air' || e.abilities?.includes('fly');
      if (filter === 'ground')  return e.movementType !== 'air' && !e.abilities?.includes('fly');
      return true;
    });
  }, [filter]);

  const isEncountered = (name: string) => encounteredEnemies.includes(name);

  const selectedEnemy: EnemyType | null =
    selectedIdx !== null && filteredEnemies[selectedIdx] && isEncountered(filteredEnemies[selectedIdx].name)
      ? filteredEnemies[selectedIdx]
      : null;

  const handleCardClick = (idx: number, name: string) => {
    if (isEncountered(name)) setSelectedIdx(idx);
  };

  const encounterCount = ENEMY_TYPES.filter((e) => isEncountered(e.name)).length;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#140404] via-[#1e0a0a] to-[#0f1520] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none px-4 pt-4 pb-2 flex items-center justify-between border-b border-red-900/30">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-orange-300 tracking-tight">
            {language === 'zh-TW' ? '敵人圖鑑' : 'Enemy Dictionary'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {encounterCount}/{ENEMY_TYPES.length}&nbsp;
            {language === 'zh-TW' ? '已遭遇' : 'encountered'}
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
        <div className="md:w-[42%] flex flex-col border-r border-red-900/20">
          {/* Filter bar */}
          <div className="flex-none px-3 py-2 border-b border-red-900/20 flex flex-wrap items-center gap-1.5">
            {(Object.keys(FILTER_LABELS) as FilterCategory[]).map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${
                  filter === cat
                    ? 'bg-red-700 border-red-500 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                {language === 'zh-TW' ? FILTER_LABELS[cat].zh : FILTER_LABELS[cat].en}
              </button>
            ))}
          </div>

          {/* Card grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {filteredEnemies.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                {language === 'zh-TW' ? '沒有符合條件的敵人' : 'No enemies match this filter'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredEnemies.map((enemy, idx) => (
                  <EnemyCard
                    key={`${enemy.name}-${idx}`}
                    enemy={enemy}
                    encountered={isEncountered(enemy.name)}
                    selected={selectedIdx === idx}
                    language={language}
                    onClick={() => handleCardClick(idx, enemy.name)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: detail panel */}
        <div className="md:w-[58%] overflow-y-auto">
          {!selectedEnemy ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-8">
              <div className="text-6xl mb-4 opacity-20">📖</div>
              <p className="text-slate-500 text-base font-medium">
                {language === 'zh-TW' ? '選擇一個已遭遇的敵人查看詳情' : 'Select an encountered enemy to view details'}
              </p>
              <p className="text-slate-600 text-xs mt-1">
                {language === 'zh-TW' ? '在戰鬥中遭遇敵人後可解鎖記錄' : 'Encounter enemies in battle to unlock their records'}
              </p>
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-4">
              {/* Enemy hero row */}
              <div className="flex items-start gap-4">
                <div className="text-6xl md:text-7xl leading-none flex-none">{selectedEnemy.icon}</div>
                <div className="flex-1 min-w-0">
                  {(() => {
                    const threat = getThreat(selectedEnemy);
                    return (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${threat.badgeClass} ${threat.textClass}`}>
                          {language === 'zh-TW' ? threat.labelZh : threat.label}
                        </span>
                        {selectedEnemy.isBoss && (
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded border bg-yellow-500/20 border-yellow-400/80 text-yellow-300">
                            {language === 'zh-TW' ? '首領' : 'BOSS'}
                          </span>
                        )}
                        {(selectedEnemy.movementType === 'air' || selectedEnemy.abilities?.includes('fly')) && (
                          <span className="text-xs px-2 py-0.5 rounded border bg-sky-500/10 border-sky-500/40 text-sky-300">
                            ✈ {language === 'zh-TW' ? '飛行' : 'Air'}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
                    {selectedEnemy.name}
                  </h2>
                  {selectedEnemy.description && (
                    <p className="text-red-300/80 text-sm italic mt-1.5 leading-snug">
                      "{selectedEnemy.description}"
                    </p>
                  )}
                </div>
              </div>

              {/* Stats + Radar row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Stat bars */}
                <div className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
                    {language === 'zh-TW' ? '屬性' : 'Stats'}
                  </div>
                  <StatBar
                    label={language === 'zh-TW' ? '生命值 HP' : 'HP 生命值'}
                    value={selectedEnemy.hp}
                    max={10000}
                    variant="hp"
                  />
                  <StatBar
                    label={language === 'zh-TW' ? '速度 SPD' : 'SPD 速度'}
                    value={selectedEnemy.speed}
                    max={0.08}
                    variant="rng"
                  />
                  <StatBar
                    label={language === 'zh-TW' ? '獎勵 GOLD' : 'GOLD 獎勵'}
                    value={selectedEnemy.reward}
                    max={500}
                    variant="gold"
                  />
                </div>

                {/* Radar chart */}
                <div className="flex-none flex flex-col items-center justify-center bg-slate-900/50 border border-slate-700/40 rounded-xl p-3">
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                    {language === 'zh-TW' ? '威脅圖' : 'Threat Diagram'}
                  </div>
                  <ThreatRadar enemy={selectedEnemy} />
                </div>
              </div>

              {/* Abilities */}
              {(selectedEnemy.abilities?.length ?? 0) > 0 && (
                <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-4">
                  <div className="text-red-300 text-xs font-bold uppercase tracking-widest mb-2">
                    {language === 'zh-TW' ? '特殊能力' : 'Special Abilities'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEnemy.abilities!.map((ab, i) => (
                      <span
                        key={i}
                        className={`px-2.5 py-1 text-xs rounded-full border font-semibold capitalize ${getAbilityClass(ab)}`}
                      >
                        {ab.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                  {selectedEnemy.abilityCooldown && (
                    <p className="text-slate-500 text-xs mt-2">
                      {language === 'zh-TW' ? '技能冷卻：' : 'Ability cooldown: '}{selectedEnemy.abilityCooldown}
                    </p>
                  )}
                </div>
              )}

              {/* Immunities */}
              {(selectedEnemy.immunities?.length ?? 0) > 0 && (
                <div className="bg-slate-900/50 border border-sky-800/40 rounded-xl p-4">
                  <div className="text-sky-300 text-xs font-bold uppercase tracking-widest mb-2">
                    {language === 'zh-TW' ? '屬性免疫' : 'Immunities'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEnemy.immunities!.map((imm, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 text-xs rounded-full border bg-sky-500/10 border-sky-500/40 text-sky-200 font-semibold uppercase"
                      >
                        {imm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra info row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedEnemy.minWave && (
                  <div className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-3 text-center">
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">
                      {language === 'zh-TW' ? '首現波次' : 'First Wave'}
                    </div>
                    <div className="text-white font-bold text-lg">{selectedEnemy.minWave}</div>
                  </div>
                )}
                {selectedEnemy.moneyBonus && (
                  <div className="bg-slate-900/50 border border-yellow-700/30 rounded-lg p-3 text-center">
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">
                      {language === 'zh-TW' ? '獎金倍率' : 'Bonus'}
                    </div>
                    <div className="text-yellow-300 font-bold text-lg">{selectedEnemy.moneyBonus}×</div>
                  </div>
                )}
                <div className="bg-slate-900/50 border border-slate-700/40 rounded-lg p-3 text-center">
                  <div className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">
                    {language === 'zh-TW' ? '移動方式' : 'Movement'}
                  </div>
                  <div className="text-white font-bold text-sm">
                    {selectedEnemy.movementType === 'air' || selectedEnemy.abilities?.includes('fly')
                      ? (language === 'zh-TW' ? '✈ 飛行' : '✈ Air')
                      : (language === 'zh-TW' ? '🚶 地面' : '🚶 Ground')
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
