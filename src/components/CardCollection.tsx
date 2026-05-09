// src/components/CardCollection.tsx
import React, { useState, useMemo } from 'react';
import { TOWERS } from '../engine/data';
import { getTowerGifAsset } from '../config/visualAssets';
import {
  type TowerCardData,
  STARS_COLORS,
  STARS_LABELS,
  xpToNextLevel,
  cardStatMultipliers,
  BOND_BONUSES,
  loadTowerCards,
  getOrInitCard,
} from '../config/towerCards';
import type { GoogleUser } from '../services/googleAuth';

interface CardCollectionProps {
  user: GoogleUser;
  unlockedTowers: string[];
  onBack: () => void;
}

function StarRow({ stars, size = 12 }: { stars: number; size?: number }) {
  const color = STARS_COLORS[stars] || '#94a3b8';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            background: i < stars ? color : '#1e293b',
            clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
            boxShadow: i < stars ? `0 0 4px ${color}80` : 'none',
          }}
        />
      ))}
    </div>
  );
}

function XpBar({ xp, maxXp, color }: { xp: number; maxXp: number; color: string }) {
  const pct = Math.min(100, (xp / maxXp) * 100);
  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}80` }}
      />
    </div>
  );
}

function TowerCard({
  towerKey,
  card,
  isUnlocked,
  isSelected,
  onClick,
}: {
  towerKey: string;
  card: TowerCardData;
  isUnlocked: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const stats = TOWERS[towerKey];
  if (!stats) return null;
  const starColor = STARS_COLORS[card.stars] || '#94a3b8';
  const mults = cardStatMultipliers(card.level);
  const xpMax = xpToNextLevel(card.level);
  const gifSrc = getTowerGifAsset(towerKey);

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 p-2.5 rounded border transition-all duration-200 cursor-pointer group"
      style={{
        background: isSelected
          ? `linear-gradient(160deg, ${starColor}18, ${starColor}08)`
          : isUnlocked
          ? 'rgba(15,25,45,0.9)'
          : 'rgba(10,15,25,0.7)',
        borderColor: isSelected ? starColor : isUnlocked ? starColor + '30' : '#1e293b',
        boxShadow: isSelected ? `0 0 16px ${starColor}40, inset 0 0 12px ${starColor}08` : 'none',
        filter: isUnlocked ? 'none' : 'grayscale(0.8)',
        opacity: isUnlocked ? 1 : 0.5,
        width: 110,
      }}
    >
      {/* Rarity top bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t" style={{ background: starColor }} />

      {/* Tower art */}
      <div
        className="w-14 h-14 flex items-center justify-center rounded overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${starColor}40` }}
      >
        {gifSrc ? (
          <img src={gifSrc} alt={stats.name} className="h-full w-full object-contain pixel-art" draggable={false} />
        ) : (
          <span style={{ fontSize: 32 }}>{stats.icon}</span>
        )}
      </div>

      {/* Name */}
      <div
        className="font-mono font-bold text-[9px] tracking-wider text-center leading-tight truncate w-full"
        style={{ color: isUnlocked ? '#e2e8f0' : '#475569' }}
      >
        {stats.name}
      </div>

      {/* Stars */}
      <StarRow stars={card.stars} size={9} />

      {/* Level badge */}
      <div
        className="font-mono font-black text-[10px] px-2 py-0.5 rounded-sm"
        style={{ background: starColor + '22', color: starColor, border: `1px solid ${starColor}40` }}
      >
        LV {card.level}
      </div>

      {/* XP bar */}
      {card.level < 20 && (
        <div className="w-full">
          <XpBar xp={card.xp} maxXp={xpMax} color={starColor} />
          <div className="font-mono text-[7px] text-slate-500 text-right mt-0.5">
            {card.xp}/{xpMax}
          </div>
        </div>
      )}
      {card.level >= 20 && (
        <div className="font-mono text-[8px] font-black" style={{ color: starColor }}>MAX</div>
      )}

      {/* Stat mult preview */}
      <div className="text-[7px] font-mono text-slate-500 w-full text-center">
        DMG ×{mults.damage.toFixed(2)}
      </div>

      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded">
          <span className="font-mono text-[9px] font-bold text-slate-600 tracking-widest">LOCKED</span>
        </div>
      )}
    </button>
  );
}

