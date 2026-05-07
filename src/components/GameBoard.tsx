// src/components/GameBoard.tsx
import React, { useEffect, useState, useRef } from 'react';
import { game } from '../engine/GameEngine'; 
import { TOWERS, THEMES } from '../engine/data';
import { ROWS, COLS } from '../engine/MapGenerator';
import { QuestionModal } from './QuestionModal';
import { GameOverModal } from './GameOverModal';
import { BuffSelectionModal } from './BuffSelectionModal';
import { soundSystem } from '../engine/SoundSystem';
import { effectManager } from '../engine/EffectManager';
import { i18n, getTowerName, getTowerDescription } from '../utils/i18n';
import { getThemeDescription } from '../utils/themeHelpers';
import type { Particle } from '../engine/types';
import { ProjectileRenderer } from './ProjectileRenderer';
import { getEnemyGifAsset, getTowerGifAsset } from '../config/visualAssets';
import { isDeveloperMode } from '../config/developerMode';

const TILE_SIZE = 60; // Increased tile size for better visibility
const BOARD_WIDTH = COLS * TILE_SIZE; 
const BOARD_HEIGHT = ROWS * TILE_SIZE;
const ABILITY_LABELS: Record<string, { en: string; zh: string }> = {
  shield: { en: 'Shield', zh: '護盾' },
  slow_towers: { en: 'Slow Towers', zh: '緩速防禦塔' },
  deactivate_towers: { en: 'EMP Disable', zh: '電磁癱瘓' },
  regenerate: { en: 'Regenerate', zh: '自我再生' },
  heal_allies: { en: 'Heal Allies', zh: '治療同伴' },
  speed_aura: { en: 'Speed Aura', zh: '加速光環' },
  shield_allies: { en: 'Shield Allies', zh: '同伴護盾' },
  charge: { en: 'Charge', zh: '衝鋒' },
  area_disable: { en: 'Area Disable', zh: '區域失能' },
  damage_reflect: { en: 'Damage Reflect', zh: '反傷' },
  split: { en: 'Split', zh: '分裂' },
  stun_attack: { en: 'Stun Attack', zh: '暈眩攻擊' },
  teleport: { en: 'Teleport', zh: '瞬移' },
  poison_aura: { en: 'Poison Aura', zh: '毒霧光環' },
  freeze_aura: { en: 'Freeze Aura', zh: '冰凍光環' },
  invisible: { en: 'Invisible', zh: '隱形' },
  fly: { en: 'Flying', zh: '飛行' },
  cc_immune: { en: 'CC Immune', zh: '控場免疫' },
  spawn_minions: { en: 'Spawn Minions', zh: '召喚小怪' },
  attack_towers: { en: 'Attack Towers', zh: '攻擊防禦塔' },
};

interface GameBoardProps {
  onGameEnd?: (result?: { wave: number; enemiesKilled: number; moneyEarned: number; towersBuilt: number; encounteredEnemies: string[] }) => void;
  questionSetId?: string; // Question set identifier for the game mode
  allowedTowers?: string[]; // List of tower keys that can be built (from loadout selection)
}

