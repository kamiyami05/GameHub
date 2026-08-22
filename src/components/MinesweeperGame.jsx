import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Flag, Pickaxe, Bomb, Clock, BookOpen, Trophy, LogOut, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '@/lib/audio';
import { useAuthStore } from '@/store/authStore';
import GamePortalMenu from './GamePortalMenu';

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10, label: '9x9 (10 Mìn)', sublabel: 'Cấp độ Nhập Môn dễ dàng' },
  medium: { rows: 12, cols: 12, mines: 22, label: '12x12 (22 Mìn)', sublabel: 'Cấp độ Thử Thách logic vừa' },
  hard: { rows: 14, cols: 14, mines: 36, label: '14x14 (36 Mìn)', sublabel: 'Cấp độ Chuyên Gia hiểm hóc' }
};

export default function MinesweeperGame({ onBack }) {
  const { profile, recordMinesweeperWin, getLeaderboard } = useAuthStore();
  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'playing'
  const [showInstructions, setShowInstructions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const [diffKey, setDiffKey] = useState('easy');
  const conf = DIFFICULTIES[diffKey];

  const [grid, setGrid] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [firstClick, setFirstClick] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagMode, setFlagMode] = useState(false);
  const [timer, setTimer] = useState(0);

  const timerRef = useRef(null);

  const minesDifficulties = [
    { id: 'easy', label: 'Cơ Bản (9x9 - 10 Mìn)', sublabel: 'Luyện tập làm quen phản xạ' },
    { id: 'medium', label: 'Trung Bình (12x12 - 22 Mìn)', sublabel: 'Bàn cờ mở rộng, mật độ mìn tăng' },
    { id: 'hard', label: 'Chuyên Gia (14x14 - 36 Mìn)', sublabel: 'Độ khó cao nhất, thử thách phán đoán' }
  ];

  const resetGame = useCallback((k = diffKey) => {
    const c = DIFFICULTIES[k];
    setGrid(Array.from({ length: c.rows }, () => Array(c.cols).fill(0)));
    setRevealed(Array.from({ length: c.rows }, () => Array(c.cols).fill(false)));
    setFlagged(Array.from({ length: c.rows }, () => Array(c.cols).fill(false)));
    setFirstClick(true);
    setGameOver(false);
    setWon(false);
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
    audio.playClick();
  }, [diffKey]);

  const handleStartGame = (diffId) => {
    const selected = diffId || diffKey;
    setDiffKey(selected);
    resetGame(selected);
    setViewMode('playing');
  };

  const openMinesLeaderboard = async () => {
    setShowLeaderboard(true);
    const data = await getLeaderboard('minesweeper', 20);
    setLeaderboardData(data || []);
  };

  useEffect(() => {
    if (viewMode === 'playing') {
      resetGame(diffKey);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [diffKey, resetGame, viewMode]);

  const generateMines = (safeR, safeC) => {
    const newGrid = Array.from({ length: conf.rows }, () => Array(conf.cols).fill(0));
    let placed = 0;

    while (placed < conf.mines) {
      const r = Math.floor(Math.random() * conf.rows);
      const c = Math.floor(Math.random() * conf.cols);

      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      if (newGrid[r][c] === -1) continue;

      newGrid[r][c] = -1;
      placed++;
    }

    for (let r = 0; r < conf.rows; r++) {
      for (let c = 0; c < conf.cols; c++) {
        if (newGrid[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < conf.rows && nc >= 0 && nc < conf.cols && newGrid[nr][nc] === -1) {
              count++;
            }
          }
        }
        newGrid[r][c] = count;
      }
    }
    return newGrid;
  };

  const handleCellClick = (r, c) => {
    if (gameOver || won) return;

    if (flagMode) {
      toggleFlag(r, c);
      return;
    }

    if (flagged[r][c]) return;

    let currentGrid = grid;
    if (firstClick) {
      setFirstClick(false);
      currentGrid = generateMines(r, c);
      setGrid(currentGrid);
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }

    if (currentGrid[r][c] === -1) {
      setGameOver(true);
      if (timerRef.current) clearInterval(timerRef.current);
      audio.playLose();

      const newRev = revealed.map(row => [...row]);
      newRev[r][c] = true;
      for (let i = 0; i < conf.rows; i++) {
        for (let j = 0; j < conf.cols; j++) {
          if (currentGrid[i][j] === -1) newRev[i][j] = true;
        }
      }
      setRevealed(newRev);
      return;
    }

    const newRev = revealed.map(row => [...row]);
    const flood = (cr, cc) => {
      if (cr < 0 || cr >= conf.rows || cc < 0 || cc >= conf.cols) return;
      if (newRev[cr][cc] || flagged[cr][cc]) return;

      newRev[cr][cc] = true;
      if (currentGrid[cr][cc] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) flood(cr + dr, cc + dc);
          }
        }
      }
    };
    flood(r, c);
    setRevealed(newRev);
    audio.playClick();

    let allSafeRevealed = true;
    for (let i = 0; i < conf.rows; i++) {
      for (let j = 0; j < conf.cols; j++) {
        if (currentGrid[i][j] !== -1 && !newRev[i][j]) {
          allSafeRevealed = false;
          break;
        }
      }
      if (!allSafeRevealed) break;
    }

    if (allSafeRevealed) {
      setWon(true);
      if (timerRef.current) clearInterval(timerRef.current);
      audio.playWin();
      confetti({ particleCount: 80, spread: 70 });
      recordMinesweeperWin(timer + 1);
    }
  };

  const toggleFlag = (r, c) => {
    if (gameOver || won || revealed[r][c]) return;
    const newFlagged = flagged.map(row => [...row]);
    newFlagged[r][c] = !newFlagged[r][c];
    setFlagged(newFlagged);
    audio.vibrate(15);
  };

  let flagCount = 0;
  flagged.forEach(row => row.forEach(f => { if (f) flagCount++; }));
  const remainingMines = Math.max(0, conf.mines - flagCount);

  if (viewMode === 'menu') {
    return (
      <div className="w-full relative">
        <GamePortalMenu
          title="Dò Mìn (Minesweeper)"
          icon="💣"
          tagline="Tác chiến phá bom mìn chiến thuật, giải mã các tọa độ nguy hiểm"
          difficulties={minesDifficulties}
          onStartGame={handleStartGame}
          onOpenInstructions={() => setShowInstructions(true)}
          onOpenLeaderboard={openMinesLeaderboard}
          onExit={onBack}
        />

        {/* Instructions Modal */}
        {showInstructions && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="w-full max-w-md bg-[#1c1f27] border border-[#3e4248] rounded-3xl p-6 relative shadow-2xl">
              <button
                onClick={() => setShowInstructions(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#242833] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-base font-black uppercase tracking-wide">Hướng Dẫn Dò Mìn</h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-medium">
                <p>• <strong>An toàn 100%:</strong> Nước click đầu tiên luôn luôn an toàn và tự động mở vùng đất rộng.</p>
                <p>• <strong>Ý nghĩa con số:</strong> Mỗi con số thể hiện chính xác số lượng quả mìn nằm trong 8 ô xung quanh nó.</p>
                <p>• <strong>Cắm cờ:</strong> Bấm nút <strong>Cắm Cờ</strong> (trên mobile) hoặc <strong>chuột phải</strong> (trên PC) để đánh dấu các ô nghi ngờ có mìn.</p>
                <p>• <strong>Thắng cuộc:</strong> Mở hết tất cả các ô không chứa mìn trong thời gian ngắn nhất!</p>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors mt-6 shadow-sm"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="w-full max-w-md bg-[#1c1f27] border border-[#3e4248] rounded-3xl p-6 relative shadow-2xl">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#242833] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <Trophy className="w-5 h-5" />
                <h3 className="text-base font-black uppercase tracking-wide">Bảng Xếp Hạng Dò Mìn</h3>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {leaderboardData.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#14161b] border border-[#3e4248] text-center text-xs text-slate-400">
                    <p className="font-bold text-slate-200">Chế độ Offline</p>
                    <p className="text-[11px] text-slate-500 mt-1">Kỷ lục hiện tại của bạn: <strong className="text-emerald-400 font-mono">{profile?.minesweeper_best_time ? `${profile.minesweeper_best_time}s` : '--'}</strong></p>
                  </div>
                ) : (
                  leaderboardData.map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-[#14161b] border border-[#3e4248] text-xs">
                      <div className="flex items-center gap-2.5 font-bold text-slate-200">
                        <span className="font-mono">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                        <span>{p.username}</span>
                      </div>
                      <span className="font-black text-emerald-400 font-mono">{p.minesweeper_best_time}s</span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors mt-6 shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-4 animate-fadeIn pb-8 mx-auto">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c1f27] hover:bg-[#242833] border border-[#3e4248] text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu Game</span>
        </button>

        <div className="flex bg-[#1c1f27] border border-[#3e4248] rounded-xl p-1 gap-1">
          {Object.keys(DIFFICULTIES).map(k => (
            <button
              key={k}
              onClick={() => { setDiffKey(k); resetGame(k); }}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                diffKey === k 
                  ? 'bg-[#242833] text-emerald-400 border border-[#3e4248] shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {DIFFICULTIES[k].label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1c1f27] border border-[#3e4248] rounded-2xl text-xs font-bold font-mono shadow-sm">
        <div className="flex items-center gap-2 text-rose-400 font-black">
          <Bomb className="w-4 h-4" />
          <span>{remainingMines} MÌN</span>
        </div>

        <button
          onClick={() => setFlagMode(!flagMode)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border font-sans shadow-sm ${
            flagMode 
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' 
              : 'bg-[#242833] text-slate-200 border-[#3e4248]'
          }`}
        >
          {flagMode ? <Flag className="w-4 h-4" /> : <Pickaxe className="w-4 h-4" />}
          <span>{flagMode ? 'Chế độ Cắm Cờ' : 'Chế độ Đào Mìn'}</span>
        </button>

        <div className="flex items-center gap-2 text-sky-400 font-black">
          <Clock className="w-4 h-4" />
          <span>{timer}s</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="w-full bg-[#1c1f27] border border-[#3e4248] rounded-3xl p-3.5 shadow-2xl">
        <div 
          className="grid gap-1.5 w-full"
          style={{ gridTemplateColumns: `repeat(${conf.cols}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) => 
            row.map((val, c) => {
              const isRev = revealed[r]?.[c];
              const isFlag = flagged[r]?.[c];

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => { e.preventDefault(); toggleFlag(r, c); }}
                  className={`aspect-square rounded-xl flex items-center justify-center font-black text-sm cursor-pointer select-none transition-all ${
                    isRev 
                      ? val === -1 
                        ? 'bg-rose-600/80 text-white' 
                        : 'bg-[#14161b]/70 text-slate-300' 
                      : 'bg-[#242833] hover:bg-[#2d3240] border border-[#3e4248]'
                  }`}
                >
                  {isRev ? (
                    val === -1 ? '💣' : (val > 0 ? (
                      <span className={
                        val === 1 ? 'text-sky-400' : val === 2 ? 'text-emerald-400' : val === 3 ? 'text-rose-400' : 'text-purple-400'
                      }>
                        {val}
                      </span>
                    ) : '')
                  ) : (
                    isFlag ? '🚩' : ''
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Outcome message */}
      {won && (
        <div className="text-center font-black text-sm text-emerald-400 animate-fadeIn">
          🎉 Thắng cuộc! Thời gian phá đảo: {timer} giây!
        </div>
      )}
      {gameOver && (
        <div className="text-center font-black text-sm text-rose-400 animate-fadeIn">
          💥 Bùm! Bạn đã dẫm phải mìn!
        </div>
      )}

      {/* Actions */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => resetGame(diffKey)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1c1f27] hover:bg-[#242833] border border-[#3e4248] text-slate-300 hover:text-white text-xs font-black transition-all shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Ván Mới</span>
        </button>

        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-[#1c1f27] hover:bg-rose-500/10 border border-[#3e4248] hover:border-rose-500/30 text-slate-400 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Thoát Ra Sảnh</span>
        </button>
      </div>
    </div>
  );
}
