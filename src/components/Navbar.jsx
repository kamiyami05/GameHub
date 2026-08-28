import React, { useState } from 'react';
import { Volume2, VolumeX, Coffee, Sparkles } from 'lucide-react';
import { audio } from '@/lib/audio';
import { usePlayerStore, CHARACTERS, getRankInfo } from '@/store/playerStore';

export default function Navbar({ onOpenCharacterSelect, onOpenCoffee }) {
  const { characterId, username, elo, winStreak } = usePlayerStore();
  const [sfxOn, setSfxOn] = useState(!audio.isMuted);

  const charInfo = CHARACTERS[characterId] || CHARACTERS.panda;
  const rankInfo = getRankInfo(elo);

  const toggleSfx = () => {
    const on = audio.toggleSFX();
    setSfxOn(on);
  };

  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-5 py-2.5 bg-[#14161f]/85 backdrop-blur-md border border-[#232734] rounded-2xl mb-4 text-xs">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 select-none">
        <span className="text-base">⚔️</span>
        <div className="flex flex-col">
          <span className="font-black text-slate-100 text-sm tracking-tight leading-none">
            CARO<span className="text-sky-400">.AI</span>
          </span>
        </div>
      </div>

      {/* Controls & Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Win Streak Indicator */}
        {winStreak > 1 && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold font-mono text-xs">
            <span>🔥</span>
            <span>{winStreak} Chuỗi Thắng</span>
          </div>
        )}

        {/* Coffee Button */}
        <button
          onClick={onOpenCoffee}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] border border-[#282d3d] text-amber-300 font-medium text-xs transition-colors cursor-pointer"
          title="Tặng ly cafe"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cafe</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={toggleSfx}
          className="p-1.5 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] border border-[#282d3d] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title={sfxOn ? "Tắt âm thanh" : "Bật âm thanh"}
        >
          {sfxOn ? (
            <Volume2 className="w-4 h-4 text-sky-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Player Profile & Character Switch Button */}
        <button
          onClick={onOpenCharacterSelect}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] border border-[#282d3d] hover:border-sky-500/50 text-slate-200 transition-colors cursor-pointer"
          title="Đổi nhân vật & thông tin"
        >
          <span className="text-base shrink-0">{charInfo.icon}</span>
          <div className="flex flex-col text-left max-w-[100px] sm:max-w-[140px]">
            <span className="font-bold text-slate-200 text-xs truncate leading-tight">
              {username || 'Kỳ Thủ'}
            </span>
            <span className="text-[10px] font-mono font-semibold truncate" style={{ color: rankInfo.color }}>
              {rankInfo.icon} {rankInfo.name} ({elo}/900)
            </span>
          </div>
          <Sparkles className="w-3 h-3 text-slate-500 hover:text-sky-400 shrink-0" />
        </button>
      </div>
    </header>
  );
}
