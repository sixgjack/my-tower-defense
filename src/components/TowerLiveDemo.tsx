// src/components/TowerLiveDemo.tsx
// Live demo canvas showing tower attacking enemies
import React, { useRef, useEffect } from 'react';
import type { TowerStats } from '../engine/types';

interface TowerLiveDemoProps {
  tower: TowerStats;
  width?: number;
  height?: number;
}

export const TowerLiveDemo: React.FC<TowerLiveDemoProps> = ({ 
  tower, 
  width = 400, 
  height = 300 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Demo state
    let tick = 0;
    const towerX = width / 2;
    const towerY = height / 2;
    const enemies: Array<{ x: number; y: number; hp: number; maxHp: number; angle: number }> = [];
    const projectiles: Array<{ x: number; y: number; targetX: number; targetY: number; progress: number }> = [];
    let lastShot = 0;

    // Spawn enemies periodically
    const spawnEnemy = () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = tower.range * 40 + 50;
      const x = towerX + Math.cos(angle) * distance;
      const y = towerY + Math.sin(angle) * distance;
      enemies.push({
        x,
        y,
        hp: 100,
        maxHp: 100,
        angle: Math.atan2(towerY - y, towerX - x)
      });
    };

    // Initial enemies
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnEnemy(), i * 1000);
    }

    const animate = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Draw background grid
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Draw range circle
      ctx.strokeStyle = tower.color + '40';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(towerX, towerY, tower.range * 40, 0, Math.PI * 2);
      ctx.stroke();

      // Update and draw enemies
      enemies.forEach((enemy, index) => {
        // Move enemy towards tower
        const dx = towerX - enemy.x;
        const dy = towerY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 0.5;
        enemy.x += (dx / dist) * speed;
        enemy.y += (dy / dist) * speed;
        enemy.angle = Math.atan2(dy, dx);

        // Draw enemy
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle + Math.PI);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-15, -10, 30, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('👾', 0, 5);
        ctx.restore();

        // Draw HP bar
        const barWidth = 30;
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 25, barWidth, barHeight);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(enemy.x - barWidth / 2, enemy.y - 25, (enemy.hp / enemy.maxHp) * barWidth, barHeight);
      });

      // Tower shooting logic
      if (tick - lastShot >= tower.cooldown / 10) {
        const nearestEnemy = enemies
          .map((e, i) => ({ enemy: e, dist: Math.sqrt(Math.pow(e.x - towerX, 2) + Math.pow(e.y - towerY, 2)), index: i }))
          .filter(e => e.dist <= tower.range * 40)
          .sort((a, b) => a.dist - b.dist)[0];

        if (nearestEnemy) {
          lastShot = tick;
          projectiles.push({
            x: towerX,
            y: towerY,
            targetX: nearestEnemy.enemy.x,
            targetY: nearestEnemy.enemy.y,
            progress: 0
          });
        }
      }

      // Update and draw projectiles
      projectiles.forEach((proj, projIndex) => {
        proj.progress += 0.05;
        if (proj.progress >= 1) {
          // Hit target
          const hitEnemy = enemies.find(e => {
            const dist = Math.sqrt(Math.pow(e.x - proj.targetX, 2) + Math.pow(e.y - proj.targetY, 2));
            return dist < 20;
          });
          if (hitEnemy) {
            hitEnemy.hp -= tower.damage;
            if (hitEnemy.hp <= 0) {
              const index = enemies.indexOf(hitEnemy);
              enemies.splice(index, 1);
              // Spawn new enemy
              setTimeout(() => spawnEnemy(), 500);
            }
          }
          projectiles.splice(projIndex, 1);
        } else {
          proj.x = towerX + (proj.targetX - towerX) * proj.progress;
          proj.y = towerY + (proj.targetY - towerY) * proj.progress;

          // Draw projectile based on style
          ctx.fillStyle = tower.color;
          ctx.beginPath();
          if (tower.projectileStyle === 'dot' || !tower.projectileStyle) {
            ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (tower.projectileStyle === 'missile') {
            ctx.fillRect(proj.x - 3, proj.y - 8, 6, 12);
          } else if (tower.projectileStyle === 'arrow') {
            ctx.beginPath();
            ctx.moveTo(proj.x, proj.y - 5);
            ctx.lineTo(proj.x - 3, proj.y + 5);
            ctx.lineTo(proj.x + 3, proj.y + 5);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Draw tower
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(towerX, towerY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(tower.icon, towerX, towerY + 8);

      // Draw tower range indicator when shooting
      if (projectiles.length > 0) {
        ctx.strokeStyle = tower.color + '80';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(towerX, towerY, tower.range * 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Spawn enemies periodically
    const spawnInterval = setInterval(() => {
      if (enemies.length < 5) {
        spawnEnemy();
      }
    }, 2000);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(spawnInterval);
    };
  }, [tower, width, height]);

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
      <div className="text-slate-300 text-sm mb-2 font-semibold">Live Demo / 實戰演示</div>
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border border-slate-700"
        style={{ maxHeight: height }}
      />
    </div>
  );
};
