// src/components/LuckyDraw.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { GoogleUser } from '../services/googleAuth';
import * as db from '../services/postgresDatabase';
import { TOWERS } from '../engine/data';
import { i18n } from '../utils/i18n';

// ═══════════════════════════════════════════
//  Types & Constants
// ═══════════════════════════════════════════

type Rarity = 'N' | 'R' | 'SR' | 'SSR';
type AnimPhase = 'idle' | 'orb' | 'flash' | 'reveal-single' | 'reveal-ten';

interface DrawResult {
  towerKey: string;
  rarity: Rarity;
  isDuplicate: boolean;
  newExpTotal: number;
  newStarLevel: number;
}

interface LuckyDrawProps {
  user: GoogleUser;
  credits: number;
  unlockedTowers: string[];
  onBack: () => void;
  onStatusUpdate: () => Promise<void>;
}

const SINGLE_COST = 100;
const TEN_COST = 900;
// ★1=0 exp (base), ★2=3, ★3=6, ★4=10
const STAR_EXP_THRESHOLDS = [0, 3, 6, 10];

const RARITY_WEIGHTS: Record<Rarity, number> = { SSR: 3, SR: 12, R: 25, N: 60 };

const RARITY_CONFIG: Record<Rarity, {
  labelZh: string; gradient: string; glow: string;
  border: string; bg: string; text: string; badge: string;
}> = {
  SSR: {
    labelZh: '最稀有',
    gradient: 'from-yellow-400 via-orange-300 to-yellow-500',
    glow: '#facc15',
    border: 'border-yellow-400',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-300',
    badge: 'bg-gradient-to-r from-yellow-500 to-orange-400 text-black font-black',
  },
  SR: {
    labelZh: '超稀有',
    gradient: 'from-purple-500 via-pink-400 to-purple-600',
    glow: '#a855f7',
    border: 'border-purple-400',
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    badge: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold',
  },
  R: {
    labelZh: '稀有',
    gradient: 'from-blue-500 to-cyan-400',
    glow: '#3b82f6',
    border: 'border-blue-400',
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    badge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold',
  },
  N: {
    labelZh: '普通',
    gradient: 'from-slate-500 to-slate-600',
    glow: '#64748b',
    border: 'border-slate-500',
    bg: 'bg-slate-600/15',
    text: 'text-slate-300',
    badge: 'bg-slate-600 text-slate-200 font-semibold',
  },
};

// ═══════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════

function getStarLevel(exp: number): number {
  for (let i = STAR_EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= STAR_EXP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function starDisplay(level: number) {
  return '★'.repeat(level) + '☆'.repeat(4 - level);
}

function pickRarity(): Rarity {
  const r = Math.random() * 100;
  if (r < RARITY_WEIGHTS.SSR) return 'SSR';
  if (r < RARITY_WEIGHTS.SSR + RARITY_WEIGHTS.SR) return 'SR';
  if (r < RARITY_WEIGHTS.SSR + RARITY_WEIGHTS.SR + RARITY_WEIGHTS.R) return 'R';
  return 'N';
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function splitPools(allKeys: string[]): Record<Rarity, string[]> {
  const sorted = [...allKeys].sort((a, b) => (TOWERS[b]?.cost ?? 0) - (TOWERS[a]?.cost ?? 0));
  const len = sorted.length;
  const ssrEnd = Math.max(1, Math.floor(len * 0.1));
  const srEnd  = Math.max(ssrEnd + 1, Math.floor(len * 0.4));
  const rEnd   = Math.max(srEnd + 1, Math.floor(len * 0.7));
  const pools: Record<Rarity, string[]> = {
    SSR: sorted.slice(0, ssrEnd),
    SR:  sorted.slice(ssrEnd, srEnd),
    R:   sorted.slice(srEnd, rEnd),
    N:   sorted.slice(rEnd),
  };
  if (pools.N.length === 0)   pools.N   = [...sorted];
  if (pools.R.length === 0)   pools.R   = [...pools.N];
  if (pools.SR.length === 0)  pools.SR  = [...pools.R];
  if (pools.SSR.length === 0) pools.SSR = [...pools.SR];
  return pools;
}

function normalizeKeys(input: string[]): string[] {
  const valid = new Set(Object.keys(TOWERS));
  return Array.from(new Set((input || []).filter(k => valid.has(k))));
}

// ═══════════════════════════════════════════
//  Background Particles
// ═══════════════════════════════════════════

const BG_SHAPES = ['★', '◆', '✦', '✧', '✶', '●'];
const BG_COLORS = ['#facc15', '#a855f7', '#3b82f6', '#ec4899', '#22d3ee', '#fb923c'];

function BackgroundParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 38 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 14 + 7,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 4,
      shape: BG_SHAPES[i % BG_SHAPES.length],
      color: BG_COLORS[i % BG_COLORS.length],
      opacity: Math.random() * 0.22 + 0.04,
    }))
  , []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute gacha-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            color: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.shape}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
