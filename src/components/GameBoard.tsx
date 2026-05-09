// src/components/GameBoard.tsx
import React, { useEffect, useState, useRef } from 'react';
import { game } from '../engine/GameEngine'; 
import { TOWERS, THEMES } from '../engine/data';
import { ROWS, COLS } from '../engine/MapGenerator';
import { QuestionModal } from './QuestionModal';
import { GameOverModal } from './GameOverModal';
import { BuffSelectionModal } from './BuffSelectionModal';
import { WavePreparationPage } from './WavePreparationPage';
import { soundSystem } from '../engine/SoundSystem';
import { i18n, getTowerName, getTowerDescription } from '../utils/i18n';
import { getThemeDescription } from '../utils/themeHelpers';
import type { Particle } from '../engine/types';
import { getTowerGifAsset } from '../config/visualAssets';
import { isDeveloperMode } from '../config/developerMode';
import { PixiGameBoard } from './PixiGameBoard';
import { COMMANDERS, DEFAULT_COMMANDER } from '../config/characters';
import { TOWER_VISUAL_GROUP } from '../config/spriteManifest';

const GROUP_COLORS: Record<string, string> = {
  archer:   '#38bdf8',
  catapult: '#f97316',
  mage:     '#a855f7',
  guardian: '#22c55e',
};

const TILE_SIZE = 60; // Increased tile size for better visibility
const BOARD_WIDTH = COLS * TILE_SIZE; 
const BOARD_HEIGHT = ROWS * TILE_SIZE;
const ABILITY_DESCRIPTIONS: Record<string, { label: string; labelZh: string; desc: string; descZh: string; danger: 'low' | 'med' | 'high' }> = {
  teleport:         { label: 'Teleport',        labelZh: '瞬移',     desc: 'Skips 20–40% of remaining path instantly',    descZh: '瞬間跳過20–40%剩餘路徑', danger: 'high' },
  charge:           { label: 'Charge',           labelZh: '衝鋒',     desc: 'Bursts forward half a tile on the path',       descZh: '沿路徑瞬間向前衝半格', danger: 'med' },
  shield:           { label: 'Shield',           labelZh: '護盾',     desc: 'Has a 30% HP damage buffer on spawn',          descZh: '出生時擁有30%HP護盾', danger: 'high' },
  regenerate:       { label: 'Regenerate',       labelZh: '自我再生', desc: 'Recovers 1% max HP/sec when below 50% HP',      descZh: '低於50%時每秒回復1%最大HP', danger: 'med' },
  heal_allies:      { label: 'Heal Allies',      labelZh: '治療同伴', desc: 'Heals nearby enemies for 15% of their max HP',  descZh: '治療附近敵人15%最大HP', danger: 'high' },
  speed_aura:       { label: 'Speed Aura',       labelZh: '加速光環', desc: 'Passively speeds up all allies in range',       descZh: '持續加速範圍內所有同伴', danger: 'high' },
  shield_allies:    { label: 'Shield Allies',    labelZh: '同伴護盾', desc: 'Gives 3 nearby allies a 30% HP shield',        descZh: '給予3個附近同伴30%HP護盾', danger: 'high' },
  deactivate_towers:{ label: 'EMP Disable',      labelZh: '電磁癱瘓', desc: 'Disables all towers within 2 tiles for 3s',    descZh: '癱瘓2格內所有防禦塔3秒', danger: 'high' },
  area_disable:     { label: 'Area Disable',     labelZh: '區域失能', desc: 'Stuns all towers in a 1-tile radius for 4s',   descZh: '暈眩1格範圍內所有塔4秒', danger: 'high' },
  slow_towers:      { label: 'Slow Towers',      labelZh: '緩速防禦塔',desc:'Reduces attack speed of nearby towers for 3s', descZh: '降低附近防禦塔攻速3秒', danger: 'med' },
  split:            { label: 'Split',            labelZh: '分裂',     desc: 'Splits into 2 smaller enemies at 30% HP',      descZh: '低於30%HP時分裂為2個敵人', danger: 'med' },
  attack_towers:    { label: 'Attack Towers',    labelZh: '攻擊防禦塔',desc:'Actively deals damage to towers in range',     descZh: '主動攻擊範圍內的防禦塔', danger: 'high' },
  poison_aura:      { label: 'Poison Aura',      labelZh: '毒霧光環', desc: 'Poisons nearby towers, reducing their output', descZh: '持續毒化附近防禦塔', danger: 'med' },
  freeze_aura:      { label: 'Freeze Aura',      labelZh: '冰凍光環', desc: 'Slows all towers in range passively',          descZh: '持續減緩範圍內所有防禦塔', danger: 'med' },
  invisible:        { label: 'Invisible',        labelZh: '隱形',     desc: 'Cannot be targeted — needs detection towers',  descZh: '無法被鎖定，需要偵測塔', danger: 'high' },
  fly:              { label: 'Flying',           labelZh: '飛行',     desc: 'Only air-targeting towers can attack it',      descZh: '僅對空防禦塔可攻擊', danger: 'high' },
  cc_immune:        { label: 'CC Immune',        labelZh: '控場免疫', desc: 'Immune to freeze, stun and slow effects',      descZh: '免疫冰凍、暈眩、減速', danger: 'high' },
  spawn_minions:    { label: 'Spawn Minions',    labelZh: '召喚小怪', desc: 'Periodically spawns additional enemies',       descZh: '定期召喚額外敵人', danger: 'med' },
  stun_attack:      { label: 'Stun Attack',      labelZh: '暈眩攻擊', desc: 'Briefly stuns nearby towers on hit',           descZh: '命中時短暫暈眩附近防禦塔', danger: 'med' },
  damage_reflect:   { label: 'Reflect',          labelZh: '反傷',     desc: 'Reflects 20% of incoming damage to towers',   descZh: '將20%受到的傷害反射回防禦塔', danger: 'med' },
};