function CardDetail({ card, towerKey }: { card: TowerCardData; towerKey: string }) {
  const stats = TOWERS[towerKey];
  if (!stats) return null;
  const starColor = STARS_COLORS[card.stars] || '#94a3b8';
  const mults = cardStatMultipliers(card.level);
  const gifSrc = getTowerGifAsset(towerKey);
  const xpMax = xpToNextLevel(card.level);

  return (
    <div
      className="flex-1 flex flex-col gap-4 p-5 rounded border overflow-y-auto"
      style={{
        background: `linear-gradient(160deg, ${starColor}12, rgba(10,20,40,0.95))`,
        borderColor: starColor + '50',
        boxShadow: `inset 0 0 40px ${starColor}06`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t" style={{ background: starColor + '80' }} />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className="w-20 h-20 flex items-center justify-center rounded flex-shrink-0"
          style={{ background: 'rgba(0,0,0,0.6)', border: `2px solid ${starColor}60`, boxShadow: `0 0 16px ${starColor}30` }}
        >
          {gifSrc ? (
            <img src={gifSrc} alt={stats.name} className="h-full w-full object-contain pixel-art" draggable={false} />
          ) : (
            <span style={{ fontSize: 48 }}>{stats.icon}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono font-black text-xl tracking-wider" style={{ color: starColor }}>
            {stats.name}
          </div>
          <div
            className="font-mono text-[10px] tracking-widest mb-2"
            style={{ color: starColor + 'aa' }}
          >
            {STARS_LABELS[card.stars]} · {(stats as any).type?.toUpperCase() || 'PROJECTILE'}
          </div>
          <StarRow stars={card.stars} size={14} />
          <div className="mt-2 text-[11px] text-slate-300 leading-relaxed italic">
            {(stats as any).description || stats.name}
          </div>
        </div>
      </div>

      {/* Level + XP */}
      <div className="p-3 rounded border" style={{ borderColor: starColor + '30', background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono font-black text-2xl" style={{ color: starColor }}>
            LV {card.level}
          </div>
          {card.level < 20 ? (
            <div className="font-mono text-[10px] text-slate-400">
              {card.xp} / {xpMax} XP
            </div>
          ) : (
            <div className="font-mono text-[10px] font-bold" style={{ color: starColor }}>MAX LEVEL</div>
          )}
        </div>
        {card.level < 20 && <XpBar xp={card.xp} maxXp={xpMax} color={starColor} />}
      </div>

      {/* Stat bonuses */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'DMG MULT', value: `×${mults.damage.toFixed(2)}`, color: '#f87171' },
          { label: 'RNG MULT', value: `×${mults.range.toFixed(2)}`, color: '#60a5fa' },
          { label: 'SPD MULT', value: `×${mults.cooldownDiv.toFixed(2)}`, color: '#fbbf24' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="p-2 rounded border text-center"
            style={{ borderColor: color + '30', background: color + '10' }}
          >
            <div className="font-mono text-[8px] text-slate-400 tracking-widest mb-0.5">{label}</div>
            <div className="font-mono font-black text-base" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Bond level */}
      <div className="p-3 rounded border" style={{ borderColor: '#a855f730', background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-[9px] tracking-widest text-slate-400">BOND LEVEL</div>
          <div className="font-mono font-black text-sm text-purple-400">
            {card.bondLevel} / 10
          </div>
        </div>
        <div className="flex gap-1 mb-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-sm"
              style={{
                background: i < card.bondLevel ? '#a855f7' : '#1e293b',
                boxShadow: i < card.bondLevel ? '0 0 4px #a855f780' : 'none',
              }}
            />
          ))}
        </div>
        <div className="text-[9px] text-slate-400 font-mono">
          Total Kills: <span className="text-purple-300 font-bold">{card.totalKills}</span>
          <span className="ml-3">Next Bond at: <span className="text-purple-300">{(Math.floor(card.totalKills / 50) + 1) * 50} kills</span></span>
        </div>
        {Object.entries(BOND_BONUSES).map(([lvl, desc]) => (
          <div
            key={lvl}
            className="flex items-center gap-2 mt-1.5"
            style={{ opacity: card.bondLevel >= parseInt(lvl) ? 1 : 0.35 }}
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center font-mono text-[8px] font-bold flex-shrink-0"
              style={{
                background: card.bondLevel >= parseInt(lvl) ? '#a855f7' : '#1e293b',
                color: card.bondLevel >= parseInt(lvl) ? 'white' : '#475569',
              }}
            >
              {lvl}
            </div>
            <span className="font-mono text-[9px]" style={{ color: card.bondLevel >= parseInt(lvl) ? '#c4b5fd' : '#475569' }}>
              {desc}
            </span>
          </div>
        ))}
      </div>

      {/* Base stats */}
      <div className="p-3 rounded border" style={{ borderColor: '#33415530', background: 'rgba(0,0,0,0.3)' }}>
        <div className="font-mono text-[8px] tracking-widest text-slate-500 mb-2">BASE STATS</div>
        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
          <div className="text-slate-400">Cost: <span className="text-emerald-400 font-bold">${stats.cost}</span></div>
          <div className="text-slate-400">Damage: <span className="text-red-400 font-bold">{stats.damage}</span></div>
          <div className="text-slate-400">Range: <span className="text-blue-400 font-bold">{stats.range}</span></div>
          <div className="text-slate-400">Kills: <span className="text-yellow-400 font-bold">{card.totalKills}</span></div>
        </div>
      </div>
    </div>
  );
}

export const CardCollection: React.FC<CardCollectionProps> = ({ user, unlockedTowers, onBack }) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const allCards = useMemo(() => {
    const saved = loadTowerCards(user.uid);
    const result: Record<string, TowerCardData> = {};
    for (const key of Object.keys(TOWERS)) {
      result[key] = getOrInitCard(saved, key, unlockedTowers.includes(key));
    }
    return result;
  }, [user.uid, unlockedTowers]);

  const towerKeys = useMemo(() => {
    return Object.keys(TOWERS).filter((key) => {
      const card = allCards[key];
      const stats = TOWERS[key];
      if (filterStars !== null && card.stars !== filterStars) return false;
      if (filterType !== 'all' && (stats as any).type !== filterType) return false;
      return true;
    });
  }, [allCards, filterStars, filterType]);

  const selectedCard = selectedKey ? allCards[selectedKey] : null;
  const towerTypes = ['all', ...Array.from(new Set(Object.values(TOWERS).map((t) => (t as any).type || 'projectile')))];

  return (
    <div
      className="min-h-screen w-screen flex flex-col select-none"
      style={{ background: 'linear-gradient(160deg, #061428 0%, #091a38 50%, #050e1c 100%)' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(0,212,255,0.15)', background: 'rgba(6,20,40,0.9)' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-[10px] tracking-wider px-3 py-1.5 border transition-colors"
            style={{ borderColor: 'rgba(0,212,255,0.3)', color: '#00d4ff' }}
          >
            &lt; BACK
          </button>
          <span className="font-mono font-bold text-sm tracking-[0.2em] text-cyan-300" style={{ textShadow: '0 0 8px rgba(0,212,255,0.6)' }}>
            CARD COLLECTION
          </span>
          <span className="font-mono text-[9px] text-slate-500">
            {unlockedTowers.length} / {Object.keys(TOWERS).length} UNLOCKED
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Stars filter */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setFilterStars(null)}
              className="font-mono text-[9px] px-2 py-1 border transition-colors"
              style={{
                borderColor: filterStars === null ? '#00d4ff' : '#334155',
                color: filterStars === null ? '#00d4ff' : '#475569',
              }}
            >
              ALL
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStars(filterStars === s ? null : s)}
                className="font-mono text-[9px] px-2 py-1 border transition-colors"
                style={{
                  borderColor: filterStars === s ? STARS_COLORS[s] : '#334155',
                  color: filterStars === s ? STARS_COLORS[s] : '#475569',
                }}
              >
                {s}★
              </button>
            ))}
          </div>
          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="font-mono text-[9px] px-2 py-1 border bg-slate-900 text-slate-300"
            style={{ borderColor: '#334155' }}
          >
            {towerTypes.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Card grid */}
        <div className="flex-shrink-0 overflow-y-auto p-4" style={{ width: 520 }}>
          <div className="flex flex-wrap gap-2">
            {towerKeys.map((key) => (
              <TowerCard
                key={key}
                towerKey={key}
                card={allCards[key]}
                isUnlocked={unlockedTowers.includes(key)}
                isSelected={selectedKey === key}
                onClick={() => setSelectedKey(key === selectedKey ? null : key)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 p-4 overflow-y-auto relative">
          {selectedCard && selectedKey ? (
            <CardDetail card={selectedCard} towerKey={selectedKey} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-slate-600 text-[11px] tracking-widest mb-2">SELECT A CARD</div>
                <div className="font-mono text-slate-700 text-[9px]">
                  {unlockedTowers.length} cards unlocked · Earn XP in battle to level up
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
