// src/components/PixelTowerIcon.tsx
import React from 'react';

interface Props {
  towerKey: string;
  size?: number;
  color?: string;
}

const TYPE_COLORS: Record<string, string> = {
  BASIC_RIFLE: '#3b82f6',
  BASIC_CANNON: '#9ca3af',
  BASIC_SNIPER: '#22d3ee',
  BASIC_SHOTGUN: '#f97316',
  BASIC_FREEZE: '#bae6fd',
  BASIC_BURN: '#ef4444',
  BASIC_STUN: '#facc15',
  BASIC_HEAL: '#4ade80',
  MORTAR: '#6b7280',
  CHAIN_LIGHTNING: '#fde047',
  PENETRATOR: '#93c5fd',
  SLOW_FIELD: '#67e8f9',
  HEALER: '#86efac',
  MINE_LAYER: '#92400e',
  MISSILE: '#f43f5e',
  LASER: '#ef4444',
  SUMMONER: '#c084fc',
  EXECUTIONER: '#7f1d1d',
  BANKER: '#fbbf24',
};

export const PixelTowerIcon: React.FC<Props> = ({ towerKey, size = 40, color }) => {
  const fill = color ?? TYPE_COLORS[towerKey] ?? '#64748b';

  // Reusable highlight/shadow rects
  const highlight = <rect x={2} y={2} width={8} height={4} fill="white" fillOpacity={0.10} />;
  const shadow = <rect x={30} y={28} width={8} height={8} fill="black" fillOpacity={0.20} />;

  const renderIcon = () => {
    switch (towerKey) {
      // ── BASIC_RIFLE ─────────────────────────────────────────────────────────
      // Two thick horizontal barrels side-by-side, short base block
      case 'BASIC_RIFLE':
        return (
          <g>
            {/* Base block */}
            <rect x={8} y={26} width={24} height={10} fill={fill} />
            {/* Left barrel */}
            <rect x={9} y={12} width={9} height={14} fill={fill} />
            {/* Right barrel */}
            <rect x={22} y={12} width={9} height={14} fill={fill} />
            {/* Barrel tips */}
            <rect x={9} y={10} width={9} height={3} fill={fill} />
            <rect x={22} y={10} width={9} height={3} fill={fill} />
            {/* Center gap highlight */}
            <rect x={18} y={14} width={4} height={10} fill="black" fillOpacity={0.3} />
            {highlight}
            {shadow}
          </g>
        );

      // ── BASIC_CANNON ─────────────────────────────────────────────────────────
      // Round barrel tube pointing up, thick base, 2 brick supports
      case 'BASIC_CANNON':
        return (
          <g>
            {/* Base plate */}
            <rect x={4} y={30} width={32} height={6} fill={fill} />
            {/* Left support brick */}
            <rect x={6} y={22} width={8} height={10} fill={fill} />
            {/* Right support brick */}
            <rect x={26} y={22} width={8} height={10} fill={fill} />
            {/* Barrel body */}
            <rect x={15} y={8} width={10} height={20} fill={fill} />
            {/* Barrel tip */}
            <rect x={13} y={6} width={14} height={4} fill={fill} />
            {/* Barrel muzzle highlight */}
            <rect x={16} y={6} width={4} height={2} fill="white" fillOpacity={0.25} />
            {/* Barrel shadow inner */}
            <rect x={20} y={8} width={3} height={20} fill="black" fillOpacity={0.2} />
            {highlight}
            {shadow}
          </g>
        );

      // ── BASIC_SNIPER ─────────────────────────────────────────────────────────
      // Very long thin barrel (2px wide, 28px tall), small body base, scope dot
      case 'BASIC_SNIPER':
        return (
          <g>
            {/* Body base */}
            <rect x={12} y={26} width={16} height={10} fill={fill} />
            {/* Barrel — very long, thin */}
            <rect x={19} y={2} width={3} height={25} fill={fill} />
            {/* Scope block */}
            <rect x={14} y={20} width={8} height={4} fill={fill} />
            {/* Scope dot */}
            <rect x={17} y={21} width={2} height={2} fill="white" fillOpacity={0.8} />
            {/* Barrel tip shine */}
            <rect x={19} y={2} width={1} height={3} fill="white" fillOpacity={0.4} />
            {highlight}
            {shadow}
          </g>
        );

      // ── BASIC_SHOTGUN ─────────────────────────────────────────────────────────
      // 3 short barrels in a fan spread
      case 'BASIC_SHOTGUN':
        return (
          <g>
            {/* Base block */}
            <rect x={8} y={28} width={24} height={8} fill={fill} />
            {/* Center barrel */}
            <rect x={18} y={10} width={5} height={18} fill={fill} />
            {/* Left barrel — angled outward via skew using polygon */}
            <polygon points="10,28 14,28 12,10 8,10" fill={fill} />
            {/* Right barrel — mirror */}
            <polygon points="30,28 26,28 28,10 32,10" fill={fill} />
            {/* Muzzle tips */}
            <rect x={8} y={8} width={5} height={3} fill={fill} />
            <rect x={18} y={8} width={5} height={3} fill={fill} />
            <rect x={28} y={8} width={5} height={3} fill={fill} />
            {highlight}
            {shadow}
          </g>
        );

      // ── BASIC_FREEZE ─────────────────────────────────────────────────────────
      // Hexagon body outline, 4 snowflake arm lines radiating out
      case 'BASIC_FREEZE':
        return (
          <g>
            {/* Hexagon body */}
            <polygon points="20,4 32,11 32,25 20,32 8,25 8,11" fill={fill} fillOpacity={0.7} stroke={fill} strokeWidth={2} />
            {/* Snowflake arms — horizontal */}
            <rect x={2} y={18} width={36} height={3} fill={fill} />
            {/* Snowflake arms — vertical */}
            <rect x={18} y={2} width={3} height={36} fill={fill} />
            {/* Snowflake arms — diagonal \ */}
            <rect x={14} y={7} width={3} height={26} fill={fill} transform="rotate(45,20,20)" />
            {/* Snowflake arms — diagonal / */}
            <rect x={14} y={7} width={3} height={26} fill={fill} transform="rotate(-45,20,20)" />
            {/* Center gem */}
            <rect x={17} y={17} width={6} height={6} fill="white" fillOpacity={0.6} />
            {highlight}
            <rect x={30} y={28} width={8} height={8} fill="black" fillOpacity={0.15} />
          </g>
        );

      // ── BASIC_BURN ─────────────────────────────────────────────────────────
      // Vented nozzle body, flame spike shapes at top (3 triangular rects)
      case 'BASIC_BURN':
        return (
          <g>
            {/* Body */}
            <rect x={10} y={18} width={20} height={16} fill={fill} />
            {/* Vents on body */}
            <rect x={12} y={20} width={16} height={2} fill="black" fillOpacity={0.3} />
            <rect x={12} y={25} width={16} height={2} fill="black" fillOpacity={0.3} />
            <rect x={12} y={30} width={16} height={2} fill="black" fillOpacity={0.3} />
            {/* Nozzle tip */}
            <rect x={14} y={12} width={12} height={7} fill={fill} />
            {/* Flame spikes — center */}
            <polygon points="20,2 22,12 18,12" fill="#fbbf24" />
            {/* Flame spikes — left */}
            <polygon points="15,5 17,13 13,13" fill="#fbbf24" fillOpacity={0.8} />
            {/* Flame spikes — right */}
            <polygon points="25,5 27,13 23,13" fill="#fbbf24" fillOpacity={0.8} />
            {highlight}
            {shadow}
          </g>
        );

      // ── BASIC_STUN ─────────────────────────────────────────────────────────
      // Coil rings around a central pole, lightning bolt shape
      case 'BASIC_STUN':
        return (
          <g>
            {/* Central pole */}
            <rect x={18} y={6} width={4} height={28} fill={fill} />
            {/* Base */}
            <rect x={10} y={30} width={20} height={6} fill={fill} />
            {/* Coil rings */}
            <rect x={12} y={10} width={16} height={3} fill={fill} fillOpacity={0.7} />
            <rect x={12} y={16} width={16} height={3} fill={fill} fillOpacity={0.7} />
            <rect x={12} y={22} width={16} height={3} fill={fill} fillOpacity={0.7} />
            {/* Lightning bolt */}
            <polygon points="24,4 18,20 22,20 16,36 26,16 21,16" fill="#fff" fillOpacity={0.85} />
            {highlight}
            {shadow}
          </g>
        );

      // ── BASIC_HEAL ─────────────────────────────────────────────────────────
      // Thick plus/cross shape, circle outline behind it
      case 'BASIC_HEAL':
        return (
          <g>
            {/* Pulse circle outline behind */}
            <rect x={4} y={4} width={32} height={32} fill="none" stroke={fill} strokeWidth={2} strokeOpacity={0.4}
              style={{ rx: 16 }} />
            {/* Horizontal bar of cross */}
            <rect x={6} y={16} width={28} height={8} fill={fill} />
            {/* Vertical bar of cross */}
            <rect x={16} y={6} width={8} height={28} fill={fill} />
            {/* Center highlight */}
            <rect x={18} y={8} width={4} height={4} fill="white" fillOpacity={0.3} />
            {highlight}
            {shadow}
          </g>
        );

      // ── MORTAR ─────────────────────────────────────────────────────────────
      // Short wide tube barrel, heavy base plate, angle indicator line
      case 'MORTAR':
        return (
          <g>
            {/* Heavy base plate */}
            <rect x={2} y={30} width={36} height={7} fill={fill} />
            {/* Thick body */}
            <rect x={8} y={20} width={24} height={12} fill={fill} />
            {/* Short wide barrel */}
            <rect x={13} y={8} width={14} height={14} fill={fill} />
            {/* Barrel bore (dark inner) */}
            <rect x={16} y={8} width={8} height={8} fill="black" fillOpacity={0.45} />
            {/* Angle indicator line */}
            <rect x={24} y={12} width={10} height={2} fill="white" fillOpacity={0.5} transform="rotate(-30,24,13)" />
            {highlight}
            {shadow}
          </g>
        );

      // ── CHAIN_LIGHTNING ─────────────────────────────────────────────────────
      // Forked lightning Y-shape from a dish emitter
      case 'CHAIN_LIGHTNING':
        return (
          <g>
            {/* Dish emitter base */}
            <rect x={6} y={28} width={28} height={8} fill={fill} />
            {/* Dish curve — approximated with rects */}
            <rect x={8} y={22} width={24} height={8} fill={fill} />
            <rect x={12} y={18} width={16} height={6} fill={fill} />
            {/* Main lightning stem */}
            <rect x={19} y={8} width={3} height={12} fill="#fff" fillOpacity={0.9} />
            {/* Left fork */}
            <polygon points="20,8 14,2 18,8" fill="#fff" fillOpacity={0.9} />
            {/* Right fork */}
            <polygon points="21,8 27,2 23,8" fill="#fff" fillOpacity={0.9} />
            {/* Glow on dish */}
            <rect x={14} y={20} width={12} height={3} fill={fill} fillOpacity={0.5} />
            {highlight}
            {shadow}
          </g>
        );

      // ── PENETRATOR ─────────────────────────────────────────────────────────
      // Very long narrow barrel with penetrator fin shapes
      case 'PENETRATOR':
        return (
          <g>
            {/* Base */}
            <rect x={10} y={28} width={20} height={8} fill={fill} />
            {/* Long narrow barrel */}
            <rect x={18} y={2} width={4} height={27} fill={fill} />
            {/* Fins — left */}
            <polygon points="18,8 10,16 18,20" fill={fill} fillOpacity={0.8} />
            {/* Fins — right */}
            <polygon points="22,8 30,16 22,20" fill={fill} fillOpacity={0.8} />
            {/* Tip */}
            <polygon points="18,2 22,2 20,0" fill="white" fillOpacity={0.6} />
            {highlight}
            {shadow}
          </g>
        );

      // ── SLOW_FIELD ─────────────────────────────────────────────────────────
      // Concentric hexagon rings, spiral center
      case 'SLOW_FIELD':
        return (
          <g>
            {/* Outer hexagon ring */}
            <polygon points="20,2 34,10 34,28 20,36 6,28 6,10" fill="none" stroke={fill} strokeWidth={2} />
            {/* Middle hexagon ring */}
            <polygon points="20,8 29,13 29,25 20,30 11,25 11,13" fill="none" stroke={fill} strokeWidth={2} />
            {/* Inner hexagon fill */}
            <polygon points="20,13 25,16 25,22 20,25 15,22 15,16" fill={fill} fillOpacity={0.5} />
            {/* Spiral center rects */}
            <rect x={18} y={14} width={4} height={4} fill={fill} transform="rotate(20,20,20)" />
            <rect x={18} y={14} width={4} height={4} fill={fill} transform="rotate(70,20,20)" />
            <rect x={18} y={14} width={4} height={4} fill={fill} transform="rotate(120,20,20)" fillOpacity={0.7} />
            {highlight}
            <rect x={30} y={28} width={8} height={8} fill="black" fillOpacity={0.15} />
          </g>
        );

      // ── HEALER ─────────────────────────────────────────────────────────────
      // Medical cross + orbit ring
      case 'HEALER':
        return (
          <g>
            {/* Orbit ring */}
            <polygon points="20,2 38,20 20,38 2,20" fill="none" stroke={fill} strokeWidth={2} strokeOpacity={0.5} />
            {/* Horizontal bar */}
            <rect x={6} y={16} width={28} height={8} fill={fill} />
            {/* Vertical bar */}
            <rect x={16} y={6} width={8} height={28} fill={fill} />
            {/* Corner rounders (decorative) */}
            <rect x={16} y={16} width={8} height={8} fill="white" fillOpacity={0.15} />
            {highlight}
            {shadow}
          </g>
        );

      // ── MINE_LAYER ─────────────────────────────────────────────────────────
      // Mine spiked circle on top of a small base launcher
      case 'MINE_LAYER':
        return (
          <g>
            {/* Launcher base */}
            <rect x={10} y={26} width={20} height={10} fill={fill} />
            {/* Launcher tube */}
            <rect x={16} y={18} width={8} height={10} fill={fill} />
            {/* Mine circle body */}
            <polygon points="20,4 23,8 28,6 26,11 31,13 26,15 28,20 23,18 20,22 17,18 12,20 14,15 9,13 14,11 12,6 17,8" fill={fill} />
            {/* Mine center */}
            <rect x={17} y={11} width={6} height={6} fill="black" fillOpacity={0.4} />
            {highlight}
            {shadow}
          </g>
        );

      // ── MISSILE ─────────────────────────────────────────────────────────────
      // Pointed rocket shape with fins
      case 'MISSILE':
        return (
          <g>
            {/* Launcher base */}
            <rect x={6} y={28} width={28} height={8} fill={fill} />
            {/* Rocket body */}
            <rect x={16} y={12} width={8} height={18} fill={fill} />
            {/* Nose cone */}
            <polygon points="20,2 24,12 16,12" fill={fill} />
            {/* Left fin */}
            <polygon points="16,24 10,32 16,30" fill={fill} fillOpacity={0.85} />
            {/* Right fin */}
            <polygon points="24,24 30,32 24,30" fill={fill} fillOpacity={0.85} />
            {/* Exhaust */}
            <rect x={18} y={30} width={4} height={3} fill="#f97316" fillOpacity={0.8} />
            {/* Nose highlight */}
            <rect x={18} y={4} width={2} height={5} fill="white" fillOpacity={0.35} />
            {highlight}
            {shadow}
          </g>
        );

      // ── LASER ─────────────────────────────────────────────────────────────
      // Dish emitter + laser cone lines spreading forward
      case 'LASER':
        return (
          <g>
            {/* Base */}
            <rect x={4} y={28} width={32} height={8} fill={fill} />
            {/* Dish body */}
            <rect x={8} y={18} width={24} height={12} fill={fill} />
            {/* Dish curve top */}
            <rect x={12} y={14} width={16} height={6} fill={fill} />
            {/* Emitter nub */}
            <rect x={18} y={10} width={4} height={6} fill="white" fillOpacity={0.8} />
            {/* Laser cone — left ray */}
            <polygon points="18,10 4,4 16,10" fill="#fca5a5" fillOpacity={0.7} />
            {/* Laser cone — right ray */}
            <polygon points="22,10 36,4 24,10" fill="#fca5a5" fillOpacity={0.7} />
            {/* Center beam */}
            <rect x={19} y={2} width={2} height={10} fill="white" fillOpacity={0.9} />
            {highlight}
            {shadow}
          </g>
        );

      // ── SUMMONER ─────────────────────────────────────────────────────────
      // Portal oval with arcane star shapes
      case 'SUMMONER':
        return (
          <g>
            {/* Base pedestal */}
            <rect x={10} y={30} width={20} height={6} fill={fill} />
            <rect x={8} y={34} width={24} height={4} fill={fill} />
            {/* Portal oval body */}
            <polygon points="20,4 30,10 34,20 30,30 20,34 10,30 6,20 10,10" fill={fill} fillOpacity={0.3} stroke={fill} strokeWidth={2} />
            {/* Arcane star — 6 points */}
            <polygon points="20,8 21.5,14 28,12 23,17 28,22 21.5,20 20,26 18.5,20 12,22 17,17 12,12 18.5,14" fill={fill} fillOpacity={0.9} />
            {/* Center rune */}
            <rect x={17} y={17} width={6} height={6} fill="white" fillOpacity={0.3} transform="rotate(45,20,20)" />
            {highlight}
            {shadow}
          </g>
        );

      // ── EXECUTIONER ─────────────────────────────────────────────────────
      // Crosshair sight + elongated barrel, skull-like detail
      case 'EXECUTIONER':
        return (
          <g>
            {/* Base */}
            <rect x={8} y={28} width={24} height={8} fill={fill} />
            {/* Long barrel */}
            <rect x={18} y={4} width={4} height={25} fill={fill} />
            {/* Crosshair horizontal */}
            <rect x={10} y={14} width={20} height={2} fill={fill} fillOpacity={0.7} />
            {/* Crosshair vertical tick top */}
            <rect x={19} y={8} width={2} height={5} fill={fill} fillOpacity={0.7} />
            {/* Skull eye sockets */}
            <rect x={13} y={20} width={4} height={3} fill="black" fillOpacity={0.5} />
            <rect x={23} y={20} width={4} height={3} fill="black" fillOpacity={0.5} />
            {/* Scope mount */}
            <rect x={14} y={12} width={12} height={4} fill={fill} />
            {highlight}
            {shadow}
          </g>
        );

      // ── BANKER ─────────────────────────────────────────────────────────────
      // Coin stack shapes, dollar sign
      case 'BANKER':
        return (
          <g>
            {/* Coin stack layers */}
            <rect x={8} y={30} width={24} height={5} fill={fill} />
            <rect x={8} y={30} width={24} height={2} fill="white" fillOpacity={0.2} />
            <rect x={8} y={24} width={24} height={5} fill={fill} />
            <rect x={8} y={24} width={24} height={2} fill="white" fillOpacity={0.15} />
            <rect x={8} y={18} width={24} height={5} fill={fill} />
            <rect x={8} y={18} width={24} height={2} fill="white" fillOpacity={0.1} />
            {/* Dollar sign vertical bar */}
            <rect x={19} y={4} width={3} height={14} fill={fill} />
            {/* Dollar sign S curves — approximated */}
            <rect x={14} y={5} width={12} height={3} fill={fill} />
            <rect x={14} y={11} width={12} height={3} fill={fill} />
            <rect x={14} y={17} width={12} height={3} fill={fill} />
            <rect x={14} y={5} width={3} height={6} fill={fill} />
            <rect x={23} y={11} width={3} height={6} fill={fill} />
            {highlight}
            {shadow}
          </g>
        );

      // ── DEFAULT ─────────────────────────────────────────────────────────────
      default:
        return (
          <g>
            {/* Generic square turret */}
            <rect x={8} y={26} width={24} height={10} fill={fill} />
            <rect x={14} y={16} width={12} height={12} fill={fill} />
            <rect x={18} y={6} width={4} height={12} fill={fill} />
            <rect x={16} y={6} width={8} height={3} fill={fill} />
            {highlight}
            {shadow}
          </g>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {renderIcon()}
    </svg>
  );
};