interface GameBoardProps {
  onGameEnd?: (result?: { wave: number; enemiesKilled: number; moneyEarned: number; towersBuilt: number; encounteredEnemies: string[] }) => void;
  questionSetId?: string;
  allowedTowers?: string[];
  selectedCommander?: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({ onGameEnd, questionSetId = 'mixed', allowedTowers: initialAllowedTowers, selectedCommander = DEFAULT_COMMANDER }) => {
  // --- REACT STATE ---
  const [tick, setTick] = useState(0);
  // Mutable loadout — updated each environment via WavePreparationPage
  const [allowedTowers, setAllowedTowers] = useState<string[] | undefined>(initialAllowedTowers);
  const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{r: number, c: number} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync with Engine
  const [money, setMoney] = useState(game.money);
  const [lives, setLives] = useState(game.lives);
  const [wave, setWave] = useState(game.wave);
  const [gameSpeed, setGameSpeed] = useState(game.gameSpeed);
  const [isTactical, setIsTactical] = useState(game.isTacticalMode);
  
  // Visual Effects State
  const [hitOpacity, setHitOpacity] = useState(0);
  const [waveCountdown, setWaveCountdown] = useState(game.waveCountdown);
  const [waveInProgress, setWaveInProgress] = useState(game.waveInProgress);
  const [isGameOver, setIsGameOver] = useState(game.isGameOver);
  const [showBuffSelection, setShowBuffSelection] = useState(game.showBuffSelection);
  const [showWaveShop, setShowWaveShop] = useState(game.showWaveShop);
  
  // Language State
  const [language, setLanguage] = useState<'en' | 'zh'>(i18n.getLanguage());

  // Commander State
  const [cmdCooldownPct, setCmdCooldownPct] = useState(1);
  const [cmdAbilityActive, setCmdAbilityActive] = useState(false);
  const commander = COMMANDERS[selectedCommander] || COMMANDERS[DEFAULT_COMMANDER];

  // Fixed-timestep refs — keeps game at 60 ticks/s on any refresh rate
  const lastTimeRef = useRef(0);
  const accumRef    = useRef(0);
  const TICK_MS     = 1000 / 60;

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    i18n.setLanguage(newLang);
  };
  const formatTargetMode = (mode?: string) => {
    if (mode === 'air') return language === 'zh' ? '對空 / Air' : 'Air / 對空';
    if (mode === 'both') return language === 'zh' ? '對地空 / Ground+Air' : 'Ground+Air / 對地空';
    return language === 'zh' ? '對地 / Ground' : 'Ground / 對地';
  };
  const formatTowerType = (type?: string) => {
    const map: Record<string, { en: string; zh: string }> = {
      projectile: { en: 'Projectile', zh: '投射' },
      area: { en: 'Area', zh: '範圍' },
      beam: { en: 'Beam', zh: '光束' },
      spread: { en: 'Spread', zh: '散射' },
      aura: { en: 'Aura', zh: '光環' },
      pull: { en: 'Control', zh: '控制' },
      farm: { en: 'Economy', zh: '經濟' },
      summon: { en: 'Summon', zh: '召喚' },
    };
    const v = map[type || 'projectile'] || { en: type || 'Unknown', zh: type || '未知' };
    return language === 'zh' ? `${v.zh} / ${v.en}` : `${v.en} / ${v.zh}`;
  };

  // Theme Logic
  const themeIndex = Math.min(Math.floor((wave - 1) / 10), THEMES.length - 1);
  const currentTheme = THEMES[themeIndex];

  // Fresh run when entering the board (singleton engine persists between lobby visits).
  useEffect(() => {
    game.startNewGame();
    game.setCommander(selectedCommander);
  }, []);

  // --- AUDIO & ALARM EFFECT ---
  useEffect(() => {
    if (lives < 2 && lives > 0) {
        soundSystem.startLowHealthAlarm();
    } else {
        soundSystem.stopLowHealthAlarm();
    }
    return () => soundSystem.stopLowHealthAlarm();
  }, [lives]);