//  Gacha Card
// ═══════════════════════════════════════════

function GachaCard({ result, delay = 0 }: { result: DrawResult; delay?: number }) {
  const tower = TOWERS[result.towerKey];
  const cfg   = RARITY_CONFIG[result.rarity];
  const isZh  = i18n.getLanguage() === 'zh';
  const name  = isZh && (tower as any).nameZh ? (tower as any).nameZh : tower.name;
  const desc  = isZh && (tower as any).descriptionZh ? (tower as any).descriptionZh : tower.description;
  const stars = starDisplay(result.newStarLevel);

  return (
    <div
      className="gacha-card-reveal flex flex-col items-center"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div
        className={`relative rounded-xl border-2 ${cfg.border} p-3 ${cfg.bg} flex flex-col items-center gap-1.5`}
        style={{
          boxShadow: `0 0 18px ${cfg.glow}55, 0 0 36px ${cfg.glow}25`,
          minWidth: 140,
          maxWidth: 180,
        }}
      >
        {/* Rarity badge */}
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] ${cfg.badge} whitespace-nowrap`}>
          {result.rarity} {isZh ? cfg.labelZh : ''}
        </div>

        {/* SSR shimmer overlay */}
        {result.rarity === 'SSR' && (
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none gacha-ssr-shimmer" />
        )}

        {/* Tower icon */}
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center mt-2"
          style={{
            background: `radial-gradient(circle, ${tower.color}45, ${tower.color}12)`,
            boxShadow: `0 0 10px ${cfg.glow}70`,
            fontSize: 40,
          }}
        >
          {tower.icon}
        </div>

        {/* Stars */}
        <div className="text-yellow-400 text-xs tracking-widest">{stars}</div>

        {/* Name */}
        <div className={`font-bold text-center text-xs leading-tight ${cfg.text}`}>{name}</div>

        {/* Quote */}
        {(tower as any).quote && (
          <div className="text-[10px] italic text-yellow-200/75 text-center leading-snug px-1">
            {(tower as any).quote}
          </div>
        )}

        {/* Desc */}
        <div className="text-[9px] text-white/50 text-center leading-snug px-1">{desc}</div>

        {/* Duplicate / new label */}
        {result.isDuplicate ? (
          <div className="mt-0.5 px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/50 text-blue-300 text-[9px] font-bold">
            +1 EXP → ★{result.newStarLevel} {isZh ? '已強化' : 'Enhanced'}
          </div>
        ) : (
          <div className="mt-0.5 px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-[9px] font-bold">
            ✨ {isZh ? '新解鎖' : 'New Unlock'}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════

export const LuckyDraw: React.FC<LuckyDrawProps> = ({
  user, credits, unlockedTowers, onBack, onStatusUpdate
}) => {
  const [phase, setPhase]               = useState<AnimPhase>('idle');
  const [results, setResults]           = useState<DrawResult[]>([]);
  const [revealedCount, setRevealed]    = useState(0);
  const [flashRarity, setFlashRarity]   = useState<Rarity | null>(null);

  const isZh = i18n.getLanguage() === 'zh';
  const allKeys = useMemo(() => Object.keys(TOWERS), []);
  const pools   = useMemo(() => splitPools(allKeys), [allKeys]);
  const ssrList = useMemo(() => pools.SSR.slice(0, 6), [pools]);

  const canSingle = credits >= SINGLE_COST;
  const canTen    = credits >= TEN_COST;

  // Stagger the 10-pull reveals
  useEffect(() => {
    if (phase === 'reveal-ten' && revealedCount < results.length) {
      const t = setTimeout(() => setRevealed(c => c + 1), 160);
      return () => clearTimeout(t);
    }
  }, [phase, revealedCount, results.length]);

  const executeDraw = useCallback(async (count: 1 | 10) => {
    const cost = count === 1 ? SINGLE_COST : TEN_COST;
    if (credits < cost) return;

    setPhase('orb');
    setResults([]);
    setRevealed(0);
    await new Promise(r => setTimeout(r, 1900));

    try {
      const statusResult = await db.getStudentStatus(user.uid);
      if (!statusResult.success || !statusResult.data) throw new Error('Cannot load status');

      const status = statusResult.data;
      const currentUnlocked = normalizeKeys(status.unlockedTowers || []);
      const towerExp: Record<string, number> = { ...(status.towerExp || {}) };

      const drawResults: DrawResult[] = [];
      for (let i = 0; i < count; i++) {
        const rarity   = pickRarity();
        const towerKey = pickOne(pools[rarity]);
        const isDupe   = currentUnlocked.includes(towerKey);
        const prevExp  = isDupe ? (towerExp[towerKey] ?? 0) : 0;
        const newExp   = isDupe ? prevExp + 1 : 0;
        const starLvl  = getStarLevel(newExp);

        if (isDupe) {
          towerExp[towerKey] = newExp;
        } else {
          currentUnlocked.push(towerKey);
          towerExp[towerKey] = towerExp[towerKey] ?? 0;
        }

        drawResults.push({ towerKey, rarity, isDuplicate: isDupe, newExpTotal: newExp, newStarLevel: starLvl });
      }

      // Best rarity for flash color
      const order: Rarity[] = ['SSR', 'SR', 'R', 'N'];
      const best = order.find(r => drawResults.some(d => d.rarity === r)) ?? 'N';
      setFlashRarity(best);

      await db.updateStudentStatus(user.uid, {
        increment: { credits: -cost },
        unlockedTowers: currentUnlocked,
        towerExp,
      } as any);
      await onStatusUpdate();

      setResults(drawResults);
      setPhase('flash');
      await new Promise(r => setTimeout(r, 550));

      if (count === 1) {
        setPhase('reveal-single');
      } else {
        setPhase('reveal-ten');
        setRevealed(1);
      }
    } catch (err) {
      console.error('Draw error:', err);
      setPhase('idle');
    }
  }, [credits, user.uid, pools, onStatusUpdate]);

  const reset = () => {
    setPhase('idle');
    setResults([]);
    setFlashRarity(null);
    setRevealed(0);
  };

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse at 50% -10%, #2d0a5c 0%, #0d0520 50%, #000 100%)' }}
    >
      <BackgroundParticles />

      {/* Rarity flash */}
      {phase === 'flash' && flashRarity && (
        <div
          className="fixed inset-0 z-50 pointer-events-none gacha-flash"
          style={{ background: RARITY_CONFIG[flashRarity].glow + '50' }}
        />
      )}

      <div className="relative z-10 min-h-screen p-4 md:p-6 flex flex-col items-center">

        {/* ── HEADER ── */}
        <div className="w-full max-w-3xl flex items-center justify-between mb-6 mt-2">
          <div>
            <h1
              className="pixel-font text-xl md:text-2xl text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg,#facc15,#fb923c,#f472b6,#a78bfa)' }}
            >
              {isZh ? '傳說召喚門' : 'Legend Summoning Gate'}
            </h1>
            <p className="text-slate-400 text-[9px] mt-1 pixel-font">
              {isZh ? '重複召喚強化星級' : 'Duplicates power up star level'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="pixel-box px-3 py-2 border-yellow-500/50 bg-black/60 text-yellow-400 font-bold flex items-center gap-1.5">
              <span>💎</span>
              <span className="pixel-font text-sm">{credits}</span>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="pixel-btn px-4 py-2 text-xs bg-slate-700/60 border-slate-500 text-slate-300 hover:text-white"
            >
              {isZh ? '返回' : 'Back'}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════ IDLE VIEW ══════════════════════════════ */}
        {phase === 'idle' && (
          <div className="w-full max-w-3xl flex flex-col gap-5">

            {/* Orb + Draw Buttons */}
            <div className="pixel-box border-purple-500/30 bg-black/50 p-6 flex flex-col items-center gap-5">
              {/* Orb */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full gacha-orb-idle"
                  style={{
                    background: 'radial-gradient(circle at 38% 32%, #7c3aed, #4c1d95, #1e0a3c)',
                  }}
                />
                <div
                  className="absolute inset-3 rounded-full"
                  style={{ background: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.12), transparent 60%)' }}
                />
                <span className="relative z-10 text-5xl" style={{ filter: 'drop-shadow(0 0 10px #a855f7)' }}>🌟</span>
              </div>

              {/* Pull buttons */}
              <div className="flex gap-4 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => executeDraw(1)}
                  disabled={!canSingle}
                  className={`flex-1 pixel-btn py-3 ${canSingle ? 'bg-purple-800/50 border-purple-400 text-purple-100' : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'}`}
                >
                  <div className="pixel-font text-[10px] mb-1">{isZh ? '單次召喚' : '1× Summon'}</div>
                  <div className="text-yellow-400 font-bold">💎 {SINGLE_COST}</div>
                </button>
                <button
                  type="button"
                  onClick={() => executeDraw(10)}
                  disabled={!canTen}
                  className={`flex-1 pixel-btn py-3 relative ${canTen ? 'bg-yellow-800/40 border-yellow-500 text-yellow-100' : 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'}`}
                >
                  <div className="absolute -top-2.5 -right-2.5 bg-red-600 text-white pixel-font text-[8px] px-1.5 py-0.5 rounded">
                    -10%
                  </div>
                  <div className="pixel-font text-[10px] mb-1">{isZh ? '十連召喚' : '10× Summon'}</div>
                  <div className="text-yellow-400 font-bold">💎 {TEN_COST}</div>
                </button>
              </div>
            </div>

            {/* Rarity rate table */}
            <div className="pixel-box border-slate-600/30 bg-black/50 p-4">
              <div className="pixel-font text-[10px] text-slate-400 mb-3">{isZh ? '召喚機率' : 'Summon Rates'}</div>
              <div className="grid grid-cols-4 gap-2">
                {(['SSR', 'SR', 'R', 'N'] as Rarity[]).map(r => {
                  const cfg = RARITY_CONFIG[r];
                  return (
                    <div
                      key={r}
                      className={`flex flex-col items-center p-2.5 rounded-lg ${cfg.bg} border ${cfg.border}/40`}
                    >
                      <div className={`pixel-font text-sm font-black ${cfg.text}`}>{r}</div>
                      <div className={`text-[9px] ${cfg.text} opacity-60 mb-1`}>{isZh ? cfg.labelZh : r}</div>
                      <div className="text-white font-bold text-xl">{RARITY_WEIGHTS[r]}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SSR Showcase */}
            <div className="pixel-box border-yellow-500/25 bg-black/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">👑</span>
                <span className="pixel-font text-[10px] text-yellow-300">
                  {isZh ? 'SSR 最稀有砲台' : 'SSR Rarest Towers'}
                </span>
                <span className="ml-auto text-[10px] text-slate-500 pixel-font">
                  {RARITY_WEIGHTS.SSR}% {isZh ? '機率' : 'rate'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ssrList.map(k => (
                  <div
                    key={k}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/25 min-w-[52px]"
                    style={{ boxShadow: '0 0 8px #facc1525' }}
                  >
                    <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 5px #facc15)' }}>
                      {TOWERS[k].icon}
                    </span>
                    <span className="text-yellow-200 text-[8px] pixel-font text-center leading-tight max-w-[56px]">
                      {isZh && (TOWERS[k] as any).nameZh
                        ? (TOWERS[k] as any).nameZh
                        : TOWERS[k].name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Star level guide */}
            <div className="pixel-box border-blue-500/25 bg-black/50 p-4">
              <div className="pixel-font text-[10px] text-blue-300 mb-3">
                {isZh ? '砲台星級強化' : 'Tower Star Enhancement'}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {STAR_EXP_THRESHOLDS.map((exp, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="text-yellow-400 text-sm">{starDisplay(i + 1)}</div>
                    <div className="text-slate-400 text-[9px] pixel-font">Lv.{i + 1}</div>
                    <div className="text-slate-500 text-[8px]">{exp} EXP</div>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 text-[9px] mt-2 text-center">
                {isZh
                  ? '重複抽到相同砲台可累積EXP並提升星級'
                  : 'Redrawing a tower grants +1 EXP toward the next star level'}
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════ ORB SPINNING ══════════════════════════════ */}
        {phase === 'orb' && (
          <div className="flex flex-col items-center justify-center gap-8" style={{ minHeight: '60vh' }}>
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Spinning outer orb */}
              <div
                className="absolute inset-0 rounded-full gacha-orb-spin"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #a855f7, #4c1d95, #1e0a3c)',
                  boxShadow: '0 0 60px #a855f780, 0 0 100px #7c3aed40',
                }}
              />
              {/* Orbit rings */}
              <div className="absolute inset-5 rounded-full border border-white/20 gacha-orbit-ring" />
              <div className="absolute inset-10 rounded-full border border-white/10 gacha-orbit-ring-2" />
              {/* Gloss */}
              <div
                className="absolute inset-3 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle at 38% 28%, rgba(255,255,255,0.18), transparent 55%)' }}
              />
              <span className="relative z-10 text-6xl gacha-icon-pulse">⚡</span>
            </div>
            <p className="pixel-font text-purple-300 text-xs animate-pulse">
              {isZh ? '召喚降臨中...' : 'Summoning...'}
            </p>
          </div>
        )}

        {/* ══════════════════════════════ SINGLE REVEAL ══════════════════════════════ */}
        {phase === 'reveal-single' && results.length === 1 && (
          <div className="flex flex-col items-center gap-6 w-full max-w-xs mt-6">
            <GachaCard result={results[0]} />
            <button
              type="button"
              onClick={reset}
              className="pixel-btn px-8 py-3 text-sm bg-purple-800/50 border-purple-400 text-purple-100"
            >
              {isZh ? '繼續召喚' : 'Summon Again'}
            </button>
          </div>
        )}

        {/* ══════════════════════════════ TEN PULL REVEAL ══════════════════════════════ */}
        {phase === 'reveal-ten' && results.length === 10 && (
          <div className="flex flex-col items-center gap-5 w-full max-w-3xl mt-4">
            <div className="grid grid-cols-5 gap-3 w-full">
              {results.map((r, i) =>
                i < revealedCount ? (
                  <GachaCard key={i} result={r} delay={0} />
                ) : (
                  <div key={i} className="flex items-center justify-center" style={{ minHeight: 200 }}>
                    <div className="w-20 h-28 rounded-xl bg-purple-950/70 border-2 border-purple-500/30 flex items-center justify-center text-4xl gacha-card-back text-purple-400">
                      ?
                    </div>
                  </div>
                )
              )}
            </div>
            {revealedCount >= results.length && (
              <button
                type="button"
                onClick={reset}
                className="pixel-btn px-8 py-3 text-sm bg-purple-800/50 border-purple-400 text-purple-100"
              >
                {isZh ? '繼續召喚' : 'Summon Again'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
