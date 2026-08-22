import React from 'react';
import { X, Heart, Coffee } from 'lucide-react';
import { audio } from '@/lib/audio';

export default function CoffeeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md bg-[#1c1f27] border border-[#3e4248] rounded-3xl p-5 sm:p-6 relative shadow-2xl flex flex-col items-center text-center overflow-hidden cursor-default"
      >
        {/* Glow accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-28 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#242833] transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Coffee className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
            Tặng Ly Cafe ☕
          </h3>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-4">
          Quét mã QR bên dưới để ủng hộ tác giả ly cafe thơm ngon!
        </p>

        {/* Pure Image Container - No External Links */}
        <div className="w-full max-w-[320px] aspect-square rounded-2xl bg-[#14161b] border-2 border-amber-500/40 p-2 overflow-hidden shadow-xl flex items-center justify-center">
          <img 
            src="/images/buycoffe.jpg" 
            alt="Mã QR Tặng Ly Cafe" 
            className="w-full h-full object-contain rounded-xl select-none"
          />
        </div>

        {/* Footer Note */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Heart className="w-4 h-4 text-rose-500 fill-current animate-pulse" />
          <span>Chân thành cảm ơn sự đồng hành và ủng hộ của bạn!</span>
        </div>

        {/* Close button */}
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className="w-full py-2.5 mt-4 rounded-xl bg-[#242833] hover:bg-[#2d3240] text-slate-300 font-bold text-xs transition-colors cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
