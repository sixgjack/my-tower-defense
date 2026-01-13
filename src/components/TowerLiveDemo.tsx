// src/components/TowerLiveDemo.tsx
// Enhanced live demo canvas showing tower attacking enemies with better visuals
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
  targetX: number;
  targetY: number;
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
}

export const TowerLiveDemo: React.FC<TowerLiveDemoProps> = ({ 
  tower, 
  width = 500, 
  height = 400 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
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

    // Set canvas size with device pixel ratio for crisp rendering
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

    const towerX = width / 2;
    const towerY = height / 2;
    const rangePixels = tower.range * 50; // Scale range to pixels

    // Spawn enemies periodically
    const spawnEnemy = () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = rangePixels + 60 + Math.random() * 40;
      const x = towerX + Math.cos(angle) * distance;
      const y = towerY + Math.sin(angle) * distance;
      
      enemyIdCounter.current++;
      enemiesRef.current.push({
        x,
        y,
        hp: 100,
        maxHp: 100,
        angle: Math.atan2(towerY - y, towerX - x),
        targetX: towerX,
        targetY: towerY,
        id: enemyIdCounter.current
      });
    };

    // Initial enemies
    setTimeout(() => spawnEnemy(), 500);
    setTimeout(() => spawnEnemy(), 1500);
    setTimeout(() => spawnEnemy(), 2500);

    const drawProjectile = (ctx: CanvasRenderingContext2D, proj: Projectile, style?: string) => {
      ctx.save();
      ctx.translate(proj.x, proj.y);
      ctx.rotate(proj.angle);

      switch (style) {
        case 'missile':
          // Missile shape
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(-4, 8);
          ctx.lineTo(0, 6);
          ctx.lineTo(4, 8);
          ctx.closePath();
          ctx.fill();
          // Flame trail
          ctx.fillStyle = '#ff6b00';
          ctx.beginPath();
          ctx.arc(0, 8, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'arrow':
        case 'arrow_classic':
          // Arrow shape
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(-3, 6);
          ctx.lineTo(0, 4);
          ctx.lineTo(3, 6);
          ctx.closePath();
          ctx.fill();
          break;
        case 'arc':
          // Cannonball
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.arc(2, 2, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'lightning':
          // Lightning bolt
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffff00';
          ctx.beginPath();
          ctx.moveTo(-3, -8);
          ctx.lineTo(2, 0);
          ctx.lineTo(-2, 0);
          ctx.lineTo(3, 8);
          ctx.stroke();
          break;
        case 'fire':
          // Fireball
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
          gradient.addColorStop(0, '#ff6b00');
          gradient.addColorStop(0.5, '#ff0000');
          gradient.addColorStop(1, tower.color);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'ice':
          // Ice shard
          ctx.fillStyle = '#a5f3fc';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(-4, 4);
          ctx.lineTo(0, 2);
          ctx.lineTo(4, 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        case 'sniper':
          // Sniper bullet (fast, small)
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
          // Trail
          ctx.strokeStyle = tower.color + '80';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(0, 0);
          ctx.stroke();
          break;
        default:
          // Default dot
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          // Glow effect
          ctx.shadowBlur = 8;
          ctx.shadowColor = tower.color;
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
      }
      ctx.restore();
    };

    const animate = () => {
      tickRef.current++;
      ctx.clearRect(0, 0, width, height);

      // Draw background with gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0f172a');
      bgGradient.addColorStop(1, '#1e293b');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 25) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 25) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw range circle (pulsing effect)
      const pulse = Math.sin(tickRef.current * 0.1) * 0.1 + 0.9;
      ctx.strokeStyle = tower.color + '30';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(towerX, towerY, rangePixels * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update and draw enemies
      enemiesRef.current.forEach((enemy, index) => {
        // Move enemy towards tower
        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 0.8;
        if (dist > 5) {
          enemy.x += (dx / dist) * speed;
          enemy.y += (dy / dist) * speed;
        }
        enemy.angle = Math.atan2(dy, dx);

        // Draw enemy shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(enemy.x + 2, enemy.y + 18, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw enemy body
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-12, -8, 24, 16);
        // Enemy icon
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👾', 0, 0);
        ctx.restore();

        // Draw HP bar
        const barWidth = 28;
        const barHeight = 4;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 22, barWidth, barHeight);
        const hpPercent = enemy.hp / enemy.maxHp;
        const hpGradient = ctx.createLinearGradient(enemy.x - barWidth / 2, 0, enemy.x + barWidth / 2, 0);
        hpGradient.addColorStop(0, hpPercent > 0.5 ? '#22c55e' : '#f59e0b');
        hpGradient.addColorStop(1, hpPercent > 0.5 ? '#16a34a' : '#dc2626');
        ctx.fillStyle = hpGradient;
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 22, barWidth * hpPercent, barHeight);
        // HP bar border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(enemy.x - barWidth / 2, enemy.y - 22, barWidth, barHeight);
      });

      // Tower shooting logic
      const cooldownTicks = Math.max(1, Math.floor(tower.cooldown / 16.67)); // 60fps = 16.67ms per frame
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
          projectileIdCounter.current++;
          projectilesRef.current.push({
            x: towerX,
            y: towerY,
            targetX: nearestEnemy.enemy.x,
            targetY: nearestEnemy.enemy.y,
            progress: 0,
            angle,
            id: projectileIdCounter.current
          });
        }
      }

      // Update and draw projectiles
      projectilesRef.current.forEach((proj, projIndex) => {
        const speed = tower.projectileSpeed ? (1 - tower.projectileSpeed) * 0.1 : 0.08;
        proj.progress += speed;
        
        if (proj.progress >= 1) {
          // Hit target - find closest enemy
          const hitEnemy = enemiesRef.current.find(e => {
            const dist = Math.sqrt(Math.pow(e.x - proj.targetX, 2) + Math.pow(e.y - proj.targetY, 2));
            return dist < 25;
          });
          
          if (hitEnemy) {
            // Damage enemy
            hitEnemy.hp -= tower.damage;
            
            // Area damage for area towers
            if (tower.type === 'area' && tower.areaRadius) {
              const areaRadiusPixels = tower.areaRadius * 50;
              enemiesRef.current.forEach(e => {
                const dist = Math.sqrt(Math.pow(e.x - hitEnemy.x, 2) + Math.pow(e.y - hitEnemy.y, 2));
                if (dist <= areaRadiusPixels && e.id !== hitEnemy.id) {
                  e.hp -= tower.damage * 0.5; // Reduced area damage
                }
              });
            }
            
            if (hitEnemy.hp <= 0) {
              const index = enemiesRef.current.indexOf(hitEnemy);
              enemiesRef.current.splice(index, 1);
              // Spawn new enemy after delay
              setTimeout(() => spawnEnemy(), 800);
            }
          }
          
          projectilesRef.current.splice(projIndex, 1);
        } else {
          // Update projectile position
          proj.x = towerX + (proj.targetX - towerX) * proj.progress;
          proj.y = towerY + (proj.targetY - towerY) * proj.progress;
          
          // Draw projectile
          drawProjectile(ctx, proj, tower.projectileStyle);
        }
      });

      // Draw tower with rotation towards nearest enemy
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
      ctx.ellipse(towerX + 3, towerY + 25, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw tower base
      ctx.fillStyle = tower.color + '40';
      ctx.beginPath();
      ctx.arc(towerX, towerY, 22, 0, Math.PI * 2);
      ctx.fill();

      // Draw tower body with rotation
      ctx.save();
      ctx.translate(towerX, towerY);
      ctx.rotate(towerAngle);
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      // Tower icon
      ctx.font = '28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.icon, 0, 0);
      ctx.restore();

      // Draw range indicator when shooting (pulse effect)
      if (projectilesRef.current.length > 0) {
        const pulse = Math.sin(tickRef.current * 0.3) * 0.2 + 0.8;
        ctx.strokeStyle = tower.color + '60';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(towerX, towerY, rangePixels * pulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Spawn enemies periodically
    const spawnInterval = setInterval(() => {
      if (enemiesRef.current.length < 4) {
        spawnEnemy();
      }
    }, 2500);

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
