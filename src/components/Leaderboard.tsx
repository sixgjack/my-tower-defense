// src/components/Leaderboard.tsx
import React, { useEffect, useState, useCallback } from 'react';
import type { GoogleUser } from '../services/googleAuth';
import { getAllStudentsForLeaderboard, updateStudentDisplayName } from '../services/postgresDatabase';
import type { StudentStatus } from '../services/postgresDatabase';

interface LeaderboardProps {
  user: GoogleUser;
  onBack: () => void;
  language?: string;
}

const RANK_ICONS = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [
  'from-yellow-500/30 to-amber-600/30 border-yellow-400/50',
  'from-slate-300/20 to-slate-400/20 border-slate-300/40',
  'from-amber-600/20 to-orange-700/20 border-amber-600/40',
];

type SortKey = 'highestWave' | 'totalEnemiesKilled' | 'totalGames' | 'credits';

export const Leaderboard: React.FC<LeaderboardProps> = ({ user, onBack, language = 'en' }) => {
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('highestWave');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  const zh = language === 'zh-TW';

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getAllStudentsForLeaderboard();
    if (result.success && result.data) {
      setStudents(result.data);
      const me = result.data.find(s => s.userId === user.uid);
      setNameInput(me?.displayName || user.displayName || '');
    }
    setLoading(false);
  }, [user.uid, user.displayName]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...students].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSavingName(true);
    await updateStudentDisplayName(user.uid, nameInput.trim());
    setSavingName(false);
    setEditingName(false);
    await load();
  };

  const SORT_OPTIONS: { key: SortKey; label: string; labelZh: string; icon: string }[] = [
    { key: 'highestWave', label: 'Highest Wave', labelZh: '最高波次', icon: '🌊' },
    { key: 'totalEnemiesKilled', label: 'Enemies Killed', labelZh: '擊殺敵人', icon: '💀' },
    { key: 'totalGames', label: 'Games Played', labelZh: '遊戲場數', icon: '🎮' },
    { key: 'credits', label: 'Credits', labelZh: '積分', icon: '💰' },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 overflow-y-auto">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20 font-semibold"
          >
            ← {zh ? '返回' : 'Back'}
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              {zh ? '排行榜' : 'Leaderboard'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {zh ? '本地裝置排名' : 'Local device rankings'}
            </p>
          </div>
        </div>

        {/* Display name edit */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">{zh ? '你的顯示名稱：' : 'Your display name:'}</span>
            {editingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="flex-1 bg-slate-800 text-white px-3 py-1 rounded-lg border border-slate-600 text-sm outline-none focus:border-emerald-400"
                  maxLength={24}
                  autoFocus
                />
                <button type="button" onClick={handleSaveName} disabled={savingName} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors">
                  {savingName ? '...' : (zh ? '儲存' : 'Save')}
                </button>
                <button type="button" onClick={() => setEditingName(false)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
                  {zh ? '取消' : 'Cancel'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">{nameInput || user.displayName || user.uid.slice(0, 8)}</span>
                <button type="button" onClick={() => setEditingName(true)} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors px-2 py-0.5 rounded border border-slate-600 hover:border-emerald-400">
                  ✏️ {zh ? '編輯' : 'Edit'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sort tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                sortBy === opt.key
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {opt.icon} {zh ? opt.labelZh : opt.label}
            </button>
          ))}
        </div>

        {/* Leaderboard table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-400" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="text-5xl mb-4">🏆</div>
            <div>{zh ? '尚無記錄。開始遊戲！' : 'No records yet. Start playing!'}</div>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((student, idx) => {
              const isMe = student.userId === user.uid;
              const rankColor = idx < 3 ? RANK_COLORS[idx] : 'from-slate-800/40 to-slate-700/40 border-slate-600/30';
              const rankIcon = idx < 3 ? RANK_ICONS[idx] : `#${idx + 1}`;
              const displayName = student.displayName || (isMe ? (user.displayName || 'You') : `Player ${student.userId.slice(0, 6)}`);

              return (
                <div
                  key={student.userId}
                  className={`relative bg-gradient-to-r ${rankColor} backdrop-blur-md rounded-2xl border p-4 transition-all ${isMe ? 'ring-2 ring-emerald-400/50' : ''}`}
                >
                  {isMe && (
                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                      {zh ? '你' : 'YOU'}
                    </span>
                  )}
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-12 h-12 flex items-center justify-center text-2xl font-black shrink-0">
                      {rankIcon}
                    </div>

                    {/* Name + stats */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-lg truncate">{displayName}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <span className="text-slate-400 text-xs">🌊 Wave {student.highestWave}</span>
                        <span className="text-slate-400 text-xs">💀 {student.totalEnemiesKilled.toLocaleString()}</span>
                        <span className="text-slate-400 text-xs">🎮 {student.totalGames}</span>
                        <span className="text-slate-400 text-xs">💰 {student.credits}</span>
                      </div>
                    </div>

                    {/* Primary stat */}
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black text-white">
                        {sortBy === 'totalEnemiesKilled'
                          ? student.totalEnemiesKilled.toLocaleString()
                          : sortBy === 'credits'
                          ? student.credits.toLocaleString()
                          : sortBy === 'totalGames'
                          ? student.totalGames
                          : student.highestWave}
                      </div>
                      <div className="text-xs text-slate-500">
                        {SORT_OPTIONS.find(o => o.key === sortBy)?.icon}
                      </div>
                    </div>
                  </div>

                  {/* Tower count badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      🏰 {student.unlockedTowers.length} {zh ? '防禦塔已解鎖' : 'towers unlocked'}
                    </span>
                    {student.lastPlayed && (
                      <span className="text-xs text-slate-600">
                        · {new Date(student.lastPlayed).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Refresh */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={load}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all text-sm"
          >
            ↺ {zh ? '刷新' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
};
