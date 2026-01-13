// src/components/MiniGameBoard.tsx
// Mini GameBoard for tower live demo - uses actual GameEngine logic
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { TOWERS, ENEMY_TYPES } from '../engine/data';
import { ROWS, COLS } from '../engine/MapGenerator';
import type { TowerStats } from '../engine/types';
import { ProjectileRenderer } from './ProjectileRenderer';

const TILE_SIZE = 30; // Smaller for demo
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const miniGameRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a mini game instance
    const miniGame = new GameEngine();
    miniGame.money = 10000; // Give plenty of money
    miniGame.lives = 100; // Don't let it end
    
    // Place the tower in the center
    const centerR = Math.floor(ROWS / 2);
    const centerC = Math.floor(COLS / 2);
    
    // Find tower key
    const towerKey = Object.keys(TOWERS).find(key => TOWERS[key].name === tower.name);
    if (towerKey) {
      miniGame.requestBuildTower(centerR, centerC, towerKey);
      miniGame.confirmAction();
    }
    
    miniGameRef.current = miniGame;

    // Game loop
    let frameId: number;
    const loop = () => {
      miniGame.tick();
      setTick(prev => prev + 1);
      frameId = requestAnimationFrame(loop);
    };
    
    loop();

    // Spawn enemies periodically
    const spawnInterval = setInterval(() => {
      if (miniGame.enemies.length < 3) {
        // Spawn enemy at start of path
        if (miniGame.path.length > 0) {
          const start = miniGame.path[0];
          const enemyType = ENEMY_TYPES[0]; // Use first enemy type
          if (enemyType) {
            miniGame.enemies.push({
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
      cancelAnimationFrame(frameId);
      clearInterval(spawnInterval);
    };
  }, [tower]);

  if (!miniGameRef.current) return null;

  const game = miniGameRef.current;
  const scaleX = width / (COLS * TILE_SIZE);
  const scaleY = height / (ROWS * TILE_SIZE);
  const scale = Math.min(scaleX, scaleY);

  return (
    <div 
      ref={containerRef}
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
          <pattern id="grid" width={TILE_SIZE} height={TILE_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${TILE_SIZE} 0 L 0 0 0 ${TILE_SIZE}`} fill="none" stroke="rgba(100,100,100,0.1)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={COLS * TILE_SIZE} height={ROWS * TILE_SIZE} fill="url(#grid)" />
        
        {/* Path */}
        {game.path.map((point, idx) => {
          if (idx === 0) return null;
          const prev = game.path[idx - 1];
          return (
            <line
              key={idx}
              x1={prev.c * TILE_SIZE + TILE_SIZE / 2}
              y1={prev.r * TILE_SIZE + TILE_SIZE / 2}
              x2={point.c * TILE_SIZE + TILE_SIZE / 2}
              y2={point.r * TILE_SIZE + TILE_SIZE / 2}
              stroke="#475569"
              strokeWidth="4"
            />
          );
        })}

        {/* Towers */}
        {game.towers.map(t => {
          const stats = TOWERS[t.key];
          const x = t.c * TILE_SIZE + TILE_SIZE / 2;
          const y = t.r * TILE_SIZE + TILE_SIZE / 2;
          return (
            <g key={t.id}>
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
            </g>
          );
        })}

        {/* Enemies */}
        {game.enemies.map(e => {
          const x = (e.c + (e.xOffset || 0)) * TILE_SIZE + TILE_SIZE / 2;
          const y = (e.r + (e.yOffset || 0)) * TILE_SIZE + TILE_SIZE / 2;
          return (
            <g key={e.id}>
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
                fontSize={TILE_SIZE / 3}
              >
                {e.icon}
              </text>
              {/* HP bar */}
              <rect
                x={x - TILE_SIZE / 2}
                y={y - TILE_SIZE / 2 - 5}
                width={TILE_SIZE}
                height={3}
                fill="#1a1a1a"
              />
              <rect
                x={x - TILE_SIZE / 2}
                y={y - TILE_SIZE / 2 - 5}
                width={(e.hp / e.maxHp) * TILE_SIZE}
                height={3}
                fill="#22c55e"
              />
            </g>
          );
        })}

        {/* Mines */}
        {game.mines.map(mine => (
          <g key={mine.id}>
            <circle
              cx={mine.c * TILE_SIZE + TILE_SIZE / 2}
              cy={mine.r * TILE_SIZE + TILE_SIZE / 2}
              r={TILE_SIZE / 4}
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
              fontSize={TILE_SIZE / 3}
            >
              💣
            </text>
          </g>
        ))}

        {/* Projectiles */}
        {game.projectiles.map(p => (
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
