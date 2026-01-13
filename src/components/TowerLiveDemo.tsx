// src/components/TowerLiveDemo.tsx
// Enhanced live demo showing tower attacking enemies on a route
import React, { useRef, useEffect } from 'react';
import type { TowerStats } from '../engine/types';

interface TowerLiveDemoProps {
  tower: TowerStats;
  width?: number;
  height?: number;
}

interface Enemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  angle: number;
  pathProgress: number; // Progress along path (0 to 1)
  id: number;
}

interface Projectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  angle: number;
  id: number;
  style?: string;
  returnToTower?: boolean;
  returnProgress?: number;
}

export const TowerLiveDemo: React.FC<TowerLiveDemoProps> = ({ 
  tower, 
  width = 500, 
  height = 300 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const lastShotRef = useRef<number>(0);
  const tickRef = useRef<number>(0);
  const enemyIdCounter = useRef<number>(0);
  const projectileIdCounter = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    // Reset state
    enemiesRef.current = [];
    projectilesRef.current = [];
    lastShotRef.current = 0;
    tickRef.current = 0;
    enemyIdCounter.current = 0;
    projectileIdCounter.current = 0;

    // Define a simple path (left to right)
    const path = [
      { x: 20, y: height / 2 },
      { x: width - 20, y: height / 2 }
    ];
    
    const towerX = width / 2;
    const towerY = height / 2;
    const rangePixels = tower.range * 50;

    // Spawn enemies on the path
    const spawnEnemy = () => {
      enemyIdCounter.current++;
      enemiesRef.current.push({
        x: path[0].x,
        y: path[0].y,
        hp: 100,
        maxHp: 100,
        angle: 0,
        pathProgress: 0,
        id: enemyIdCounter.current
      });
    };

    // Initial enemies
    setTimeout(() => spawnEnemy(), 500);
    setTimeout(() => spawnEnemy(), 2000);
    setTimeout(() => spawnEnemy(), 3500);

    const drawProjectile = (ctx: CanvasRenderingContext2D, proj: Projectile, style?: string) => {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      
      if (proj.returnToTower && proj.returnProgress !== undefined && proj.returnProgress > 0) {
        // Returning - rotate back
        ctx.rotate(proj.angle + Math.PI);
      } else {
        ctx.rotate(proj.angle);
      }

      switch (style) {
        case 'shotgun':
          // Small pellets
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'boomerang':
          // Boomerang shape
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.moveTo(0, -4);
          ctx.lineTo(-3, 0);
          ctx.lineTo(0, 4);
          ctx.lineTo(3, 0);
          ctx.closePath();
          ctx.fill();
          break;
        case 'bloomerang':
          // Flower-shaped boomerang
          const bloomRotation = tickRef.current * 5;
          const petalCount = 5;
          for (let i = 0; i < petalCount; i++) {
            const angle = (i * 360 / petalCount) + bloomRotation;
            const rad = angle * Math.PI / 180;
            const px = Math.cos(rad) * 3;
            const py = Math.sin(rad) * 3;
            ctx.fillStyle = tower.color;
            ctx.beginPath();
            ctx.ellipse(px, py, 2, 4, rad, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'spread':
          // Spread pattern
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        default:
          // Default dot
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
      }
      ctx.restore();
    };

    const animate = () => {
      tickRef.current++;
      ctx.clearRect(0, 0, width, height);

      // Draw background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0f172a');
      bgGradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw path
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      ctx.lineTo(path[1].x, path[1].y);
      ctx.stroke();

      // Draw range circle (subtle)
      ctx.strokeStyle = tower.color + '20';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(towerX, towerY, rangePixels, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update and draw enemies
      enemiesRef.current.forEach((enemy) => {
        // Move enemy along path
        enemy.pathProgress += 0.005;
        if (enemy.pathProgress > 1) {
          enemy.pathProgress = 0; // Reset to start
        }
        
        enemy.x = path[0].x + (path[1].x - path[0].x) * enemy.pathProgress;
        enemy.y = path[0].y + (path[1].y - path[0].y) * enemy.pathProgress;
        
        // Check if in range
        const dist = Math.sqrt(Math.pow(enemy.x - towerX, 2) + Math.pow(enemy.y - towerY, 2));
        const inRange = dist <= rangePixels;

        // Draw enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(enemy.x + 2, enemy.y + 12, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw enemy
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.fillStyle = inRange ? '#ef4444' : '#dc2626';
        ctx.fillRect(-10, -6, 20, 12);
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👾', 0, 0);
        ctx.restore();

        // Draw HP bar
        const barWidth = 24;
        const barHeight = 3;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 16, barWidth, barHeight);
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : '#dc2626';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 16, barWidth * hpPercent, barHeight);
      });

      // Tower shooting logic - slower for demo visibility
      const cooldownTicks = Math.max(1, Math.floor((tower.cooldown * 3) / 16.67)); // 3x slower for demo
      if (tickRef.current - lastShotRef.current >= cooldownTicks) {
        const nearestEnemy = enemiesRef.current
          .map((e) => ({ 
            enemy: e, 
            dist: Math.sqrt(Math.pow(e.x - towerX, 2) + Math.pow(e.y - towerY, 2))
          }))
          .filter(e => e.dist <= rangePixels)
          .sort((a, b) => a.dist - b.dist)[0];

        if (nearestEnemy) {
          lastShotRef.current = tickRef.current;
          const angle = Math.atan2(nearestEnemy.enemy.y - towerY, nearestEnemy.enemy.x - towerX);
          
          // Handle different attack types
          if (tower.type === 'spread') {
            // Spread attack - multiple pellets
            const pelletCount = tower.multiTarget || 5;
            const spreadAngle = 35;
            for (let i = 0; i < pelletCount; i++) {
              const angleOffset = (i / (pelletCount - 1) - 0.5) * spreadAngle * (Math.PI / 180);
              const pelletAngle = angle + angleOffset;
              const distance = nearestEnemy.dist;
              const pelletTx = towerX + Math.cos(pelletAngle) * distance;
              const pelletTy = towerY + Math.sin(pelletAngle) * distance;
              
              projectileIdCounter.current++;
              projectilesRef.current.push({
                x: towerX,
                y: towerY,
                targetX: pelletTx,
                targetY: pelletTy,
                progress: 0,
                angle: pelletAngle,
                id: projectileIdCounter.current,
                style: 'shotgun'
              });
            }
          } else if (tower.projectileStyle === 'boomerang' || tower.projectileStyle === 'bloomerang') {
            // Boomerang attack
            projectileIdCounter.current++;
            projectilesRef.current.push({
              x: towerX,
              y: towerY,
              targetX: nearestEnemy.enemy.x,
              targetY: nearestEnemy.enemy.y,
              progress: 0,
              angle,
              id: projectileIdCounter.current,
              style: tower.projectileStyle,
              returnToTower: true,
              returnProgress: 0
            });
          } else {
            // Standard projectile
            projectileIdCounter.current++;
            projectilesRef.current.push({
              x: towerX,
              y: towerY,
              targetX: nearestEnemy.enemy.x,
              targetY: nearestEnemy.enemy.y,
              progress: 0,
              angle,
              id: projectileIdCounter.current,
              style: tower.projectileStyle || 'dot'
            });
          }
        }
      }

      // Update and draw projectiles
      projectilesRef.current.forEach((proj, projIndex) => {
        if (proj.returnToTower && proj.returnProgress !== undefined) {
          // Boomerang return logic
          if (proj.progress < 1) {
            // Going to target
            proj.progress += 0.08;
            proj.x = towerX + (proj.targetX - towerX) * proj.progress;
            proj.y = towerY + (proj.targetY - towerY) * proj.progress;
          } else if (proj.returnProgress < 1) {
            // Returning to tower
            proj.returnProgress += 0.08;
            proj.x = proj.targetX + (towerX - proj.targetX) * proj.returnProgress;
            proj.y = proj.targetY + (towerY - proj.targetY) * proj.returnProgress;
          } else {
            // Returned - remove
            projectilesRef.current.splice(projIndex, 1);
            return;
          }
        } else {
          // Normal projectile
          proj.progress += 0.08;
          if (proj.progress >= 1) {
            // Hit target
            const hitEnemy = enemiesRef.current.find(e => {
              const dist = Math.sqrt(Math.pow(e.x - proj.targetX, 2) + Math.pow(e.y - proj.targetY, 2));
              return dist < 15;
            });
            
            if (hitEnemy) {
              hitEnemy.hp -= tower.damage;
              if (hitEnemy.hp <= 0) {
                const index = enemiesRef.current.indexOf(hitEnemy);
                enemiesRef.current.splice(index, 1);
                setTimeout(() => spawnEnemy(), 1000);
              }
            }
            
            // Handle boomerang return
            if (tower.projectileStyle === 'boomerang' || tower.projectileStyle === 'bloomerang') {
              proj.returnToTower = true;
              proj.returnProgress = 0;
            } else {
              projectilesRef.current.splice(projIndex, 1);
            }
          } else {
            proj.x = towerX + (proj.targetX - towerX) * proj.progress;
            proj.y = towerY + (proj.targetY - towerY) * proj.progress;
          }
        }
        
        // Draw projectile
        drawProjectile(ctx, proj, proj.style);
      });

      // Draw tower
      const nearestEnemy = enemiesRef.current
        .map((e) => ({ 
          enemy: e, 
          dist: Math.sqrt(Math.pow(e.x - towerX, 2) + Math.pow(e.y - towerY, 2))
        }))
        .filter(e => e.dist <= rangePixels)
        .sort((a, b) => a.dist - b.dist)[0];
      
      const towerAngle = nearestEnemy 
        ? Math.atan2(nearestEnemy.enemy.y - towerY, nearestEnemy.enemy.x - towerX)
        : 0;

      // Draw tower shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(towerX + 2, towerY + 15, 15, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw tower base
      ctx.fillStyle = tower.color + '40';
      ctx.beginPath();
      ctx.arc(towerX, towerY, 18, 0, Math.PI * 2);
      ctx.fill();

      // Draw tower with rotation
      ctx.save();
      ctx.translate(towerX, towerY);
      ctx.rotate(towerAngle);
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.icon, 0, 0);
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Spawn enemies periodically
    const spawnInterval = setInterval(() => {
      if (enemiesRef.current.length < 3) {
        spawnEnemy();
      }
    }, 3000);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(spawnInterval);
    };
  }, [tower, width, height]);

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl p-4 border-2 border-slate-700/50 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-slate-200 text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Live Demo / 實戰演示
        </div>
        <div className="text-xs text-slate-500">Watch the tower in action</div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border-2 border-slate-700/50 shadow-inner bg-slate-950"
        style={{ maxHeight: height }}
      />
    </div>
  );
};
