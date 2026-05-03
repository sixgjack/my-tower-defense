// src/components/TowerLiveDemo.tsx
// Enhanced live demo using MiniGameBoard for accurate rendering
import React from 'react';
import type { TowerStats } from '../engine/types';
import { MiniGameBoard } from './MiniGameBoard';

interface TowerLiveDemoProps {
  tower: TowerStats;
  width?: number;
  height?: number;
}

export const TowerLiveDemo: React.FC<TowerLiveDemoProps> = ({ 
  tower, 
  width = 500, 
  height = 300 
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl p-4 border-2 border-slate-700/50 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-slate-200 text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Live Demo / 實戰演示
        </div>
        <div className="text-xs text-slate-500">Watch the tower in action</div>
      </div>
      <MiniGameBoard tower={tower} width={width} height={height} />
    </div>
  );
};
