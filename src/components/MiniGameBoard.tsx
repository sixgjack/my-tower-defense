// src/components/MiniGameBoard.tsx
// Mini version of GameBoard for tower live demo - uses actual GameEngine
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { TOWERS, ENEMY_TYPES } from '../engine/data';
import { ROWS, COLS } from '../engine/MapGenerator';
import type { TowerStats } from '../engine/types';
import { ProjectileRenderer } from './ProjectileRenderer';
import { effectManager } from '../engine/EffectManager';

const TILE_SIZE = 20; // Much smaller for demo
const DEMO_WIDTH = 500;
const DEMO_HEIGHT = 300;

interface MiniGameBoardProps {
  tower: TowerStats;
  width?: number;
  height?: number;
}

export const MiniGameBoard: React.FC<MiniGameBoardProps> = ({ 
  tower, 
  width = DEMO_WIDTH, 
  height = DEMO_HEIGHT 
}) => {
  const [tick, setTick] = useState(0);
  const miniGameRef = useRef<GameEngine | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    // Create a new game instance for the demo
    const miniGame = new GameEngine();
    miniGame.money = 100000; // Plenty of money
    miniGame.lives = 999;
    miniGameRef.current = miniGame;

    // Helper to spawn an enemy
    const spawnEnemy = () => {
      if (!miniGameRef.current || !miniGameRef.current.path || miniGameRef.current.path.length === 0) return;
      if (miniGameRef.current.enemies.length >= 5) return; // Max 5 enemies
      
      const start = miniGameRef.current.path[0];
      const enemyTypeIndex = Math.floor(Math.random() * Math.min(3, ENEMY_TYPES.length));
      const enemyType = ENEMY_TYPES[enemyTypeIndex];
      if (enemyType) {
        miniGameRef.current.enemies.push({
          id: Date.now() + Math.random(),
          pathIndex: 0,
          progress: 0,
          r: start.r,
          c: start.c,
          hp: 150, // Higher HP so they last longer
          maxHp: 150,
          baseSpeed: 0.015, // Slightly slower so tower can hit them
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
          statusEffects: []
        });
      }
    };

    // Place tower after map is ready
    const placeTower = () => {
      if (miniGame.path && miniGame.path.length > 0 && miniGame.map && miniGame.map.length > 0) {
        // Find middle of the path
        const pathMidIndex = Math.floor(miniGame.path.length / 2);
        const pathMid = miniGame.path[pathMidIndex];
        
        // Find a valid spot adjacent to the path
        const offsets = [
          { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 },
          { r: -1, c: -1 }, { r: -1, c: 1 }, { r: 1, c: -1 }, { r: 1, c: 1 }
        ];
        
        let placed = false;
        for (const offset of offsets) {
          const towerR = pathMid.r + offset.r;
          const towerC = pathMid.c + offset.c;
          
          if (towerR < 0 || towerR >= ROWS || towerC < 0 || towerC >= COLS) continue;
          
          const cell = miniGame.map[towerR]?.[towerC];
          const isOnPath = miniGame.path.some(p => p.r === towerR && p.c === towerC);
          
          // Valid spot: empty grass (0), not on path, not blocked
          if (cell === 0 && !isOnPath) {
            const towerKey = Object.keys(TOWERS).find(key => TOWERS[key].name === tower.name);
            if (towerKey) {
              miniGame.requestBuildTower(towerR, towerC, towerKey);
              miniGame.confirmAction();
              placed = true;
              
              // Spawn initial enemies
              setTimeout(() => {
                spawnEnemy();
                spawnEnemy();
              }, 100);
              break;
            }
          }
        }
        
        if (!placed) {
          // Fallback: try random spots
          for (let attempts = 0; attempts < 30; attempts++) {
            const towerR = Math.floor(Math.random() * (ROWS - 2)) + 1;
            const towerC = Math.floor(Math.random() * (COLS - 2)) + 1;
            const cell = miniGame.map[towerR]?.[towerC];
            const isOnPath = miniGame.path.some(p => p.r === towerR && p.c === towerC);
            
            if (cell === 0 && !isOnPath) {
              const towerKey = Object.keys(TOWERS).find(key => TOWERS[key].name === tower.name);
              if (towerKey) {
                miniGame.requestBuildTower(towerR, towerC, towerKey);
                miniGame.confirmAction();
                setTimeout(() => {
                  spawnEnemy();
                  spawnEnemy();
                }, 100);
                break;
              }
            }
          }
        }
      } else {
        setTimeout(placeTower, 50);
      }
    };

    // Start placing tower after a short delay
    setTimeout(placeTower, 100);

    // Game loop
    const loop = () => {
      if (miniGameRef.current) {
        miniGameRef.current.tick();
        setTick(prev => prev + 1);
      }
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    // Spawn enemies periodically (faster rate)
    const spawnInterval = setInterval(() => {
      spawnEnemy();
    }, 1200);

    return () => {
      clearInterval(spawnInterval);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [tower]);

  const miniGame = miniGameRef.current;
  if (!miniGame || !miniGame.path || miniGame.path.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400" style={{ minHeight: height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-2"></div>
          <div>Loading demo...</div>
        </div>
      </div>
    );
  }

  const scaleX = width / (COLS * TILE_SIZE);
  const scaleY = height / (ROWS * TILE_SIZE);
  const scale = Math.min(scaleX, scaleY);

  return (
    <div 
      className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border-2 border-slate-700 overflow-hidden"
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {/* Grid */}
        <defs>
          <pattern id="mini-grid" width={TILE_SIZE} height={TILE_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${TILE_SIZE} 0 L 0 0 0 ${TILE_SIZE}`} fill="none" stroke="rgba(100,100,100,0.1)" strokeWidth="1"/>
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
              stroke="#475569"
              strokeWidth="3"
            />
          );
        })}

        {/* Mines */}
        {miniGame.mines.map(mine => (
          <g key={mine.id}>
            <circle
              cx={mine.c * TILE_SIZE + TILE_SIZE / 2}
              cy={mine.r * TILE_SIZE + TILE_SIZE / 2}
              r={TILE_SIZE / 3}
              fill="#f59e0b"
              stroke="#dc2626"
              strokeWidth="2"
              opacity="0.8"
            />
            <text
              x={mine.c * TILE_SIZE + TILE_SIZE / 2}
              y={mine.r * TILE_SIZE + TILE_SIZE / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={TILE_SIZE / 2}
            >
              💣
            </text>
          </g>
        ))}

        {/* Towers */}
        {miniGame.towers.map(t => {
          const stats = TOWERS[t.key];
          const x = t.c * TILE_SIZE + TILE_SIZE / 2;
          const y = t.r * TILE_SIZE + TILE_SIZE / 2;
          const auraColor = effectManager.getTowerAuraColor(t);

          return (
            <g key={t.id}>
              {/* Status Effect Aura */}
              {auraColor && (
                <circle
                  cx={x}
                  cy={y}
                  r={TILE_SIZE * 0.8}
                  fill="none"
                  stroke={auraColor}
                  strokeWidth="2"
                  opacity="0.6"
                  className="animate-pulse"
                />
              )}
              {/* Range circle */}
              <circle
                cx={x}
                cy={y}
                r={stats.range * TILE_SIZE}
                fill="none"
                stroke={stats.color}
                strokeWidth="1"
                opacity="0.2"
              />
              {/* Tower */}
              <circle
                cx={x}
                cy={y}
                r={TILE_SIZE / 3}
                fill={stats.color}
                opacity="0.8"
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={TILE_SIZE / 2}
              >
                {stats.icon}
              </text>
              {/* Healing/Buff effect */}
              {(stats.description.includes('Heal') || stats.description.includes('Medic')) && (
                <text
                  x={x + TILE_SIZE / 2}
                  y={y - TILE_SIZE / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={TILE_SIZE / 3}
                  fill="#10b981"
                  className="animate-pulse"
                >
                  +
                </text>
              )}
            </g>
          );
        })}

        {/* Enemies */}
        {miniGame.enemies.map(e => {
          const x = (e.c + (e.xOffset || 0)) * TILE_SIZE + TILE_SIZE / 2;
          const y = (e.r + (e.yOffset || 0)) * TILE_SIZE + TILE_SIZE / 2;
          const auraColor = effectManager.getEnemyAuraColor(e);

          return (
            <g key={e.id}>
              {/* Status Effect Aura */}
              {auraColor && (
                <circle
                  cx={x}
                  cy={y}
                  r={TILE_SIZE * 0.6}
                  fill="none"
                  stroke={auraColor}
                  strokeWidth="2"
                  opacity="0.7"
                  className="animate-pulse"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={TILE_SIZE / 4}
                fill={e.color}
                opacity="0.9"
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={TILE_SIZE / 2}
              >
                {e.icon}
              </text>
              {/* HP Bar */}
              <rect
                x={x - TILE_SIZE / 3}
                y={y - TILE_SIZE / 2 - 5}
                width={TILE_SIZE * 2 / 3}
                height={3}
                fill="#1a1a1a"
              />
              <rect
                x={x - TILE_SIZE / 3}
                y={y - TILE_SIZE / 2 - 5}
                width={(e.hp / e.maxHp) * TILE_SIZE * 2 / 3}
                height={3}
                fill="#22c55e"
              />
            </g>
          );
        })}

        {/* Particles */}
        {miniGame.particles.map(p => {
          const scaleFactor = TILE_SIZE / 60;
          const px = p.x * scaleFactor;
          const py = p.y * scaleFactor;
          const alpha = p.life / p.maxLife;
          const size = (p.scale || 1) * 3 * scaleFactor;
          
          if (p.type === 'text') {
            return (
              <text
                key={p.id}
                x={px}
                y={py + (p.maxLife - p.life) * (p.vy || 0) * scaleFactor}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12 * (p.scale || 1) * scaleFactor}
                fill={p.color}
                opacity={alpha}
              >
                {p.text}
              </text>
            );
          }
          
          // Render visual particles
          switch (p.type) {
            case 'spark':
            case 'flame':
              return <circle key={p.id} cx={px} cy={py} r={size} fill={p.color} opacity={alpha} />;
            case 'smoke':
              return <circle key={p.id} cx={px} cy={py} r={size * 2} fill={p.color} opacity={alpha * 0.4} />;
            case 'freeze':
              return <circle key={p.id} cx={px} cy={py} r={size} fill="#60a5fa" opacity={alpha} />;
            case 'electric':
              return <rect key={p.id} x={px - size/2} y={py - size/2} width={size} height={size} fill="#facc15" opacity={alpha} />;
            case 'shockwave':
              const shockSize = 20 * scaleFactor * (1 - p.life / p.maxLife);
              return <circle key={p.id} cx={px} cy={py} r={shockSize} fill="none" stroke={p.color} strokeWidth={1} opacity={alpha} />;
            case 'heal':
              return (
                <g key={p.id} opacity={alpha}>
                  <rect x={px - 4 * scaleFactor} y={py - 1 * scaleFactor} width={8 * scaleFactor} height={2 * scaleFactor} fill="#10b981" />
                  <rect x={px - 1 * scaleFactor} y={py - 4 * scaleFactor} width={2 * scaleFactor} height={8 * scaleFactor} fill="#10b981" />
                </g>
              );
            default:
              return <circle key={p.id} cx={px} cy={py} r={size} fill={p.color} opacity={alpha} />;
          }
        })}

        {/* Projectiles */}
        {miniGame.projectiles.map(p => (
          <ProjectileRenderer
            key={p.id}
            projectile={p}
            tileSize={TILE_SIZE}
            tick={tick}
          />
        ))}

        {/* Beams / Lasers */}
        {miniGame.towers.filter(t => TOWERS[t.key]?.type === 'beam' && t.targetId).map(t => {
          const stats = TOWERS[t.key];
          const target = miniGame.enemies.find(e => e.id === t.targetId);
          if (!target) return null;
          
          const sx = t.c * TILE_SIZE + TILE_SIZE / 2;
          const sy = t.r * TILE_SIZE + TILE_SIZE / 2;
          const ex = (target.c + (target.xOffset || 0)) * TILE_SIZE + TILE_SIZE / 2;
          const ey = (target.r + (target.yOffset || 0)) * TILE_SIZE + TILE_SIZE / 2;
          
          const ramp = Math.min(1, (t.damageCharge || 0) / 5);
          const beamWidth = 2 + ramp * 3;
          
          if (stats.projectileStyle === 'ice') {
            return (
              <g key={`beam-${t.id}`}>
                <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#60a5fa" strokeWidth={beamWidth + 3} opacity={0.2} />
                <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#93c5fd" strokeWidth={beamWidth} opacity={0.7} />
                <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#ffffff" strokeWidth={1} opacity={0.8} />
                <circle cx={ex} cy={ey} r={6 + ramp * 4} fill="#60a5fa" opacity={0.3} />
              </g>
            );
          } else if (stats.projectileStyle === 'lightning') {
            const jitter = 8 + ramp * 5;
            const mx = (sx + ex) / 2 + (Math.sin(tick * 0.5) * jitter);
            const my = (sy + ey) / 2 + (Math.cos(tick * 0.5) * jitter);
            return (
              <g key={`beam-${t.id}`}>
                <polyline points={`${sx},${sy} ${mx},${my} ${ex},${ey}`} fill="none" stroke="#fcd34d" strokeWidth={4} opacity={0.3} />
                <polyline points={`${sx},${sy} ${mx},${my} ${ex},${ey}`} fill="none" stroke="#facc15" strokeWidth={2 + ramp} opacity={0.8} />
                <polyline points={`${sx},${sy} ${mx},${my} ${ex},${ey}`} fill="none" stroke="#ffffff" strokeWidth={1} opacity={0.9} />
                <circle cx={ex} cy={ey} r={5 + ramp * 3} fill="#facc15" opacity={0.5} />
              </g>
            );
          } else {
            return (
              <g key={`beam-${t.id}`}>
                <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={stats.color} strokeWidth={beamWidth + 3} opacity={0.2 + ramp * 0.2} />
                <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={stats.color} strokeWidth={beamWidth} opacity={0.6 + ramp * 0.4} />
                <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#ffffff" strokeWidth={1} opacity={0.5 + ramp * 0.5} />
                <circle cx={ex} cy={ey} r={5 + ramp * 6} fill={stats.color} opacity={0.4} />
              </g>
            );
          }
        })}
      </svg>
    </div>
  );
};
