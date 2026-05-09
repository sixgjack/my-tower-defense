// src/components/WavePreparationPage.tsx
import React, { useState, useMemo } from 'react';
import { generateBuffChoices, getBuffDescription, type BuffDefinition } from '../engine/buffSystem';
import { THEMES, TOWERS } from '../engine/data';
import { i18n } from '../utils/i18n';
import { getTowerGifAsset } from '../config/visualAssets';

interface WavePreparationPageProps {
  isOpen: boolean;
  wave: number;
  gold: number;
  lives: number;
  allowedTowers: string[];
  allUnlockedTowers: string[];
  onSelectBuff: (buff: BuffDefinition) => void;
  onSpendGold: (amount: number) => void;
  onConfirm: (newAllowedTowers: string[]) => void;
}

// ── Vendor pixel art SVG ─────────────────────────────────────────────────────
function VendorPortrait({ size = 100 }: { size?: number }) {
  const h = Math.round(size * 110 / 72);
  return (
    <svg width={size} height={h} viewBox="0 0 72 110" style={{ imageRendering: 'pixelated' }}>
      {/* Robe body */}
      <rect x="14" y="52" width="44" height="50" fill="#1a0f2e" />
      <rect x="18" y="56" width="36" height="44" fill="#221040" />
      {/* Robe drape lines */}
      <rect x="28" y="56" width="3" height="44" fill="#2e1860" opacity="0.7" />
      <rect x="36" y="56" width="3" height="44" fill="#2e1860" opacity="0.7" />
      <rect x="44" y="56" width="3" height="44" fill="#2e1860" opacity="0.7" />
      {/* Robe hem decoration */}
      <rect x="14" y="98" width="44" height="4" fill="#5b21b6" opacity="0.8" />
      <rect x="18" y="100" width="6" height="6" fill="#7c3aed" opacity="0.9" />
      <rect x="30" y="100" width="6" height="6" fill="#7c3aed" opacity="0.9" />
      <rect x="42" y="100" width="6" height="6" fill="#7c3aed" opacity="0.9" />
      {/* Belt */}
      <rect x="16" y="68" width="40" height="5" fill="#0d0820" />
      <rect x="32" y="68" width="8" height="5" fill="#facc15" opacity="0.9" />
      {/* Pouch */}
      <rect x="44" y="71" width="10" height="8" fill="#0d0820" />
      <rect x="46" y="73" width="6" height="4" fill="#1c1030" />
      {/* Arms */}
      <rect x="6"  y="54" width="10" height="20" fill="#1a0f2e" />
      <rect x="56" y="54" width="10" height="20" fill="#1a0f2e" />
      {/* Hands — holding a glowing artifact */}
      <rect x="5"  y="72" width="8"  height="6"  fill="#c4845e" />
      <rect x="59" y="72" width="8"  height="6"  fill="#c4845e" />
      {/* Item being held — glowing coin stack */}
      <rect x="26" y="76" width="20" height="12" fill="#0a0820" />
      <rect x="28" y="77" width="16" height="10" fill="#1c0f40" />
      <rect x="30" y="78" width="12" height="8"  fill="#facc15" opacity="0.85" />
      <rect x="32" y="79" width="8"  height="6"  fill="#fef08a" opacity="0.7" />
      <rect x="32" y="79" width="8"  height="2"  fill="#ffffff" opacity="0.4" />
      {/* Glow from item */}
      <ellipse cx="36" cy="82" rx="14" ry="8" fill="#facc15" opacity="0.10" />
      {/* Neck */}
      <rect x="28" y="44" width="16" height="10" fill="#c4845e" />
      {/* Head */}
      <rect x="20" y="14" width="32" height="32" fill="#1a0f2e" />
      <rect x="22" y="16" width="28" height="28" fill="#c4845e" />
      {/* Hood */}
      <rect x="16" y="10" width="40" height="24" fill="#1a0f2e" />
      <rect x="18" y="12" width="36" height="20" fill="#221040" />
      {/* Hood inner shadow */}
      <rect x="20" y="16" width="32" height="16" fill="#1a0f2e" opacity="0.6" />
      {/* Face peeking out */}
      <rect x="24" y="18" width="24" height="20" fill="#c4845e" />
      {/* Eyes — glowing green */}
      <rect x="26" y="23" width="7"  height="5"  fill="#000000" />
      <rect x="39" y="23" width="7"  height="5"  fill="#000000" />
      <rect x="27" y="24" width="5"  height="3"  fill="#00ff88" opacity="0.95" />
      <rect x="40" y="24" width="5"  height="3"  fill="#00ff88" opacity="0.95" />
      <rect x="28" y="24" width="2"  height="2"  fill="#ffffff" opacity="0.6" />
      <rect x="41" y="24" width="2"  height="2"  fill="#ffffff" opacity="0.6" />
      {/* Nose & mouth */}
      <rect x="34" y="29" width="4"  height="4"  fill="#b57350" />
      <rect x="30" y="34" width="12" height="3"  fill="#7c3020" />
      <rect x="32" y="35" width="8"  height="1"  fill="#e86030" opacity="0.7" />
      {/* Hood crest / rune */}
      <rect x="30" y="11" width="12" height="2"  fill="#7c3aed" />
      <rect x="33" y="9"  width="6"  height="4"  fill="#9333ea" />
      <rect x="35" y="8"  width="2"  height="2"  fill="#c084fc" />
      {/* Shoulder pads */}
      <rect x="14" y="50" width="14" height="6"  fill="#221040" />
      <rect x="44" y="50" width="14" height="6"  fill="#221040" />
      <rect x="14" y="50" width="14" height="3"  fill="#5b21b6" opacity="0.7" />
      <rect x="44" y="50" width="14" height="3"  fill="#5b21b6" opacity="0.7" />
      {/* Ambient glow */}
      <ellipse cx="36" cy="60" rx="30" ry="40" fill="#7c3aed" opacity="0.04" />
    </svg>
  );
}

