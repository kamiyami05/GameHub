import React from 'react';
import { X, Coffee } from 'lucide-react';
import { audio } from '@/lib/audio';

export default function CoffeeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs bg-[#14161f] border border-[#232734] rounded-2xl p-5 relative shadow-xl flex flex-col items-center text-center cursor-default"
      >
        {/* Close Button */}
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-1.5 mb-3 text-amber-400">
          <Coffee className="w-4 h-4" />
          <h3 className="text-sm font-bold text-slate-100">
            Ủng hộ Cafe
          </h3>
        </div>

        {/* QR Code */}
        <div className="w-full aspect-square rounded-xl bg-[#0f1016] border border-[#1d212c] p-2 overflow-hidden flex items-center justify-center">
          <img 
            src="/images/buycoffe.jpg" 
            alt="Mã QR Cafe" 
            className="w-full h-full object-contain rounded-lg select-none"
          />
        </div>

        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className="w-full py-2 mt-3 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
