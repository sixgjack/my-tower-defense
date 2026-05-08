// src/components/MiniGameBoard.tsx
// Mini version of GameBoard for tower live demo - uses actual GameEngine
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { TOWERS, ENEMY_TYPES } from '../engine/data';
import { ROWS, COLS } from '../engine/MapGenerator';
import type { TowerStats } from '../engine/types';
import { ProjectileRenderer } from './ProjectileRenderer';
import { effectManager } from '../engine/EffectManager';

const TILE_SIZE = 20;
const DEMO_WIDTH = 500;
const DEMO_HEIGHT = 300;

// Support/buff/heal aura tower keys that should show allied demo towers
const SUPPORT_AURA_KEYS = new Set([
  'DAMAGE_BUFF', 'SPEED_BUFF', 'RANGE_BUFF', 'HEALER', 'BASIC_HEAL', 'WEAKEN',
]);

// Category labels for the header
const TOWER_CATEGORY_LABELS: Record<string, { en: string; zh: string; color: string }> = {
  projectile: { en: 'Attack', zh: '攻擊', color: '#ef4444' },
  area:       { en: 'Area',   zh: '範圍', color: '#f97316' },
  beam:       { en: 'Beam',   zh: '光束', color: '#a855f7' },
  spread:     { en: 'Spread', zh: '散射', color: '#f59e0b' },
  aura:       { en: 'Aura',   zh: '光環', color: '#22c55e' },
  pull:       { en: 'Control',zh: '控制', color: '#06b6d4' },
  farm:       { en: 'Economy',zh: '經濟', color: '#10b981' },
  summon:     { en: 'Summon', zh: '召喚', color: '#8b5cf6' },
};

// Ally stub towers to spawn near support towers
const ALLY_TOWER_ICONS = ['🏰', '⚔️', '🎯'];
const ALLY_TOWER_COLORS = ['#3b82f6', '#ef4444', '#f59e0b'];

interface MiniGameBoardProps {
  tower: TowerStats;
  width?: number;
  height?: number;
}

