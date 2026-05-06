// src/components/ProjectileRenderer.tsx
import React from 'react';
import type { Projectile } from '../engine/types';

interface ProjectileRendererProps {
  projectile: Projectile;
  tileSize: number;
  tick: number;
}

// Deterministic jitter so we don't get new values every render frame
const seededJitter = (seed: number, amplitude: number) =>
  Math.sin(seed * 127.1 + 311.7) * amplitude;

const renderProjectile = (p: Projectile, TILE_SIZE: number, tick: number) => {
  const sx = (p.startX ?? p.x) * TILE_SIZE + TILE_SIZE / 2;
  const sy = (p.startY ?? p.y) * TILE_SIZE + TILE_SIZE / 2;
  const tx = p.tx * TILE_SIZE + TILE_SIZE / 2;
  const ty = p.ty * TILE_SIZE + TILE_SIZE / 2;
  const px = p.x * TILE_SIZE + TILE_SIZE / 2;
  const py = p.y * TILE_SIZE + TILE_SIZE / 2;
  const angle = Math.atan2(p.ty - p.y, p.tx - p.x) * (180 / Math.PI);

  // Arc/grenade projectile parabolic position
  const getArcPosition = () => {
    const cx = sx + (tx - sx) * p.progress;
    const cy = sy + (ty - sy) * p.progress;
    const arcHeight = TILE_SIZE * 2.0 * 4 * p.progress * (1 - p.progress);
    return { cx, cy: cy - arcHeight };
  };

  switch (p.style) {
    case 'lightning': {
      const seed = Number(p.id) * 0.001 + tick * 0.35;
      const midX = (sx + tx) / 2 + seededJitter(seed, 18);
      const midY = (sy + ty) / 2 + seededJitter(seed + 2.1, 18);
      const q1X = (sx + midX) / 2 + seededJitter(seed + 4.2, 10);
      const q1Y = (sy + midY) / 2 + seededJitter(seed + 6.3, 10);
      const q2X = (midX + tx) / 2 + seededJitter(seed + 8.4, 10);
      const q2Y = (midY + ty) / 2 + seededJitter(seed + 10.5, 10);
      const pts = `${sx},${sy} ${q1X},${q1Y} ${midX},${midY} ${q2X},${q2Y} ${tx},${ty}`;
      const brX = midX + seededJitter(seed + 1.3, 15);
      const brY = midY + seededJitter(seed + 3.7, 15);
      return (
        <g>
          {/* Outer glow */}
          <polyline points={pts} fill="none" stroke={p.color} strokeWidth="9" opacity="0.2" strokeLinecap="round" />
          {/* Main bolt */}
          <polyline points={pts} fill="none" stroke="#facc15" strokeWidth="3.5" opacity="0.85" strokeLinecap="round" />
          {/* White hot core */}
          <polyline points={pts} fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.9" strokeLinecap="round" />
          {/* Branch */}
          <polyline points={`${midX},${midY} ${brX},${brY}`} fill="none" stroke="#fef08a" strokeWidth="2" opacity="0.5" />
          {/* Impact flash */}
          <circle cx={tx} cy={ty} r={9} fill="#facc15" opacity="0.5">
            <animate attributeName="r" values="9;14;9" dur="0.15s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="0.15s" repeatCount="indefinite" />
          </circle>
          <circle cx={tx} cy={ty} r={4} fill="white" opacity="0.9" />
        </g>
      );
    }

    case 'arc': {
      const { cx, cy } = getArcPosition();
      // Shadow beneath arc (projected on ground)
      const shadowY = sy + (ty - sy) * p.progress;
      const shadowSize = 8 * (1 - p.progress * 0.5);
      return (
        <g>
          <ellipse cx={cx} cy={shadowY} rx={shadowSize} ry={shadowSize * 0.4} fill="black" opacity="0.25" />
          <g transform={`translate(${cx}, ${cy}) rotate(${tick * 12})`}>
            <circle r={9} fill={p.color} />
            <circle r={7} fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
            <circle r={3} fill="white" opacity="0.8" />
            <line x1={-9} y1={0} x2={9} y2={0} stroke="white" strokeWidth="0.8" opacity="0.4" />
            <line x1={0} y1={-9} x2={0} y2={9} stroke="white" strokeWidth="0.8" opacity="0.4" />
          </g>
        </g>
      );
    }

    case 'missile': {
      const flameLen = 10 + Math.sin(tick * 0.8) * 4;
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          {/* Exhaust glow */}
          <ellipse cx={-8} cy={0} rx={flameLen} ry={4} fill="#ff6600" opacity="0.3" />
          {/* Flame */}
          <path d={`M -6,0 L -${6 + flameLen},${3} L -${6 + flameLen},-${3} Z`} fill="#ff8800" opacity="0.8" />
          <path d={`M -6,0 L -${4 + flameLen * 0.6},${1.5} L -${4 + flameLen * 0.6},-${1.5} Z`} fill="#ffdd00" opacity="0.9" />
          {/* Body */}
          <path d="M 9,0 L -5,5 L -5,-5 Z" fill={p.color} />
          {/* Fins */}
          <path d="M -3,5 L -7,9 L -5,4 Z" fill="#475569" />
          <path d="M -3,-5 L -7,-9 L -5,-4 Z" fill="#475569" />
          {/* Nose */}
          <circle cx={9} cy={0} r={2} fill="white" opacity="0.9" />
        </g>
      );
    }

    case 'rocket': {
      const rFlame = 8 + Math.sin(tick * 0.8) * 3;
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <ellipse cx={-7} cy={0} rx={rFlame} ry={3.5} fill="#ff4400" opacity="0.35" />
          <circle cx={-8} cy={0} r={2} fill="#ffaa00" opacity="0.9">
            <animate attributeName="r" values="2;3.5;2" dur="0.1s" repeatCount="indefinite" />
          </circle>
          <path d="M 9,0 L -5,7 L -5,-7 Z" fill={p.color} />
          <path d="M -3,7 L -9,11 L -5,4 Z" fill="#334155" />
          <path d="M -3,-7 L -9,-11 L -5,-4 Z" fill="#334155" />
          <circle cx={9} cy={0} r={2.5} fill="white" opacity="0.8" />
        </g>
      );
    }

    case 'fire':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={11} fill={p.color} opacity="0.2">
            <animate attributeName="r" values="11;14;11" dur="0.3s" repeatCount="indefinite" />
          </circle>
          <circle r={7} fill="url(#grad-fire)" />
          <circle r={4} fill="#fef08a" opacity="0.9">
            <animate attributeName="r" values="4;5.5;4" dur="0.2s" repeatCount="indefinite" />
          </circle>
        </g>
      );

    case 'plasma':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={12} fill={p.color} opacity="0.2">
            <animate attributeName="r" values="12;16;12" dur="0.4s" repeatCount="indefinite" />
          </circle>
          <circle r={8} fill={p.color} opacity="0.85">
            <animate attributeName="opacity" values="0.85;1;0.85" dur="0.25s" repeatCount="indefinite" />
          </circle>
          <circle r={5} fill="url(#grad-energy)" />
          <circle r={2} fill="white" opacity="0.9" />
        </g>
      );

    case 'dot':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <rect x={-8} y={-3} width={14} height={6} rx={3} fill={p.color} />
          <rect x={-8} y={-1.5} width={14} height={3} rx={1.5} fill="white" opacity="0.35" />
          <line x1={-18} y1={0} x2={-10} y2={0} stroke={p.color} strokeWidth="2" opacity="0.5" />
        </g>
      );

    case 'arrow':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <path d="M 10,0 L -7,5 L -3,0 L -7,-5 Z" fill={p.color} />
          <line x1={-14} y1={0} x2={-9} y2={0} stroke={p.color} strokeWidth="2.5" />
          <line x1={-7} y1={-3} x2={-7} y2={3} stroke={p.color} strokeWidth="2" />
        </g>
      );

    case 'bullet':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          {/* Trail */}
          <line x1={-12} y1={0} x2={-5} y2={0} stroke={p.color} strokeWidth="2" opacity="0.4" />
          <circle r={4} fill={p.color} />
          <circle r={2} fill="white" opacity="0.7" />
        </g>
      );

    case 'energy':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={12} fill={p.color} opacity="0.15">
            <animate attributeName="r" values="12;16;12" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle r={7} fill={p.color} opacity="0.9">
            <animate attributeName="r" values="7;9;7" dur="0.4s" repeatCount="indefinite" />
          </circle>
          <circle r={4} fill="white" opacity="0.7" />
        </g>
      );

    case 'crystal': {
      const cRot = angle + tick * 12;
      return (
        <g transform={`translate(${px}, ${py}) rotate(${cRot})`}>
          <polygon points="0,-11 7,0 0,11 -7,0" fill={p.color} opacity="0.9" />
          <polygon points="0,-8 5,0 0,8 -5,0" fill="white" opacity="0.4" />
          <circle r={2.5} fill="white" opacity="0.9" />
          {/* Shimmer lines */}
          <line x1={0} y1={-11} x2={0} y2={11} stroke="white" strokeWidth="0.8" opacity="0.3" />
          <line x1={-7} y1={0} x2={7} y2={0} stroke="white" strokeWidth="0.8" opacity="0.3" />
        </g>
      );
    }

    case 'poison':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={11} fill="#4c1d95" opacity="0.2">
            <animate attributeName="r" values="11;14;11" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle r={7} fill="#7c3aed" opacity="0.9">
            <animate attributeName="r" values="7;8.5;7" dur="0.4s" repeatCount="indefinite" />
          </circle>
          <circle r={4} fill="#a78bfa" />
          <circle r={2} fill="white" opacity="0.6" />
        </g>
      );

    case 'ice': {
      const iRot = tick * 6;
      return (
        <g transform={`translate(${px}, ${py}) rotate(${iRot})`}>
          {/* Outer frost aura */}
          <circle r={14} fill="#60a5fa" opacity="0.12">
            <animate attributeName="r" values="14;18;14" dur="0.6s" repeatCount="indefinite" />
          </circle>
          {/* Crystal shape */}
          <polygon points="0,-10 6,0 0,10 -6,0" fill="#60a5fa" />
          <polygon points="0,-7 4,0 0,7 -4,0" fill="#bfdbfe" opacity="0.85" />
          {/* Crosshairs */}
          <line x1={-12} y1={0} x2={12} y2={0} stroke="#93c5fd" strokeWidth="1.5" opacity="0.5" />
          <line x1={0} y1={-12} x2={0} y2={12} stroke="#93c5fd" strokeWidth="1.5" opacity="0.5" />
          <circle r={2.5} fill="white" />
        </g>
      );
    }

    case 'acid':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={10} fill="#10b981" opacity="0.2">
            <animate attributeName="r" values="10;13;10" dur="0.35s" repeatCount="indefinite" />
          </circle>
          <circle r={6} fill="#10b981" opacity="0.95">
            <animate attributeName="r" values="6;7.5;6" dur="0.3s" repeatCount="indefinite" />
          </circle>
          <circle r={3} fill="#34d399" />
          <circle r={1.5} fill="white" opacity="0.7" />
        </g>
      );

    case 'laser':
      return (
        <g>
          {/* Glow trail */}
          <line x1={sx} y1={sy} x2={px} y2={py} stroke={p.color} strokeWidth="6" opacity="0.2" />
          {/* Core beam */}
          <line x1={sx} y1={sy} x2={px} y2={py} stroke={p.color} strokeWidth="3" opacity="0.85" />
          <line x1={sx} y1={sy} x2={px} y2={py} stroke="white" strokeWidth="1.2" opacity="0.7" />
        </g>
      );

    case 'sniper':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          {/* Trail */}
          <line x1={-20} y1={0} x2={10} y2={0} stroke={p.color} strokeWidth="1.5" opacity="0.3" />
          {/* Body */}
          <rect x={-10} y={-2.5} width={18} height={5} rx={2.5} fill={p.color} />
          <rect x={-10} y={-1} width={18} height={2} fill="white" opacity="0.35" />
          <circle r={3} fill="white" opacity="0.9" cx={10} cy={0} />
        </g>
      );

    case 'shotgun':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <circle r={4} fill={p.color} />
          <circle r={2} fill="white" opacity="0.6" />
        </g>
      );

    case 'grenade': {
      const { cx, cy } = getArcPosition();
      const shadowY2 = sy + (ty - sy) * p.progress;
      return (
        <g>
          <ellipse cx={cx} cy={shadowY2} rx={6} ry={2.5} fill="black" opacity="0.2" />
          <g transform={`translate(${cx}, ${cy}) rotate(${tick * 18})`}>
            <circle r={8} fill={p.color} />
            <circle r={6} fill="none" stroke="#1e293b" strokeWidth="1.5" />
            <line x1={-6} y1={0} x2={6} y2={0} stroke="#1e293b" strokeWidth="1.5" opacity="0.6" />
            <line x1={0} y1={-6} x2={0} y2={6} stroke="#1e293b" strokeWidth="1.5" opacity="0.6" />
            <circle r={2.5} fill="white" opacity="0.7" />
          </g>
        </g>
      );
    }

    case 'cannonball': {
      const { cx, cy } = getArcPosition();
      const shadowY3 = sy + (ty - sy) * p.progress;
      return (
        <g>
          <ellipse cx={cx} cy={shadowY3} rx={7} ry={3} fill="black" opacity="0.2" />
          <g transform={`translate(${cx}, ${cy})`}>
            <circle r={10} fill="#1e293b" />
            <circle r={8} fill="#374151" />
            <circle r={5} fill="#4b5563" />
            <circle r={3} fill={p.color} opacity="0.6" />
          </g>
        </g>
      );
    }

    case 'dart':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <line x1={-8} y1={0} x2={10} y2={0} stroke="#7c3aed" strokeWidth="2" />
          <path d="M 10,0 L 5,3 L 5,-3 Z" fill={p.color} />
          <path d="M -5,2 L -8,4 L -6,0 Z" fill="#a78bfa" opacity="0.7" />
          <path d="M -5,-2 L -8,-4 L -6,0 Z" fill="#a78bfa" opacity="0.7" />
        </g>
      );

    case 'kunai':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle + tick * 22})`}>
          <path d="M 9,0 L -7,4 L -3,0 L -7,-4 Z" fill={p.color} />
          <line x1={-7} y1={0} x2={-12} y2={0} stroke={p.color} strokeWidth="1.5" opacity="0.5" />
        </g>
      );

    case 'shuriken':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${tick * 32})`}>
          {/* 4-bladed shuriken */}
          <polygon points="7,0 2,2 0,7 -2,2 -7,0 -2,-2 0,-7 2,-2" fill={p.color} />
          <circle r={3} fill={p.color} />
          <circle r={1.5} fill="white" opacity="0.8" />
        </g>
      );

    case 'boomerang':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle + Math.sin(tick * 0.08) * 25})`}>
          {/* Wing glow */}
          <path d="M 11,0 Q 0,11 -11,0 Q 0,-11 11,0" fill={p.color} opacity="0.2" strokeWidth="0" />
          {/* Body */}
          <path d="M 10,0 Q 0,9 -10,0 Q 0,-9 10,0" fill={p.color} stroke="white" strokeWidth="1" opacity="0.95" />
          <path d="M 7,0 Q 0,5 -7,0 Q 0,-5 7,0" fill="white" opacity="0.3" />
        </g>
      );

    case 'bloomerang': {
      const bloomRot = tick * 22;
      const COUNT = 5;
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <circle cx="0" cy="0" r="4" fill={p.color} opacity={0.95} />
          {Array.from({ length: COUNT }, (_, i) => {
            const pAngle = (i * 360 / COUNT) + bloomRot;
            const pRad = pAngle * Math.PI / 180;
            const cpx = Math.cos(pRad) * 7;
            const cpy = Math.sin(pRad) * 7;
            return (
              <ellipse key={i} cx={cpx} cy={cpy} rx="3" ry="7"
                fill={p.color} opacity={0.85} transform={`rotate(${pAngle}, ${cpx}, ${cpy})`} />
            );
          })}
        </g>
      );
    }

    case 'spear':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <line x1={-12} y1={0} x2={8} y2={0} stroke={p.color} strokeWidth="3" />
          <path d="M 8,0 L 3,4 L 3,-4 Z" fill={p.color} />
          <line x1={-12} y1={0} x2={8} y2={0} stroke="white" strokeWidth="0.8" opacity="0.3" />
        </g>
      );

    case 'blade':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle + tick * 55})`}>
          <ellipse cx={0} cy={0} rx={11} ry={3} fill={p.color} />
          <ellipse cx={0} cy={0} rx={10} ry={2} fill="white" opacity="0.25" />
          <ellipse cx={0} cy={0} rx={4} ry={1.5} fill="white" opacity="0.5" />
        </g>
      );

    case 'saw':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${tick * 65})`}>
          <circle r={9} fill={p.color} />
          {/* Saw teeth */}
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * 45) * Math.PI / 180;
            const x1 = Math.cos(a) * 7, y1 = Math.sin(a) * 7;
            const x2 = Math.cos(a + Math.PI / 16) * 11, y2 = Math.sin(a + Math.PI / 16) * 11;
            const x3 = Math.cos(a + Math.PI / 8) * 7, y3 = Math.sin(a + Math.PI / 8) * 7;
            return <polygon key={i} points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill={p.color} stroke="#1e293b" strokeWidth="0.5" />;
          })}
          <circle r={4} fill="#1e293b" />
          <circle r={2} fill={p.color} opacity="0.5" />
        </g>
      );

    case 'disc':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${tick * 18})`}>
          <circle r={9} fill={p.color} />
          <circle r={7} fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
          <circle r={3} fill="white" opacity="0.6" />
          <line x1={-7} y1={0} x2={7} y2={0} stroke="white" strokeWidth="0.8" opacity="0.2" />
          <line x1={0} y1={-7} x2={0} y2={7} stroke="white" strokeWidth="0.8" opacity="0.2" />
        </g>
      );

    case 'star':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${tick * 12})`}>
          <circle r={11} fill={p.color} opacity="0.2" />
          <polygon points="0,-9 2.5,-3 9,-3 4,1.5 6,8 0,4 -6,8 -4,1.5 -9,-3 -2.5,-3" fill={p.color} />
          <polygon points="0,-6 1.5,-2 6,-2 2.5,1 4,5.5 0,2.5 -4,5.5 -2.5,1 -6,-2 -1.5,-2" fill="white" opacity="0.4" />
          <circle r={2} fill="white" opacity="0.9" />
        </g>
      );

    case 'bolt':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <line x1={-14} y1={0} x2={10} y2={0} stroke={p.color} strokeWidth="4" opacity="0.3" />
          <path d="M 10,0 L -5,5 L -2,0 L -5,-5 Z" fill={p.color} />
          <line x1={-14} y1={0} x2={-6} y2={0} stroke={p.color} strokeWidth="3" />
          <line x1={-14} y1={0} x2={-6} y2={0} stroke="white" strokeWidth="1.2" opacity="0.4" />
          <circle cx={10} cy={0} r={2} fill="white" opacity="0.8" />
        </g>
      );

    case 'magic':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={14} fill={p.color} opacity="0.15">
            <animate attributeName="r" values="14;18;14" dur="0.6s" repeatCount="indefinite" />
          </circle>
          <circle r={8} fill={p.color} opacity="0.85">
            <animate attributeName="r" values="8;10;8" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle r={5} fill="url(#grad-magic)" />
          <circle r={2.5} fill="white" opacity="0.9" />
          {/* Orbiting dot */}
          <circle cx={8 * Math.cos(tick * 0.1)} cy={8 * Math.sin(tick * 0.1)} r={2} fill="white" opacity="0.7" />
        </g>
      );

    case 'shadow':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={12} fill="#0f172a" opacity="0.4">
            <animate attributeName="r" values="12;15;12" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle r={7} fill="#1e1e2e" opacity="0.95">
            <animate attributeName="opacity" values="0.95;0.7;0.95" dur="0.4s" repeatCount="indefinite" />
          </circle>
          <circle r={4} fill={p.color} opacity="0.6" />
          <circle r={2} fill="#6b7280" opacity="0.8" />
        </g>
      );

    case 'void':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={14} fill="#0f172a" stroke={p.color} strokeWidth="2" opacity="0.6">
            <animate attributeName="r" values="14;18;14" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle r={8} fill="#0f172a" stroke={p.color} strokeWidth="1.5" />
          <circle r={5} fill={p.color} opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="0.6s" repeatCount="indefinite" />
          </circle>
          <circle r={2} fill={p.color} opacity="0.9" />
        </g>
      );

    case 'holy':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={14} fill="#fef9c3" opacity="0.2">
            <animate attributeName="r" values="14;18;14" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle r={8} fill="#fef08a" opacity="0.95">
            <animate attributeName="opacity" values="0.95;1;0.95" dur="0.4s" repeatCount="indefinite" />
          </circle>
          <circle r={5} fill="#fcd34d" />
          <circle r={2.5} fill="white" opacity="0.95" />
          {/* Cross */}
          <line x1={0} y1={-6} x2={0} y2={6} stroke="white" strokeWidth="1.5" opacity="0.5" />
          <line x1={-6} y1={0} x2={6} y2={0} stroke="white" strokeWidth="1.5" opacity="0.5" />
        </g>
      );

    case 'dark':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={13} fill="#1e1e2e" opacity="0.3">
            <animate attributeName="r" values="13;17;13" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle r={8} fill="#0f0f1a" opacity="0.95">
            <animate attributeName="r" values="8;9.5;8" dur="0.45s" repeatCount="indefinite" />
          </circle>
          <circle r={5} fill={p.color} opacity="0.6" />
          <circle r={2} fill={p.color} opacity="0.9" />
        </g>
      );

    case 'vortex': {
      const vRot = tick * 32;
      return (
        <g transform={`translate(${px}, ${py}) rotate(${vRot})`}>
          <circle r={18} fill="none" stroke={p.color} strokeWidth="1.5" opacity="0.2" strokeDasharray="5 3">
            <animate attributeName="r" values="18;12;18" dur="0.7s" repeatCount="indefinite" />
          </circle>
          <circle r={13} fill="none" stroke={p.color} strokeWidth="2" opacity="0.4" strokeDasharray="4 3">
            <animate attributeName="r" values="13;8;13" dur="0.55s" repeatCount="indefinite" />
          </circle>
          <path d="M 0,-9 Q 9,0 0,9 Q -9,0 0,-9" fill="none" stroke={p.color} strokeWidth="2.5" opacity="0.85">
            <animate attributeName="d" values="M 0,-9 Q 9,0 0,9 Q -9,0 0,-9; M 0,-7 Q 7,0 0,7 Q -7,0 0,-7; M 0,-9 Q 9,0 0,9 Q -9,0 0,-9" dur="0.5s" repeatCount="indefinite" />
          </path>
          <circle r={5} fill={p.color} opacity="0.9" />
          <circle r={2.5} fill="white" opacity="0.95" />
        </g>
      );
    }

    case 'arrow_classic':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <line x1={-14} y1={0} x2={8} y2={0} stroke={p.color} strokeWidth="2.5" />
          <path d="M 8,0 L -7,6 L -3,0 L -7,-6 Z" fill={p.color} />
          <line x1={-7} y1={-4} x2={-7} y2={4} stroke={p.color} strokeWidth="2" />
          <line x1={-10} y1={-3} x2={-10} y2={3} stroke={p.color} strokeWidth="1.5" opacity="0.6" />
        </g>
      );

    case 'needle':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <line x1={-14} y1={0} x2={8} y2={0} stroke={p.color} strokeWidth="2.5" />
          <circle r={2.5} fill={p.color} cx={-12} cy={0} />
          <circle r={2} fill="white" opacity="0.7" cx={8} cy={0} />
        </g>
      );

    case 'spike':
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <line x1={-12} y1={0} x2={-4} y2={0} stroke={p.color} strokeWidth="3" />
          <polygon points="8,0 -4,5 -4,-5" fill={p.color} />
          <line x1={-12} y1={0} x2={-4} y2={0} stroke="white" strokeWidth="1" opacity="0.3" />
        </g>
      );

    case 'orb':
      return (
        <g transform={`translate(${px}, ${py})`}>
          <circle r={13} fill={p.color} opacity="0.15">
            <animate attributeName="r" values="13;17;13" dur="0.55s" repeatCount="indefinite" />
          </circle>
          <circle r={8} fill={p.color} opacity="0.9">
            <animate attributeName="r" values="8;10;8" dur="0.5s" repeatCount="indefinite" />
          </circle>
          <circle r={5} fill="white" opacity="0.45" />
          <circle r={2} fill="white" opacity="0.9" />
        </g>
      );

    default:
      return (
        <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
          <rect x={-8} y={-3} width={14} height={6} rx={3} fill={p.color} />
          <rect x={-8} y={-1.5} width={14} height={3} fill="white" opacity="0.25" />
          <line x1={-18} y1={0} x2={-10} y2={0} stroke={p.color} strokeWidth="1.5" opacity="0.4" />
        </g>
      );
  }
};

export const ProjectileRenderer: React.FC<ProjectileRendererProps> = ({ projectile, tileSize, tick }) => {
  return (
    // geometricPrecision keeps smooth SVG antialiasing; crispEdges was making diagonals look stepped
    <g style={{ shapeRendering: 'geometricPrecision' }}>
      {renderProjectile(projectile, tileSize, tick)}
    </g>
  );
};