  // --- GAME LOOP ---
  useEffect(() => {
    const initAudio = () => { soundSystem.init(); window.removeEventListener('click', initAudio); };
    window.addEventListener('click', initAudio);

    let frameId: number;
    const loop = (timestamp: number) => {
      // Fixed 60 ticks/s — prevent double-speed on 120hz monitors
      const delta = lastTimeRef.current
        ? Math.min(timestamp - lastTimeRef.current, 100)
        : TICK_MS;
      lastTimeRef.current = timestamp;
      accumRef.current += delta;
      while (accumRef.current >= TICK_MS) {
        game.tick();
        accumRef.current -= TICK_MS;
      }

      // React state updates (low frequency)
      if (game.money !== money) setMoney(game.money);
      if (game.lives !== lives) setLives(game.lives);
      if (game.wave !== wave) setWave(game.wave);
      if (game.gameSpeed !== gameSpeed) setGameSpeed(game.gameSpeed);
      if (game.isTacticalMode !== isTactical) setIsTactical(game.isTacticalMode);
      if (game.baseHitEffect !== hitOpacity) setHitOpacity(game.baseHitEffect);
      
      setWaveCountdown(game.waveCountdown);
      setWaveInProgress(game.waveInProgress);
      
      if (game.isGameOver !== isGameOver) setIsGameOver(game.isGameOver);
      
      if (game.pendingAction && !isModalOpen) setIsModalOpen(true);
      if (game.showBuffSelection && !showBuffSelection) setShowBuffSelection(true);
      if (game.showWaveShop && !showWaveShop) {
        setShowWaveShop(true);
        game.isTacticalMode = true; // freeze the game during prep
      }

      // Commander state sync
      setCmdCooldownPct(game.getCommanderAbilityCooldownPct());
      setCmdAbilityActive(game.commanderAbilityActiveTicks > 0);
      
      // We still tick React to render projectiles/particles and handle spawn/death
      setTick(t => t + 1);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [money, lives, wave, gameSpeed, isTactical, isModalOpen, hitOpacity, isGameOver]);

  // --- HANDLERS ---
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHoverPos(null);
    if (draggingKey && hoverPos) {
      // Check if tower is allowed (if allowedTowers is specified)
      if (allowedTowers && allowedTowers.length > 0 && !allowedTowers.includes(draggingKey)) {
        setDraggingKey(null);
        return; // Don't build if not in allowed list
      }
      game.requestBuildTower(hoverPos.r, hoverPos.c, draggingKey);
      setDraggingKey(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / TILE_SIZE);
    const r = Math.floor(y / TILE_SIZE);
    if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
        if (!hoverPos || hoverPos.r !== r || hoverPos.c !== c) setHoverPos({ r, c });
    }
  };

  const getGhostStatus = () => {
      if (!draggingKey || !hoverPos) return null;
      const stats = TOWERS[draggingKey];
      const cell = game.map[hoverPos.r][hoverPos.c];
      const towerStats = TOWERS[draggingKey!];
      const pathOk = Boolean((towerStats as any)?.canDeployOnPath);
      const isBlocked = cell === 'S' || cell === 'B' || cell === 'X' || (cell === 1 && !pathOk);
      const hasTower = game.towers.some(t => t.r === hoverPos.r && t.c === hoverPos.c);
      const isValid = !isBlocked && !hasTower;
      return { stats, isValid, rangePx: stats.range * TILE_SIZE };
  };
  const ghost = getGhostStatus();

  // --- RENDER PARTICLES ---
  const renderParticle = (p: Particle) => {
      const t = p.life / p.maxLife; // normalized lifetime 1→0
      const ti = 1 - t;             // inverse: 0→1 as particle ages

      if (p.type === 'text') {
        return <div key={p.id} className="absolute pointer-events-none font-black text-xs z-50 whitespace-nowrap select-none"
            style={{ left: p.x, top: p.y, color: p.color, textShadow: `0px 1px 3px rgba(0,0,0,0.9), 0 0 6px ${p.color}`, opacity: Math.min(1, t * 3) }}>{p.text}</div>;
      }
      if (p.type === 'shockwave') {
          const size = 70 * p.scale * ti;
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              border: `3px solid ${p.color}`, opacity: t * 0.9,
              boxShadow: `0 0 ${size * 0.3}px ${p.color}40` }} />;
      }
      if (p.type === 'spark') {
          const r = 3 * p.scale;
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: p.color, opacity: t,
              boxShadow: `0 0 ${r*3}px ${p.color}` }} />;
      }
      if (p.type === 'smoke') {
          const r = (4 + 8 * ti) * p.scale;
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: p.color, opacity: t * 0.45, filter: 'blur(3px)' }} />;
      }
      if (p.type === 'muzzle') {
          const r = (8 + 6 * t) * p.scale;
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-40"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: `radial-gradient(circle, white 0%, ${p.color} 60%, transparent 100%)`,
              opacity: t * 0.9,
              boxShadow: `0 0 ${r*2}px ${p.color}` }} />;
      }
      if (p.type === 'flame') {
          const r = (5 + 3 * t) * p.scale;
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: `radial-gradient(circle, #fff5c0 0%, ${p.color} 40%, #ff4400 100%)`,
              opacity: t * 0.85,
              boxShadow: `0 0 ${r * 2}px ${p.color}` }} />;
      }
      if (p.type === 'debris') {
          const r = 3 * p.scale;
          return <div key={p.id} className="absolute pointer-events-none z-30"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: p.color, opacity: t,
              transform: `rotate(${(1 - t) * 360}deg)` }} />;
      }
      if (p.type === 'star') {
          const r = 5 * p.scale;
          const rot = ti * 180;
          return <div key={p.id} className="absolute pointer-events-none z-30"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2, opacity: t,
              transform: `rotate(${rot}deg)` }}>
              <div style={{ width: '100%', height: '100%', background: p.color,
                clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
                filter: `drop-shadow(0 0 ${r}px ${p.color})` }} />
            </div>;
      }
      if (p.type === 'impact') {
          // Expanding ring that fades out
          const size = 24 * p.scale * ti;
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-40"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              border: `2px solid ${p.color}`, opacity: t * 0.9,
              boxShadow: `0 0 ${size}px ${p.color}50` }} />;
      }
      if (p.type === 'freeze') {
          const r = (3 + 2 * t) * p.scale;
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: `radial-gradient(circle, white 0%, ${p.color} 50%, #93c5fd 100%)`,
              opacity: t * 0.85,
              boxShadow: `0 0 ${r*2}px ${p.color}` }} />;
      }
      if (p.type === 'poison_cloud') {
          const r = (6 + 6 * ti) * p.scale;
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: `radial-gradient(circle, ${p.color} 0%, transparent 80%)`,
              opacity: t * 0.65, filter: 'blur(2px)' }} />;
      }
      if (p.type === 'electric') {
          const r = (2 + 3 * t) * p.scale;
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: p.color, opacity: t,
              boxShadow: `0 0 ${r*4}px ${p.color}`, filter: 'blur(0.5px)' }} />;
      }
      if (p.type === 'magic_burst') {
          const size = 50 * p.scale * ti;
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              background: `radial-gradient(circle, white 0%, ${p.color} 40%, transparent 100%)`,
              opacity: t * 0.8 }} />;
      }
      if (p.type === 'shadow_cloud') {
          const r = (8 + 6 * ti) * p.scale;
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: p.color, opacity: t * 0.5, filter: 'blur(4px)' }} />;
      }
      if (p.type === 'void_ring') {
          const size = 60 * p.scale * ti;
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              border: `2px solid ${p.color}`, opacity: t,
              boxShadow: `inset 0 0 ${size * 0.3}px ${p.color}40` }} />;
      }
      if (p.type === 'holy_light') {
          const size = 40 * p.scale * ti;
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              background: `radial-gradient(circle, white 0%, ${p.color} 50%, transparent 100%)`,
              opacity: t * 0.85, boxShadow: `0 0 ${size}px ${p.color}` }} />;
      }
      if (p.type === 'blast') {
          const size = 80 * p.scale * ti;
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              border: `3px solid ${p.color}`,
              background: `radial-gradient(circle, ${p.color}40 0%, transparent 60%)`,
              opacity: t,
              boxShadow: `0 0 ${size * 0.5}px ${p.color}, inset 0 0 ${size*0.3}px ${p.color}40` }} />;
      }
      if (p.type === 'splash') {
          const size = 50 * p.scale * ti;
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              background: `radial-gradient(circle, ${p.color}60 0%, ${p.color}20 60%, transparent 100%)`,
              opacity: t * 0.7, filter: 'blur(2px)' }} />;
      }
      if (p.type === 'shard') {
          const r = (3 + 2 * t) * p.scale;
          const rot = ti * 300;
          return <div key={p.id} className="absolute pointer-events-none z-30"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: p.color, opacity: t,
              transform: `rotate(${rot}deg)`,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              boxShadow: `0 0 ${r}px ${p.color}` }} />;
      }
      if (p.type === 'beam') {
          const size = 30 * p.scale * ti;
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              background: `radial-gradient(circle, white 0%, ${p.color} 50%, transparent 100%)`,
              opacity: t, boxShadow: `0 0 ${size}px ${p.color}` }} />;
      }
      if (p.type === 'ripple') {
          const size = 45 * p.scale * ti;
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              border: `2px solid ${p.color}`, opacity: t * 0.7 }} />;
      }
      if (p.type === 'heal') {
          return <div key={p.id} className="absolute pointer-events-none z-40 font-black text-xl"
            style={{ left: p.x - 8, top: p.y - 8,
              color: p.color, opacity: t,
              textShadow: `0 0 6px ${p.color}, 0 1px 3px black`,
              transform: `translateY(${ti * -18}px)` }}>+</div>;
      }
      if (p.type === 'buff') {
          const r = (8 + 4 * t) * p.scale;
          return <div key={p.id} className="absolute pointer-events-none z-40 rounded-full"
            style={{ left: p.x - r, top: p.y - r, width: r*2, height: r*2,
              background: `radial-gradient(circle, white 0%, ${p.color} 50%, transparent 80%)`,
              opacity: t * 0.9, boxShadow: `0 0 ${r*2}px ${p.color}` }} />;
      }
      if (p.type === 'aura') {
          const size = 28 * p.scale * (0.5 + t * 0.5);
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size,
              background: `radial-gradient(circle, ${p.color}50 0%, transparent 70%)`,
              opacity: t * 0.7 }} />;
      }
      return null;
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${currentTheme.bg} text-slate-100 font-sans select-none transition-colors duration-1000 relative`}>
      
      {/* --- HIT FLASH OVERLAY --- */}
      <div className="absolute inset-0 pointer-events-none z-[60] bg-red-600 mix-blend-overlay"
           style={{ opacity: hitOpacity * 0.6, transition: 'opacity 0.1s' }} />

      {/* --- LOW HEALTH OVERLAY --- */}
      {lives < 2 && lives > 0 && (
         <>
             <div className="absolute inset-0 pointer-events-none z-[59] bg-red-900/20 animate-pulse" />
             <div className="absolute inset-0 pointer-events-none z-[59] shadow-[inset_0_0_100px_rgba(255,0,0,0.6)] animate-pulse" />
         </>
      )}

      <QuestionModal isOpen={isModalOpen} onSuccess={() => { game.confirmAction(); setIsModalOpen(false); }} onClose={() => { game.cancelAction(); setIsModalOpen(false); }} theme={currentTheme.name} questionSetId={questionSetId} />
      
      <BuffSelectionModal
        isOpen={game.showBuffSelection || showBuffSelection}
        onSelect={(buff) => {
          game.applyBuff(buff);
          setShowBuffSelection(false);
        }}
        wave={wave}
        gold={money}
        onSpendGold={(amount) => { game.money = Math.max(0, game.money - amount); setMoney(game.money); }}
      />

      <WavePreparationPage
        isOpen={game.showWaveShop || showWaveShop}
        wave={wave}
        gold={money}
        lives={lives}
        allowedTowers={allowedTowers ?? []}
        allUnlockedTowers={Object.keys(TOWERS)}
        onSelectBuff={(buff) => {
          game.applyBuff(buff);
          game.showBuffSelection = false;
        }}
        onSpendGold={(amount) => { game.money = Math.max(0, game.money - amount); setMoney(game.money); }}
        onConfirm={(newTowers) => {
          setAllowedTowers(newTowers.length > 0 ? newTowers : undefined);
          game.closeWaveShop();          // regenerates map + bumps mapVersion
          game.isTacticalMode = false;   // unfreeze — ready to build
          setShowWaveShop(false);
          setMoney(game.money);
        }}
      />
      
      <GameOverModal 
        isOpen={isGameOver}
        onRestart={() => {
          game.startNewGame();
          setIsGameOver(false);
        }}
        onBackToMenu={() => {
          if (onGameEnd) {
            onGameEnd({
              wave: game.wave,
              towersBuilt: game.towers.length,
              enemiesKilled: game.totalEnemiesKilled,
              moneyEarned: game.totalMoneyEarned,
              encounteredEnemies: game.getEncounteredEnemies()
            });
          }
        }}
        stats={{
          wave: game.wave,
          towersBuilt: game.towers.length,
          enemiesKilled: game.totalEnemiesKilled,
          moneyEarned: game.totalMoneyEarned
        }}
      />

      {/* --- SIDEBAR --- */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-700/60 z-20 shadow-2xl" style={{ background: '#080f1a' }}>
        <div className="p-4 border-b border-slate-700/60" style={{ background: '#060c14' }}>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-black tracking-wider" style={{ color: '#60a5fa', textShadow: '0 0 12px #3b82f680' }}>{i18n.t('game.title')}</h1>
            <button 
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-colors"
              title={i18n.t('game.language')}
            >
              {language === 'en' ? '中' : 'EN'}
            </button>
          </div>
          {/* Home Button */}
          <button
            onClick={() => {
              if (onGameEnd) {
                onGameEnd({
                  wave: game.wave,
                  towersBuilt: game.towers.length,
                  enemiesKilled: game.totalEnemiesKilled,
                  moneyEarned: game.totalMoneyEarned,
                  encounteredEnemies: game.getEncounteredEnemies()
                });
              }
            }}
            className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            title={language === 'zh' ? '返回大廳' : 'Return to Lobby'}
          >
            <span>{language === 'zh' ? '返回大廳' : 'Home'}</span>
          </button>
          <div className="flex justify-between items-center mt-1 text-xs text-slate-300">
              <span>{i18n.t('game.wave')}: {language === 'zh' && currentTheme.nameZh ? currentTheme.nameZh : currentTheme.name}</span>
              {!waveInProgress && <span className="text-yellow-300 font-bold animate-pulse">{i18n.t('game.nextWaveIn')}: {(waveCountdown/60).toFixed(1)}s</span>}
          </div>
           {/* Environment Effects Info */}
           {(currentTheme.towerCooldownMultiplier || currentTheme.towerRangeMultiplier || currentTheme.towerDamageMultiplier || currentTheme.enemySpeedMultiplier || currentTheme.enemyHpMultiplier || currentTheme.moneyBonus) && (
             <div className="p-3 bg-slate-800/50 border-t border-slate-700">
               <div className="text-xs text-slate-300 font-semibold mb-1">
                 {language === 'zh' ? '環境效果' : 'Environment Effects'}
               </div>
               <div className="text-xs text-slate-400 leading-tight">
                 {getThemeDescription(currentTheme)}
               </div>
             </div>
           )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {(allowedTowers && allowedTowers.length > 0 
            ? allowedTowers.map(key => [key, TOWERS[key]] as [string, typeof TOWERS[string]])
            : Object.entries(TOWERS)
          ).map(([key, tower]) => {
            const canAfford = isDeveloperMode() || money >= tower.cost;
            const dpCost = (tower as any).dpCost as number | undefined;
            const hasEnoughDp = !dpCost || isDeveloperMode() || game.deployPoints >= dpCost;
            const dmg = Math.round(tower.damage || 0);
            const cooldownTicks = Math.max(1, tower.cooldown || 1);
            const atkPerSec = (60 / cooldownTicks).toFixed(2);
            const towerType = formatTowerType((tower as any).type);
            const targetLabel = formatTargetMode((tower as any).targetMode);
            const group = TOWER_VISUAL_GROUP[key] ?? 'archer';
            const groupColor = GROUP_COLORS[group] ?? '#60a5fa';
            const opClass = (tower as any).operatorClass as string | undefined;
            const CLASS_COLOR: Record<string,string> = { guard:'#dc2626',defender:'#2563eb',vanguard:'#059669',sniper:'#b45309',caster:'#7c3aed',medic:'#0e7490',supporter:'#4b5563',specialist:'#9a3412' };
            const classColor = opClass ? (CLASS_COLOR[opClass] ?? groupColor) : groupColor;
            const blockCount = (tower as any).blockCount as number | undefined;
            const def = (tower as any).def as number | undefined;
            return (
              <div key={key} draggable={canAfford}
                onDragStart={(e) => { if(canAfford) { setDraggingKey(key); e.dataTransfer.setData('text', key); }}}
                className={`relative select-none transition-all group ${canAfford ? 'cursor-grab active:cursor-grabbing hover:translate-y-[-1px]' : 'opacity-40 cursor-not-allowed'}`}
                style={{
                  background: 'linear-gradient(135deg, #0c1622 0%, #0a1018 100%)',
                  border: `1px solid ${canAfford ? classColor + '55' : '#1e2d3d'}`,
                  boxShadow: canAfford ? `0 2px 12px ${classColor}18, inset 0 1px 0 ${classColor}20` : 'none',
                  overflow: 'hidden',
                }}>
                {/* Class color header strip */}
                <div style={{ height: 3, background: canAfford ? `linear-gradient(90deg, ${classColor}, ${groupColor}88)` : '#1e2d3d' }} />
                <div className="flex gap-2 p-2">
                  {/* Portrait */}
                  <div className="relative shrink-0" style={{ width: 48, height: 56 }}>
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform"
                         style={{ background: `linear-gradient(160deg, ${classColor}22, #060c14)`, border: `1px solid ${classColor}44` }}>
                      {getTowerGifAsset(key) ? (
                        <img src={getTowerGifAsset(key)} alt={tower.name}
                             className="w-full h-full object-contain pixel-art" draggable={false} />
                      ) : (
                        <span style={{ fontSize: 26, filter: `drop-shadow(0 0 6px ${classColor})` }}>{tower.icon}</span>
                      )}
                    </div>
                    {/* Block count pip (bottom-right of portrait) */}
                    {blockCount != null && blockCount > 0 && (
                      <div className="absolute bottom-0 right-0 flex gap-px p-px" style={{ background: '#0008' }}>
                        {Array.from({length: blockCount}).map((_,i) => (
                          <div key={i} style={{ width: 5, height: 5, background: classColor, opacity: 0.9 }} />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Info column */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Name + class */}
                    <div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {opClass && (
                          <span className="text-[7px] font-black uppercase tracking-wider px-1 py-0.5 shrink-0"
                                style={{ background: classColor + 'cc', color: '#fff', letterSpacing: '0.08em' }}>
                            {opClass.toUpperCase()}
                          </span>
                        )}
                        <span className="text-[11px] font-black truncate" style={{ color: '#e2e8f0' }}>{getTowerName(key)}</span>
                      </div>
                      <div className="text-[9px] mt-0.5 truncate" style={{ color: groupColor + 'bb' }}>{targetLabel}</div>
                    </div>
                    {/* Stats row */}
                    <div className="flex gap-1 text-[9px] font-mono mt-1">
                      <div className="flex items-center gap-0.5 px-1 py-0.5" style={{ background: '#1a0808', border: '1px solid #3d1515' }}>
                        <span style={{ color: '#94a3b8' }}>ATK</span>
                        <span className="font-black" style={{ color: '#f87171' }}>{dmg}</span>
                      </div>
                      <div className="flex items-center gap-0.5 px-1 py-0.5" style={{ background: '#0f110a', border: '1px solid #2a3010' }}>
                        <span style={{ color: '#94a3b8' }}>SPD</span>
                        <span className="font-black" style={{ color: '#86efac' }}>{atkPerSec}</span>
                      </div>
                      {def != null && def > 0 && (
                        <div className="flex items-center gap-0.5 px-1 py-0.5" style={{ background: '#080f1a', border: '1px solid #153060' }}>
                          <span style={{ color: '#94a3b8' }}>DEF</span>
                          <span className="font-black" style={{ color: '#93c5fd' }}>{def}</span>
                        </div>
                      )}
                    </div>
                    {/* Cost row */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black font-mono" style={{ color: '#4ade80' }}>${tower.cost}</span>
                        {dpCost && (
                          <span className="text-[8px] font-black font-mono px-1"
                                style={{ background: hasEnoughDp ? '#2d1b69' : '#4a0a0a', color: hasEnoughDp ? '#c4b5fd' : '#f87171', border: `1px solid ${hasEnoughDp ? '#6d28d9' : '#dc2626'}55` }}>
                            {dpCost}DP
                          </span>
                        )}
                      </div>
                      <span className="text-[8px] font-mono" style={{ color: classColor + 'aa' }}>{towerType.split(' / ')[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 relative bg-slate-900/60 flex flex-col items-center justify-center p-4">
        
        {/* HUD */}
        <div className="absolute top-4 w-full max-w-4xl flex justify-between px-4 z-30 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            {/* Money */}
            <div className="flex items-center gap-2 px-3 py-1.5 min-w-[110px]"
                 style={{ background: '#060f1a', border: '1px solid #22c55e44', borderLeft: '3px solid #22c55e', boxShadow: '0 0 10px #22c55e18' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
                <polygon points="8,3 13,6 13,10 8,13 3,10 3,6" fill="#f59e0b"/>
                <text x="8" y="10" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#78350f">$</text>
              </svg>
              <span className="font-black font-mono text-lg" style={{ color: '#4ade80', textShadow: '0 0 8px #22c55e60' }}>
                {isDeveloperMode() ? '∞' : `$${money}`}
              </span>
              {isDeveloperMode() && (
                <span className="text-[9px] font-black tracking-widest px-1 py-0.5" style={{ color: '#fbbf24', background: '#451a00', border: '1px solid #f59e0b50' }}>DEV</span>
              )}
            </div>
            {/* Lives */}
            <div className={`flex items-center gap-2 px-3 py-1.5 ${lives < 2 ? 'animate-bounce' : ''}`}
                 style={{ background: lives < 2 ? '#1a0505' : '#060f1a', border: `1px solid ${lives < 2 ? '#ef444480' : '#ef444430'}`, borderLeft: `3px solid ${lives < 2 ? '#ef4444' : '#f87171'}`, boxShadow: lives < 2 ? '0 0 16px #ef444440' : '0 0 10px #ef444415' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                <polygon points="7,13 1,7 1,4 4,1 7,4 10,1 13,4 13,7" fill={lives < 2 ? '#ef4444' : '#f87171'} stroke={lives < 2 ? '#dc2626' : '#ef444460'} strokeWidth="1"/>
                <polygon points="7,11 2,7 2,5 4,3 7,5 10,3 12,5 12,7" fill={lives < 2 ? '#fca5a5' : '#ef444480'}/>
              </svg>
              <span className="font-black font-mono text-lg" style={{ color: lives < 2 ? '#fca5a5' : '#f87171', textShadow: lives < 2 ? '0 0 8px #ef444460' : 'none' }}>{lives}</span>
            </div>
            {/* DP (Deploy Points) */}
            <div className="flex items-center gap-2 px-3 py-1.5"
                 style={{ background: '#060f1a', border: '1px solid #8b5cf640', borderLeft: '3px solid #8b5cf6', boxShadow: '0 0 10px #8b5cf615' }}>
              <span className="font-mono text-[9px] text-purple-400 font-black uppercase tracking-wider">DP</span>
              <span className="font-black font-mono text-lg text-purple-300">{Math.floor(game.deployPoints)}/{game.maxDeployPoints}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Wave counter */}
            <div className="flex flex-col items-center justify-center px-4 py-1 min-w-[96px]"
                 style={{ background: '#06091a', border: '1px solid #6366f144', borderLeft: '3px solid #6366f1', boxShadow: '0 0 10px #6366f118' }}>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#a5b4fc' }}>
                {waveInProgress ? i18n.t('game.currentWave') : i18n.t('game.nextWaveIn')}
              </span>
              <span className="text-2xl font-black font-mono" style={{ color: waveInProgress ? '#e0e7ff' : '#fbbf24', textShadow: waveInProgress ? '0 0 8px #6366f150' : '0 0 8px #f59e0b60' }}>
                {waveInProgress ? wave : (waveCountdown/60).toFixed(1) + 's'}
              </span>
            </div>

            {/* Pause/play */}
            <button type="button" onClick={() => game.toggleTacticalMode()}
                    className={`px-3 py-2 font-black text-sm tracking-wider transition-all ${isTactical ? 'animate-pulse' : ''}`}
                    style={{ background: isTactical ? '#451a00' : '#060f1a', border: `1px solid ${isTactical ? '#f97316' : '#334155'}`, color: isTactical ? '#fb923c' : '#94a3b8', boxShadow: isTactical ? '0 0 10px #f9731630' : 'none' }}>
              {isTactical ? '⏸ PAUSE' : '▶ PLAY'}
            </button>

            {/* Speed */}
            <div className="flex overflow-hidden" style={{ border: '1px solid #1e293b', background: '#060c14' }}>
              {[0.5, 1, 2, 4].map(s => (
                <button type="button" key={s} onClick={() => game.gameSpeed = s}
                        className="px-2.5 py-2 text-xs font-black font-mono transition-all"
                        style={{ background: gameSpeed === s ? '#1d4ed8' : 'transparent', color: gameSpeed === s ? '#bfdbfe' : '#475569', borderRight: '1px solid #1e293b' }}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* NOTIFICATION OVERLAY */}
        {game.notification && (
           <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
               <div className="relative px-10 py-5 rounded-none" style={{
                 background: game.notificationType === 'boss' ? 'rgba(127,0,0,0.85)' : game.notificationType === 'alert' ? 'rgba(30,60,120,0.85)' : 'rgba(10,20,40,0.85)',
                 border: `4px solid ${game.notificationType === 'boss' ? '#ef4444' : game.notificationType === 'alert' ? '#60a5fa' : '#facc15'}`,
                 boxShadow: `0 0 30px ${game.notificationType === 'boss' ? '#ef444480' : game.notificationType === 'alert' ? '#60a5fa80' : '#facc1580'}, inset 0 0 20px rgba(0,0,0,0.5)`,
               }}>
                 <h1 className="text-5xl font-black tracking-widest text-white drop-shadow-xl"
                   style={{ textShadow: `0 0 20px ${game.notificationType === 'boss' ? '#ef4444' : game.notificationType === 'alert' ? '#60a5fa' : '#facc15'}, 0 2px 4px black` }}>
                   {game.notification}
                 </h1>
               </div>
           </div>
        )}
        {game.bossAbilityPopup && (
          <div className="absolute top-14 right-2 z-50 pointer-events-none w-48">
            <div style={{ background: '#07080f', border: `1px solid ${game.bossAbilityPopup.bossType === 'big' ? '#ef4444' : '#f59e0b'}`, boxShadow: `0 0 12px ${game.bossAbilityPopup.bossType === 'big' ? '#ef444430' : '#f59e0b30'}` }}>
              <div className="px-2 py-1 flex items-center gap-1.5"
                   style={{ background: game.bossAbilityPopup.bossType === 'big' ? 'rgba(80,0,0,0.8)' : 'rgba(80,40,0,0.8)' }}>
                <span className="text-[8px] font-black tracking-wider uppercase flex-shrink-0"
                      style={{ color: game.bossAbilityPopup.bossType === 'big' ? '#fca5a5' : '#fcd34d' }}>
                  {game.bossAbilityPopup.bossType === 'big' ? '⚠ BIG' : '◈ MINI'}
                </span>
                <span className="text-white font-black text-[9px] truncate">{game.bossAbilityPopup.name}</span>
              </div>
              <div className="px-2 py-1.5 flex flex-col gap-0.5">
                {game.bossAbilityPopup.abilities.map((ability) => {
                  const info = ABILITY_DESCRIPTIONS[ability];
                  const dangerColor = info?.danger === 'high' ? '#ef4444' : info?.danger === 'med' ? '#f59e0b' : '#6b7280';
                  return (
                    <div key={`${game.bossAbilityPopup?.name}-${ability}`} className="flex items-center gap-1">
                      <span className="text-[7px] font-black flex-shrink-0 uppercase w-14 text-right"
                            style={{ color: dangerColor }}>{info ? (language === 'zh' ? info.labelZh : info.label) : ability}</span>
                      <span className="text-[7px] text-slate-400 leading-tight truncate">
                        {info ? (language === 'zh' ? info.descZh : info.desc) : ability}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- BOARD --- */}
        <div className="relative shadow-2xl transition-all duration-300 pixel-board"
             style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, border: '4px solid #1e293b', backgroundColor: '#0f172a' }}
             onDragOver={handleDragOver} onDragLeave={() => setHoverPos(null)} onDrop={handleDrop}>
          
          {/* PixiJS canvas — tiles, towers, enemies, projectiles */}
          <PixiGameBoard rows={ROWS} cols={COLS} tick={tick} selectedTowerId={selectedTowerId} />

          {/* Transparent click capture for tower selection */}
          <div className="absolute inset-0 z-[5]"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const c = Math.floor((e.clientX - rect.left) / TILE_SIZE);
                 const r = Math.floor((e.clientY - rect.top) / TILE_SIZE);
                 const tower = game.towers.find(t => t.r === r && t.c === c);
                 if (tower) setSelectedTowerId(prev => prev === tower.id ? null : tower.id);
                 else setSelectedTowerId(null);
               }} />

          {/* Placing BASIC_BURN: preview the exact 3×3 hazard */}
          {ghost && draggingKey === 'BASIC_BURN' && hoverPos &&
            [-1, 0, 1].flatMap(dr => [-1, 0, 1].map(dc => ({ dr, dc }))).map(({ dr, dc }) => {
              const r = hoverPos.r + dr;
              const c = hoverPos.c + dc;
              if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
              const ring = Math.sin((tick + dr * dc) * 0.08) * 0.03;
              return (
                <div
                  key={`burn-ghost-${r}-${c}`}
                  className="absolute pointer-events-none z-[38] pixel-tile"
                  style={{
                    left: c * TILE_SIZE,
                    top: r * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    background: ghost.isValid ? `rgba(249,115,22,${0.16 + ring})` : `rgba(239,68,68,${0.1 + ring})`,
                    border: ghost.isValid ? '2px solid rgba(251,191,36,0.6)' : '2px dashed rgba(248,113,113,0.45)',
                    boxShadow: 'inset 0 0 10px rgba(251,146,60,0.35)',
                  }}
                />
              );
            })}

          {/* 2. Ghost */}
          {ghost && (
             <div className="absolute pointer-events-none z-40 transition-all duration-75"
                  style={{ left: hoverPos!.c * TILE_SIZE, top: hoverPos!.r * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                {/* Range circle — hidden for aura towers like Flamethrower */}
                {(ghost.stats as any).type !== 'aura' && (
                <div className={`absolute rounded-full border-2 opacity-40 transition-colors ${ghost.isValid ? 'bg-emerald-500/30 border-emerald-400' : 'bg-rose-500/30 border-rose-400'}`}
                     style={{ width: ghost.rangePx * 2, height: ghost.rangePx * 2, top: TILE_SIZE/2 - ghost.rangePx, left: TILE_SIZE/2 - ghost.rangePx }} />
                )}
                {/* Aura tower: show coverage grid instead of circle */}
                {(ghost.stats as any).type === 'aura' && hoverPos && (
                  <div className={`absolute inset-0 pointer-events-none border-2 ${ghost.isValid ? 'border-emerald-400 bg-emerald-500/20' : 'border-rose-400 bg-rose-500/20'}`}
                       style={{ boxShadow: ghost.isValid ? `0 0 0 ${TILE_SIZE}px rgba(34,197,94,0.08)` : `0 0 0 ${TILE_SIZE}px rgba(239,68,68,0.08)` }} />
                )}
                {/* Tower preview icon with color background */}
                <div className={`w-full h-full flex items-center justify-center overflow-hidden border-2 ${ghost.isValid ? 'border-emerald-400/70' : 'border-rose-400/70'}`}
                     style={{ backgroundColor: ghost.stats.color + '25', fontSize: `${TILE_SIZE * 0.5}px` }}>
                  {getTowerGifAsset(draggingKey || '') ? (
                    <img
                      src={getTowerGifAsset(draggingKey || '')}
                      alt="tower ghost"
                      className="h-[80%] w-[80%] object-contain pixel-art opacity-80"
                      draggable={false}
                    />
                  ) : (
                    <span style={{ opacity: 0.85, filter: `drop-shadow(0 0 4px ${ghost.stats.color})` }}>
                      {ghost.stats.icon}
                    </span>
                  )}
                </div>
             </div>
          )}

          {/* 4b. Selected Tower Popup — rendered at board level to escape z-10 stacking context */}
          {selectedTowerId !== null && (() => {
            const t = game.towers.find(tt => tt.id === selectedTowerId);
            if (!t) return null;
            const stats = TOWERS[t.key];
            const targetMode = (stats as any).targetMode || 'ground';
            const element = (stats as any).element || 'physical';
            let invest = stats.cost; for(let i=1; i<t.level; i++) invest += Math.floor(stats.cost * 1.5 * i);
            const sellPrice = Math.floor(invest * Math.max(0.5, 0.85 - (t.level * 0.05)));
            const upgradeCost = Math.floor(stats.cost * 1.5 * t.level);
            const popupLeft = t.c * TILE_SIZE + TILE_SIZE / 2;
            const popupTop = t.r * TILE_SIZE;
            const nearTop = t.r < 4;
            return (
              <div
                className="absolute z-[60] pointer-events-auto"
                style={{
                  left: popupLeft,
                  top: nearTop ? popupTop + TILE_SIZE + 8 : popupTop - 8,
                  transform: nearTop ? 'translateX(-50%)' : 'translate(-50%, -100%)',
                }}
              >
                <div className="bg-slate-900 border-2 border-slate-500 p-2 shadow-2xl flex flex-col gap-1 w-44"
                     style={{ boxShadow: `0 0 0 1px #000, 0 4px 20px rgba(0,0,0,0.8), 0 0 12px ${stats.color}40` }}>
                  <div className="pixel-font text-[8px] text-yellow-300 mb-1 border-b-2 border-slate-600 pb-1 text-center leading-relaxed truncate"
                       style={{ color: stats.color }}>{getTowerName(t.key)}</div>
                  <div className="text-[9px] text-slate-400 mb-1 text-center leading-tight line-clamp-2">{getTowerDescription(t.key)}</div>
                  <div className="pixel-font text-[7px] text-slate-300 mb-1 border-b-2 border-slate-700 pb-1 text-center leading-relaxed">
                    RNG:{Math.floor(t.range)} DMG:{t.damage} LV:{t.level}
                  </div>
                  <div className="text-[9px] text-center text-cyan-300 mb-1 border-b border-slate-700 pb-1">
                    {targetMode === 'ground' ? 'Ground' : targetMode === 'air' ? 'Air' : 'Ground+Air'} · {String(element).toUpperCase()}
                  </div>
                  {/* Target Priority Selector */}
                  <div className="mb-1">
                    <div className="pixel-font text-[6px] text-slate-400 text-center mb-0.5">TARGET</div>
                    <div className="grid grid-cols-5 gap-0.5">
                      {(['first','last','strong','weak','near'] as const).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { game.setTowerTargetPriority(t.id, p); setSelectedTowerId(null); setTimeout(() => setSelectedTowerId(t.id), 0); }}
                          className="pixel-font text-[5px] py-0.5 rounded border transition-colors"
                          style={{
                            background: (t.targetPriority || 'near') === p ? '#1e40af' : '#1e293b',
                            borderColor: (t.targetPriority || 'near') === p ? '#60a5fa' : '#475569',
                            color: (t.targetPriority || 'near') === p ? '#93c5fd' : '#94a3b8',
                          }}
                        >{p.toUpperCase().slice(0,3)}</button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { game.requestUpgradeTower(t.id); setSelectedTowerId(null); }}
                    className="pixel-btn bg-amber-700 border-amber-500 text-amber-100 text-[7px] py-1.5 font-bold w-full"
                  >{i18n.t('game.upgrade')} ${upgradeCost}</button>
                  <button
                    type="button"
                    onClick={() => { game.sellTower(t.id); setSelectedTowerId(null); }}
                    className="pixel-btn bg-red-900 border-red-600 text-red-100 text-[7px] py-1.5 w-full"
                  >{i18n.t('game.sell')} +${sellPrice}</button>
                  {(() => {
                    const isPathOp = Boolean((TOWERS[t.key] as any)?.canDeployOnPath) && game.map[t.r]?.[t.c] === 1;
                    return isPathOp ? (
                      <button
                        type="button"
                        onClick={() => { game.retreatOperator(t.id); setSelectedTowerId(null); }}
                        className="w-full mt-1 py-1.5 font-black text-xs tracking-wider"
                        style={{ background: '#3b0764', border: '1px solid #8b5cf6', color: '#c4b5fd' }}
                      >
                        ↩ RETREAT (50% refund)
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
            );
          })()}

          {/* 6. Particles */}
          {game.particles.map(renderParticle)}

          {isTactical && ( <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-grayscale-[0.5] z-0 pointer-events-none"><h2 className="text-6xl font-black text-white/10 uppercase rotate-[-5deg]">Tactical Mode</h2></div> )}
        </div>
        
        {/* COMMANDER ABILITY BAR */}
        <div className="absolute bottom-4 left-4 z-50 flex items-center gap-3"
             style={{ maxWidth: 340 }}>
          {/* Portrait */}
          <div className="w-12 h-12 flex-shrink-0 rounded-sm overflow-hidden"
               style={{ border: `2px solid ${commander.accentColor}`, background: commander.bgFrom, boxShadow: `0 0 8px ${commander.accentColor}50` }}>
            <svg width="48" height="48" viewBox="0 0 48 56" style={{ imageRendering: 'pixelated' }}>
              <rect x="12" y="24" width="24" height="28" fill="#1a1a2e" />
              <rect x="14" y="26" width="20" height="24" fill="#16213e" />
              <rect x="16" y="8" width="16" height="16" fill="#16213e" />
              <rect x="18" y="10" width="12" height="12" fill="#1a1a2e" />
              <rect x="17" y="14" width="14" height="4" fill={commander.accentColor} opacity="0.9" />
              <rect x="8" y="24" width="8" height="12" fill="#16213e" />
              <rect x="32" y="24" width="8" height="12" fill="#16213e" />
              <rect x="14" y="28" width="20" height="2" fill={commander.accentColor} opacity="0.7" />
            </svg>
          </div>
          {/* Info + ability */}
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-[11px] tracking-widest" style={{ color: commander.accentColor }}>{commander.name.toUpperCase()}</span>
              <span className="font-mono text-[9px] text-slate-500 truncate">{language === 'zh' ? commander.passive.nameZh : commander.passive.name}</span>
            </div>
            {/* Active ability button */}
            <button
              type="button"
              onClick={() => game.triggerCommanderAbility()}
              disabled={cmdCooldownPct < 1}
              className="flex items-center gap-2 px-2 py-1 rounded-sm font-mono text-[10px] font-bold transition-all"
              style={{
                background: cmdCooldownPct >= 1 ? commander.accentColor + '22' : 'rgba(15,23,42,0.8)',
                border: `1px solid ${cmdCooldownPct >= 1 ? commander.accentColor : '#334155'}`,
                color: cmdCooldownPct >= 1 ? commander.accentColor : '#475569',
                boxShadow: cmdCooldownPct >= 1 ? `0 0 8px ${commander.accentColor}40` : 'none',
                cursor: cmdCooldownPct >= 1 ? 'pointer' : 'not-allowed',
              }}
            >
              <span className="text-[9px] px-1 py-0.5 rounded-sm font-black tracking-widest"
                    style={{ background: cmdCooldownPct >= 1 ? commander.accentColor + '33' : '#1e293b' }}>
                {commander.active.icon}
              </span>
              <span className="truncate">
                {language === 'zh' ? commander.active.nameZh : commander.active.name}
              </span>
              {cmdAbilityActive && (
                <span className="text-[8px] animate-pulse" style={{ color: commander.accentColor }}>ACTIVE</span>
              )}
            </button>
            {/* Cooldown bar */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-100"
                   style={{ width: `${cmdCooldownPct * 100}%`, background: commander.accentColor, boxShadow: cmdCooldownPct >= 1 ? `0 0 4px ${commander.accentColor}` : 'none' }} />
            </div>
          </div>
        </div>

        {/* GOLD BUTTON */}
        <div className="absolute bottom-6 right-6 z-50">
           <button type="button" onClick={() => game.requestEarnMoney()} disabled={isTactical} className={`group relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${isTactical ? 'grayscale cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95 hover:shadow-yellow-500/60'}`}>
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600"></div>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                {/* Inner content */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 m-[3px] rounded-[13px] px-12 py-5 flex items-center gap-5 border border-yellow-500/20">
                    {/* Icon with glow */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-lg opacity-60 group-hover:opacity-90 transition-opacity"></div>
                        <div className="relative bg-gradient-to-br from-yellow-400 to-amber-600 text-yellow-900 rounded-full w-14 h-14 flex items-center justify-center font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">$</div>
                    </div>
                    {/* Text */}
                    <div className="flex flex-col items-start">
                        <span className="text-yellow-300 font-black uppercase tracking-wider text-xl drop-shadow-md">獲取資金</span>
                        <span className="text-yellow-500/80 text-sm font-mono font-semibold tracking-widest">GET FUNDING</span>
                    </div>
                    {/* Sparkle effects */}
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                </div>
           </button>
        </div>

      </div>
    </div>
  );
};