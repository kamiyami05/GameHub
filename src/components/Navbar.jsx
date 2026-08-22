import React, { useState } from 'react';
import { Volume2, VolumeX, Coffee } from 'lucide-react';
import { audio } from '@/lib/audio';
import { useAuthStore } from '@/store/authStore';

export default function Navbar({ onNavigate, onOpenAuth, onOpenCoffee }) {
  const { profile } = useAuthStore();
  const [sfxOn, setSfxOn] = useState(!audio.isMuted);

  const toggleSfx = () => {
    const on = audio.toggleSFX();
    setSfxOn(on);
  };

  const handleLogoClick = () => {
    audio.playClick();
    onNavigate('lobby');
  };

  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#1c1f27]/90 backdrop-blur-md border border-[#3e4248] rounded-2xl mb-6 shadow-sm text-xs font-sans">
      {/* Brand */}
      <div 
        onClick={handleLogoClick}
        className="flex items-center gap-2.5 cursor-pointer select-none group"
      >
        <div className="w-8 h-8 rounded-xl bg-[#242833] border border-[#3e4248] flex items-center justify-center text-base font-black text-sky-400 group-hover:border-sky-500/50 transition-colors shadow-sm">
          🎮
        </div>
        <div>
          <div className="font-black text-slate-100 text-sm tracking-tight leading-none">
            ARCADE<span className="text-sky-400">HUB</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono tracking-wider">STRATEGY PORTAL</span>
        </div>
      </div>

      {/* Controls & Coffee & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Buy Me a Coffee Button */}
        <button
          onClick={onOpenCoffee}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Tặng ly cafe ủng hộ tác giả"
        >
          <Coffee className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Tặng ly cafe</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={toggleSfx}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#242833] border border-transparent hover:border-[#3e4248] transition-colors"
          title={sfxOn ? "Tắt âm thanh" : "Bật âm thanh"}
        >
          {sfxOn ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Profile */}
        <div
          onClick={onOpenAuth}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#242833] hover:bg-[#2d3240] border border-[#3e4248] hover:border-sky-500/50 cursor-pointer transition-all shadow-sm"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <span className="w-5 h-5 rounded-full bg-sky-600/30 flex items-center justify-center text-[10px] font-black text-sky-400">
              {profile?.username?.charAt(0)?.toUpperCase() || 'K'}
            </span>
          )}
          <span className="font-bold text-slate-200 max-w-[110px] truncate text-xs">
            {profile?.username || 'Khách'}
          </span>
        </div>
      </div>
    </header>
  );
}
