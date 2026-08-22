import React, { useState } from 'react';
import { Play, BookOpen, Trophy, LogOut, ArrowLeft } from 'lucide-react';
import { audio } from '@/lib/audio';

export default function GamePortalMenu({
  title,
  icon,
  tagline,
  difficulties = null, // array of { id, label, sublabel } or null
  onStartGame,
  onOpenInstructions,
  onOpenLeaderboard,
  onExit
}) {
  const [selectedDiff, setSelectedDiff] = useState(difficulties ? difficulties[1]?.id || difficulties[0]?.id : null);
  const [showDiffPicker, setShowDiffPicker] = useState(false);

  const handlePlayClick = () => {
    audio.playClick();
    if (difficulties && !showDiffPicker) {
      setShowDiffPicker(true);
    } else {
      onStartGame(selectedDiff);
    }
  };

  const handleStartWithDiff = (diffId) => {
    audio.playClick();
    setSelectedDiff(diffId);
    onStartGame(diffId);
  };

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-4 animate-fadeIn">
      {/* Game Title with Heroic Glow */}
      <div className="text-center mb-6">
        <div className="text-4xl sm:text-5xl mb-2 filter drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">
          {icon}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight uppercase drop-shadow-md">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5 max-w-md mx-auto">
          {tagline}
        </p>
      </div>

      {/* Center Portal Box */}
      <div className="w-full max-w-sm bg-[#1c1f27]/90 backdrop-blur-xl border border-[#3e4248] rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-3.5 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-24 bg-sky-500/20 rounded-full blur-2xl pointer-events-none"></div>

        {!showDiffPicker ? (
          <>
            {/* Play Button */}
            <button
              onClick={handlePlayClick}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-sky-600/30 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>CHƠI NGAY</span>
            </button>

            {/* Instructions Button */}
            <button
              onClick={() => { audio.playClick(); onOpenInstructions(); }}
              className="w-full py-3 rounded-2xl bg-[#242833] hover:bg-[#2d3240] border border-[#3e4248] text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Hướng Dẫn</span>
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={() => { audio.playClick(); onOpenLeaderboard(); }}
              className="w-full py-3 rounded-2xl bg-[#242833] hover:bg-[#2d3240] border border-[#3e4248] text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer shadow-sm"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Bảng Xếp Hạng</span>
            </button>

            {/* Exit Button */}
            <button
              onClick={() => { audio.playClick(); onExit(); }}
              className="w-full py-3 rounded-2xl bg-[#242833]/60 hover:bg-rose-500/10 border border-[#3e4248] hover:border-rose-500/30 text-slate-400 hover:text-rose-300 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Thoát Ra Sảnh</span>
            </button>
          </>
        ) : (
          /* Difficulty Selector Screen */
          <div className="w-full flex flex-col gap-3 animate-fadeIn">
            <div className="text-center mb-1">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">Chọn Độ Khó</span>
              <span className="text-[11px] text-slate-500">Mức độ thử thách của trận đấu</span>
            </div>

            {difficulties?.map(d => (
              <button
                key={d.id}
                onClick={() => handleStartWithDiff(d.id)}
                className="w-full py-3 px-4 rounded-2xl bg-[#242833] hover:bg-sky-600/20 border border-[#3e4248] hover:border-sky-500/50 flex items-center justify-between text-left transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <div>
                  <span className="text-xs font-black text-slate-100 block">{d.label}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{d.sublabel}</span>
                </div>
                <Play className="w-4 h-4 text-sky-400 fill-current" />
              </button>
            ))}

            <button
              onClick={() => setShowDiffPicker(false)}
              className="w-full py-2.5 rounded-xl bg-[#14161b] hover:bg-[#242833] border border-[#3e4248] text-slate-400 hover:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all mt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay Lại</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
