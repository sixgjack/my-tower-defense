// src/components/MiniGameBoard.tsx
// Simplified Mini GameBoard for tower live demo - standalone implementation
import React, { useEffect, useRef, useState } from 'react';
import { ENEMY_TYPES } from '../engine/data';
import type { TowerStats } from '../engine/types';

const TILE_SIZE = 30;
const DEMO_WIDTH = 500;
const DEMO_HEIGHT = 300;

interface MiniGameBoardProps {
  tower: TowerStats;
  width?: number;
  height?: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  icon: string;
  color: string;
  progress: number; // 0 to 1 along path
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
  color: string;
  style: string;
}

export const MiniGameBoard: React.FC<MiniGameBoardProps> = ({ 
  tower, 
  width = DEMO_WIDTH, 
  height = DEMO_HEIGHT 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [towerPos] = useState({ x: width / 2, y: height / 2 });
  const lastShotTime = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // Simple path: left to right
  const path = [
    { x: 0, y: height / 2 },
    { x: width / 2 - 50, y: height / 2 },
    { x: width / 2 + 50, y: height / 2 },
    { x: width, y: height / 2 }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Spawn enemies periodically
    const spawnEnemy = () => {
      if (enemies.length < 2) {
        const enemyType = ENEMY_TYPES[0] || ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        if (enemyType) {
          setEnemies(prev => [...prev, {
            id: Date.now() + Math.random(),
            x: path[0].x,
            y: path[0].y,
            hp: 100,
            maxHp: 100,
            icon: enemyType.icon,
            color: enemyType.color,
            progress: 0
          }]);
        }
      }
    };

    // Initial spawn
    spawnEnemy();
    const spawnInterval = setInterval(spawnEnemy, 3000);

    // Game loop
    const animate = () => {
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += TILE_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw path
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();

      // Update and draw enemies
      setEnemies(prev => {
        const updated = prev.map(enemy => {
          // Move enemy along path
          const newProgress = Math.min(1, enemy.progress + 0.005);
          const pathIndex = Math.floor(newProgress * (path.length - 1));
          const segmentProgress = (newProgress * (path.length - 1)) % 1;
          
          const start = path[pathIndex];
          const end = path[Math.min(pathIndex + 1, path.length - 1)];
          const x = start.x + (end.x - start.x) * segmentProgress;
          const y = start.y + (end.y - start.y) * segmentProgress;

          return { ...enemy, x, y, progress: newProgress };
        }).filter(e => e.progress < 1); // Remove enemies that reached the end

        return updated;
      });

      // Draw enemies
      enemies.forEach(enemy => {
        // Enemy circle
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Enemy icon
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.icon, enemy.x, enemy.y);

        // HP bar
        const barWidth = 30;
        const barHeight = 4;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 20, barWidth, barHeight);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 20, (enemy.hp / enemy.maxHp) * barWidth, barHeight);
      });

      // Tower shooting logic
      const now = Date.now();
      const cooldown = tower.cooldown || 50;
      
      enemies.forEach(enemy => {
        const dist = Math.sqrt((enemy.x - towerPos.x) ** 2 + (enemy.y - towerPos.y) ** 2);
        const range = (tower.range || 2.5) * TILE_SIZE;

        if (dist <= range && now - lastShotTime.current > cooldown) {
          // Create projectile
          const projectile: Projectile = {
            id: Date.now() + Math.random(),
            x: towerPos.x,
            y: towerPos.y,
            tx: enemy.x,
            ty: enemy.y,
            progress: 0,
            color: tower.color || '#3b82f6',
            style: tower.projectileStyle || 'dot'
          };
          
          setProjectiles(prev => [...prev, projectile]);
          lastShotTime.current = now;

          // Apply damage
          const damage = tower.damage || 10;
          setEnemies(prev => prev.map(e => 
            e.id === enemy.id 
              ? { ...e, hp: Math.max(0, e.hp - damage) }
              : e
          ));
        }
      });

      // Update and draw projectiles
      setProjectiles(prev => {
        return prev.map(proj => {
          const newProgress = Math.min(1, proj.progress + 0.1);
          const x = proj.x + (proj.tx - proj.x) * newProgress;
          const y = proj.y + (proj.ty - proj.y) * newProgress;
          return { ...proj, progress: newProgress, x, y };
        }).filter(p => p.progress < 1);
      });

      // Draw projectiles
      projectiles.forEach(proj => {
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Add trail effect
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Draw tower
      const towerRange = (tower.range || 2.5) * TILE_SIZE;
      ctx.strokeStyle = tower.color || '#3b82f6';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(towerPos.x, towerPos.y, towerRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      ctx.fillStyle = tower.color || '#3b82f6';
      ctx.beginPath();
      ctx.arc(towerPos.x, towerPos.y, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.icon || '🏰', towerPos.x, towerPos.y);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      clearInterval(spawnInterval);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [tower, width, height, enemies, projectiles, towerPos]);

  // Remove dead enemies
  useEffect(() => {
    setEnemies(prev => prev.filter(e => e.hp > 0));
  }, [enemies]);

  return (
    <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border-2 border-slate-700 overflow-hidden" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
      />
    </div>
  );
};
