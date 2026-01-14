// src/components/MiniGameBoard.tsx
// Mini version of GameBoard for tower live demo - uses actual GameEngine
import React, { useEffect, useRef, useState } from 'react';
import { game } from '../engine/GameEngine';
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
  const miniGameRef = useRef<typeof game | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    // Create a new game instance for the demo
    const { GameEngine } = require('../engine/GameEngine');
    const miniGame = new GameEngine();
    miniGame.money = 10000;
    miniGame.lives = 100;
    miniGameRef.current = miniGame;

    // Place tower in center after map is ready
    const placeTower = () => {
      if (miniGame.path && miniGame.path.length > 0 && miniGame.map && miniGame.map.length > 0) {
        const centerR = Math.floor(ROWS / 2);
        const centerC = Math.floor(COLS / 2);
        
        // Find a valid spot near center
        let towerR = centerR;
        let towerC = centerC;
        let attempts = 0;
        
        while (attempts < 50) {
          const isOnPath = miniGame.path.some(p => p.r === towerR && p.c === towerC);
          const isObstacle = miniGame.map[towerR] && miniGame.map[towerR][towerC] === 'X';
          if (!isOnPath && !isObstacle && miniGame.map[towerR] && miniGame.map[towerR][towerC] === 0) {
            break;
          }
          towerR = centerR + Math.floor((Math.random() - 0.5) * 4);
          towerC = centerC + Math.floor((Math.random() - 0.5) * 4);
          towerR = Math.max(1, Math.min(ROWS - 2, towerR));
          towerC = Math.max(1, Math.min(COLS - 2, towerC));
          attempts++;
        }

        const towerKey = Object.keys(TOWERS).find(key => TOWERS[key].name === tower.name);
        if (towerKey) {
          miniGame.requestBuildTower(towerR, towerC, towerKey);
          miniGame.confirmAction();
        }
      } else {
        setTimeout(placeTower, 100);
      }
    };

    // Start placing tower after a short delay
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

    // Spawn enemies periodically
    const spawnInterval = setInterval(() => {
      if (miniGameRef.current && miniGameRef.current.path && miniGameRef.current.path.length > 0) {
        if (miniGameRef.current.enemies.length < 3) {
          const start = miniGameRef.current.path[0];
          const enemyType = ENEMY_TYPES[0];
          if (enemyType) {
            miniGameRef.current.enemies.push({
              id: Date.now() + Math.random(),
              pathIndex: 0,
              progress: 0,
              r: start.r,
              c: start.c,
              hp: 100,
              maxHp: 100,
              baseSpeed: 0.02,
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
        }
      }
    }, 2000);

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
          <ProjectileRenderer
            key={p.id}
            projectile={p}
            tileSize={TILE_SIZE}
            tick={tick}
          />
        ))}
      </svg>
    </div>
  );
};