// ── Rarity styles ─────────────────────────────────────────────────────────────
const RARITY_STYLE: Record<string, { border: string; bg: string; badge: string; title: string }> = {
  legendary: { border: '#facc15', bg: 'rgba(120,60,0,0.65)',  badge: 'bg-yellow-500 text-black',      title: 'text-yellow-300' },
  epic:      { border: '#a855f7', bg: 'rgba(80,20,100,0.65)', badge: 'bg-purple-500 text-white',      title: 'text-purple-300' },
  rare:      { border: '#38bdf8', bg: 'rgba(10,60,100,0.65)', badge: 'bg-sky-500 text-white',         title: 'text-sky-300'    },
  common:    { border: '#475569', bg: 'rgba(20,30,45,0.65)',  badge: 'bg-slate-600 text-slate-200',   title: 'text-slate-200'  },
};

// ── Shop item types ───────────────────────────────────────────────────────────
type ShopItemKind = 'buff' | 'life' | 'temp_tower';
interface ShopItem {
  id: string;
  kind: ShopItemKind;
  name: string;
  nameZh: string;
  desc: string;
  descZh: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  buff?: BuffDefinition;
  towerKey?: string;
  icon: string;
}

const VENDOR_LINES = [
  "Fresh stock, commander. Priced fairly... relatively speaking.",
  "I only sell to the prepared. Are you prepared?",
  "Spend it or lose it. Gold is no armor.",
  "These won't last long. Others want what you want.",
  "The next environment is cruel. I suggest you shop wisely.",
  "I've seen worse odds. Not many, but some.",
];

function getRarityForWave(wave: number): 'common' | 'rare' | 'epic' | 'legendary' | undefined {
  if (wave >= 30) return Math.random() < 0.3 ? 'legendary' : Math.random() < 0.5 ? 'epic' : 'rare';
  if (wave >= 20) return Math.random() < 0.2 ? 'epic' : Math.random() < 0.5 ? 'rare' : 'common';
  return Math.random() < 0.3 ? 'rare' : 'common';
}

