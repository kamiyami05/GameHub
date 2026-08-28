import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Flag, Pickaxe, Bomb, Clock, Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '@/lib/audio';
import { useAuthStore } from '@/store/authStore';
import GamePortalMenu from './GamePortalMenu';

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10, label: '9x9' },
  medium: { rows: 12, cols: 12, mines: 22, label: '12x12' },
  hard: { rows: 14, cols: 14, mines: 36, label: '14x14' }
};

export default function MinesweeperGame({ onBack }) {
  const { profile, recordMinesweeperWin, getLeaderboard } = useAuthStore();
  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'playing'
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
    { id: 'easy', label: 'Dễ (9x9 - 10 mìn)' },
    { id: 'medium', label: 'Vừa (12x12 - 22 mìn)' },
    { id: 'hard', label: 'Khó (14x14 - 36 mìn)' }
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

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
  };

  const checkWin = (rev) => {
    let unrevealedSafe = 0;
    for (let r = 0; r < conf.rows; r++) {
      for (let c = 0; c < conf.cols; c++) {
        if (grid[r][c] !== -1 && !rev[r][c]) {
          unrevealedSafe++;
        }
      }
    }
    return unrevealedSafe === 0;
  };

  const revealCell = (r, c, currentGrid = grid) => {
    if (gameOver || won || flagged[r][c] || revealed[r][c]) return;

    let activeGrid = currentGrid;
    if (firstClick) {
      setFirstClick(false);
      activeGrid = generateMines(r, c);
      setGrid(activeGrid);
      startTimer();
    }

    if (activeGrid[r][c] === -1) {
      // Hit mine -> Loss
      setGameOver(true);
      if (timerRef.current) clearInterval(timerRef.current);
      audio.playLose();
      const allRev = revealed.map(row => [...row]);
      for (let i = 0; i < conf.rows; i++) {
        for (let j = 0; j < conf.cols; j++) {
          if (activeGrid[i][j] === -1) allRev[i][j] = true;
        }
      }
      setRevealed(allRev);
      return;
    }

    // Flood fill
    audio.playClick();
    const newRevealed = revealed.map(row => [...row]);
    const queue = [[r, c]];
    newRevealed[r][c] = true;

    while (queue.length > 0) {
      const [cr, cc] = queue.shift();
      if (activeGrid[cr][cc] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = cr + dr, nc = cc + dc;
            if (nr >= 0 && nr < conf.rows && nc >= 0 && nc < conf.cols && !newRevealed[nr][nc] && !flagged[nr][nc]) {
              newRevealed[nr][nc] = true;
              if (activeGrid[nr][nc] === 0) queue.push([nr, nc]);
            }
          }
        }
      }
    }

    setRevealed(newRevealed);

    if (checkWin(newRevealed)) {
      setWon(true);
      if (timerRef.current) clearInterval(timerRef.current);
      audio.playWin();
      confetti({ particleCount: 70, spread: 60 });
      recordMinesweeperWin(timer);
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
          title="Dò Mìn"
          icon="💣"
          difficulties={minesDifficulties}
          onStartGame={handleStartGame}
          onOpenLeaderboard={openMinesLeaderboard}
          onExit={onBack}
        />

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="w-full max-w-sm bg-[#14161f] border border-[#232734] rounded-2xl p-5 relative">
              <button
                onClick={() => setShowLeaderboard(false)}
                className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4 text-amber-400">
                <Trophy className="w-4 h-4" />
                <h3 className="text-sm font-bold">Xếp hạng Dò Mìn</h3>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {leaderboardData.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#0f1016] text-center text-xs text-slate-400">
                    <p>Kỷ lục: <strong className="text-emerald-400">{profile?.minesweeper_best_time ? `${profile.minesweeper_best_time}s` : '--'}</strong></p>
                  </div>
                ) : (
                  leaderboardData.map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f1016] border border-[#1d212c] text-xs">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="font-mono">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                        <span className="truncate max-w-[130px]">{p.username}</span>
                      </div>
                      <span className="font-bold text-emerald-400 font-mono">{p.minesweeper_best_time}s</span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors mt-4"
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
    <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center gap-3 animate-fadeIn pb-6 mx-auto">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14161f] hover:bg-[#1a1d28] border border-[#232734] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Menu</span>
        </button>

        <div className="flex bg-[#14161f] border border-[#232734] rounded-xl p-0.5 gap-0.5">
          {Object.keys(DIFFICULTIES).map(k => (
            <button
              key={k}
              onClick={() => { setDiffKey(k); resetGame(k); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                diffKey === k 
                  ? 'bg-[#222634] text-emerald-400' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {DIFFICULTIES[k].label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-[#14161f] border border-[#232734] rounded-xl text-xs font-mono">
        <div className="flex items-center gap-1.5 text-rose-400 font-bold">
          <Bomb className="w-3.5 h-3.5" />
          <span>{remainingMines}</span>
        </div>

        {/* Flag Mode Toggle Button (Mobile Friendly) */}
        <button
          onClick={() => setFlagMode(!flagMode)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors border font-sans cursor-pointer ${
            flagMode 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
              : 'bg-[#1b1e2a] text-slate-200 border-[#282d3d]'
          }`}
        >
          {flagMode ? <Flag className="w-3.5 h-3.5 text-rose-400" /> : <Pickaxe className="w-3.5 h-3.5 text-sky-400" />}
          <span>{flagMode ? 'Cắm cờ' : 'Đào mìn'}</span>
        </button>

        <div className="flex items-center gap-1.5 text-sky-400 font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>{timer}s</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="w-full bg-[#14161f] border border-[#232734] rounded-2xl p-2.5 shadow-lg relative">
        <div 
          className="grid gap-1 w-full"
          style={{ gridTemplateColumns: `repeat(${conf.cols}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) => 
            row.map((val, c) => {
              const isRev = revealed[r]?.[c];
              const isFlag = flagged[r]?.[c];

              let content = '';
              let tileClass = 'bg-[#1b1e2a] hover:bg-[#222635] border border-[#282d3d]';

              if (isRev) {
                if (val === -1) {
                  content = '💣';
                  tileClass = 'bg-rose-950/80 border border-rose-800 text-white';
                } else if (val === 0) {
                  tileClass = 'bg-[#0f1016] border border-[#1a1d26]';
                } else {
                  content = val;
                  const numColors = [
                    '',
                    'text-sky-400 font-bold',
                    'text-emerald-400 font-bold',
                    'text-rose-400 font-bold',
                    'text-purple-400 font-bold',
                    'text-amber-400 font-bold',
                    'text-teal-400 font-bold',
                    'text-pink-400 font-bold',
                    'text-slate-200 font-bold'
                  ];
                  tileClass = `bg-[#0f1016] border border-[#1a1d26] ${numColors[val]}`;
                }
              } else if (isFlag) {
                content = '🚩';
                tileClass = 'bg-[#1b1e2a] border border-[#282d3d] text-rose-400';
              }

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => {
                    if (flagMode) toggleFlag(r, c);
                    else revealCell(r, c);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    toggleFlag(r, c);
                  }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs sm:text-sm transition-colors cursor-pointer ${tileClass}`}
                >
                  {content}
                </button>
              );
            })
          )}
        </div>

        {/* Win / Loss Overlay */}
        {(gameOver || won) && (
          <div className="absolute inset-0 bg-[#0c0d12]/90 rounded-2xl flex flex-col items-center justify-center gap-2 p-4 animate-fadeIn">
            <h3 className={`text-lg font-bold ${won ? 'text-emerald-400' : 'text-rose-400'}`}>
              {won ? 'Chiến thắng!' : 'Dẫm trúng mìn!'}
            </h3>
            <p className="text-xs text-slate-400">Thời gian: <strong className="text-sky-400 font-mono">{timer}s</strong></p>
            <button
              onClick={() => resetGame()}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer mt-1"
            >
              Chơi lại
            </button>
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Click để đào • Chuột phải để cắm cờ</span>
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Thoát
        </button>
      </div>
    </div>
  );
}
