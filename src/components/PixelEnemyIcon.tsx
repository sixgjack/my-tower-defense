// src/components/PixelEnemyIcon.tsx
import React from 'react';

interface Props {
  name: string;
  size?: number;
  color: string;
}

// Derive a darker shade (shadow) and lighter shade (highlight) from a hex color
const shadeDark = (hex: string): string => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 50);
  const g = Math.max(0, ((n >> 8) & 0xff) - 50);
  const b = Math.max(0, (n & 0xff) - 50);
  return `rgb(${r},${g},${b})`;
};

const shadeLight = (hex: string): string => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 60);
  const g = Math.min(255, ((n >> 8) & 0xff) + 60);
  const b = Math.min(255, (n & 0xff) + 60);
  return `rgb(${r},${g},${b})`;
};

export const PixelEnemyIcon: React.FC<Props> = ({ name, size = 36, color }) => {
  const dark = shadeDark(color.startsWith('#') ? color : '#888888');
  const light = shadeLight(color.startsWith('#') ? color : '#888888');

  const renderEnemy = () => {
    switch (name) {
      // ── SMALL / FAST ────────────────────────────────────────────────────────

      case 'Bug':
        return (
          <g>
            {/* Oval body */}
            <ellipse cx={18} cy={20} rx={8} ry={10} fill={color} />
            <ellipse cx={18} cy={20} rx={8} ry={10} fill={dark} fillOpacity={0.25} />
            {/* Left legs */}
            <rect x={4} y={14} width={6} height={2} fill={dark} />
            <rect x={4} y={19} width={6} height={2} fill={dark} />
            <rect x={4} y={24} width={6} height={2} fill={dark} />
            {/* Right legs */}
            <rect x={26} y={14} width={6} height={2} fill={dark} />
            <rect x={26} y={19} width={6} height={2} fill={dark} />
            <rect x={26} y={24} width={6} height={2} fill={dark} />
            {/* Antennae */}
            <rect x={14} y={6} width={2} height={6} fill={dark} transform="rotate(-15,15,12)" />
            <rect x={20} y={6} width={2} height={6} fill={dark} transform="rotate(15,21,12)" />
            {/* Highlight */}
            <rect x={13} y={13} width={5} height={3} fill={light} fillOpacity={0.4} />
          </g>
        );

      case 'Spider':
        return (
          <g>
            {/* Round body */}
            <rect x={12} y={12} width={12} height={12} fill={color} />
            <rect x={10} y={14} width={16} height={8} fill={color} />
            {/* Highlight */}
            <rect x={13} y={13} width={5} height={3} fill={light} fillOpacity={0.4} />
            {/* Left legs — 4 thick diagonal */}
            <rect x={2} y={10} width={10} height={3} fill={dark} transform="rotate(30,7,11)" />
            <rect x={2} y={16} width={10} height={3} fill={dark} transform="rotate(10,7,17)" />
            <rect x={2} y={20} width={10} height={3} fill={dark} transform="rotate(-10,7,21)" />
            <rect x={2} y={26} width={10} height={3} fill={dark} transform="rotate(-30,7,27)" />
            {/* Right legs */}
            <rect x={24} y={10} width={10} height={3} fill={dark} transform="rotate(-30,29,11)" />
            <rect x={24} y={16} width={10} height={3} fill={dark} transform="rotate(-10,29,17)" />
            <rect x={24} y={20} width={10} height={3} fill={dark} transform="rotate(10,29,21)" />
            <rect x={24} y={26} width={10} height={3} fill={dark} transform="rotate(30,29,27)" />
            {/* Eyes */}
            <rect x={14} y={15} width={2} height={2} fill={light} />
            <rect x={20} y={15} width={2} height={2} fill={light} />
          </g>
        );

      case 'Mite':
        return (
          <g>
            {/* Tiny oval body */}
            <rect x={11} y={13} width={14} height={10} fill={color} />
            <rect x={13} y={11} width={10} height={14} fill={color} />
            {/* Highlight */}
            <rect x={13} y={12} width={4} height={3} fill={light} fillOpacity={0.5} />
            {/* Left mandible */}
            <rect x={4} y={17} width={8} height={3} fill={dark} />
            <rect x={2} y={15} width={5} height={2} fill={dark} />
            {/* Right mandible */}
            <rect x={24} y={17} width={8} height={3} fill={dark} />
            <rect x={29} y={15} width={5} height={2} fill={dark} />
            {/* Shadow edge */}
            <rect x={18} y={13} width={7} height={10} fill={dark} fillOpacity={0.2} />
          </g>
        );

      case 'Fly':
        return (
          <g>
            {/* Oval body */}
            <rect x={13} y={16} width={10} height={12} fill={color} />
            <rect x={11} y={18} width={14} height={8} fill={color} />
            {/* Left wing — parallelogram */}
            <polygon points="2,8 14,8 12,18 0,18" fill={light} fillOpacity={0.7} />
            {/* Right wing */}
            <polygon points="22,8 34,8 36,18 24,18" fill={light} fillOpacity={0.7} />
            {/* Head */}
            <rect x={15} y={12} width={6} height={6} fill={color} />
            {/* Eyes */}
            <rect x={14} y={13} width={2} height={2} fill={light} />
            <rect x={20} y={13} width={2} height={2} fill={light} />
            {/* Shadow */}
            <rect x={19} y={16} width={4} height={12} fill={dark} fillOpacity={0.25} />
          </g>
        );

      case 'Worm':
        return (
          <g>
            {/* Segment 1 — head */}
            <rect x={20} y={4} width={10} height={8} fill={color} />
            {/* Segment 2 */}
            <rect x={14} y={12} width={10} height={8} fill={color} />
            {/* Segment 3 */}
            <rect x={18} y={20} width={10} height={8} fill={color} />
            {/* Segment 4 — tail */}
            <rect x={12} y={28} width={10} height={6} fill={color} />
            {/* Segment dividers */}
            <rect x={20} y={11} width={10} height={2} fill={dark} fillOpacity={0.35} />
            <rect x={14} y={19} width={10} height={2} fill={dark} fillOpacity={0.35} />
            <rect x={18} y={27} width={10} height={2} fill={dark} fillOpacity={0.35} />
            {/* Head eye */}
            <rect x={22} y={6} width={2} height={2} fill={light} />
            {/* Highlights */}
            <rect x={21} y={5} width={4} height={2} fill={light} fillOpacity={0.4} />
          </g>
        );

      case 'Snake':
        return (
          <g>
            {/* Head */}
            <rect x={22} y={4} width={10} height={7} fill={color} />
            {/* Body diagonal 1 */}
            <rect x={12} y={10} width={14} height={6} fill={color} transform="rotate(-10,19,13)" />
            {/* Body diagonal 2 */}
            <rect x={18} y={18} width={14} height={6} fill={color} transform="rotate(10,25,21)" />
            {/* Tail */}
            <rect x={8} y={26} width={12} height={5} fill={color} transform="rotate(-10,14,28)" />
            {/* Forked tongue */}
            <rect x={30} y={6} width={4} height={2} fill={light} />
            <rect x={33} y={4} width={2} height={2} fill={light} />
            <rect x={33} y={8} width={2} height={2} fill={light} />
            {/* Eye */}
            <rect x={24} y={5} width={2} height={2} fill={dark} />
            {/* Shadow */}
            <rect x={28} y={4} width={4} height={7} fill={dark} fillOpacity={0.25} />
          </g>
        );

      case 'Swift':
        return (
          <g>
            {/* Aerodynamic diamond body */}
            <polygon points="18,4 30,18 18,28 6,18" fill={color} />
            {/* Speed lines left */}
            <rect x={0} y={14} width={8} height={2} fill={light} fillOpacity={0.7} />
            <rect x={0} y={18} width={6} height={2} fill={light} fillOpacity={0.5} />
            <rect x={0} y={22} width={4} height={2} fill={light} fillOpacity={0.3} />
            {/* Speed lines right */}
            <rect x={28} y={14} width={8} height={2} fill={light} fillOpacity={0.7} />
            <rect x={30} y={18} width={6} height={2} fill={light} fillOpacity={0.5} />
            <rect x={32} y={22} width={4} height={2} fill={light} fillOpacity={0.3} />
            {/* Highlight */}
            <rect x={14} y={8} width={6} height={4} fill={light} fillOpacity={0.4} />
            {/* Shadow edge */}
            <polygon points="18,4 30,18 18,28" fill={dark} fillOpacity={0.2} />
          </g>
        );

      // ── CYBER / TECH ─────────────────────────────────────────────────────────

      case 'Glitch':
        return (
          <g>
            {/* Main block */}
            <rect x={8} y={10} width={20} height={20} fill={color} />
            {/* Glitch offset duplicate */}
            <rect x={14} y={8} width={20} height={20} fill={color} fillOpacity={0.5} />
            {/* Glitch scan lines */}
            <rect x={8} y={14} width={26} height={2} fill={dark} fillOpacity={0.5} />
            <rect x={8} y={20} width={26} height={2} fill={dark} fillOpacity={0.5} />
            <rect x={8} y={26} width={26} height={2} fill={dark} fillOpacity={0.5} />
            {/* Offset highlight */}
            <rect x={14} y={8} width={8} height={3} fill={light} fillOpacity={0.5} />
            {/* Main highlight */}
            <rect x={9} y={11} width={7} height={3} fill={light} fillOpacity={0.4} />
          </g>
        );

      case 'Drone':
        return (
          <g>
            {/* Hexagonal body */}
            <polygon points="18,8 26,12 26,22 18,26 10,22 10,12" fill={color} />
            {/* Left propeller blades */}
            <rect x={2} y={4} width={8} height={3} fill={dark} transform="rotate(-45,6,5)" />
            <rect x={2} y={4} width={8} height={3} fill={dark} transform="rotate(45,6,5)" />
            {/* Right propeller blades */}
            <rect x={26} y={4} width={8} height={3} fill={dark} transform="rotate(-45,30,5)" />
            <rect x={26} y={4} width={8} height={3} fill={dark} transform="rotate(45,30,5)" />
            {/* Bottom propeller blades */}
            <rect x={2} y={28} width={8} height={3} fill={dark} transform="rotate(-45,6,29)" />
            <rect x={2} y={28} width={8} height={3} fill={dark} transform="rotate(45,6,29)" />
            <rect x={26} y={28} width={8} height={3} fill={dark} transform="rotate(-45,30,29)" />
            <rect x={26} y={28} width={8} height={3} fill={dark} transform="rotate(45,30,29)" />
            {/* Sensor eye */}
            <rect x={15} y={14} width={6} height={4} fill={light} fillOpacity={0.8} />
            {/* Highlight */}
            <rect x={11} y={9} width={6} height={3} fill={light} fillOpacity={0.4} />
          </g>
        );

      case 'Hacker':
        return (
          <g>
            {/* Head circle */}
            <rect x={13} y={2} width={10} height={10} fill={color} />
            <rect x={11} y={4} width={14} height={6} fill={color} />
            {/* Body rect */}
            <rect x={10} y={12} width={16} height={14} fill={color} />
            {/* Tool arm left */}
            <rect x={4} y={14} width={6} height={3} fill={dark} />
            <rect x={2} y={10} width={4} height={8} fill={dark} />
            {/* Right arm */}
            <rect x={26} y={14} width={6} height={3} fill={color} fillOpacity={0.7} />
            {/* Legs */}
            <rect x={10} y={26} width={6} height={8} fill={dark} />
            <rect x={20} y={26} width={6} height={8} fill={dark} />
            {/* Eye */}
            <rect x={14} y={5} width={2} height={2} fill={light} />
            <rect x={20} y={5} width={2} height={2} fill={light} />
            {/* Highlight */}
            <rect x={11} y={3} width={5} height={3} fill={light} fillOpacity={0.4} />
          </g>
        );

      case 'Crawler':
        return (
          <g>
            {/* Crab body */}
            <rect x={8} y={14} width={20} height={10} fill={color} />
            <rect x={10} y={12} width={16} height={14} fill={color} />
            {/* Front claws */}
            <rect x={2} y={10} width={8} height={4} fill={dark} />
            <rect x={2} y={8} width={4} height={4} fill={dark} />
            <rect x={26} y={10} width={8} height={4} fill={dark} />
            <rect x={30} y={8} width={4} height={4} fill={dark} />
            {/* Back legs */}
            <rect x={4} y={20} width={6} height={3} fill={dark} />
            <rect x={4} y={24} width={5} height={3} fill={dark} transform="rotate(20,7,25)" />
            <rect x={26} y={20} width={6} height={3} fill={dark} />
            <rect x={27} y={24} width={5} height={3} fill={dark} transform="rotate(-20,29,25)" />
            {/* Eyes */}
            <rect x={13} y={14} width={3} height={3} fill={light} />
            <rect x={20} y={14} width={3} height={3} fill={light} />
            {/* Shell highlight */}
            <rect x={11} y={13} width={7} height={3} fill={light} fillOpacity={0.35} />
          </g>
        );

      case 'Virus':
        return (
          <g>
            {/* Circle body */}
            <rect x={12} y={10} width={12} height={16} fill={color} />
            <rect x={10} y={12} width={16} height={12} fill={color} />
            {/* 8 spike rects radiating out */}
            <rect x={17} y={2} width={2} height={8} fill={color} />
            <rect x={17} y={26} width={2} height={8} fill={color} />
            <rect x={2} y={17} width={8} height={2} fill={color} />
            <rect x={26} y={17} width={8} height={2} fill={color} />
            {/* Diagonal spikes */}
            <rect x={6} y={6} width={8} height={2} fill={color} transform="rotate(45,10,7)" />
            <rect x={22} y={6} width={8} height={2} fill={color} transform="rotate(-45,26,7)" />
            <rect x={6} y={28} width={8} height={2} fill={color} transform="rotate(-45,10,29)" />
            <rect x={22} y={28} width={8} height={2} fill={color} transform="rotate(45,26,29)" />
            {/* Center highlight */}
            <rect x={13} y={11} width={6} height={4} fill={light} fillOpacity={0.4} />
            {/* Shadow side */}
            <rect x={18} y={10} width={6} height={16} fill={dark} fillOpacity={0.2} />
          </g>
        );

      case 'Malware':
        return (
          <g>
            {/* Armored beetle — segmented plates */}
            {/* Head plate */}
            <rect x={10} y={4} width={16} height={8} fill={color} />
            {/* Body plate 1 */}
            <rect x={8} y={11} width={20} height={7} fill={color} />
            {/* Body plate 2 */}
            <rect x={8} y={17} width={20} height={7} fill={color} />
            {/* Tail plate */}
            <rect x={10} y={23} width={16} height={7} fill={color} />
            {/* Segment lines */}
            <rect x={8} y={11} width={20} height={2} fill={dark} fillOpacity={0.4} />
            <rect x={8} y={17} width={20} height={2} fill={dark} fillOpacity={0.4} />
            <rect x={8} y={23} width={20} height={2} fill={dark} fillOpacity={0.4} />
            {/* Side armor */}
            <rect x={4} y={12} width={4} height={16} fill={dark} />
            <rect x={28} y={12} width={4} height={16} fill={dark} />
            {/* Head highlight */}
            <rect x={11} y={5} width={8} height={3} fill={light} fillOpacity={0.4} />
            {/* Eyes */}
            <rect x={12} y={6} width={3} height={3} fill={light} />
            <rect x={21} y={6} width={3} height={3} fill={light} />
          </g>
        );

      // ── HEAVY ─────────────────────────────────────────────────────────────────

      case 'Tank':
        return (
          <g>
            {/* Body */}
            <rect x={4} y={16} width={28} height={14} fill={color} />
            {/* Turret block */}
            <rect x={10} y={8} width={16} height={10} fill={dark} />
            {/* Barrel */}
            <rect x={22} y={10} width={10} height={4} fill={dark} />
            {/* Tread lines — bottom */}
            <rect x={4} y={28} width={28} height={4} fill={dark} />
            <rect x={6} y={29} width={3} height={3} fill={light} fillOpacity={0.3} />
            <rect x={11} y={29} width={3} height={3} fill={light} fillOpacity={0.3} />
            <rect x={16} y={29} width={3} height={3} fill={light} fillOpacity={0.3} />
            <rect x={21} y={29} width={3} height={3} fill={light} fillOpacity={0.3} />
            <rect x={26} y={29} width={3} height={3} fill={light} fillOpacity={0.3} />
            {/* Highlight */}
            <rect x={5} y={17} width={10} height={3} fill={light} fillOpacity={0.3} />
          </g>
        );

      case 'Brute':
        return (
          <g>
            {/* Wide shoulders */}
            <rect x={2} y={8} width={32} height={10} fill={color} />
            {/* Body */}
            <rect x={8} y={16} width={20} height={14} fill={color} />
            {/* Head */}
            <rect x={12} y={2} width={12} height={8} fill={color} />
            {/* Left fist */}
            <rect x={0} y={18} width={8} height={8} fill={dark} />
            {/* Right fist */}
            <rect x={28} y={18} width={8} height={8} fill={dark} />
            {/* Legs */}
            <rect x={8} y={28} width={8} height={6} fill={dark} />
            <rect x={20} y={28} width={8} height={6} fill={dark} />
            {/* Highlight */}
            <rect x={3} y={9} width={10} height={3} fill={light} fillOpacity={0.35} />
            {/* Eyes */}
            <rect x={14} y={4} width={3} height={3} fill={light} />
            <rect x={19} y={4} width={3} height={3} fill={light} />
          </g>
        );

      case 'Guardian':
        return (
          <g>
            {/* Pointed helmet */}
            <polygon points="18,0 22,2 22,10 14,10 14,2" fill={color} />
            {/* Head */}
            <rect x={13} y={8} width={10} height={8} fill={color} />
            {/* Body / armor */}
            <rect x={10} y={16} width={16} height={16} fill={color} />
            {/* Shield on left side */}
            <rect x={2} y={14} width={8} height={14} fill={dark} />
            <rect x={3} y={15} width={6} height={3} fill={light} fillOpacity={0.35} />
            {/* Sword on right */}
            <rect x={28} y={8} width={3} height={20} fill={light} fillOpacity={0.7} />
            <rect x={26} y={12} width={7} height={2} fill={light} fillOpacity={0.5} />
            {/* Highlight */}
            <rect x={11} y={17} width={7} height={3} fill={light} fillOpacity={0.3} />
            {/* Visor slit */}
            <rect x={14} y={12} width={8} height={2} fill={dark} fillOpacity={0.6} />
          </g>
        );

      case 'Trojan':
        return (
          <g>
            {/* Horse body rect */}
            <rect x={6} y={14} width={24} height={14} fill={color} />
            {/* Neck */}
            <rect x={22} y={6} width={8} height={12} fill={color} />
            {/* Head */}
            <rect x={24} y={2} width={10} height={8} fill={color} />
            {/* Legs */}
            <rect x={8} y={26} width={4} height={8} fill={dark} />
            <rect x={14} y={26} width={4} height={8} fill={dark} />
            <rect x={20} y={26} width={4} height={8} fill={dark} />
            <rect x={26} y={26} width={4} height={8} fill={dark} />
            {/* Tail */}
            <polygon points="6,16 0,12 4,22" fill={dark} />
            {/* Snout */}
            <rect x={32} y={4} width={4} height={4} fill={dark} />
            {/* Eye */}
            <rect x={26} y={3} width={2} height={2} fill={light} />
            {/* Highlight */}
            <rect x={7} y={15} width={10} height={3} fill={light} fillOpacity={0.3} />
          </g>
        );

      // ── SPECIAL / ABILITY ─────────────────────────────────────────────────────

      case 'Ghost':
        return (
          <g>
            {/* Rounded top oval */}
            <rect x={8} y={6} width={20} height={20} fill={color} />
            <rect x={10} y={4} width={16} height={6} fill={color} />
            {/* Wavy bottom — 3 points */}
            <polygon points="8,26 14,26 11,34 8,34" fill={color} />
            <polygon points="14,26 22,26 18,34" fill={color} />
            <polygon points="22,26 28,26 25,34 22,34" fill={color} />
            {/* Eye holes */}
            <rect x={12} y={12} width={4} height={5} fill={dark} fillOpacity={0.7} />
            <rect x={20} y={12} width={4} height={5} fill={dark} fillOpacity={0.7} />
            {/* Highlight */}
            <rect x={11} y={5} width={8} height={4} fill={light} fillOpacity={0.45} />
          </g>
        );

      case 'Teleporter':
        return (
          <g>
            {/* Portal oval */}
            <polygon points="18,4 28,8 32,18 28,28 18,32 8,28 4,18 8,8" fill={color} fillOpacity={0.4} stroke={color} strokeWidth={2} />
            {/* Star inside */}
            <polygon points="18,8 19,14 25,12 21,17 25,22 19,20 18,26 17,20 11,22 15,17 11,12 17,14" fill={color} />
            {/* Center */}
            <rect x={16} y={16} width={4} height={4} fill={light} fillOpacity={0.7} />
            {/* Highlight */}
            <rect x={10} y={7} width={7} height={3} fill={light} fillOpacity={0.4} />
          </g>
        );

      case 'Summoner':
        return (
          <g>
            {/* Crystal ball */}
            <rect x={10} y={10} width={16} height={16} fill={color} fillOpacity={0.6} />
            <rect x={8} y={12} width={20} height={12} fill={color} fillOpacity={0.6} />
            {/* Orbit lines */}
            <rect x={4} y={17} width={28} height={2} fill={color} fillOpacity={0.8} />
            <rect x={17} y={4} width={2} height={28} fill={color} fillOpacity={0.8} />
            <rect x={8} y={8} width={20} height={2} fill={color} fillOpacity={0.6} transform="rotate(45,18,9)" />
            <rect x={8} y={8} width={20} height={2} fill={color} fillOpacity={0.6} transform="rotate(-45,18,9)" />
            {/* Center glow */}
            <rect x={15} y={15} width={6} height={6} fill={light} fillOpacity={0.7} />
            {/* Highlight */}
            <rect x={11} y={11} width={7} height={4} fill={light} fillOpacity={0.5} />
          </g>
        );

      case 'Phantom':
        return (
          <g>
            {/* Same as Ghost but with void center */}
            <rect x={8} y={6} width={20} height={20} fill={color} fillOpacity={0.7} />
            <rect x={10} y={4} width={16} height={6} fill={color} fillOpacity={0.7} />
            {/* Wavy bottom */}
            <polygon points="8,26 14,26 11,34 8,34" fill={color} fillOpacity={0.7} />
            <polygon points="14,26 22,26 18,34" fill={color} fillOpacity={0.7} />
            <polygon points="22,26 28,26 25,34 22,34" fill={color} fillOpacity={0.7} />
            {/* Cut-out eye holes */}
            <rect x={11} y={11} width={5} height={6} fill="black" fillOpacity={0.8} />
            <rect x={20} y={11} width={5} height={6} fill="black" fillOpacity={0.8} />
            {/* Void center */}
            <rect x={14} y={18} width={8} height={6} fill="black" fillOpacity={0.6} />
            {/* Highlight edge */}
            <rect x={11} y={5} width={8} height={3} fill={light} fillOpacity={0.3} />
          </g>
        );

      case 'Wraith':
        return (
          <g>
            {/* Flowing cape body — wide top */}
            <polygon points="6,4 30,4 34,28 18,34 2,28" fill={color} fillOpacity={0.8} />
            {/* Void center cut-out */}
            <polygon points="14,12 22,12 24,24 18,28 12,24" fill="black" fillOpacity={0.7} />
            {/* Hood top */}
            <rect x={12} y={2} width={12} height={6} fill={color} />
            {/* Highlight */}
            <rect x={8} y={5} width={10} height={3} fill={light} fillOpacity={0.35} />
            {/* Glowing eyes */}
            <rect x={14} y={8} width={3} height={3} fill={light} fillOpacity={0.9} />
            <rect x={19} y={8} width={3} height={3} fill={light} fillOpacity={0.9} />
          </g>
        );

      // ── BOSSES ──────────────────────────────────────────────────────────────

      case 'Titan':
        return (
          <g>
            {/* Wide armored body */}
            <rect x={4} y={14} width={28} height={18} fill={color} />
            {/* Shoulder pads */}
            <rect x={0} y={12} width={10} height={8} fill={dark} />
            <rect x={26} y={12} width={10} height={8} fill={dark} />
            {/* Horned helmet */}
            <rect x={11} y={4} width={14} height={12} fill={color} />
            <polygon points="12,4 8,0 14,6" fill={dark} />
            <polygon points="24,4 28,0 22,6" fill={dark} />
            {/* Visor */}
            <rect x={13} y={8} width={10} height={4} fill={dark} fillOpacity={0.7} />
            {/* Legs */}
            <rect x={6} y={30} width={8} height={6} fill={dark} />
            <rect x={22} y={30} width={8} height={6} fill={dark} />
            {/* Highlight */}
            <rect x={5} y={15} width={12} height={3} fill={light} fillOpacity={0.3} />
          </g>
        );

      case 'Behemoth':
        return (
          <g>
            {/* Massive oval body */}
            <rect x={4} y={10} width={28} height={22} fill={color} />
            <rect x={2} y={12} width={32} height={18} fill={color} />
            {/* Head */}
            <rect x={10} y={4} width={16} height={10} fill={color} />
            {/* Huge left fist */}
            <rect x={0} y={16} width={10} height={12} fill={dark} />
            {/* Huge right fist */}
            <rect x={26} y={16} width={10} height={12} fill={dark} />
            {/* Jaw */}
            <rect x={12} y={10} width={12} height={4} fill={dark} fillOpacity={0.5} />
            {/* Eyes */}
            <rect x={12} y={5} width={4} height={4} fill={light} />
            <rect x={20} y={5} width={4} height={4} fill={light} />
            {/* Highlight */}
            <rect x={3} y={11} width={12} height={4} fill={light} fillOpacity={0.3} />
          </g>
        );

      case 'Dragon':
        return (
          <g>
            {/* Body */}
            <rect x={8} y={14} width={20} height={14} fill={color} />
            {/* Lizard head */}
            <rect x={22} y={8} width={12} height={10} fill={color} />
            <rect x={28} y={12} width={6} height={4} fill={dark} />
            {/* Left wing triangle */}
            <polygon points="8,14 0,2 12,12" fill={color} fillOpacity={0.8} />
            {/* Right wing triangle (merged into body top) */}
            <polygon points="28,14 36,2 24,12" fill={color} fillOpacity={0.8} />
            {/* Tail */}
            <polygon points="8,20 0,24 8,28" fill={dark} />
            {/* Legs */}
            <rect x={10} y={26} width={6} height={6} fill={dark} />
            <rect x={22} y={26} width={6} height={6} fill={dark} />
            {/* Eye */}
            <rect x={26} y={9} width={3} height={3} fill={light} />
            {/* Highlight */}
            <rect x={9} y={15} width={8} height={3} fill={light} fillOpacity={0.35} />
          </g>
        );

      case 'Colossus':
        return (
          <g>
            {/* Tall pillar body */}
            <rect x={12} y={4} width={12} height={28} fill={color} />
            <rect x={8} y={20} width={20} height={12} fill={color} />
            {/* Head */}
            <rect x={13} y={2} width={10} height={6} fill={color} />
            {/* Mechanical arm — right */}
            <rect x={28} y={12} width={8} height={4} fill={dark} />
            <rect x={30} y={8} width={6} height={4} fill={dark} />
            <rect x={34} y={6} width={4} height={8} fill={dark} />
            {/* Left arm */}
            <rect x={0} y={12} width={8} height={4} fill={dark} />
            {/* Chest detail */}
            <rect x={14} y={14} width={8} height={6} fill={dark} fillOpacity={0.4} />
            {/* Legs */}
            <rect x={10} y={30} width={6} height={6} fill={dark} />
            <rect x={20} y={30} width={6} height={6} fill={dark} />
            {/* Highlight */}
            <rect x={13} y={5} width={6} height={3} fill={light} fillOpacity={0.4} />
          </g>
        );

      case 'Tyrant':
        return (
          <g>
            {/* Spiked crown */}
            <polygon points="14,2 16,8 18,2 20,8 22,2 24,8 12,8" fill={color} />
            {/* Head */}
            <rect x={12} y={8} width={12} height={8} fill={color} />
            {/* Spiked shoulders */}
            <polygon points="2,14 10,14 6,8" fill={dark} />
            <polygon points="34,14 26,14 30,8" fill={dark} />
            {/* Body */}
            <rect x={8} y={14} width={20} height={16} fill={color} />
            {/* Angular chest */}
            <polygon points="8,14 28,14 24,22 12,22" fill={dark} fillOpacity={0.3} />
            {/* Legs */}
            <rect x={8} y={28} width={8} height={8} fill={dark} />
            <rect x={20} y={28} width={8} height={8} fill={dark} />
            {/* Eye glow */}
            <rect x={14} y={10} width={4} height={3} fill={light} />
            <rect x={18} y={10} width={4} height={3} fill={light} />
            {/* Highlight */}
            <rect x={9} y={15} width={8} height={3} fill={light} fillOpacity={0.3} />
          </g>
        );

      case 'Warlord':
        return (
          <g>
            {/* Helmet */}
            <rect x={11} y={2} width={14} height={10} fill={color} />
            <polygon points="11,6 6,2 10,10" fill={dark} />
            {/* Body */}
            <rect x={8} y={12} width={20} height={18} fill={color} />
            {/* Sword left */}
            <rect x={2} y={8} width={3} height={22} fill={light} fillOpacity={0.8} />
            <rect x={0} y={14} width={7} height={2} fill={light} fillOpacity={0.5} />
            {/* Shield right */}
            <rect x={29} y={10} width={7} height={14} fill={dark} />
            <rect x={30} y={11} width={5} height={3} fill={light} fillOpacity={0.3} />
            {/* Legs */}
            <rect x={10} y={28} width={6} height={6} fill={dark} />
            <rect x={20} y={28} width={6} height={6} fill={dark} />
            {/* Visor */}
            <rect x={13} y={6} width={10} height={3} fill={dark} fillOpacity={0.6} />
            {/* Highlight */}
            <rect x={9} y={13} width={8} height={3} fill={light} fillOpacity={0.3} />
          </g>
        );

      // ── ADDITIONAL NOTABLE ENEMIES ────────────────────────────────────────────

      case 'Necromancer':
        return (
          <g>
            {/* Robe body */}
            <polygon points="18,34 4,34 8,14 28,14 32,34" fill={color} />
            {/* Torso */}
            <rect x={12} y={10} width={12} height={8} fill={color} />
            {/* Hooded head */}
            <rect x={11} y={2} width={14} height={10} fill={dark} />
            <polygon points="11,2 8,0 14,8" fill={dark} />
            <polygon points="25,2 28,0 22,8" fill={dark} />
            {/* Staff */}
            <rect x={30} y={2} width={2} height={30} fill={dark} />
            <polygon points="29,2 33,2 31,6" fill={light} fillOpacity={0.7} />
            {/* Eyes glow */}
            <rect x={14} y={5} width={3} height={3} fill={light} />
            <rect x={19} y={5} width={3} height={3} fill={light} />
            {/* Highlight */}
            <rect x={12} y={11} width={6} height={3} fill={light} fillOpacity={0.3} />
          </g>
        );

      case 'Assassin':
      case 'Shadow Assassin':
        return (
          <g>
            {/* Sleek body */}
            <rect x={12} y={10} width={12} height={20} fill={color} fillOpacity={0.9} />
            {/* Head with mask */}
            <rect x={13} y={4} width={10} height={8} fill={dark} />
            {/* Left blade */}
            <polygon points="8,14 12,12 12,22" fill={light} fillOpacity={0.8} />
            {/* Right blade */}
            <polygon points="28,14 24,12 24,22" fill={light} fillOpacity={0.8} />
            {/* Mask visor slit */}
            <rect x={15} y={8} width={6} height={2} fill={light} fillOpacity={0.6} />
            {/* Legs */}
            <rect x={12} y={28} width={5} height={6} fill={dark} />
            <rect x={19} y={28} width={5} height={6} fill={dark} />
            {/* Shadow cloak */}
            <polygon points="12,10 6,18 12,26" fill={dark} fillOpacity={0.4} />
            <polygon points="24,10 30,18 24,26" fill={dark} fillOpacity={0.4} />
          </g>
        );

      case 'Golem':
        return (
          <g>
            {/* Stone body */}
            <rect x={6} y={14} width={24} height={18} fill={color} />
            {/* Stone head */}
            <rect x={10} y={6} width={16} height={10} fill={color} />
            {/* Shoulder slabs */}
            <rect x={2} y={14} width={6} height={10} fill={dark} />
            <rect x={28} y={14} width={6} height={10} fill={dark} />
            {/* Crack lines */}
            <rect x={16} y={14} width={2} height={18} fill={dark} fillOpacity={0.3} />
            <rect x={10} y={20} width={8} height={2} fill={dark} fillOpacity={0.3} />
            {/* Eyes */}
            <rect x={13} y={8} width={4} height={4} fill={light} />
            <rect x={19} y={8} width={4} height={4} fill={light} />
            {/* Legs */}
            <rect x={8} y={30} width={8} height={6} fill={dark} />
            <rect x={20} y={30} width={8} height={6} fill={dark} />
            {/* Highlight */}
            <rect x={7} y={15} width={10} height={3} fill={light} fillOpacity={0.3} />
          </g>
        );

      case 'Overlord':
        return (
          <g>
            {/* Crown of spikes */}
            <polygon points="8,8 10,2 13,8 16,0 19,8 22,0 25,8 28,2 30,8" fill={color} />
            {/* Wide armored body */}
            <rect x={4} y={8} width={28} height={22} fill={color} />
            {/* Regal shoulders */}
            <rect x={0} y={8} width={6} height={12} fill={dark} />
            <rect x={30} y={8} width={6} height={12} fill={dark} />
            {/* Chest insignia */}
            <polygon points="18,12 22,18 18,24 14,18" fill={dark} fillOpacity={0.5} />
            {/* Glowing eyes */}
            <rect x={12} y={10} width={5} height={5} fill={light} />
            <rect x={19} y={10} width={5} height={5} fill={light} />
            {/* Legs */}
            <rect x={6} y={28} width={8} height={8} fill={dark} />
            <rect x={22} y={28} width={8} height={8} fill={dark} />
            {/* Highlight */}
            <rect x={5} y={9} width={12} height={3} fill={light} fillOpacity={0.3} />
          </g>
        );

      // ── DEFAULT ─────────────────────────────────────────────────────────────

      default:
        return (
          <g>
            {/* Threatening diamond with X mark */}
            <polygon points="18,2 34,18 18,34 2,18" fill={color} />
            {/* X mark */}
            <rect x={11} y={16} width={16} height={4} fill={dark} transform="rotate(45,19,18)" />
            <rect x={11} y={16} width={16} height={4} fill={dark} transform="rotate(-45,19,18)" />
            {/* Highlight */}
            <rect x={11} y={8} width={8} height={4} fill={light} fillOpacity={0.4} />
            {/* Shadow edge */}
            <polygon points="18,2 34,18 18,34" fill={dark} fillOpacity={0.2} />
          </g>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {renderEnemy()}
    </svg>
  );
};