export const GameBoard: React.FC<GameBoardProps> = ({ onGameEnd, questionSetId = 'mixed', allowedTowers }) => {
  // --- REACT STATE ---
  const [tick, setTick] = useState(0);
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
  
  // Language State
  const [language, setLanguage] = useState<'en' | 'zh'>(i18n.getLanguage());
  
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    i18n.setLanguage(newLang);
  };
  const formatAbilityLabel = (ability: string) => {
    const label = ABILITY_LABELS[ability];
    if (!label) return ability;
    return language === 'zh' ? `${label.zh} / ${label.en}` : `${label.en} / ${label.zh}`;
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

  // --- PERFORMANCE OPTIMIZATION: REFS ---
  // We store direct DOM references to enemies to bypass React's render cycle for movement
  const enemyRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const enemyHpRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Theme Logic
  const themeIndex = Math.min(Math.floor((wave - 1) / 10), THEMES.length - 1);
  const currentTheme = THEMES[themeIndex];

  // Fresh run when entering the board (singleton engine persists between lobby visits).
  useEffect(() => {
    game.startNewGame();
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
    const loop = () => {
      game.tick();
      
      // 1. DIRECT DOM MANIPULATION (High Performance)
      // We update positions directly here. This is 10x faster than React state for animations.
      game.enemies.forEach(e => {
          const el = enemyRefs.current.get(e.id);
          const hpEl = enemyHpRefs.current.get(e.id);
          
          if (el) {
              const x = (e.c + (e.xOffset || 0)) * TILE_SIZE;
              const y = (e.r + (e.yOffset || 0)) * TILE_SIZE;
              // Hardware accelerated transform
              el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${e.scale})`;
          }
          
          if (hpEl) {
              const hpPercent = (e.hp / e.maxHp) * 100;
              hpEl.style.width = `${hpPercent}%`;
          }
      });

      // 2. REACT STATE UPDATES (Low Frequency / Necessary Logic)
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
      const isBlocked = cell === 'S' || cell === 'B' || cell === 'X'; // Block Start/Base/Obstacle only
      const hasTower = game.towers.some(t => t.r === hoverPos.r && t.c === hoverPos.c);
      const isValid = !isBlocked && !hasTower; // Allow placement on path (1) and empty (0)
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
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-700 bg-slate-900/95 z-20 shadow-xl">
        <div className="p-4 border-b border-slate-700 bg-slate-950">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{i18n.t('game.title')}</h1>
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
            <span>🏠</span>
            <span>{language === 'zh' ? '返回大廳' : 'Home'}</span>
          </button>
          <div className="flex justify-between items-center mt-1 opacity-70 text-xs">
              <span>{i18n.t('game.wave')}: {language === 'zh' && currentTheme.nameZh ? currentTheme.nameZh : currentTheme.name}</span>
              {!waveInProgress && <span className="text-yellow-400 font-bold animate-pulse">{i18n.t('game.nextWaveIn')}: {(waveCountdown/60).toFixed(1)}s</span>}
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
            const dmg = Math.round(tower.damage || 0);
            const cooldownTicks = Math.max(1, tower.cooldown || 1);
            const atkPerSec = (60 / cooldownTicks).toFixed(2);
            const towerType = formatTowerType((tower as any).type);
            const targetLabel = formatTargetMode((tower as any).targetMode);
            return (
                <div key={key} draggable={canAfford} onDragStart={(e) => { if(canAfford) { setDraggingKey(key); e.dataTransfer.setData('text', key); }}}
                className={`relative p-2.5 rounded-lg border transition-all group ${canAfford ? 'border-slate-600 bg-slate-800/70 hover:bg-slate-700/80 hover:border-cyan-400/60 cursor-grab active:cursor-grabbing' : 'border-transparent opacity-40 grayscale cursor-not-allowed'}`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl h-10 w-10 shrink-0 flex items-center justify-center bg-slate-950 rounded shadow group-hover:scale-110 transition-transform overflow-hidden">
                    {getTowerGifAsset(key) ? (
                      <img
                        src={getTowerGifAsset(key)}
                        alt={`${tower.name} sprite`}
                        className="h-full w-full object-contain pixel-art"
                        draggable={false}
                      />
                    ) : (
                      tower.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-100 truncate">{getTowerName(key)}</div>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-xs text-emerald-400 font-mono">${tower.cost}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-cyan-500/50 text-cyan-300 bg-cyan-900/20">{targetLabel}</span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px]">
                        <div className="rounded bg-slate-900/70 border border-slate-700 px-1.5 py-0.5 text-rose-200">
                          {language === 'zh' ? '傷害' : 'DMG'}: <span className="font-semibold text-rose-300">{dmg}</span>
                        </div>
                        <div className="rounded bg-slate-900/70 border border-slate-700 px-1.5 py-0.5 text-amber-200">
                          {language === 'zh' ? '速度' : 'SPD'}: <span className="font-semibold text-amber-300">{atkPerSec}/s</span>
                        </div>
                        <div className="col-span-2 rounded bg-slate-900/70 border border-slate-700 px-1.5 py-0.5 text-violet-200 truncate">
                          {language === 'zh' ? '類型' : 'TYPE'}: <span className="font-semibold text-violet-300">{towerType}</span>
                        </div>
                      </div>
                  </div>
                </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 relative bg-black/40 flex flex-col items-center justify-center p-4">
        
        {/* HUD */}
        <div className="absolute top-4 w-full max-w-4xl flex justify-between px-4 z-30 pointer-events-none">
          <div className="flex gap-4 pointer-events-auto">
             <div className="bg-slate-900/90 border border-slate-600 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 min-w-[120px]">
                <span className="text-2xl">💵</span>
                <span className="text-emerald-400 font-bold text-xl">
                  {isDeveloperMode() ? '∞' : `$${money}`}
                </span>
                {isDeveloperMode() && (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-900/60 border border-amber-500/50 px-1.5 py-0.5 rounded">
                    Dev
                  </span>
                )}
             </div>
             <div className={`bg-slate-900/90 border border-slate-600 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${lives < 2 ? 'border-red-500 bg-red-900/50 animate-bounce' : ''}`}>
                <span className="text-2xl">❤️</span><span className={`font-bold text-xl ${lives < 2 ? 'text-red-200' : 'text-rose-400'}`}>{lives}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
             <div className="flex flex-col items-center justify-center bg-indigo-600 px-4 py-1 rounded shadow-lg border border-indigo-400 mr-4 min-w-[100px]">
                 <span className="text-[10px] uppercase font-bold text-indigo-200">
                    {waveInProgress ? i18n.t('game.currentWave') : i18n.t('game.nextWaveIn')}
                 </span>
                 <span className={`text-2xl font-black ${waveInProgress ? 'text-white' : 'text-yellow-300 animate-pulse'}`}>
                    {waveInProgress ? wave : (waveCountdown/60).toFixed(1) + 's'}
                 </span>
             </div>

             <button onClick={() => game.toggleTacticalMode()} className={`px-4 py-2 rounded font-bold border transition-all ${isTactical ? 'bg-amber-600 border-amber-400 text-white animate-pulse' : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'}`}>
                {isTactical ? `⏸ ${i18n.t('game.paused')}` : `▶ ${i18n.t('game.play')}`}
             </button>

             <div className="flex bg-slate-900 rounded border border-slate-700 overflow-hidden">
                {[0.5, 1, 2, 4].map(s => (
                    <button key={s} onClick={() => game.gameSpeed = s} className={`px-3 py-2 text-xs font-bold hover:bg-slate-700 ${gameSpeed === s ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{s}x</button>
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
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="min-w-[360px] max-w-[75vw] rounded border-2 border-amber-400 bg-slate-900/95 px-4 py-3 shadow-2xl"
                 style={{ boxShadow: '0 0 16px rgba(251,191,36,0.4)' }}>
              <div className="text-[11px] tracking-wide uppercase text-amber-300 font-bold mb-1">
                {game.bossAbilityPopup.bossType === 'big' ? 'Big Boss Intel' : 'Mini Boss Intel'}
              </div>
              <div className="text-white font-black text-lg mb-2">{game.bossAbilityPopup.name}</div>
              <div className="flex flex-wrap gap-1.5">
                {game.bossAbilityPopup.abilities.map((ability) => (
                  <span
                    key={`${game.bossAbilityPopup?.name}-${ability}`}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/60 bg-amber-950/40 text-amber-200"
                  >
                    {formatAbilityLabel(ability)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- BOARD --- */}
        <div className="relative shadow-2xl transition-all duration-300 pixel-board"
             style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, border: '4px solid #1e293b', backgroundColor: '#0f172a' }}
             onDragOver={handleDragOver} onDragLeave={() => setHoverPos(null)} onDrop={handleDrop}>
          
          {/* 1. Grid */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, ${TILE_SIZE}px)`, gridTemplateRows: `repeat(${ROWS}, ${TILE_SIZE}px)` }}>
              {game.map.map((row, r) => row.map((cell, c) => {
                  let className = `${currentTheme.bg} ${currentTheme.grid} border-[0.5px] border-opacity-20`;
                  if (cell !== 0 && cell !== 'S' && cell !== 'B') className = `${currentTheme.path} ${currentTheme.grid} border-none shadow-inner`;
                  
                  return (
                    <div key={`${r}-${c}`} className={`${className} flex items-center justify-center text-xs opacity-80 pixel-tile`}>
                        {cell === 'S' && <span className="text-xl animate-bounce">🚪</span>}
                        {cell === 'B' && <span className="text-xl animate-pulse">🎯</span>}
                        {cell === 'X' && <span className="text-xl opacity-50">{currentTheme.obstacle}</span>}
                    </div>
                  );
              }))}
          </div>

          {/* Path Visualization - Animated Dotted Arrows */}
          {game.path.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-5 overflow-visible" style={{ opacity: 0.4 }}>
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#60a5fa" opacity="0.6" />
                </marker>
              </defs>
              {game.path.slice(0, -1).map((point, idx) => {
                if (idx >= game.path.length - 1) return null;
                const nextPoint = game.path[idx + 1];
                const x1 = point.c * TILE_SIZE + TILE_SIZE / 2;
                const y1 = point.r * TILE_SIZE + TILE_SIZE / 2;
                const x2 = nextPoint.c * TILE_SIZE + TILE_SIZE / 2;
                const y2 = nextPoint.r * TILE_SIZE + TILE_SIZE / 2;
                
                return (
                  <line
                    key={`path-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#60a5fa"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                    markerEnd="url(#arrowhead)"
                    opacity="0.5"
                    style={{
                      strokeDashoffset: (tick * 4) % 12,
                      animation: 'pathDash 0.5s linear infinite'
                    }}
                  />
                );
              })}
              <style>{`
                @keyframes pathDash {
                  to {
                    stroke-dashoffset: -12;
                  }
                }
              `}</style>
            </svg>
          )}

          {/* Active Flamethrower (BASIC_BURN) 3×3 burn tiles */}
          {game.collectFlameThrowerAuraCells().map(({ r, c }) => {
            const flicker = 0.1 + Math.sin((tick + r * 5 + c * 11) * 0.1) * 0.055;
            return (
              <div
                key={`flame-zone-${r}-${c}`}
                className="absolute pointer-events-none z-[6] pixel-tile transition-opacity duration-100"
                style={{
                  left: c * TILE_SIZE,
                  top: r * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  opacity: 0.85 + flicker,
                  mixBlendMode: 'screen',
                  background: `
                    radial-gradient(circle at 50% 80%, rgba(255,237,170,${0.2 + flicker}) 0%, transparent 62%),
                    linear-gradient(
                      180deg,
                      rgba(251,146,60,${0.18 + flicker * 0.5}) 0%,
                      rgba(239,68,68,${0.13 + flicker * 0.45}) 45%,
                      rgba(153,27,27,${0.1 + flicker * 0.35}) 100%
                    )`,
                  boxShadow: 'inset 0 0 14px rgba(251,191,36,0.42)',
                  border: '1px solid rgba(251,113,133,0.35)',
                }}
              />
            );
          })}

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

          {/* 3. Towers */}
          {game.towers.map(t => {
             const stats = TOWERS[t.key];
             const isSelected = selectedTowerId === t.id;
             const auraColor = effectManager.getTowerAuraColor(t);
             
             // Check if this is a support/aura tower
             const isSupportTower = stats.damage === 0 || 
                 (stats.type === 'aura' && (stats.description.includes('Heal') || stats.description.includes('heal') || 
                  stats.description.includes('buff') || stats.description.includes('Buff') || 
                  stats.description.includes('Medic') || stats.description.includes('Support') ||
                  stats.description.includes('Amplifier') || stats.description.includes('Enhancer') ||
                  stats.description.includes('Extender')));
             
             // Determine aura type color for support towers
             const getSupportAuraColor = () => {
                 if (t.key === 'DAMAGE_BUFF' || stats.description.includes('Damage') || stats.description.includes('Amplifier')) return '#ef4444'; // Red
                 if (t.key === 'SPEED_BUFF' || stats.description.includes('Speed') || stats.description.includes('attack speed')) return '#fbbf24'; // Yellow
                 if (t.key === 'RANGE_BUFF' || stats.description.includes('Range') || stats.description.includes('Extender')) return '#3b82f6'; // Blue
                 if (t.key === 'HEALER' || t.key === 'BASIC_HEAL' || stats.description.includes('Heal') || stats.description.includes('Medic')) return '#10b981'; // Green
                 if (stats.description.includes('Slow') || stats.description.includes('slow')) return '#60a5fa'; // Light blue
                 if (stats.description.includes('Weaken')) return '#a855f7'; // Purple
                 return stats.color;
             };
             const supportAuraColor = isSupportTower ? getSupportAuraColor() : null;

             return (
                 <div key={t.id} className="absolute z-10" style={{ left: t.c * TILE_SIZE, top: t.r * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                     {/* Support Tower Aura Range Indicator */}
                     {isSupportTower && (
                         <div 
                             className="absolute rounded-full pointer-events-none"
                             style={{
                                 width: t.range * TILE_SIZE * 2,
                                 height: t.range * TILE_SIZE * 2,
                                 top: TILE_SIZE/2 - t.range * TILE_SIZE,
                                 left: TILE_SIZE/2 - t.range * TILE_SIZE,
                                 background: `radial-gradient(circle, ${supportAuraColor}20 0%, ${supportAuraColor}05 70%, transparent 100%)`,
                                 border: `1px dashed ${supportAuraColor}40`,
                                 zIndex: -1,
                                 animation: 'pulse 2s ease-in-out infinite'
                             }}
                         />
                     )}
                     {/* Status Effect Aura */}
                     {auraColor && (
                         <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
                              style={{
                                  boxShadow: `0 0 ${TILE_SIZE * 0.4}px ${auraColor}, 0 0 ${TILE_SIZE * 0.2}px ${auraColor}`,
                                  border: `2px solid ${auraColor}`,
                                  opacity: 0.6,
                                  zIndex: -1
                              }}
                         />
                     )}
                     
                     {/* Tower Disabled/Stunned Effect */}
                     {t.statusEffects && t.statusEffects.some((e: any) => e.effectId === 'stunned') && (
                         <>
                             <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                                 <div className="text-3xl animate-bounce">💫</div>
                             </div>
                             <div className="absolute inset-0 rounded-lg pointer-events-none z-10 bg-indigo-600/30 animate-pulse" />
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-indigo-300 bg-indigo-900/80 px-2 py-0.5 rounded whitespace-nowrap z-30">
                                 DISABLED
                             </div>
                         </>
                     )}
                     
                     {/* Tower Slowed Effect */}
                     {t.statusEffects && t.statusEffects.some((e: any) => e.effectId === 'firerate_debuff') && !t.statusEffects.some((e: any) => e.effectId === 'stunned') && (
                         <>
                             <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                                 <div className="text-2xl opacity-70">🐌</div>
                             </div>
                             <div className="absolute inset-0 rounded-lg pointer-events-none z-10 bg-blue-500/20" />
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-blue-300 bg-blue-900/80 px-2 py-0.5 rounded whitespace-nowrap z-30">
                                 SLOWED
                             </div>
                         </>
                     )}
                     
                     {/* Health Bar */}
                     {t.maxHp && t.maxHp > 0 && (
                         <div className="absolute -top-1 left-0 right-0 h-1 bg-slate-700 rounded-full overflow-hidden z-10">
                             <div 
                                 className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-100"
                                 style={{ width: `${Math.max(0, Math.min(100, ((t.hp || t.maxHp) / t.maxHp) * 100))}%` }}
                             />
                         </div>
                     )}
                    {/* Tower base platform (pixel-art pedestal) */}
                    <div className="absolute inset-0 pointer-events-none"
                         style={{
                           background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)',
                           border: `1px solid ${isSelected ? '#facc15' : stats.color + '60'}`,
                           boxShadow: isSelected
                             ? `0 0 12px #facc1580, inset 0 0 8px #facc1520`
                             : t.targetId
                               ? `0 0 8px ${stats.color}60, inset 0 0 4px ${stats.color}20`
                               : 'none',
                         }} />
                    <div
                         onClick={() => setSelectedTowerId(isSelected ? null : t.id)}
                        className={`w-full h-full flex items-center justify-center cursor-pointer transition-transform overflow-hidden`}
                        style={{
                            fontSize: `${TILE_SIZE * 0.5}px`,
                            transform: t.angle !== undefined ? `rotate(${t.angle}deg)` : 'none',
                            transformOrigin: 'center',
                        }}
                     >
                         {getTowerGifAsset(t.key) ? (
                           <img
                             src={getTowerGifAsset(t.key)}
                             alt={`${stats.name} tower`}
                             className="h-[85%] w-[85%] object-contain pixel-art"
                             draggable={false}
                           />
                         ) : (
                           <span style={{ filter: t.targetId ? `drop-shadow(0 0 4px ${stats.color})` : 'none' }}>
                             {stats.icon}
                           </span>
                         )}
                          {t.level > 1 && <div className="absolute -top-1 -right-1 text-[9px] px-1 font-black text-white"
                            style={{ background: '#1d4ed8', border: '1px solid #60a5fa', minWidth: 14, textAlign: 'center' }}>
                            {t.level}
                          </div>}
                     </div>
                     {isSelected && <div className="absolute rounded-full border border-white/30 bg-white/5 pointer-events-none" style={{ width: t.range * TILE_SIZE * 2, height: t.range * TILE_SIZE * 2, top: TILE_SIZE/2 - t.range * TILE_SIZE, left: TILE_SIZE/2 - t.range * TILE_SIZE, zIndex: -1 }} /> }
                 </div>
             );
          })}

          {/* 4. Enemies - OPTIMIZED WITH REFS */}
          {game.enemies.map(e => {
              const auraColor = effectManager.getEnemyAuraColor(e);
              return (
              <div 
                  key={e.id} 
                  ref={(el) => {
                      if (el) {
                          enemyRefs.current.set(e.id, el);
                          // Set initial position immediately via DOM
                          const x = (e.c + (e.xOffset||0)) * TILE_SIZE;
                          const y = (e.r + (e.yOffset||0)) * TILE_SIZE;
                          el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${e.scale})`;
                      } else {
                          enemyRefs.current.delete(e.id);
                      }
                  }}
                  className="absolute pointer-events-none flex flex-col items-center justify-center z-20 will-change-transform"
                  style={{ 
                      // No transform here - handled entirely by direct DOM manipulation for smooth animation
                      left: 0, top: 0, width: TILE_SIZE, height: TILE_SIZE
                  }}
              >
                  {/* Status Effect Aura */}
                  {auraColor && (
                      <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
                           style={{
                               boxShadow: `0 0 ${TILE_SIZE * 0.5}px ${auraColor}, 0 0 ${TILE_SIZE * 0.3}px ${auraColor}`,
                               border: `2px solid ${auraColor}`,
                               opacity: 0.7,
                               zIndex: -1,
                               width: TILE_SIZE * 1.2,
                               height: TILE_SIZE * 1.2,
                               left: '50%',
                               top: '50%',
                               transform: 'translate(-50%, -50%)'
                           }}
                      />
                  )}
                  {/* Shield indicator */}
                  {e.shieldHp && e.shieldHp > 0 && (
                    <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
                         style={{
                           border: '3px solid #60a5fa',
                           boxShadow: '0 0 10px #60a5fa, inset 0 0 8px rgba(96, 165, 250, 0.3)',
                           width: TILE_SIZE * 0.9,
                           height: TILE_SIZE * 0.9,
                           left: '50%',
                           top: '50%',
                           transform: 'translate(-50%, -50%)'
                         }}
                    />
                  )}
                  
                  {/* CC Immune indicator */}
                  {e.isCCImmune && (
                    <div className="absolute -top-2 -right-2 text-xs bg-purple-600 rounded-full w-4 h-4 flex items-center justify-center" title="CC Immune">
                      🛡️
                    </div>
                  )}
                  
                  {/* Speed Aura indicator */}
                  {e.abilities?.includes('speed_aura') && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px]">⚡</div>
                  )}
                  
                  {/* Shield Allies indicator */}
                  {e.abilities?.includes('shield_allies') && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px]">🛡️</div>
                  )}

                  {/* === ABILITY AURAS & VISUAL EFFECTS === */}
                  {/* Poison aura — green mist ring */}
                  {e.abilities?.includes('poison_aura') && (
                    <div className="absolute inset-0 pointer-events-none rounded-full ability-aura-poison" />
                  )}
                  {/* Freeze aura — ice blue ring */}
                  {e.abilities?.includes('freeze_aura') && (
                    <div className="absolute inset-0 pointer-events-none rounded-full ability-aura-freeze" />
                  )}
                  {/* Berserk — red rage overlay */}
                  {(e.abilities?.includes('berserk') || (e as any).berserkActive) && (
                    <div className="absolute inset-0 pointer-events-none ability-aura-berserk" />
                  )}
                  {/* Regenerate — green pulsing glow */}
                  {e.abilities?.includes('regenerate') && (
                    <div className="absolute inset-0 pointer-events-none rounded-full ability-aura-regen" />
                  )}
                  {/* Damage reflect — silver shimmer */}
                  {e.abilities?.includes('damage_reflect') && (
                    <div className="absolute inset-0 pointer-events-none ability-aura-reflect" />
                  )}
                  {/* Invisible — semi-transparent shimmer */}
                  {e.abilities?.includes('invisible') && (
                    <div className="absolute inset-0 pointer-events-none ability-aura-invisible" />
                  )}
                  {/* Teleport — purple ring */}
                  {e.abilities?.includes('teleport') && (
                    <div className="absolute inset-0 pointer-events-none rounded-full ability-aura-teleport" />
                  )}
                  {/* CC immune — gold barrier */}
                  {e.abilities?.includes('cc_immune') && (
                    <div className="absolute inset-0 pointer-events-none rounded-full ability-aura-ccimmune" />
                  )}
                  {/* Spawn minions — ghostly shadow halo */}
                  {e.abilities?.includes('spawn_minions') && (
                    <div className="absolute inset-0 pointer-events-none ability-aura-spawner" />
                  )}
                  {/* Attack towers — orange threat glow */}
                  {e.abilities?.includes('attack_towers') && (
                    <div className="absolute inset-0 pointer-events-none ability-aura-assault" />
                  )}

                  {/* Premium pixel HP bar system */}
                  <div className="flex flex-col items-center gap-0.5 mb-0.5" style={{ width: TILE_SIZE * 0.85 }}>
                    {/* Shield bar — blue/grey, only when shield active */}
                    {e.shieldHp && e.shieldHp > 0 && (
                      <div className="w-full overflow-hidden" style={{
                        height: 5, background: '#0f172a',
                        border: '1px solid #60a5fa', borderRadius: 1,
                        boxShadow: '0 0 4px #60a5fa80'
                      }}>
                        <div className="h-full transition-none" style={{
                          width: `${Math.max(2, Math.min(100, (e.shieldHp / Math.max(1, e.maxHp * 0.5)) * 100))}%`,
                          background: 'linear-gradient(90deg, #60a5fa 0%, #bfdbfe 60%, #93c5fd 100%)',
                          boxShadow: '0 0 3px #60a5fa',
                        }} />
                      </div>
                    )}
                    {/* HP bar — colour shifts by %, segmented notches */}
                    <div className="w-full relative overflow-hidden" style={{
                      height: e.isBoss ? 9 : 6,
                      background: '#0f172a',
                      border: `1px solid ${e.hp/e.maxHp > 0.5 ? '#166534' : e.hp/e.maxHp > 0.25 ? '#92400e' : '#991b1b'}`,
                      borderRadius: 1
                    }}>
                      <div className="h-full transition-none will-change-[width]" style={{
                        width: `${(e.hp / e.maxHp) * 100}%`,
                        background: e.hp/e.maxHp > 0.65
                          ? 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)'
                          : e.hp/e.maxHp > 0.35
                          ? 'linear-gradient(90deg, #b45309 0%, #f59e0b 100%)'
                          : 'linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)',
                        boxShadow: e.hp/e.maxHp > 0.65 ? '0 0 3px #22c55e80' : e.hp/e.maxHp > 0.35 ? '0 0 3px #f59e0b80' : '0 0 3px #ef444480',
                      }}
                      ref={(el) => { if (el) enemyHpRefs.current.set(e.id, el); else enemyHpRefs.current.delete(e.id); }}
                      />
                      {/* Segment notches at 25%, 50%, 75% */}
                      {[25, 50, 75].map(pct => (
                        <div key={pct} className="absolute top-0 bottom-0 pointer-events-none"
                             style={{ left: `${pct}%`, width: 1, background: 'rgba(0,0,0,0.5)' }} />
                      ))}
                    </div>
                  </div>
                  <div className="drop-shadow-md flex items-center justify-center overflow-hidden"
                       style={{ fontSize: `${TILE_SIZE * 0.52}px`, width: TILE_SIZE * 0.78, height: TILE_SIZE * 0.78 }}>
                    {(((e as any).movementType === 'air') || e.isFlying || e.abilities?.includes('fly')) ? (
                      e.icon
                    ) : getEnemyGifAsset((e as any).name, e.icon) ? (
                      <img
                        src={getEnemyGifAsset((e as any).name, e.icon)}
                        alt={`${(e as any).name || 'enemy'} sprite`}
                        className="h-full w-full object-contain pixel-art"
                        draggable={false}
                      />
                    ) : (
                      e.icon
                    )}
                  </div>
                  
                  {/* Boss indicator (dev: also show catalog bosses e.g. Archon random spawn) */}
                  {(e.bossType || (isDeveloperMode() && e.isBoss)) && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-yellow-300 px-1.5 py-0.5 whitespace-nowrap"
                         style={{ background: '#7c2d12', border: '1px solid #f59e0b', boxShadow: '0 0 6px #f59e0b80', letterSpacing: '0.05em' }}>
                      {e.bossType === 'big' ? '⚠ BOSS ⚠' : e.bossType === 'mini' ? '★ MINI' : '👑 BOSS'}
                    </div>
                  )}
              </div>
              );
          })}

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
                </div>
              </div>
            );
          })()}

          {/* 5. Projectiles */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full z-30 overflow-visible">
              <defs>
                 <radialGradient id="grad-fire" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#ef4444" />
                 </radialGradient>
                 <radialGradient id="grad-energy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#3b82f6" />
                 </radialGradient>
                 <radialGradient id="grad-magic" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                 </radialGradient>
              </defs>

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

              {/* Projectiles */}
              {game.projectiles.map(p => (
                  <ProjectileRenderer key={p.id} projectile={p} tileSize={TILE_SIZE} tick={tick} />
              ))}

              {/* BEAMS / LASERS */}
              {game.towers.filter(t => TOWERS[t.key].type === 'beam' && t.targetId).map(t => {
                    const stats = TOWERS[t.key];
                    const target = game.enemies.find(e => e.id === t.targetId);
                    if(!target) return null;
                    const sx = t.c * TILE_SIZE + TILE_SIZE/2;
                    const sy = t.r * TILE_SIZE + TILE_SIZE/2;
                    // Laser beams extend to stored map-edge endpoint; other beams go to target
                    const beamEndX = (t as any).beamEndX;
                    const beamEndY = (t as any).beamEndY;
                    const ex = beamEndX !== undefined
                      ? beamEndX * TILE_SIZE + TILE_SIZE/2
                      : (target.c + (target.xOffset||0)) * TILE_SIZE + TILE_SIZE/2;
                    const ey = beamEndY !== undefined
                      ? beamEndY * TILE_SIZE + TILE_SIZE/2
                      : (target.r + (target.yOffset||0)) * TILE_SIZE + TILE_SIZE/2;
                    
                    // Ramp intensity based on damage charge
                    const ramp = Math.min(1, (t.damageCharge || 0) / 5);
                    const beamWidth = 3 + ramp * 6;
                    const glowWidth = beamWidth + 8;
                    
                    // Different beam styles based on tower type
                    if (stats.projectileStyle === 'ice') {
                      // Ice beam - blue with frost effect
                      return (
                        <g key={t.id}>
                          {/* Outer frost glow */}
                          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#60a5fa" strokeWidth={glowWidth + 4} opacity={0.12 + ramp * 0.1} />
                          {/* Main beam */}
                          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#93c5fd" strokeWidth={beamWidth} opacity={0.75} />
                          {/* Crystal center */}
                          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#ffffff" strokeWidth={beamWidth * 0.35} opacity={0.85} />
                          {/* Animated dash for energy flow */}
                          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#bfdbfe" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.5}
                            style={{ strokeDashoffset: -(tick * 3) % 10 }} />
                          {/* Frost orbs along beam - seeded, no Math.random() */}
                          {Array.from({ length: 5 }).map((_, i) => {
                            const t_pos = (i + 0.5) / 5;
                            const fpx = sx + (ex - sx) * t_pos + (Math.sin(tick * 0.12 + i * 1.3) * 7);
                            const fpy = sy + (ey - sy) * t_pos + (Math.cos(tick * 0.12 + i * 1.3) * 7);
                            const fr = 2 + Math.sin(tick * 0.2 + i * 2.1) * 1.2;
                            return <circle key={i} cx={fpx} cy={fpy} r={fr} fill="#bfdbfe" opacity={0.7} />;
                          })}
                          {/* Freeze burst at target */}
                          <circle cx={ex} cy={ey} r={13 + ramp * 8} fill="#60a5fa" opacity={0.25}>
                            <animate attributeName="r" values={`${11+ramp*6};${15+ramp*10};${11+ramp*6}`} dur="0.5s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={ex} cy={ey} r={6 + ramp * 4} fill="#bfdbfe" opacity={0.5} />
                        </g>
                      );
                    } else if (stats.projectileStyle === 'lightning') {
                      // Lightning beam - electric with branches
                      const jitter = 15 + ramp * 10;
                      const mx = (sx + ex) / 2 + (Math.sin(tick * 0.5) * jitter);
                      const my = (sy + ey) / 2 + (Math.cos(tick * 0.5) * jitter);
                      const mx2 = (sx + mx) / 2 + (Math.cos(tick * 0.7) * jitter * 0.5);
                      const my2 = (sy + my) / 2 + (Math.sin(tick * 0.7) * jitter * 0.5);
                      const mx3 = (mx + ex) / 2 + (Math.sin(tick * 0.3) * jitter * 0.5);
                      const my3 = (my + ey) / 2 + (Math.cos(tick * 0.3) * jitter * 0.5);
                      
                      return (
                        <g key={t.id}>
                          {/* Glow */}
                          <polyline 
                            points={`${sx},${sy} ${mx2},${my2} ${mx},${my} ${mx3},${my3} ${ex},${ey}`}
                            fill="none" stroke="#fcd34d" strokeWidth={8} opacity={0.2}
                          />
                          {/* Main bolt */}
                          <polyline 
                            points={`${sx},${sy} ${mx2},${my2} ${mx},${my} ${mx3},${my3} ${ex},${ey}`}
                            fill="none" stroke="#facc15" strokeWidth={3 + ramp * 2} opacity={0.8}
                          />
                          {/* White core */}
                          <polyline 
                            points={`${sx},${sy} ${mx2},${my2} ${mx},${my} ${mx3},${my3} ${ex},${ey}`}
                            fill="none" stroke="#ffffff" strokeWidth={1.5} opacity={0.9}
                          />
                          {/* Branch */}
                          <line 
                            x1={mx} y1={my} 
                            x2={mx + Math.sin(tick * 0.4) * 25} y2={my + Math.cos(tick * 0.4) * 25}
                            stroke="#fcd34d" strokeWidth={2} opacity={0.5}
                          />
                          {/* Impact spark */}
                          <circle cx={ex} cy={ey} r={10 + ramp * 6} fill="#facc15" opacity={0.5}>
                            <animate attributeName="opacity" values="0.5;0.8;0.5" dur="0.1s" repeatCount="indefinite" />
                          </circle>
                        </g>
                      );
                    } else {
                      // Fire/laser beam - hot colors with glow
                      const color = stats.color;
                      return (
                        <g key={t.id}>
                          {/* Outer glow */}
                          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={glowWidth} opacity={0.2 + ramp * 0.2} />
                          {/* Core beam */}
                          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={beamWidth} opacity={0.6 + ramp * 0.4} />
                          {/* White hot center */}
                          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#ffffff" strokeWidth={beamWidth * 0.4} opacity={0.5 + ramp * 0.5} />
                          {/* Animated dash for energy flow */}
                          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#ffffff" strokeWidth={1} strokeDasharray="10 5" opacity={0.7} style={{ strokeDashoffset: tick * 2 }} />
                          {/* Impact glow at target */}
                          <circle cx={ex} cy={ey} r={8 + ramp * 12} fill={color} opacity={0.4}>
                            <animate attributeName="r" values={`${8+ramp*10};${12+ramp*16};${8+ramp*10}`} dur="0.3s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={ex} cy={ey} r={(8 + ramp * 12) * 0.5} fill="#ffffff" opacity={0.3} />
                        </g>
                      );
                    }
              })}
          </svg>

          {/* 6. Particles */}
          {game.particles.map(renderParticle)}

          {isTactical && ( <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-grayscale-[0.5] z-0 pointer-events-none"><h2 className="text-6xl font-black text-white/10 uppercase rotate-[-5deg]">Tactical Mode</h2></div> )}
        </div>
        
        {/* GOLD BUTTON */}
        <div className="absolute bottom-8 right-8 z-50">
           <button type="button" onClick={() => game.requestEarnMoney()} disabled={isTactical} className={`group relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${isTactical ? 'grayscale cursor-not-allowed opacity-50' : 'hover:scale-105 active:scale-95 hover:shadow-yellow-500/50'}`}>
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 animate-gradient-x"></div>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {/* Inner content */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 m-[3px] rounded-[13px] px-10 py-4 flex items-center gap-4 border border-yellow-500/20">
                    {/* Icon with glow */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                        <div className="relative bg-gradient-to-br from-yellow-400 to-amber-600 text-yellow-900 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">$</div>
                    </div>
                    {/* Text */}
                    <div className="flex flex-col items-start">
                        <span className="text-yellow-300 font-bold uppercase tracking-wider text-sm drop-shadow-md">獲取資金</span>
                        <span className="text-yellow-500/80 text-[10px] font-mono font-semibold">GET FUNDING</span>
                    </div>
                    {/* Sparkle effect */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                </div>
           </button>
        </div>

      </div>
    </div>
  );
};