export const MiniGameBoard: React.FC<MiniGameBoardProps> = ({
  tower,
  width = DEMO_WIDTH,
  height = DEMO_HEIGHT,
}) => {
  const [tick, setTick] = useState(0);
  const miniGameRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  const towerPosRef = useRef<{ r: number; c: number } | null>(null);
  const allyTowersRef = useRef<{ r: number; c: number; icon: string; color: string; label: string }[]>([]);

  // Determine tower key and type
  const towerKey = Object.keys(TOWERS).find(k => TOWERS[k].name === tower.name) ?? '';
  const isSupport = SUPPORT_AURA_KEYS.has(towerKey) || (tower.type === 'aura' && tower.damage === 0);
  const isFarm = tower.type === 'farm';
  const isAura = tower.type === 'aura';
  const categoryInfo = TOWER_CATEGORY_LABELS[tower.type ?? 'projectile'] ?? TOWER_CATEGORY_LABELS.projectile;

  useEffect(() => {
    const miniGame = new GameEngine();
    miniGame.money = 10000;
    miniGame.lives = 100;
    miniGameRef.current = miniGame;
    allyTowersRef.current = [];

    const placeTower = () => {
      if (miniGame.path && miniGame.path.length > 0 && miniGame.map && miniGame.map.length > 0) {
        const midIdx = Math.floor(miniGame.path.length / 2);
        const midPath = miniGame.path[midIdx];
        const centerR = midPath.r;
        const centerC = midPath.c;

        // Find valid spot near path midpoint
        let towerR = centerR;
        let towerC = centerC + 2;
        let attempts = 0;
        while (attempts < 60) {
          const isOnPath = miniGame.path.some(p => p.r === towerR && p.c === towerC);
          const isObstacle = miniGame.map[towerR] && miniGame.map[towerR][towerC] === 'X';
          if (!isOnPath && !isObstacle && miniGame.map[towerR] && miniGame.map[towerR][towerC] === 0) break;
          towerR = centerR + Math.floor((Math.random() - 0.5) * 6);
          towerC = centerC + 2 + Math.floor((Math.random() - 0.5) * 4);
          towerR = Math.max(1, Math.min(ROWS - 2, towerR));
          towerC = Math.max(1, Math.min(COLS - 2, towerC));
          attempts++;
        }

        if (towerKey) {
          miniGame.requestBuildTower(towerR, towerC, towerKey);
          miniGame.confirmAction();
          towerPosRef.current = { r: towerR, c: towerC };

          // For support/aura towers: spawn ally stubs around it
          if (isSupport) {
            const offsets = [[-1, -2], [1, -2], [0, -3]];
            const allyList: typeof allyTowersRef.current = [];
            offsets.forEach(([dr, dc], i) => {
              const ar = Math.max(1, Math.min(ROWS - 2, towerR + dr));
              const ac = Math.max(1, Math.min(COLS - 2, towerC + dc));
              const isOnPathCheck = miniGame.path.some(p => p.r === ar && p.c === ac);
              if (!isOnPathCheck && miniGame.map[ar]?.[ac] === 0) {
                const buffLabel = towerKey === 'DAMAGE_BUFF' ? '+50% DMG'
                  : towerKey === 'SPEED_BUFF' ? '+30% SPD'
                  : towerKey === 'RANGE_BUFF' ? '+25% RNG'
                  : (towerKey === 'HEALER' || towerKey === 'BASIC_HEAL') ? '💚 Heal'
                  : towerKey === 'WEAKEN' ? '-30% DEF'
                  : '✨ Buff';
                allyList.push({ r: ar, c: ac, icon: ALLY_TOWER_ICONS[i % ALLY_TOWER_ICONS.length], color: ALLY_TOWER_COLORS[i % ALLY_TOWER_COLORS.length], label: buffLabel });
              }
            });
            allyTowersRef.current = allyList;
          }
        }
      } else {
        setTimeout(placeTower, 100);
      }
    };

    setTimeout(placeTower, 200);

    // Game loop
    const loop = () => {
      if (miniGameRef.current) {
        miniGameRef.current.tick();
        setTick(prev => prev + 1);
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    // For non-farm towers spawn enemies; support towers still get enemies to show effects
    if (!isFarm) {
      const spawnInterval = setInterval(() => {
        if (miniGameRef.current && miniGameRef.current.path.length > 0) {
          const maxEnemies = isSupport ? 2 : 3;
          if (miniGameRef.current.enemies.length < maxEnemies) {
            const start = miniGameRef.current.path[0];
            const enemyType = ENEMY_TYPES[0];
            if (enemyType) {
              miniGameRef.current.enemies.push({
                id: Date.now() + Math.random(),
                pathIndex: 0,
                progress: 0,
                r: start.r,
                c: start.c,
                hp: 200,
                maxHp: 200,
                baseSpeed: 0.007, // Slow crawl so demo is watchable
                speedMultiplier: 1,
                icon: enemyType.icon,
                color: enemyType.color,
                reward: enemyType.reward,
                scale: 1,
                frozen: 0,
                xOffset: 0,
                yOffset: 0,
                money: enemyType.reward,
                damage: 0,
                statusEffects: [],
              });
            }
          }
        }
      }, isFarm ? 99999 : 2500);

      return () => {
        clearInterval(spawnInterval);
        cancelAnimationFrame(animationFrameRef.current);
      };
    }

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [tower, towerKey, isSupport, isFarm]);

  const miniGame = miniGameRef.current;
  if (!miniGame || !miniGame.path || miniGame.path.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400" style={{ minHeight: height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2" />
          <div>Loading demo...</div>
        </div>
      </div>
    );
  }

  const scaleX = width / (COLS * TILE_SIZE);
  const scaleY = height / (ROWS * TILE_SIZE);
  const scale = Math.min(scaleX, scaleY);

  // Pulsing alpha for buff label
  const pulseAlpha = 0.6 + 0.4 * Math.sin(tick * 0.08);

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ width, height, background: '#0f172a' }}>
      {/* Category badge */}
      <div
        className="absolute top-1 left-1 z-10 px-2 py-0.5 rounded text-xs font-bold"
        style={{ background: categoryInfo.color + '33', color: categoryInfo.color, border: `1px solid ${categoryInfo.color}55` }}
      >
        {categoryInfo.zh} / {categoryInfo.en}
      </div>

      {/* Support mode label */}
      {isSupport && (
        <div className="absolute top-1 right-1 z-10 px-2 py-0.5 rounded text-xs font-bold text-emerald-300"
          style={{ background: '#10b98133', border: '1px solid #10b98155' }}>
          支援塔 / Support
        </div>
      )}
      {isFarm && (
        <div className="absolute top-1 right-1 z-10 px-2 py-0.5 rounded text-xs font-bold text-emerald-300"
          style={{ background: '#10b98133', border: '1px solid #10b98155' }}>
          經濟塔 / Economy
        </div>
      )}

      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <defs>
          <pattern id="mini-grid" width={TILE_SIZE} height={TILE_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${TILE_SIZE} 0 L 0 0 0 ${TILE_SIZE}`} fill="none" stroke="rgba(100,100,100,0.08)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={COLS * TILE_SIZE} height={ROWS * TILE_SIZE} fill="url(#mini-grid)" />

        {/* Path */}
        {miniGame.path.map((point, idx) => {
          if (idx === 0) return null;
          const prev = miniGame.path[idx - 1];
          return (
            <line
              key={idx}
              x1={prev.c * TILE_SIZE + TILE_SIZE / 2}
              y1={prev.r * TILE_SIZE + TILE_SIZE / 2}
              x2={point.c * TILE_SIZE + TILE_SIZE / 2}
              y2={point.r * TILE_SIZE + TILE_SIZE / 2}
              stroke="#334155"
              strokeWidth="4"
            />
          );
        })}

        {/* Ally stub towers (support demo) */}
        {allyTowersRef.current.map((ally, i) => {
          const ax = ally.c * TILE_SIZE + TILE_SIZE / 2;
          const ay = ally.r * TILE_SIZE + TILE_SIZE / 2;
          return (
            <g key={`ally-${i}`}>
              {/* Ally base */}
              <circle cx={ax} cy={ay} r={TILE_SIZE / 2.5} fill={ally.color + '33'} stroke={ally.color} strokeWidth="1.5" />
              <text x={ax} y={ay} textAnchor="middle" dominantBaseline="middle" fontSize={TILE_SIZE / 2}>{ally.icon}</text>
              {/* Buff label pulse */}
              <text
                x={ax}
                y={ay - TILE_SIZE * 0.8}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={TILE_SIZE * 0.55}
                fill={isSupport && (towerKey === 'HEALER' || towerKey === 'BASIC_HEAL') ? '#34d399' : '#fbbf24'}
                opacity={pulseAlpha}
                fontWeight="bold"
              >
                {ally.label}
              </text>
            </g>
          );
        })}

        {/* Mines */}
        {miniGame.mines.map(mine => (
          <g key={mine.id}>
            <circle cx={mine.c * TILE_SIZE + TILE_SIZE / 2} cy={mine.r * TILE_SIZE + TILE_SIZE / 2} r={TILE_SIZE / 3} fill="#f59e0b" stroke="#dc2626" strokeWidth="2" opacity="0.8" />
            <text x={mine.c * TILE_SIZE + TILE_SIZE / 2} y={mine.r * TILE_SIZE + TILE_SIZE / 2} textAnchor="middle" dominantBaseline="middle" fontSize={TILE_SIZE / 2}>💣</text>
          </g>
        ))}

        {/* Towers */}
        {miniGame.towers.map(t => {
          const stats = TOWERS[t.key];
          const x = t.c * TILE_SIZE + TILE_SIZE / 2;
          const y = t.r * TILE_SIZE + TILE_SIZE / 2;
          const auraColor = effectManager.getTowerAuraColor(t);
          const isMainTower = t.key === towerKey;

          return (
            <g key={t.id}>
              {/* Range ring (only for main tower) */}
              {isMainTower && (
                <circle
                  cx={x}
                  cy={y}
                  r={stats.range * TILE_SIZE}
                  fill="none"
                  stroke={stats.color}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.3"
                />
              )}
              {/* Aura pulsing ring */}
              {isAura && isMainTower && (
                <circle
                  cx={x}
                  cy={y}
                  r={stats.range * TILE_SIZE * (0.85 + 0.1 * Math.sin(tick * 0.06))}
                  fill={stats.color + '18'}
                  stroke={stats.color}
                  strokeWidth="1.5"
                  opacity="0.5"
                />
              )}
              {/* Status Effect Aura */}
              {auraColor && (
                <circle cx={x} cy={y} r={TILE_SIZE * 0.8} fill="none" stroke={auraColor} strokeWidth="2" opacity="0.6" />
              )}
              {/* Tower body */}
              <circle cx={x} cy={y} r={isMainTower ? TILE_SIZE / 2.2 : TILE_SIZE / 3} fill={stats.color + (isMainTower ? '55' : '33')} stroke={stats.color} strokeWidth={isMainTower ? 2 : 1} opacity="0.9" />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={TILE_SIZE / (isMainTower ? 1.5 : 2)}>{stats.icon}</text>
            </g>
          );
        })}

        {/* Enemies */}
        {miniGame.enemies.map(e => {
          const x = (e.c + (e.xOffset || 0)) * TILE_SIZE + TILE_SIZE / 2;
          const y = (e.r + (e.yOffset || 0)) * TILE_SIZE + TILE_SIZE / 2;
          const auraColor = effectManager.getEnemyAuraColor(e);
          const hpFrac = e.hp / e.maxHp;

          return (
            <g key={e.id}>
              {auraColor && <circle cx={x} cy={y} r={TILE_SIZE * 0.6} fill="none" stroke={auraColor} strokeWidth="2" opacity="0.7" />}
              <circle cx={x} cy={y} r={TILE_SIZE / 3} fill={e.color} opacity="0.85" />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={TILE_SIZE / 2}>{e.icon}</text>
              {/* HP bar */}
              <rect x={x - TILE_SIZE / 3} y={y - TILE_SIZE / 2 - 4} width={TILE_SIZE * 2 / 3} height={3} fill="#1a1a2e" rx="1" />
              <rect x={x - TILE_SIZE / 3} y={y - TILE_SIZE / 2 - 4} width={hpFrac * TILE_SIZE * 2 / 3} height={3} fill={hpFrac > 0.5 ? '#22c55e' : hpFrac > 0.25 ? '#f59e0b' : '#ef4444'} rx="1" />
            </g>
          );
        })}

        {/* Particles */}
        {miniGame.particles.map(p => {
          if (p.type === 'text') {
            return (
              <text
                key={p.id}
                x={p.x * (TILE_SIZE / 60)}
                y={p.y * (TILE_SIZE / 60) + (p.maxLife - p.life) * (p.vy || 0) * (TILE_SIZE / 60)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12 * (p.scale || 1) * (TILE_SIZE / 60)}
                fill={p.color}
                opacity={p.life / p.maxLife}
              >
                {p.text}
              </text>
            );
          }
          return null;
        })}

        {/* Projectiles */}
        {miniGame.projectiles.map(p => (
          <ProjectileRenderer key={p.id} projectile={p} tileSize={TILE_SIZE} tick={tick} />
        ))}
      </svg>

      {/* Farm tower overlay */}
      {isFarm && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-slate-900/80 rounded-xl p-4 border border-emerald-500/30">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-emerald-300 text-sm font-bold">+{tower.damage || 50} / wave</div>
            <div className="text-slate-400 text-xs mt-1">Passive income tower</div>
            <div className="text-slate-500 text-xs">被動收入 / No attacks</div>
          </div>
        </div>
      )}
    </div>
  );
};
