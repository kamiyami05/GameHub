import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getRankInfo } from '@/lib/supabase';
import { audio } from '@/lib/audio';
import { useAuthStore } from '@/store/authStore';

export default function Lobby({ onSelectGame }) {
  const { profile } = useAuthStore();
  const caroRank = getRankInfo(profile?.caro_elo || 1000);

  const handleLaunch = (screen) => {
    audio.playClick();
    onSelectGame(screen);
  };

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn pb-8">
      {/* Game Directory Section Header */}
      <div className="w-full flex items-center justify-between mb-6 px-1">
        <div>
          <span className="section-kicker">★ Game Portal</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
            Danh Sách Trò Chơi
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">3 AVAILABLE GAMES</span>
      </div>

      {/* Main 3 Game Cards Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Game 1: Caro */}
        <div
          onClick={() => handleLaunch('caro')}
          className="group bg-[#1c1f27]/90 backdrop-blur-md hover:bg-[#242833] border border-[#3e4248] hover:border-sky-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1.5 flex flex-col justify-between shadow-lg hover:shadow-sky-500/10"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">⚔️</span>
              <span className="tier-badge tier-S px-2.5 py-1 text-xs font-bold">RANK ELO</span>
            </div>

            <h3 className="text-xl font-black text-slate-100 group-hover:text-sky-400 transition-colors">
              Cờ Caro 20x20 AI
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-2.5 leading-relaxed">
              Bàn cờ chiến 20x20 với thuật toán Minimax Alpha-Beta 3 cấp độ. Thắng cộng, thua trừ điểm Elo thích ứng.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#3e4248]/80 flex items-center justify-between">
            <div className="text-xs font-mono">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Kỷ lục của bạn</span>
              <span className="font-bold text-sky-400 text-sm">{profile?.caro_elo || 1000} Elo ({caroRank.name})</span>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-[#14161b] border border-[#3e4248] flex items-center justify-center group-hover:border-sky-500/50 group-hover:bg-sky-600 transition-all shadow-sm">
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Game 2: 2048 */}
        <div
          onClick={() => handleLaunch('2048')}
          className="group bg-[#1c1f27]/90 backdrop-blur-md hover:bg-[#242833] border border-[#3e4248] hover:border-amber-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1.5 flex flex-col justify-between shadow-lg hover:shadow-amber-500/10"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">🔢</span>
              <span className="tier-badge tier-A px-2.5 py-1 text-xs font-bold">HIGHSCORE</span>
            </div>

            <h3 className="text-xl font-black text-slate-100 group-hover:text-amber-400 transition-colors">
              2048 Classic
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-2.5 leading-relaxed">
              Ghép các khối số trên bàn cờ 4x4 bằng phím mũi tên hoặc vuốt cảm ứng mobile để chinh phục điểm kỷ lục.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#3e4248]/80 flex items-center justify-between">
            <div className="text-xs font-mono">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Điểm cao nhất</span>
              <span className="font-bold text-amber-400 text-sm">{profile?.game_2048_highscore || 0} điểm</span>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-[#14161b] border border-[#3e4248] flex items-center justify-center group-hover:border-amber-500/50 group-hover:bg-amber-600 transition-all shadow-sm">
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        {/* Game 3: Minesweeper */}
        <div
          onClick={() => handleLaunch('minesweeper')}
          className="group bg-[#1c1f27]/90 backdrop-blur-md hover:bg-[#242833] border border-[#3e4248] hover:border-emerald-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1.5 flex flex-col justify-between shadow-lg hover:shadow-emerald-500/10"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">💣</span>
              <span className="tier-badge tier-B px-2.5 py-1 text-xs font-bold">SPEEDRUN</span>
            </div>

            <h3 className="text-xl font-black text-slate-100 group-hover:text-emerald-400 transition-colors">
              Dò Mìn (Minesweeper)
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-2.5 leading-relaxed">
              3 cấp độ logic tác chiến, nước đầu luôn an toàn 100%, nút cắm cờ chuyên dụng mobile, tính thời gian Speedrun.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#3e4248]/80 flex items-center justify-between">
            <div className="text-xs font-mono">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Thời gian tốt nhất</span>
              <span className="font-bold text-emerald-400 text-sm">
                {profile?.minesweeper_best_time ? `${profile.minesweeper_best_time}s` : '--'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-[#14161b] border border-[#3e4248] flex items-center justify-center group-hover:border-emerald-500/50 group-hover:bg-emerald-600 transition-all shadow-sm">
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
