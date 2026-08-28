import React, { useState } from 'react';
import { Play, BookOpen, Trophy, ArrowLeft } from 'lucide-react';
import { audio } from '@/lib/audio';

export default function GamePortalMenu({
  title,
  icon,
  difficulties = null,
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
    <div className="w-full min-h-[65vh] flex flex-col items-center justify-center p-4 animate-fadeIn">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{icon}</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Center Action Box */}
      <div className="w-full max-w-xs bg-[#14161f] border border-[#232734] rounded-2xl p-5 flex flex-col items-center gap-2.5">
        {!showDiffPicker ? (
          <>
            <button
              onClick={handlePlayClick}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Chơi ngay</span>
            </button>

            {onOpenInstructions && (
              <button
                onClick={() => { audio.playClick(); onOpenInstructions(); }}
                className="w-full py-2.5 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] border border-[#282d3d] text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Hướng dẫn</span>
              </button>
            )}

            {onOpenLeaderboard && (
              <button
                onClick={() => { audio.playClick(); onOpenLeaderboard(); }}
                className="w-full py-2.5 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] border border-[#282d3d] text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Bảng xếp hạng</span>
              </button>
            )}

            <button
              onClick={() => { audio.playClick(); onExit(); }}
              className="w-full py-2.5 rounded-xl bg-transparent hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer mt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại sảnh</span>
            </button>
          </>
        ) : (
          /* Difficulty Selector */
          <div className="w-full flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-400 text-center mb-1">Chọn cấp độ</span>
            {difficulties?.map(d => (
              <button
                key={d.id}
                onClick={() => handleStartWithDiff(d.id)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] border border-[#282d3d] hover:border-slate-500 flex items-center justify-between text-left transition-colors cursor-pointer text-xs"
              >
                <span className="font-semibold text-slate-200">{d.label}</span>
                <Play className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ))}

            <button
              onClick={() => setShowDiffPicker(false)}
              className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1 mt-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Quay lại</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
