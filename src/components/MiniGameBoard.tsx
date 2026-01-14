// src/components/MiniGameBoard.tsx
// Mini GameBoard for tower live demo - uses actual GameEngine logic
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { TOWERS, ENEMY_TYPES } from '../engine/data';
import { ROWS, COLS } from '../engine/MapGenerator';
import type { TowerStats } from '../engine/types';
import { ProjectileRenderer } from './ProjectileRenderer';
import { effectManager } from '../engine/EffectManager';

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
  const [isReady, setIsReady] = useState(false);
  const miniGameRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a mini game instance
    const miniGame = new GameEngine();
    miniGame.money = 10000; // Give plenty of money
    miniGame.lives = 100; // Don't let it end
    
    miniGameRef.current = miniGame;
    
    // Wait for map generation, then place tower
    // Use a longer timeout and check if path is ready
    let initAttempts = 0;
    const maxAttempts = 50; // Maximum 5 seconds of attempts
    
    const initTower = () => {
      initAttempts++;
      
      // Check if path is ready
      if (miniGame.path && miniGame.path.length > 0 && miniGame.map && miniGame.map.length > 0) {
        // Place the tower near the path but not on it
        let towerR = Math.floor(ROWS / 2);
        let towerC = Math.floor(COLS / 2);
        
        // Try to find a spot near the path but not on it
        let attempts = 0;
        while (attempts < 20) {
          const isOnPath = miniGame.path.some(p => p.r === towerR && p.c === towerC);
          const isObstacle = miniGame.map[towerR] && miniGame.map[towerR][towerC] === 'X';
          if (!isOnPath && !isObstacle) break;
          towerR = Math.floor(Math.random() * ROWS);
          towerC = Math.floor(Math.random() * COLS);
          attempts++;
        }
        
        // Find tower key
        const towerKey = Object.keys(TOWERS).find(key => TOWERS[key].name === tower.name);
        if (towerKey) {
          miniGame.requestBuildTower(towerR, towerC, towerKey);
          miniGame.confirmAction();
        }
        setIsReady(true);
      } else if (initAttempts < maxAttempts) {
        // Path not ready yet, try again
        setTimeout(initTower, 100);
      } else {
        // Give up after max attempts - set ready anyway to show something
        console.warn('MiniGameBoard: Failed to initialize path after', maxAttempts, 'attempts');
        setIsReady(true);
      }
    };
    
    // Start initialization after a short delay
    setTimeout(initTower, 300);

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
  }, [tower, isReady]);

  const game = miniGameRef.current;
  if (!game || !isReady || !game.path || game.path.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
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
        {game.enemies.map(e => {
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

        {/* Particles */}
        {game.particles.map(p => {
          if (p.type === 'text') {
            return (
              <text
                key={p.id}
                x={p.x}
                y={p.y + (p.maxLife - p.life) * (p.vy || 0)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={16 * (p.scale || 1)}
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
