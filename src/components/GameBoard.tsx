// src/components/GameBoard.tsx
import React, { useEffect, useState, useRef } from 'react';
import { game } from '../engine/GameEngine'; 
import { TOWERS, THEMES } from '../engine/data';
import { ROWS, COLS } from '../engine/MapGenerator';
import { QuestionModal } from './QuestionModal';
import { soundSystem } from '../engine/SoundSystem';
import { effectManager } from '../engine/EffectManager';
import { i18n } from '../utils/i18n';
import type { Particle } from '../engine/types';
import { ProjectileRenderer } from './ProjectileRenderer';

const TILE_SIZE = 60; // Increased tile size for better visibility
const BOARD_WIDTH = COLS * TILE_SIZE; 
const BOARD_HEIGHT = ROWS * TILE_SIZE;

export const GameBoard: React.FC = () => {
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
  
  // Language State
  const [language, setLanguage] = useState<'en' | 'zh'>(i18n.getLanguage());
  
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    i18n.setLanguage(newLang);
  };

  // --- PERFORMANCE OPTIMIZATION: REFS ---
  // We store direct DOM references to enemies to bypass React's render cycle for movement
  const enemyRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const enemyHpRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Theme Logic
  const themeIndex = Math.min(Math.floor((wave - 1) / 10), THEMES.length - 1);
  const currentTheme = THEMES[themeIndex];

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
      
      if (game.pendingAction && !isModalOpen) setIsModalOpen(true);
      
      // We still tick React to render projectiles/particles and handle spawn/death
      setTick(t => t + 1);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [money, lives, wave, gameSpeed, isTactical, isModalOpen, hitOpacity]);

  // --- HANDLERS ---
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHoverPos(null);
    if (draggingKey && hoverPos) {
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
      if (p.type === 'text') {
        return <div key={p.id} className="absolute pointer-events-none font-black text-[10px] z-50 whitespace-nowrap"
            style={{ left: p.x, top: p.y, color: p.color, textShadow: '0px 2px 2px rgba(0,0,0,0.8)', opacity: p.life / 20 }}>{p.text}</div>;
      }
      if (p.type === 'shockwave') {
          const size = 40 * p.scale * (1 - p.life / p.maxLife);
          return <div key={p.id} className="absolute pointer-events-none rounded-full border-2 z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size, borderColor: p.color, opacity: p.life/p.maxLife }} />;
      }
      if (p.type === 'spark') {
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - 2*p.scale, top: p.y - 2*p.scale, width: 4*p.scale, height: 4*p.scale, background: p.color, opacity: p.life/p.maxLife, boxShadow: `0 0 ${4*p.scale}px ${p.color}` }} />;
      }
      if (p.type === 'smoke') {
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - 3*p.scale, top: p.y - 3*p.scale, width: 6*p.scale, height: 6*p.scale, background: p.color, opacity: p.life/p.maxLife * 0.5, filter: 'blur(2px)' }} />;
      }
      if (p.type === 'muzzle') {
          const isColored = p.color !== '#fff';
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-40"
            style={{ 
                left: p.x - 8, top: p.y - 8, width: 16, height: 16, 
                background: isColored ? p.color : 'white',
                opacity: p.life/p.maxLife * (isColored ? 0.6 : 1), 
                filter: 'blur(1.5px)', 
                boxShadow: `0 0 ${isColored ? '8px' : '12px'} ${p.color}` 
            }} />;
      }
      if (p.type === 'flame') {
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - 3*p.scale, top: p.y - 3*p.scale, width: 6*p.scale, height: 6*p.scale, background: `radial-gradient(circle, ${p.color} 0%, #ff6600 100%)`, opacity: p.life/p.maxLife, boxShadow: `0 0 ${6*p.scale}px ${p.color}` }} />;
      }
      if (p.type === 'debris') {
          return <div key={p.id} className="absolute pointer-events-none z-30"
            style={{ left: p.x - 2*p.scale, top: p.y - 2*p.scale, width: 4*p.scale, height: 4*p.scale, background: p.color, opacity: p.life/p.maxLife, transform: `rotate(${p.life * 10}deg)` }} />;
      }
      if (p.type === 'star') {
          const angle = (p.maxLife - p.life) * 15;
          return <div key={p.id} className="absolute pointer-events-none z-30"
            style={{ left: p.x - 3*p.scale, top: p.y - 3*p.scale, width: 6*p.scale, height: 6*p.scale, opacity: p.life/p.maxLife, transform: `rotate(${angle}deg)` }}>
              <div style={{ width: '100%', height: '100%', background: p.color, clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
            </div>;
      }
      if (p.type === 'impact') {
          const size = 8 * (1 - p.life / p.maxLife);
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-40 border-2"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size, borderColor: p.color, opacity: p.life/p.maxLife, boxShadow: `0 0 ${size*2}px ${p.color}` }} />;
      }
      if (p.type === 'freeze') {
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - 2*p.scale, top: p.y - 2*p.scale, width: 4*p.scale, height: 4*p.scale, background: `radial-gradient(circle, ${p.color} 0%, #bfdbfe 100%)`, opacity: p.life/p.maxLife, boxShadow: `0 0 ${4*p.scale}px ${p.color}` }} />;
      }
      if (p.type === 'poison_cloud') {
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - 4*p.scale, top: p.y - 4*p.scale, width: 8*p.scale, height: 8*p.scale, background: p.color, opacity: p.life/p.maxLife * 0.6, filter: 'blur(3px)' }} />;
      }
      if (p.type === 'electric') {
          return <div key={p.id} className="absolute pointer-events-none z-30"
            style={{ left: p.x - 2*p.scale, top: p.y - 2*p.scale, width: 4*p.scale, height: 4*p.scale, background: p.color, opacity: p.life/p.maxLife, boxShadow: `0 0 ${6*p.scale}px ${p.color}`, filter: 'blur(1px)' }} />;
      }
      if (p.type === 'magic_burst') {
          const size = 30 * p.scale * (1 - p.life / p.maxLife);
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size, background: `radial-gradient(circle, ${p.color} 0%, transparent 100%)`, opacity: p.life/p.maxLife }} />;
      }
      if (p.type === 'shadow_cloud') {
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - 5*p.scale, top: p.y - 5*p.scale, width: 10*p.scale, height: 10*p.scale, background: p.color, opacity: p.life/p.maxLife * 0.4, filter: 'blur(4px)' }} />;
      }
      if (p.type === 'void_ring') {
          const size = 50 * p.scale * (1 - p.life / p.maxLife);
          return <div key={p.id} className="absolute pointer-events-none rounded-full border z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size, borderColor: p.color, borderWidth: 2, opacity: p.life/p.maxLife }} />;
      }
      if (p.type === 'holy_light') {
          const size = 25 * p.scale * (1 - p.life / p.maxLife);
          return <div key={p.id} className="absolute pointer-events-none z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size, background: `radial-gradient(circle, ${p.color} 0%, transparent 100%)`, opacity: p.life/p.maxLife, boxShadow: `0 0 ${size}px ${p.color}` }} />;
      }
      if (p.type === 'blast') {
          const size = 60 * p.scale * (1 - p.life / p.maxLife);
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-30 border-2"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size, borderColor: p.color, opacity: p.life/p.maxLife, boxShadow: `0 0 ${size/2}px ${p.color}` }} />;
      }
      if (p.type === 'splash') {
          const size = 40 * p.scale * (1 - p.life / p.maxLife);
          return <div key={p.id} className="absolute pointer-events-none rounded-full z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size, background: p.color, opacity: p.life/p.maxLife * 0.3, filter: 'blur(2px)' }} />;
      }
      if (p.type === 'shard') {
          const angle = (p.maxLife - p.life) * 20;
          return <div key={p.id} className="absolute pointer-events-none z-30"
            style={{ left: p.x - 2*p.scale, top: p.y - 2*p.scale, width: 4*p.scale, height: 4*p.scale, background: p.color, opacity: p.life/p.maxLife, transform: `rotate(${angle}deg)`, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />;
      }
      if (p.type === 'beam') {
          const size = 20 * p.scale * (1 - p.life / p.maxLife);
          return <div key={p.id} className="absolute pointer-events-none z-30 rounded-full"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size, background: `radial-gradient(circle, ${p.color} 0%, transparent 100%)`, opacity: p.life/p.maxLife, boxShadow: `0 0 ${size}px ${p.color}` }} />;
      }
      if (p.type === 'ripple') {
          const size = 35 * p.scale * (1 - p.life / p.maxLife);
          return <div key={p.id} className="absolute pointer-events-none rounded-full border z-30"
            style={{ left: p.x - size/2, top: p.y - size/2, width: size, height: size, borderColor: p.color, borderWidth: 1, opacity: p.life/p.maxLife }} />;
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

      <QuestionModal isOpen={isModalOpen} onSuccess={() => { game.confirmAction(); setIsModalOpen(false); }} onClose={() => { game.cancelAction(); setIsModalOpen(false); }} theme={currentTheme.name} />

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
           <div className="flex justify-between items-center mt-1 opacity-70 text-xs">
               <span>{i18n.t('game.wave')}: {currentTheme.name}</span>
               {!waveInProgress && <span className="text-yellow-400 font-bold animate-pulse">{i18n.t('game.nextWaveIn')}: {(waveCountdown/60).toFixed(1)}s</span>}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {Object.entries(TOWERS).map(([key, tower]) => {
            const canAfford = money >= tower.cost;
            return (
                <div key={key} draggable={canAfford} onDragStart={(e) => { if(canAfford) { setDraggingKey(key); e.dataTransfer.setData('text', key); }}}
                className={`relative p-2 rounded-lg border flex items-center gap-3 transition-all group ${canAfford ? 'border-slate-600 bg-slate-800/50 hover:bg-slate-700 cursor-grab active:cursor-grabbing' : 'border-transparent opacity-40 grayscale cursor-not-allowed'}`}>
                <div className="text-2xl h-10 w-10 flex items-center justify-center bg-slate-950 rounded shadow group-hover:scale-110 transition-transform">{tower.icon}</div>
                <div className="flex-1">
                    <div className="font-bold text-sm text-slate-200">{tower.name}</div>
                    <div className="flex justify-between items-center"><span className="text-xs text-emerald-400 font-mono">${tower.cost}</span></div>
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
                <span className="text-2xl">💵</span><span className="text-emerald-400 font-bold text-xl">${money}</span>
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
               <h1 className="text-6xl font-black text-white stroke-black drop-shadow-xl animate-bounce">
                   {game.notification}
               </h1>
           </div>
        )}

        {/* --- BOARD --- */}
        <div className="relative shadow-2xl transition-all duration-300"
             style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, border: '4px solid #1e293b', backgroundColor: '#0f172a' }}
             onDragOver={handleDragOver} onDragLeave={() => setHoverPos(null)} onDrop={handleDrop}>
          
          {/* 1. Grid */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, ${TILE_SIZE}px)`, gridTemplateRows: `repeat(${ROWS}, ${TILE_SIZE}px)` }}>
              {game.map.map((row, r) => row.map((cell, c) => {
                  let className = `${currentTheme.bg} ${currentTheme.grid} border-[0.5px] border-opacity-20`;
                  if (cell !== 0 && cell !== 'S' && cell !== 'B') className = `${currentTheme.path} ${currentTheme.grid} border-none shadow-inner`;
                  
                  return (
                    <div key={`${r}-${c}`} className={`${className} flex items-center justify-center text-xs opacity-80`}>
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

          {/* 2. Ghost */}
          {ghost && (
             <div className="absolute pointer-events-none z-40 transition-all duration-75" 
                  style={{ left: hoverPos!.c * TILE_SIZE, top: hoverPos!.r * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
                <div className={`absolute rounded-full border-2 opacity-40 transition-colors ${ghost.isValid ? 'bg-emerald-500/30 border-emerald-400' : 'bg-rose-500/30 border-rose-400'}`}
                     style={{ width: ghost.rangePx * 2, height: ghost.rangePx * 2, top: TILE_SIZE/2 - ghost.rangePx, left: TILE_SIZE/2 - ghost.rangePx }} />
                <div className="w-full h-full flex items-center justify-center text-2xl opacity-80">{ghost.stats.icon}</div>
             </div>
          )}

          {/* 3. Towers */}
          {game.towers.map(t => {
             const stats = TOWERS[t.key];
             const isSelected = selectedTowerId === t.id;
             let invest = stats.cost; for(let i=1; i<t.level; i++) invest += Math.floor(stats.cost * 1.5 * i);
             const sellPrice = Math.floor(invest * Math.max(0.5, 0.85 - (t.level * 0.05)));
             const upgradeCost = Math.floor(stats.cost * 1.5 * t.level);
             const auraColor = effectManager.getTowerAuraColor(t);

             return (
                 <div key={t.id} className="absolute z-10" style={{ left: t.c * TILE_SIZE, top: t.r * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}>
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
                     <div onClick={() => setSelectedTowerId(isSelected ? null : t.id)} 
                          className={`w-full h-full flex items-center justify-center text-2xl cursor-pointer hover:scale-110 transition-transform ${isSelected ? 'ring-2 ring-yellow-400 bg-yellow-400/20 rounded-lg' : ''}`}>
                          {stats.icon}
                          {t.level > 1 && <div className="absolute -top-1 -right-1 bg-blue-600 text-[8px] px-1 rounded-full text-white border border-blue-400">{t.level}</div>}
                     </div>
                     {isSelected && (
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 border border-slate-500 p-2 rounded shadow-2xl z-50 flex flex-col gap-1 w-32 animate-in fade-in zoom-in duration-100">
                             <div className="text-[10px] text-center text-slate-300 mb-1 border-b border-slate-600 pb-1">{i18n.t('tower.range')}: {Math.floor(t.range)} | {i18n.t('tower.damage')}: {t.damage}</div>
                             <button onClick={() => { game.requestUpgradeTower(t.id); setSelectedTowerId(null); }} className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] py-1 rounded font-bold">{i18n.t('game.upgrade')} (${upgradeCost})</button>
                             <button onClick={() => { game.sellTower(t.id); setSelectedTowerId(null); }} className="bg-red-900/80 hover:bg-red-800 text-red-100 text-[10px] py-1 rounded border border-red-800">{i18n.t('game.sell')} (+${sellPrice})</button>
                         </div>
                     )}
                     {isSelected && <div className="absolute rounded-full border border-white/30 bg-white/5 pointer-events-none" style={{ width: stats.range * TILE_SIZE * 2 * (1 + (t.level-1)*0.1), height: stats.range * TILE_SIZE * 2 * (1 + (t.level-1)*0.1), top: TILE_SIZE/2 - (stats.range * TILE_SIZE * (1 + (t.level-1)*0.1)), left: TILE_SIZE/2 - (stats.range * TILE_SIZE * (1 + (t.level-1)*0.1)), zIndex: -1 }} /> }
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
                      if (el) enemyRefs.current.set(e.id, el);
                      else enemyRefs.current.delete(e.id);
                  }}
                  className="absolute pointer-events-none flex flex-col items-center justify-center z-20 will-change-transform"
                  style={{ 
                      // Initial Position Only. Direct DOM manipulation handles movement updates.
                      left: 0, top: 0, width: TILE_SIZE, height: TILE_SIZE,
                      transform: `translate3d(${(e.c + (e.xOffset||0)) * TILE_SIZE}px, ${(e.r + (e.yOffset||0)) * TILE_SIZE}px, 0)` 
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
                  <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden mb-0.5 border border-slate-600">
                      <div 
                        className="h-full bg-rose-500 will-change-[width]" 
                        style={{ width: `${(e.hp / e.maxHp) * 100}%` }} 
                        ref={(el) => {
                             if (el) enemyHpRefs.current.set(e.id, el);
                             else enemyHpRefs.current.delete(e.id);
                        }}
                      />
                  </div>
                  <div className="text-2xl drop-shadow-md">{e.icon}</div>
              </div>
              );
          })}

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

              {game.projectiles.map(p => (
                  <ProjectileRenderer key={p.id} projectile={p} tileSize={TILE_SIZE} tick={tick} />
              ))}

              {/* BEAMS / LASERS */}
              {game.towers.filter(t => TOWERS[t.key].type === 'beam' && t.targetId).map(t => {
                    const target = game.enemies.find(e => e.id === t.targetId);
                    if(!target) return null;
                    const sx = t.c * TILE_SIZE + TILE_SIZE/2;
                    const sy = t.r * TILE_SIZE + TILE_SIZE/2;
                    const ex = (target.c + (target.xOffset||0)) * TILE_SIZE + TILE_SIZE/2;
                    const ey = (target.r + (target.yOffset||0)) * TILE_SIZE + TILE_SIZE/2;
                    
                    return ( <g key={t.id}> <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={TOWERS[t.key].color} strokeWidth="3" opacity="0.5" /> <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="white" strokeWidth="1" strokeDasharray="5" className="animate-dash" /> <circle cx={ex} cy={ey} r={Math.random()*4+2} fill="white" /> </g> );
              })}
          </svg>

          {/* 6. Particles */}
          {game.particles.map(renderParticle)}

          {isTactical && ( <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-grayscale-[0.5] z-0 pointer-events-none"><h2 className="text-6xl font-black text-white/10 uppercase rotate-[-5deg]">Tactical Mode</h2></div> )}
        </div>
        
        {/* GOLD BUTTON */}
        <div className="absolute bottom-8 right-8 z-50">
           <button onClick={() => game.requestEarnMoney()} disabled={isTactical} className={`group relative overflow-hidden rounded-xl shadow-2xl transition-transform active:scale-95 ${isTactical ? 'grayscale cursor-not-allowed' : 'hover:-translate-y-1'}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-500 animate-pulse"></div>
                <div className="relative bg-slate-900 m-[2px] rounded-[10px] px-8 py-3 flex items-center gap-3">
                    <div className="bg-yellow-500 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">$</div>
                    <div className="flex flex-col items-start"><span className="text-yellow-400 font-bold uppercase tracking-wider text-sm">獲取資金</span><span className="text-yellow-600 text-[10px] font-mono">GET FUNDING</span></div>
                </div>
           </button>
        </div>

      </div>
    </div>
  );
};