import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { audio } from '@/lib/audio';
import { useAuthStore } from '@/store/authStore';

export default function Lobby({ onSelectGame }) {
  const { profile } = useAuthStore();

  const handleLaunch = (screen) => {
    audio.playClick();
    onSelectGame(screen);
  };

  const games = [
    {
      id: 'caro',
      name: 'Cờ Caro',
      icon: '⚔️',
      statLabel: 'Elo',
      statValue: `${profile?.caro_elo || 1000}`
    },
    {
      id: '2048',
      name: '2048',
      icon: '🔢',
      statLabel: 'Kỷ lục',
      statValue: `${profile?.game_2048_highscore || 0}`
    },
    {
      id: 'minesweeper',
      name: 'Dò Mìn',
      icon: '💣',
      statLabel: 'Thời gian',
      statValue: profile?.minesweeper_best_time ? `${profile.minesweeper_best_time}s` : '--'
    }
  ];

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn py-2">
      {/* Title */}
      <div className="w-full mb-5 px-1">
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">
          Trò chơi
        </h1>
      </div>

      {/* Clean 3 Game Cards Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
        {games.map(g => (
          <div
            key={g.id}
            onClick={() => handleLaunch(g.id)}
            className="group bg-[#14161f]/90 hover:bg-[#1a1d28] border border-[#232734] hover:border-slate-500/50 rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-3xl">{g.icon}</span>
              <div className="w-8 h-8 rounded-xl bg-[#1b1e2a] border border-[#282d3d] flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-slate-500 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
                {g.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-slate-400">
                <span>{g.statLabel}:</span>
                <span className="font-semibold text-slate-200">{g.statValue}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
