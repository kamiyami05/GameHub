import React, { useState } from 'react';
import { X, Check, Sparkles, User } from 'lucide-react';
import { CHARACTERS, usePlayerStore, getRankInfo } from '@/store/playerStore';
import CharacterModel from './CharacterModel';
import { audio } from '@/lib/audio';

export default function CharacterSelectModal({ isOpen, onClose }) {
  const { characterId, username, elo, wins, losses, winStreak, bestStreak, updateProfile } = usePlayerStore();
  const [selectedId, setSelectedId] = useState(characterId || 'panda');
  const [nameInput, setNameInput] = useState(username || 'Kỳ Thủ');

  if (!isOpen) return null;

  const currentRank = getRankInfo(elo);
  const selectedChar = CHARACTERS[selectedId] || CHARACTERS.panda;

  const handleSelect = (id) => {
    audio.playClick();
    setSelectedId(id);
  };

  const handleSave = () => {
    audio.playClick();
    const finalName = nameInput.trim() || 'Kỳ Thủ';
    updateProfile({
      characterId: selectedId,
      username: finalName
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#14161f] border border-[#232734] rounded-2xl p-5 relative shadow-2xl flex flex-col gap-4 cursor-default"
      >
        {/* Close Button */}
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <h2 className="text-base font-bold text-slate-100">
            Tạo Hình & Nhân Vật Kỳ Thủ
          </h2>
        </div>

        {/* Live Preview + Nickname Row */}
        <div className="w-full bg-[#0f1016] border border-[#1d212c] rounded-xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
          {/* Character Live Preview */}
          <div className="shrink-0 flex flex-col items-center">
            <CharacterModel
              characterId={selectedId}
              emotion="confident"
              size="medium"
              displayName={nameInput || 'Kỳ Thủ'}
              elo={elo}
              showDialogue={false}
            />
          </div>

          {/* Player Info & Edit Name */}
          <div className="flex-1 flex flex-col gap-2.5 w-full">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Tên Hiển Thị
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={18}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nhập tên của bạn..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#14161f] border border-[#232734] text-xs font-semibold text-slate-100 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Rank & Stats */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-[#14161f] border border-[#232734] rounded-lg p-1.5">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Cảnh Giới</span>
                <span className="text-xs font-bold font-mono" style={{ color: currentRank.color }}>
                  {currentRank.icon} {currentRank.name}
                </span>
              </div>
              <div className="bg-[#14161f] border border-[#232734] rounded-lg p-1.5">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Tu Vi</span>
                <span className="text-xs font-bold text-amber-400 font-mono">{elo}/900</span>
              </div>
              <div className="bg-[#14161f] border border-[#232734] rounded-lg p-1.5">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">Chuỗi Thắng</span>
                <span className="text-xs font-bold text-rose-400 font-mono">🔥 {winStreak}</span>
              </div>
            </div>

            {/* Cultivation Progress Bar */}
            <div className="w-full">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>Tiến độ Độ Kiếp</span>
                <span className="font-bold text-sky-400">{Math.round((elo / 900) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#14161f] rounded-full overflow-hidden border border-[#232734]">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (elo / 900) * 100)}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 italic">
              "{selectedChar.description}"
            </div>
          </div>
        </div>

        {/* 6 Character Cards Grid */}
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Chọn Nhân Vật Đại Diện ({Object.keys(CHARACTERS).length})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.values(CHARACTERS).map((c) => {
              const isChosen = selectedId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                    isChosen
                      ? 'bg-[#1b1e2a] border-sky-400 ring-1 ring-sky-400/30'
                      : 'bg-[#0f1016] border-[#1d212c] hover:bg-[#151722] hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl shrink-0">{c.icon}</span>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-200 truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{c.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Lưu & Sử Dụng</span>
          </button>
          <button
            onClick={() => { audio.playClick(); onClose(); }}
            className="px-5 py-2.5 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
