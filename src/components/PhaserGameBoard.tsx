// src/components/PhaserGameBoard.tsx
// Phaser-based game board with hardware-accelerated rendering
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../phaser/GameScene';
import { game } from '../engine/GameEngine';
import { TOWERS, THEMES } from '../engine/data';
import { QuestionModal } from './QuestionModal';
import { GameOverModal } from './GameOverModal';
import { BuffSelectionModal } from './BuffSelectionModal';
import { soundSystem } from '../engine/SoundSystem';
import { i18n, getTowerName } from '../utils/i18n';
import { getThemeDescription } from '../utils/themeHelpers';

interface PhaserGameBoardProps {
  onGameEnd?: (result?: { wave: number; enemiesKilled: number; moneyEarned: number; towersBuilt: number }) => void;
  questionSetId?: string;
  allowedTowers?: string[];
}

export const PhaserGameBoard: React.FC<PhaserGameBoardProps> = ({ 
  onGameEnd, 
  questionSetId = 'mixed', 
  allowedTowers 
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  
  // React state for UI elements
  const [tick, setTick] = useState(0);
  const [money, setMoney] = useState(game.money);
  const [lives, setLives] = useState(game.lives);
  const [wave, setWave] = useState(game.wave);
  const [gameSpeed, setGameSpeed] = useState(game.gameSpeed);
  const [isTactical, setIsTactical] = useState(game.isTacticalMode);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGameOver, setIsGameOver] = useState(game.isGameOver);
  const [showBuffSelection, setShowBuffSelection] = useState(game.showBuffSelection);
  const [waveCountdown, setWaveCountdown] = useState(game.waveCountdown);
  const [waveInProgress, setWaveInProgress] = useState(game.waveInProgress);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'zh'>(i18n.getLanguage());

  // Theme
  const themeIndex = Math.min(Math.floor((wave - 1) / 10), THEMES.length - 1);
  const currentTheme = THEMES[themeIndex];

  // Initialize Phaser
  useEffect(() => {
    if (!gameContainerRef.current || phaserGameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#020617',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [GameScene],
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      render: {
        antialias: true,
        pixelArt: false,
      }
    };

    phaserGameRef.current = new Phaser.Game(config);

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  // Sync dragging state to Phaser
  useEffect(() => {
    if (phaserGameRef.current) {
      phaserGameRef.current.registry.set('draggingParams', draggingKey);
    }
  }, [draggingKey]);

  // Sync game speed to Phaser
  useEffect(() => {
    if (phaserGameRef.current) {
      phaserGameRef.current.registry.set('speed', gameSpeed);
    }
  }, [gameSpeed]);

  // Game state sync loop
  useEffect(() => {
    const initAudio = () => { soundSystem.init(); window.removeEventListener('click', initAudio); };
    window.addEventListener('click', initAudio);

    const interval = setInterval(() => {
      // Sync from game engine
      if (game.money !== money) setMoney(game.money);
      if (game.lives !== lives) setLives(game.lives);
      if (game.wave !== wave) setWave(game.wave);
      if (game.gameSpeed !== gameSpeed) setGameSpeed(game.gameSpeed);
      if (game.isTacticalMode !== isTactical) setIsTactical(game.isTacticalMode);
      if (game.isGameOver !== isGameOver) setIsGameOver(game.isGameOver);
      if (game.showBuffSelection !== showBuffSelection) setShowBuffSelection(game.showBuffSelection);
      
      setWaveCountdown(game.waveCountdown);
      setWaveInProgress(game.waveInProgress);
      
      if (game.pendingAction && !isModalOpen) setIsModalOpen(true);
      
      setTick(t => t + 1);
    }, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', initAudio);
    };
  }, [money, lives, wave, gameSpeed, isTactical, isModalOpen, isGameOver, showBuffSelection]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    i18n.setLanguage(newLang);
  };

  const handleDragStart = (key: string) => {
    if (money >= TOWERS[key].cost) {
      setDraggingKey(key);
    }
  };

  const handleDragEnd = () => {
    setDraggingKey(null);
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${currentTheme.bg} text-slate-100 font-sans select-none transition-colors duration-1000 relative`}>
      
      {/* Modals */}
      <QuestionModal 
        isOpen={isModalOpen} 
        onSuccess={() => { game.confirmAction(); setIsModalOpen(false); }} 
        onClose={() => { game.cancelAction(); setIsModalOpen(false); }} 
        theme={currentTheme.name} 
        questionSetId={questionSetId} 
      />
      
      <BuffSelectionModal 
        isOpen={showBuffSelection}
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
              moneyEarned: game.totalMoneyEarned
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

      {/* Sidebar - Tower Selection */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-slate-700 bg-slate-900/95 z-20 shadow-xl">
        <div className="p-4 border-b border-slate-700 bg-slate-950">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {i18n.t('game.title')}
            </h1>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">Phaser</span>
              <button 
                onClick={toggleLanguage}
                className="px-2 py-1 text-xs rounded border border-slate-600 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {language === 'en' ? '中' : 'EN'}
              </button>
            </div>
          </div>
          
          {/* Home Button */}
          <button
            onClick={() => {
              if (onGameEnd) {
                onGameEnd({
                  wave: game.wave,
                  towersBuilt: game.towers.length,
                  enemiesKilled: game.totalEnemiesKilled,
                  moneyEarned: game.totalMoneyEarned
                });
              }
            }}
            className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span>🏠</span>
            <span>{language === 'zh' ? '返回大廳' : 'Home'}</span>
          </button>
          
          <div className="flex justify-between items-center mt-2 opacity-70 text-xs">
            <span>{language === 'zh' && currentTheme.nameZh ? currentTheme.nameZh : currentTheme.name}</span>
            {!waveInProgress && (
              <span className="text-yellow-400 font-bold animate-pulse">
                {i18n.t('game.nextWaveIn')}: {(waveCountdown/60).toFixed(1)}s
              </span>
            )}
          </div>
          
          {/* Environment Effects */}
          {(currentTheme.towerCooldownMultiplier || currentTheme.towerRangeMultiplier || 
            currentTheme.towerDamageMultiplier || currentTheme.enemySpeedMultiplier || 
            currentTheme.enemyHpMultiplier || currentTheme.moneyBonus) && (
            <div className="p-2 mt-2 bg-slate-800/50 rounded text-xs text-slate-400">
              {getThemeDescription(currentTheme)}
            </div>
          )}
        </div>
        
        {/* Tower List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {(allowedTowers && allowedTowers.length > 0 
            ? allowedTowers.map(key => [key, TOWERS[key]] as [string, typeof TOWERS[string]])
            : Object.entries(TOWERS)
          ).map(([key, tower]) => {
            const canAfford = money >= tower.cost;
            return (
              <div 
                key={key} 
                draggable={canAfford}
                onDragStart={() => handleDragStart(key)}
                onDragEnd={handleDragEnd}
                className={`relative p-2 rounded-lg border flex items-center gap-3 transition-all group ${
                  canAfford 
                    ? 'border-slate-600 bg-slate-800/50 hover:bg-slate-700 cursor-grab active:cursor-grabbing' 
                    : 'border-transparent opacity-40 grayscale cursor-not-allowed'
                }`}
              >
                <div className="text-2xl h-10 w-10 flex items-center justify-center bg-slate-950 rounded shadow group-hover:scale-110 transition-transform">
                  {tower.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-slate-200">{getTowerName(key)}</div>
                  <span className="text-xs text-emerald-400 font-mono">${tower.cost}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Area - Phaser Canvas */}
      <div className="flex-1 relative bg-black/40 flex flex-col items-center justify-center p-4">
        
        {/* HUD */}
        <div className="absolute top-4 w-full max-w-4xl flex justify-between px-4 z-30 pointer-events-none">
          <div className="flex gap-4 pointer-events-auto">
            <div className="bg-slate-900/90 border border-slate-600 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 min-w-[120px]">
              <span className="text-2xl">💵</span>
              <span className="text-emerald-400 font-bold text-xl">${money}</span>
            </div>
            <div className={`bg-slate-900/90 border border-slate-600 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${lives < 2 ? 'border-red-500 bg-red-900/50 animate-bounce' : ''}`}>
              <span className="text-2xl">❤️</span>
              <span className={`font-bold text-xl ${lives < 2 ? 'text-red-200' : 'text-rose-400'}`}>{lives}</span>
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

            <button 
              onClick={() => game.toggleTacticalMode()} 
              className={`px-4 py-2 rounded font-bold border transition-all ${
                isTactical 
                  ? 'bg-amber-600 border-amber-400 text-white animate-pulse' 
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isTactical ? `⏸ ${i18n.t('game.paused')}` : `▶ ${i18n.t('game.play')}`}
            </button>

            <div className="flex bg-slate-900 rounded border border-slate-700 overflow-hidden">
              {[0.5, 1, 2, 4].map(s => (
                <button 
                  key={s} 
                  onClick={() => game.gameSpeed = s} 
                  className={`px-3 py-2 text-xs font-bold hover:bg-slate-700 ${gameSpeed === s ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Phaser Game Container */}
        <div 
          ref={gameContainerRef}
          className="w-full h-full"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggingKey && phaserGameRef.current) {
              const scene = phaserGameRef.current.scene.getScene('GameScene');
              if (scene) {
                const pointer = scene.input.activePointer;
                const TILE = 64;
                const c = Math.floor(pointer.worldX / TILE);
                const r = Math.floor(pointer.worldY / TILE);
                game.requestBuildTower(r, c, draggingKey);
              }
            }
            setDraggingKey(null);
          }}
        />

        {/* Gold Button */}
        <div className="absolute bottom-8 right-8 z-50">
          <button 
            onClick={() => game.requestEarnMoney()} 
            disabled={isTactical} 
            className={`group relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${
              isTactical 
                ? 'grayscale cursor-not-allowed opacity-50' 
                : 'hover:scale-105 active:scale-95 hover:shadow-yellow-500/50'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 m-[3px] rounded-[13px] px-10 py-4 flex items-center gap-4 border border-yellow-500/20">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-yellow-400 to-amber-600 text-yellow-900 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">$</div>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-yellow-300 font-bold uppercase tracking-wider text-sm drop-shadow-md">獲取資金</span>
                <span className="text-yellow-500/80 text-[10px] font-mono font-semibold">GET FUNDING</span>
              </div>
            </div>
          </button>
        </div>

        {/* Tactical Mode Overlay */}
        {isTactical && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 backdrop-grayscale-[0.5] z-10 pointer-events-none">
            <h2 className="text-6xl font-black text-white/10 uppercase rotate-[-5deg]">Tactical Mode</h2>
          </div>
        )}
      </div>
    </div>
  );
};