function buildShopItems(wave: number, allowedTowers: string[]): ShopItem[] {
  const items: ShopItem[] = [];

  // 1) Always a random buff
  const rarity = getRarityForWave(wave);
  const buffs = generateBuffChoices(rarity);
  if (buffs.length > 0) {
    const b = buffs[0];
    const priceMap = { legendary: 1500, epic: 1000, rare: 600, common: 350 };
    items.push({
      id: `buff_${b.id}`,
      kind: 'buff',
      name: b.name,
      nameZh: b.nameZh,
      desc: getBuffDescription(b, 'en'),
      descZh: getBuffDescription(b, 'zh'),
      price: priceMap[b.rarity] ?? 400,
      rarity: b.rarity,
      buff: b,
      icon: '✦',
    });
  }

  // 2) Random life item
  const lifeRoll = Math.random();
  if (lifeRoll < 0.3) {
    items.push({ id: 'life_restore_15', kind: 'life', name: 'Restore to 15 Lives', nameZh: '恢復至15生命', desc: 'Fills lives up to 15 if below.', descZh: '將生命值補充至15', price: 1400, rarity: 'epic', icon: '🛡' });
  } else if (lifeRoll < 0.65) {
    items.push({ id: 'life_5', kind: 'life', name: '+5 Lives', nameZh: '+5生命', desc: 'Gain 5 extra lives. Max 20.', descZh: '獲得5條生命，上限20', price: 700, rarity: 'rare', icon: '♥' });
  } else {
    items.push({ id: 'life_3', kind: 'life', name: '+3 Lives', nameZh: '+3生命', desc: 'Gain 3 extra lives. Max 20.', descZh: '獲得3條生命，上限20', price: 400, rarity: 'common', icon: '♥' });
  }

  // 3) Temp tower (from pool not in current loadout)
  const allKeys = Object.keys(TOWERS);
  const others = allKeys.filter(k => !allowedTowers.includes(k));
  if (others.length > 0) {
    const pick = others[Math.floor(Math.random() * others.length)];
    const stats = TOWERS[pick];
    const towerRarity = (stats.cost || 50) > 250 ? 'epic' : (stats.cost || 50) > 120 ? 'rare' : 'common';
    const towerPrice = (stats.cost || 50) > 250 ? 1800 : (stats.cost || 50) > 120 ? 1100 : 750;
    items.push({
      id: `tower_${pick}`,
      kind: 'temp_tower',
      name: `[TEMP] ${stats.name}`,
      nameZh: `[臨時] ${stats.nameZh ?? stats.name}`,
      desc: `Adds ${stats.name} to your build list for this environment only.`,
      descZh: `本環境臨時解鎖${stats.nameZh ?? stats.name}`,
      price: towerPrice,
      rarity: towerRarity as any,
      towerKey: pick,
      icon: stats.icon || '🏗',
    });
  }

  return items;
}

