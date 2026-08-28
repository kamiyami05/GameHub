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

  const isImageAvatar = profile?.avatar_url && (
    profile.avatar_url.startsWith('http://') ||
    profile.avatar_url.startsWith('https://') ||
    profile.avatar_url.startsWith('/') ||
    profile.avatar_url.startsWith('data:')
  );

  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-5 py-2.5 bg-[#14161f]/80 backdrop-blur-md border border-[#232734] rounded-2xl mb-6 text-xs">
      {/* Brand Logo */}
      <button 
        onClick={() => { audio.playClick(); onNavigate('lobby'); }}
        className="flex items-center gap-2 cursor-pointer select-none text-left"
      >
        <span className="text-base">🎮</span>
        <span className="font-bold text-slate-100 text-sm tracking-tight">
          ARCADE<span className="text-sky-400">.</span>
        </span>
      </button>

      {/* Controls & Profile */}
      <div className="flex items-center gap-2 shrink-0">
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

        {/* Profile Pill */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] border border-[#282d3d] hover:border-slate-600 text-slate-200 transition-colors cursor-pointer max-w-[120px] sm:max-w-[160px]"
        >
          {isImageAvatar ? (
            <img 
              src={profile.avatar_url} 
              alt="" 
              className="w-5 h-5 rounded-full object-cover shrink-0" 
            />
          ) : profile?.avatar_url ? (
            <span className="w-5 h-5 rounded-full bg-[#0c0d12] flex items-center justify-center text-xs shrink-0 select-none">
              {profile.avatar_url}
            </span>
          ) : (
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px] font-bold shrink-0">
              {profile?.username?.charAt(0)?.toUpperCase() || 'K'}
            </span>
          )}
          <span className="font-semibold text-slate-200 truncate text-xs">
            {profile?.username || 'Khách'}
          </span>
        </button>
      </div>
    </header>
  );
}
