import React from 'react';
import { Coffee, ExternalLink, X, Heart } from 'lucide-react';
import { audio } from '@/lib/audio';

export default function CoffeeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const photoUrl = '';

  const handleOpenPhoto = () => {
    audio.playClick();
    window.open(photoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-sm bg-[#1c1f27] border border-[#3e4248] rounded-3xl p-6 relative shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-28 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#242833] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Coffee Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl mb-3 shadow-lg shadow-amber-500/10 animate-bounce">
          ☕
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-100 tracking-tight">
          Tặng Ly Cafe ☕
        </h3>
        <p className="text-xs text-slate-400 font-medium mt-1.5 leading-relaxed max-w-xs">
          Cảm ơn đạo hữu đã ủng hộ một ly cafe thơm ngon để tiếp thêm linh lực duy trì và phát triển nền tảng trò chơi!
        </p>

        {/* Action Button */}
        <div className="w-full mt-5 flex flex-col gap-2.5">
          <button
            onClick={handleOpenPhoto}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <span>Mở Ảnh QR / Tài Khoản Cafe</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={() => { audio.playClick(); onClose(); }}
            className="w-full py-2.5 rounded-xl bg-[#242833] hover:bg-[#2d3240] text-slate-300 font-bold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-curr