// ── Minimap preview ───────────────────────────────────────────────────────────
function ThemePreview({ themeIndex }: { themeIndex: number }) {
  const theme = THEMES[Math.min(themeIndex, THEMES.length - 1)];
  const patterns = ['↔ LINEAR', '🌀 SPIRAL', '⬜ RING', '↕ ZIGZAG', '∪ U-TURN', '🔀 MAZE'];
  const patternLabel = patterns[(themeIndex) % patterns.length];
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[8px] tracking-[0.25em] uppercase font-bold text-slate-400">NEXT STAGE</div>
      <div className="flex items-center gap-3 px-3 py-2" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(250,204,21,0.3)' }}>
        <div className="text-2xl">{theme.obstacle ?? '🌍'}</div>
        <div>
          <div className="text-sm font-black text-yellow-300 tracking-wider">{theme.name}</div>
          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{patternLabel} PATH LAYOUT</div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {theme.towerDamageMultiplier && theme.towerDamageMultiplier > 1 && <span className="text-green-400 mr-2">+{Math.round((theme.towerDamageMultiplier - 1) * 100)}% DMG</span>}
            {theme.towerRangeMultiplier && theme.towerRangeMultiplier > 1 && <span className="text-sky-400 mr-2">+{Math.round((theme.towerRangeMultiplier - 1) * 100)}% RNG</span>}
            {theme.enemySpeedMultiplier && theme.enemySpeedMultiplier > 1 && <span className="text-red-400 mr-2">+{Math.round((theme.enemySpeedMultiplier - 1) * 100)}% ENEMY SPD</span>}
            {theme.enemyHpMultiplier && theme.enemyHpMultiplier > 1 && <span className="text-red-400 mr-2">+{Math.round((theme.enemyHpMultiplier - 1) * 100)}% ENEMY HP</span>}
            {theme.moneyBonus && theme.moneyBonus > 1 && <span className="text-yellow-400 mr-2">+${theme.moneyBonus} BONUS GOLD</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export const WavePreparationPage: React.FC<WavePreparationPageProps> = ({
  isOpen, wave, gold, lives, allowedTowers, allUnlockedTowers,
  onSelectBuff, onSpendGold, onConfirm,
}) => {
  const lang = i18n.getLanguage();
  const nextThemeIndex = Math.min(Math.floor((wave - 1) / 10), THEMES.length - 1);
  const currentTheme  = THEMES[Math.max(0, nextThemeIndex - 1)];
  const nextTheme     = THEMES[nextThemeIndex];

  const vendorLine = useMemo(() => VENDOR_LINES[Math.floor(Math.random() * VENDOR_LINES.length)], [wave]);

  const [localTowers, setLocalTowers]   = useState<string[]>(() => [...allowedTowers]);
  const [tempTowers,  setTempTowers]    = useState<string[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [swapTarget, setSwapTarget]     = useState<string | null>(null); // tower key being swapped out
  const [localGold, setLocalGold]       = useState(gold);
  const [rerolls, setRerolls]           = useState(0);
  const [shopItems, setShopItems]       = useState<ShopItem[]>(() => buildShopItems(wave, allowedTowers));

  if (!isOpen) return null;

  const spendGold = (amount: number) => {
    setLocalGold(g => Math.max(0, g - amount));
    onSpendGold(amount);
  };

  const handleBuyItem = (item: ShopItem) => {
    if (localGold < item.price || purchasedIds.has(item.id)) return;
    spendGold(item.price);
    setPurchasedIds(prev => new Set([...prev, item.id]));
    if (item.kind === 'buff' && item.buff) {
      onSelectBuff(item.buff);
    } else if (item.kind === 'temp_tower' && item.towerKey) {
      setTempTowers(prev => [...prev, item.towerKey!]);
    }
    // life items are handled in onConfirm via purchasedIds
  };

  const handleReroll = () => {
    const cost = 200 + rerolls * 100;
    if (localGold < cost) return;
    spendGold(cost);
    setRerolls(r => r + 1);
    setShopItems(buildShopItems(wave, localTowers));
    setPurchasedIds(new Set());
  };

  const handleSwapTower = (newKey: string) => {
    if (!swapTarget) return;
    setLocalTowers(prev => prev.map(k => k === swapTarget ? newKey : k));
    setSwapTarget(null);
  };

  const handleAdvance = () => {
    // Resolve any life purchases before confirming
    purchasedIds.forEach(id => {
      if (id === 'life_3')           { /* handled by engine via onPurchase, but here we mirror */ }
      if (id === 'life_5')           { /* same */ }
      if (id === 'life_restore_15')  { /* same */ }
    });
    onConfirm([...localTowers, ...tempTowers]);
  };

  const swappablePool = allUnlockedTowers.filter(k => !localTowers.includes(k));

  return (
    <div className="fixed inset-0 z-[300] flex flex-col overflow-hidden"
         style={{ background: 'linear-gradient(160deg, #04080f 0%, #060c18 60%, #04080f 100%)' }}>

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.008) 3px, rgba(0,212,255,0.008) 4px)',
      }} />

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 flex-shrink-0"
           style={{ background: 'linear-gradient(90deg, #1c0a00 0%, #06091a 50%, #1c0a00 100%)', borderBottom: '2px solid #f59e0b60' }}>
        <div>
          <div className="text-[9px] tracking-[0.35em] uppercase font-bold" style={{ color: '#f59e0b' }}>
            ENVIRONMENT TRANSITION — WAVE {wave - 1} COMPLETE
          </div>
          <div className="text-lg font-black text-white mt-0.5 tracking-wider">
            {currentTheme.name}
            <span className="mx-2 text-slate-500">→</span>
            <span style={{ color: '#f59e0b' }}>{nextTheme.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Treasury</div>
            <div className="text-xl font-black" style={{ color: '#fbbf24' }}>${localGold}</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Lives</div>
            <div className="text-xl font-black text-red-400">{lives}/20</div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT: VENDOR ────────────────────────────────────────────────── */}
        <div className="w-[200px] flex-shrink-0 flex flex-col items-center justify-center gap-4 px-4 py-4"
             style={{ borderRight: '1px solid rgba(139,92,246,0.2)', background: 'rgba(60,0,100,0.12)' }}>
          <div className="text-[8px] tracking-[0.25em] uppercase font-bold text-purple-400">ARMS DEALER</div>
          <VendorPortrait size={100} />
          {/* Speech bubble */}
          <div className="relative px-3 py-2 text-center" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', maxWidth: 160 }}>
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
                 style={{ background: 'rgba(60,0,100,0.8)', borderTop: '1px solid rgba(139,92,246,0.4)', borderLeft: '1px solid rgba(139,92,246,0.4)' }} />
            <p className="text-[9px] text-purple-200 italic leading-relaxed">&ldquo;{vendorLine}&rdquo;</p>
          </div>
          {/* Reroll button */}
          <button
            onClick={handleReroll}
            disabled={localGold < 200 + rerolls * 100}
            className="w-full py-2 font-black text-[9px] tracking-widest transition-all"
            style={{
              background: localGold >= 200 + rerolls * 100 ? 'rgba(88,28,135,0.6)' : 'rgba(20,20,30,0.6)',
              border: `1px solid ${localGold >= 200 + rerolls * 100 ? '#9333ea' : '#1e293b'}`,
              color: localGold >= 200 + rerolls * 100 ? '#c084fc' : '#475569',
            }}
          >
            REROLL {200 + rerolls * 100}g
          </button>
        </div>

        {/* ── CENTER: SHOP ITEMS ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-0 px-6 py-4 overflow-y-auto">
          <div className="text-[9px] tracking-[0.3em] uppercase font-bold text-slate-400 mb-3">
            TACTICAL ARSENAL — 3 ITEMS
          </div>
          <div className="flex flex-col gap-3">
            {shopItems.map(item => {
              const style = RARITY_STYLE[item.rarity] ?? RARITY_STYLE.common;
              const bought = purchasedIds.has(item.id);
              const canAfford = localGold >= item.price;
              const gifSrc = item.towerKey ? getTowerGifAsset(item.towerKey) : null;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 transition-all"
                  style={{
                    background: bought ? 'rgba(20,60,20,0.8)' : style.bg,
                    border: `1px solid ${bought ? '#22c55e' : style.border}`,
                    boxShadow: bought ? '0 0 12px #22c55e30' : `0 0 8px ${style.border}18`,
                    opacity: !canAfford && !bought ? 0.55 : 1,
                  }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl"
                       style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${style.border}40` }}>
                    {gifSrc
                      ? <img src={gifSrc} alt={item.name} className="w-9 h-9 object-contain" style={{ imageRendering: 'pixelated' }} />
                      : <span>{item.icon}</span>}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[8px] px-1 py-0.5 font-bold uppercase ${style.badge}`}>{item.rarity}</span>
                      <span className={`text-xs font-black ${style.title}`}>
                        {lang === 'zh' ? item.nameZh : item.name}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed">
                      {lang === 'zh' ? item.descZh : item.desc}
                    </p>
                  </div>
                  {/* Buy button */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-[9px] font-black mb-1" style={{ color: canAfford ? '#fbbf24' : '#475569' }}>
                      ${item.price}
                    </div>
                    {bought ? (
                      <div className="px-3 py-1.5 text-[9px] font-black text-green-400">ACQUIRED ✓</div>
                    ) : (
                      <button
                        onClick={() => handleBuyItem(item)}
                        disabled={!canAfford}
                        className="px-3 py-1.5 font-black text-[9px] tracking-widest transition-all"
                        style={{
                          background: canAfford ? `rgba(${item.rarity === 'legendary' ? '120,60,0' : item.rarity === 'epic' ? '80,20,100' : '10,60,100'},0.8)` : 'rgba(20,20,30,0.6)',
                          border: `1px solid ${canAfford ? style.border : '#1e293b'}`,
                          color: canAfford ? style.border : '#475569',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                        }}
                      >
                        BUY
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: TOWER LOADOUT ─────────────────────────────────────────── */}
        <div className="w-[240px] flex-shrink-0 flex flex-col px-4 py-4 overflow-y-auto"
             style={{ borderLeft: '1px solid rgba(0,212,255,0.15)', background: 'rgba(0,20,40,0.18)' }}>
          <div className="text-[9px] tracking-[0.3em] uppercase font-bold text-cyan-400 mb-3">
            TOWER LOADOUT
          </div>

          {/* Current tower list */}
          <div className="flex flex-col gap-1.5 mb-4">
            {localTowers.map(key => {
              const stats = TOWERS[key];
              if (!stats) return null;
              const isSwapping = swapTarget === key;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 px-2 py-1.5 transition-all"
                  style={{
                    background: isSwapping ? 'rgba(239,68,68,0.18)' : 'rgba(0,30,60,0.6)',
                    border: `1px solid ${isSwapping ? '#ef4444' : 'rgba(0,212,255,0.2)'}`,
                  }}
                >
                  <span className="text-base w-6 text-center">{stats.icon}</span>
                  <span className="flex-1 text-[9px] font-bold text-slate-200 truncate">
                    {lang === 'zh' ? (stats.nameZh ?? stats.name) : stats.name}
                  </span>
                  <button
                    onClick={() => setSwapTarget(isSwapping ? null : key)}
                    className="text-[8px] px-1.5 py-0.5 font-bold transition-all flex-shrink-0"
                    style={{
                      background: isSwapping ? 'rgba(239,68,68,0.3)' : 'rgba(0,100,150,0.3)',
                      border: `1px solid ${isSwapping ? '#ef4444' : 'rgba(0,212,255,0.3)'}`,
                      color: isSwapping ? '#f87171' : '#67e8f9',
                    }}
                  >
                    {isSwapping ? 'CANCEL' : 'SWAP'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Temp towers */}
          {tempTowers.length > 0 && (
            <div className="mb-4">
              <div className="text-[8px] text-yellow-400 tracking-widest uppercase mb-1.5">TEMP (THIS ENV)</div>
              {tempTowers.map(key => {
                const stats = TOWERS[key];
                if (!stats) return null;
                return (
                  <div key={key} className="flex items-center gap-2 px-2 py-1.5 mb-1"
                       style={{ background: 'rgba(120,60,0,0.3)', border: '1px solid rgba(250,204,21,0.4)' }}>
                    <span className="text-base w-6 text-center">{stats.icon}</span>
                    <span className="flex-1 text-[9px] font-bold text-yellow-300 truncate">{stats.name}</span>
                    <span className="text-[7px] text-yellow-600 font-bold">TEMP</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Swap picker */}
          {swapTarget && (
            <div>
              <div className="text-[8px] text-red-400 tracking-widest uppercase mb-1.5">
                REPLACING: {TOWERS[swapTarget]?.name}
              </div>
              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                {swappablePool.length === 0 ? (
                  <div className="text-[9px] text-slate-500 text-center py-2">No other unlocked towers</div>
                ) : swappablePool.map(key => {
                  const stats = TOWERS[key];
                  if (!stats) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSwapTower(key)}
                      className="flex items-center gap-2 px-2 py-1.5 text-left transition-all"
                      style={{ background: 'rgba(0,60,20,0.4)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}
                    >
                      <span className="text-sm w-5 text-center">{stats.icon}</span>
                      <span className="text-[9px] font-bold truncate">{stats.name}</span>
                      <span className="text-[8px] text-slate-400 ml-auto flex-shrink-0">${stats.cost}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 px-6 py-4"
           style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid #f59e0b30' }}>
        <div className="flex items-center justify-between gap-6">
          <ThemePreview themeIndex={nextThemeIndex} />
          <div className="text-[8px] text-slate-500 text-center">
            <div>⚠ Towers on the new path will be refunded (70%)</div>
            <div className="mt-0.5">New start &amp; end points will be assigned</div>
          </div>
          <button
            onClick={handleAdvance}
            className="px-10 py-3 font-black text-sm tracking-widest transition-all hover:scale-105 flex-shrink-0"
            style={{
              background: 'linear-gradient(90deg, #92400e, #b45309)',
              border: '2px solid #f59e0b',
              color: '#fef3c7',
              boxShadow: '0 0 20px rgba(245,158,11,0.35)',
            }}
          >
            ADVANCE TO {nextTheme.name.toUpperCase()} →
          </button>
        </div>
      </div>
    </div>
  );
};
