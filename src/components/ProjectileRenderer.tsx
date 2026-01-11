// src/components/ProjectileRenderer.tsx
import React from 'react';
import type { Projectile } from '../engine/types';

interface ProjectileRendererProps {
  projectile: Projectile;
  tileSize: number;
  tick: number;
}

const renderProjectile = (p: Projectile, TILE_SIZE: number, tick: number) => {
  const sx = (p.startX ?? p.x) * TILE_SIZE + TILE_SIZE/2;
  const sy = (p.startY ?? p.y) * TILE_SIZE + TILE_SIZE/2;
  const tx = p.tx * TILE_SIZE + TILE_SIZE/2;
  const ty = p.ty * TILE_SIZE + TILE_SIZE/2;
  const px = p.x * TILE_SIZE + TILE_SIZE/2;
  const py = p.y * TILE_SIZE + TILE_SIZE/2;
  const angle = Math.atan2(p.ty - p.y, p.tx - p.x) * (180 / Math.PI);

  // Helper for arcing projectiles
  const getArcPosition = () => {
    const cx = (p.startX! * TILE_SIZE + TILE_SIZE/2) + (p.tx - p.startX!) * TILE_SIZE * p.progress;
    const cy = (p.startY! * TILE_SIZE + TILE_SIZE/2) + (p.ty - p.startY!) * TILE_SIZE * p.progress;
    const arcHeight = 120 * 4 * p.progress * (1 - p.progress);
    return { cx, cy: cy - arcHeight, arcHeight };
  };

  switch (p.style) {
    case 'lightning':
      const midX = (sx + tx) / 2 + (Math.random() - 0.5) * 30;
      const midY = (sy + ty) / 2 + (Math.random() - 0.5) * 30;
      return <g><polyline points={`${sx},${sy} ${midX},${midY} ${tx},${ty}`} stroke={p.color} strokeWidth="4" fill="none" opacity="0.6" /><polyline points={`${sx},${sy} ${midX},${midY} ${tx},${ty}`} stroke="#fff" strokeWidth="1" fill="none" /></g>;
    
    case 'arc': {
      const { cx, cy, arcHeight } = getArcPosition();
      return <g transform={`translate(${cx}, ${cy}) rotate(${tick * 15})`}><ellipse cx={0} cy={arcHeight} rx={6 * (1-p.progress)} ry={3 * (1-p.progress)} fill="black" opacity="0.2" /><circle r={6} fill="#1e293b" stroke={p.color} strokeWidth="1.5" /><path d="M 2,-5 Q 4,-8 6,-4" stroke="#fff" strokeWidth="1" fill="none" /><circle cx={6} cy={-4} r={1.5} fill="orange" className="animate-pulse" /></g>;
    }
    
    case 'missile':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><path d="M 6,0 L -4,5 L -4,-5 Z" fill={p.color} stroke="white" strokeWidth="1" /><path d="M -4,5 L -8,8 L -4,2 Z" fill="#334155" /><path d="M -4,-5 L -8,-8 L -4,-2 Z" fill="#334155" /><path d="M -6,0 L -12,3 L -12,-3 Z" fill="orange" opacity={Math.random()}><animate attributeName="d" values="M -6,0 L -12,3 L -12,-3 Z; M -6,0 L -16,4 L -16,-4 Z; M -6,0 L -12,3 L -12,-3 Z" dur="0.1s" repeatCount="indefinite" /></path></g>;
    
    case 'fire':
      return <g transform={`translate(${px}, ${py}) scale(${1 + Math.sin(tick)*0.2})`}><circle r={4} fill="url(#grad-fire)" /><circle r={7} fill={p.color} opacity="0.4" /></g>;
    
    case 'dot':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><rect x={-6} y={-2} width={10} height={4} rx={2} fill={p.color} stroke="white" strokeWidth="0.5" /><line x1={-15} y1={0} x2={-8} y2={0} stroke={p.color} strokeWidth="1" opacity="0.5" /></g>;
    
    case 'arrow':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><path d="M 8,0 L -6,4 L -2,0 L -6,-4 Z" fill={p.color} stroke="white" strokeWidth="0.5" /><line x1={-12} y1={0} x2={-8} y2={0} stroke={p.color} strokeWidth="2" /></g>;
    
    case 'bullet':
      return <g transform={`translate(${px}, ${py})`}><circle r={3} fill={p.color} stroke="white" strokeWidth="0.5" /><circle r={1} fill="white" /></g>;
    
    case 'energy':
      return <g transform={`translate(${px}, ${py})`}><circle r={5} fill={p.color} opacity="0.8"><animate attributeName="r" values="5;7;5" dur="0.5s" repeatCount="indefinite" /></circle><circle r={3} fill="white" opacity="0.6" /></g>;
    
    case 'plasma':
      return <g transform={`translate(${px}, ${py})`}><circle r={6} fill={p.color} opacity="0.7"><animate attributeName="opacity" values="0.7;1;0.7" dur="0.3s" repeatCount="indefinite" /></circle><circle r={4} fill="url(#grad-energy)" /></g>;
    
    case 'crystal':
      return <g transform={`translate(${px}, ${py}) rotate(${angle + tick * 10})`}><polygon points="0,-8 6,0 0,8 -6,0" fill={p.color} stroke="white" strokeWidth="0.5" opacity="0.9" /></g>;
    
    case 'poison':
      return <g transform={`translate(${px}, ${py})`}><circle r={5} fill="#7c3aed" opacity="0.8"><animate attributeName="r" values="5;6;5" dur="0.4s" repeatCount="indefinite" /></circle><circle r={3} fill="#a78bfa" /></g>;
    
    case 'ice':
      return <g transform={`translate(${px}, ${py}) rotate(${tick * 5})`}><polygon points="0,-7 4,0 0,7 -4,0" fill="#60a5fa" stroke="#93c5fd" strokeWidth="1" /><circle r={2} fill="white" /></g>;
    
    case 'acid':
      return <g transform={`translate(${px}, ${py})`}><circle r={4} fill="#10b981" opacity="0.9"><animate attributeName="r" values="4;5;4" dur="0.3s" repeatCount="indefinite" /></circle><circle r={2} fill="#34d399" /></g>;
    
    case 'laser':
      return <g><line x1={sx} y1={sy} x2={px} y2={py} stroke={p.color} strokeWidth="3" opacity="0.8" /><line x1={sx} y1={sy} x2={px} y2={py} stroke="white" strokeWidth="1" /></g>;
    
    case 'sniper':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><rect x={-8} y={-1.5} width={12} height={3} fill={p.color} stroke="white" strokeWidth="0.5" /><circle r={1.5} fill="white" /></g>;
    
    case 'shotgun':
      return <g transform={`translate(${px}, ${py})`}><circle r={2} fill={p.color} stroke="white" strokeWidth="0.5" /></g>;
    
    case 'grenade': {
      const { cx, cy } = getArcPosition();
      return <g transform={`translate(${cx}, ${cy})`}><circle r={5} fill={p.color} stroke="#1e293b" strokeWidth="1.5" /><circle r={2} fill="#fff" opacity="0.5" /></g>;
    }
    
    case 'cannonball': {
      const { cx, cy } = getArcPosition();
      return <g transform={`translate(${cx}, ${cy})`}><circle r={7} fill="#374151" stroke={p.color} strokeWidth="2" /><circle r={4} fill="#4b5563" /></g>;
    }
    
    case 'rocket':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><path d="M 7,0 L -5,6 L -5,-6 Z" fill={p.color} stroke="white" strokeWidth="1" /><path d="M -5,6 L -10,8 L -5,3 Z" fill="#334155" /><path d="M -5,-6 L -10,-8 L -5,-3 Z" fill="#334155" /><circle r={2} fill="orange" cx={-7} cy={0}><animate attributeName="opacity" values="1;0.5;1" dur="0.1s" repeatCount="indefinite" /></circle></g>;
    
    case 'dart':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><path d="M 8,0 L -4,2 L -2,0 L -4,-2 Z" fill="#7c3aed" stroke="white" strokeWidth="0.5" /><circle r={1.5} fill="#a78bfa" cx={-3} cy={0} /></g>;
    
    case 'kunai':
      return <g transform={`translate(${px}, ${py}) rotate(${angle + tick * 20})`}><path d="M 8,0 L -6,3 L -2,0 L -6,-3 Z" fill={p.color} stroke="white" strokeWidth="0.5" /></g>;
    
    case 'shuriken':
      return <g transform={`translate(${px}, ${py}) rotate(${tick * 30})`}><polygon points="6,0 0,6 -6,0 0,-6" fill={p.color} stroke="white" strokeWidth="0.5" /></g>;
    
    case 'boomerang':
      return <g transform={`translate(${px}, ${py}) rotate(${angle + Math.sin(tick) * 20})`}><path d="M 8,0 Q 0,8 -8,0 Q 0,-8 8,0" fill={p.color} stroke="white" strokeWidth="1" opacity="0.9" /></g>;
    
    case 'bloomerang':
      // Flower-shaped boomerang with 5 rotating petals
      const bloomRotation = tick * 20;
      const petalCount = 5;
      const petals = Array.from({ length: petalCount }, (_, i) => {
        const angle = (i * 360 / petalCount) + bloomRotation;
        const rad = angle * Math.PI / 180;
        const px_petal = Math.cos(rad) * 6;
        const py_petal = Math.sin(rad) * 6;
        return (
          <ellipse
            key={i}
            cx={px_petal}
            cy={py_petal}
            rx="4"
            ry="8"
            fill={p.color}
            opacity={0.85}
            transform={`rotate(${angle})`}
          />
        );
      });
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <circle cx="0" cy="0" r="3" fill={p.color} opacity={0.9} />
          {petals}
        </g>
      );
    
    case 'spear':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><line x1={-10} y1={0} x2={8} y2={0} stroke={p.color} strokeWidth="3" /><path d="M 8,0 L 4,3 L 4,-3 Z" fill={p.color} /></g>;
    
    case 'blade':
      return <g transform={`translate(${px}, ${py}) rotate(${angle + tick * 50})`}><ellipse cx={0} cy={0} rx={8} ry={2} fill={p.color} stroke="white" strokeWidth="0.5" /></g>;
    
    case 'saw':
      return <g transform={`translate(${px}, ${py}) rotate(${tick * 60})`}><circle r={6} fill={p.color} stroke="white" strokeWidth="1" /><circle r={4} fill="none" stroke="#1e293b" strokeWidth="1" /><line x1={-6} y1={0} x2={6} y2={0} stroke="#1e293b" strokeWidth="1" /><line x1={0} y1={-6} x2={0} y2={6} stroke="#1e293b" strokeWidth="1" /></g>;
    
    case 'disc':
      return <g transform={`translate(${px}, ${py}) rotate(${tick * 15})`}><circle r={6} fill={p.color} stroke="white" strokeWidth="1" /><circle r={3} fill="none" stroke="white" strokeWidth="1" /></g>;
    
    case 'star':
      return <g transform={`translate(${px}, ${py}) rotate(${tick * 10})`}><polygon points="0,-7 2,-2 7,-2 3,1 5,6 0,3 -5,6 -3,1 -7,-2 -2,-2" fill={p.color} stroke="white" strokeWidth="0.5" /></g>;
    
    case 'bolt':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><path d="M 8,0 L -4,4 L -1,0 L -4,-4 Z" fill={p.color} stroke="white" strokeWidth="0.5" /><line x1={-10} y1={0} x2={-4} y2={0} stroke={p.color} strokeWidth="2" /></g>;
    
    case 'magic':
      return <g transform={`translate(${px}, ${py})`}><circle r={6} fill={p.color} opacity="0.8"><animate attributeName="r" values="6;8;6" dur="0.6s" repeatCount="indefinite" /></circle><circle r={4} fill="url(#grad-magic)" /></g>;
    
    case 'shadow':
      return <g transform={`translate(${px}, ${py})`}><circle r={5} fill="#1e1e1e" opacity="0.9"><animate attributeName="opacity" values="0.9;0.6;0.9" dur="0.5s" repeatCount="indefinite" /></circle><circle r={3} fill="#4b5563" /></g>;
    
    case 'void':
      return <g transform={`translate(${px}, ${py})`}><circle r={7} fill="#0f172a" stroke={p.color} strokeWidth="2" opacity="0.9"><animate attributeName="r" values="7;9;7" dur="0.8s" repeatCount="indefinite" /></circle><circle r={4} fill={p.color} opacity="0.3" /></g>;
    
    case 'holy':
      return <g transform={`translate(${px}, ${py})`}><circle r={6} fill="#fef08a" opacity="0.9"><animate attributeName="opacity" values="0.9;1;0.9" dur="0.4s" repeatCount="indefinite" /></circle><circle r={4} fill="#fcd34d" /><circle r={2} fill="white" /></g>;
    
    case 'dark':
      return <g transform={`translate(${px}, ${py})`}><circle r={6} fill="#1e1e1e" opacity="0.9"><animate attributeName="r" values="6;7;6" dur="0.5s" repeatCount="indefinite" /></circle><circle r={4} fill={p.color} opacity="0.5" /></g>;
    
    case 'vortex':
      return <g transform={`translate(${px}, ${py}) rotate(${tick * 30})`}><path d="M 0,-8 Q 8,0 0,8 Q -8,0 0,-8" fill="none" stroke={p.color} strokeWidth="2" opacity="0.8"><animate attributeName="d" values="M 0,-8 Q 8,0 0,8 Q -8,0 0,-8; M 0,-6 Q 6,0 0,6 Q -6,0 0,-6; M 0,-8 Q 8,0 0,8 Q -8,0 0,-8" dur="0.5s" repeatCount="indefinite" /></path><circle r={3} fill={p.color} opacity="0.6" /></g>;
    
    case 'arrow_classic':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><path d="M 8,0 L -6,5 L -2,0 L -6,-5 Z" fill={p.color} stroke="white" strokeWidth="0.5" /><line x1={-12} y1={0} x2={-6} y2={0} stroke={p.color} strokeWidth="2" /></g>;
    
    case 'needle':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><line x1={-10} y1={0} x2={6} y2={0} stroke={p.color} strokeWidth="1.5" /><circle r={1.5} fill={p.color} cx={-8} cy={0} /></g>;
    
    case 'spike':
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><polygon points="6,0 -4,3 -4,-3" fill={p.color} stroke="white" strokeWidth="0.5" /><line x1={-10} y1={0} x2={-4} y2={0} stroke={p.color} strokeWidth="2" /></g>;
    
    case 'orb':
      return <g transform={`translate(${px}, ${py})`}><circle r={5} fill={p.color} opacity="0.9"><animate attributeName="r" values="5;6;5" dur="0.5s" repeatCount="indefinite" /></circle><circle r={3} fill="white" opacity="0.5" /></g>;
    
    default:
      return <g transform={`translate(${px}, ${py}) rotate(${angle})`}><rect x={-6} y={-2} width={10} height={4} rx={2} fill={p.color} stroke="white" strokeWidth="0.5" /><line x1={-15} y1={0} x2={-8} y2={0} stroke={p.color} strokeWidth="1" opacity="0.5" /></g>;
  }
};

export const ProjectileRenderer: React.FC<ProjectileRendererProps> = ({ projectile, tileSize, tick }) => {
  return <g key={projectile.id}>{renderProjectile(projectile, tileSize, tick)}</g>;
};
