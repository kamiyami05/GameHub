import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '@/lib/audio';
import { useAuthStore } from '@/store/authStore';
import GamePortalMenu from './GamePortalMenu';

const SIZE = 4;

export default function Game2048({ onBack }) {
  const { profile, record2048Score, getLeaderboard } = useAuthStore();
  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'playing'
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const [board, setBoard] = useState(() => Array.from({ length: SIZE }, () => Array(SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(profile?.game_2048_highscore || 0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0 });

  const addRandomTile = (grid) => {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length > 0) {
      const rand = empty[Math.floor(Math.random() * empty.length)];
      grid[rand.r][rand.c] = Math.random() < 0.9 ? 2 : 4;
    }
    return grid;
  };

  const initGame = useCallback(() => {
    let newGrid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setBoard(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    audio.playClick();
  }, []);

  const handleStartGame = () => {
    initGame();
    setViewMode('playing');
  };

  const open2048Leaderboard = async () => {
    setShowLeaderboard(true);
    const data = await getLeaderboard('2048', 20);
    setLeaderboardData(data || []);
  };

  const checkGameOver = (grid) => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return false;
        if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
        if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
      }
    }
    return true;
  };

  const move = useCallback((direction) => {
    if (gameOver || viewMode !== 'playing') return;

    const rotate = (b) => b[0].map((_, i) => b.map(row => row[i]).reverse());
    const rotateTimes = (b, times) => {
      let res = b;
      for (let i = 0; i < times; i++) res = rotate(res);
      return res;
    };

    let grid = board.map(row => [...row]);
    grid = rotateTimes(grid, direction);

    let moved = false;
    let gainedScore = 0;
    let reached2048 = false;

    for (let r = 0; r < SIZE; r++) {
      let row = grid[r].filter(val => val !== 0);
      for (let c = 0; c < row.length - 1; c++) {
        if (row[c] === row[c + 1]) {
          row[c] *= 2;
          gainedScore += row[c];
          if (row[c] === 2048) reached2048 = true;
          row.splice(c + 1, 1);
        }
      }
      while (row.length < SIZE) row.push(0);

      if (row.some((val, idx) => val !== grid[r][idx])) {
        moved = true;
      }
      grid[r] = row;
    }

    grid = rotateTimes(grid, (4 - direction) % 4);

    if (moved) {
      audio.playMove(true);
      grid = addRandomTile(grid);
      const newScore = score + gainedScore;
      setScore(newScore);
      setBoard(grid);

      if (newScore > bestScore) {
        setBestScore(newScore);
      }

      if (reached2048 && !won) {
        setWon(true);
        audio.playWin();
        confetti({ particleCount: 70, spread: 60 });
      }

      if (checkGameOver(grid)) {
        setGameOver(true);
        audio.playLose();
        record2048Score(newScore);
      }
    }
  }, [board, score, bestScore, gameOver, won, viewMode, record2048Score]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== 'playing') return;
      if (['ArrowUp', 'w', 'W'].includes(e.key)) { e.preventDefault(); move(3); }
      else if (['ArrowRight', 'd', 'D'].includes(e.key)) { e.preventDefault(); move(2); }
      else if (['ArrowDown', 's', 'S'].includes(e.key)) { e.preventDefault(); move(1); }
      else if (['ArrowLeft', 'a', 'A'].includes(e.key)) { e.preventDefault(); move(0); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, viewMode]);

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 25) {
      if (absDx > absDy) {
        move(dx > 0 ? 2 : 0);
      } else {
        move(dy > 0 ? 1 : 3);
      }
    }
  };

  const getTileClass = (val) => {
    switch (val) {
      case 2: return 'bg-[#1b1e2a] text-slate-200';
      case 4: return 'bg-[#222736] text-slate-100';
      case 8: return 'bg-[#0369a1] text-white';
      case 16: return 'bg-[#0284c7] text-white';
      case 32: return 'bg-[#0d9488] text-white';
      case 64: return 'bg-[#059669] text-white';
      case 128: return 'bg-[#d97706] text-white text-xl sm:text-2xl';
      case 256: return 'bg-[#ea580c] text-white text-xl sm:text-2xl';
      case 512: return 'bg-[#e11d48] text-white text-xl sm:text-2xl';
      case 1024: return 'bg-[#9333ea] text-white text-lg sm:text-xl';
      case 2048: return 'bg-[#c026d3] text-white text-lg sm:text-xl';
      default: return 'bg-[#12141c] text-transparent';
    }
  };

  if (viewMode === 'menu') {
    return (
      <div className="w-full relative">
        <GamePortalMenu
          title="2048"
          icon="🔢"
          onStartGame={handleStartGame}
          onOpenLeaderboard={open2048Leaderboard}
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
                <h3 className="text-sm font-bold">Xếp hạng 2048</h3>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {leaderboardData.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#0f1016] text-center text-xs text-slate-400">
                    <p>Kỷ lục: <strong className="text-amber-400">{profile?.game_2048_highscore || 0}</strong></p>
                  </div>
                ) : (
                  leaderboardData.map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f1016] border border-[#1d212c] text-xs">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        <span className="font-mono">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                        <span className="truncate max-w-[130px]">{p.username}</span>
                      </div>
                      <span className="font-bold text-sky-400 font-mono">{p.game_2048_highscore}</span>
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

  // Active Game Screen
  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full max-w-sm sm:max-w-md flex flex-col items-center gap-3.5 animate-fadeIn pb-6 mx-auto"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14161f] hover:bg-[#1a1d28] border border-[#232734] text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Menu</span>
        </button>

        <div className="flex items-center gap-1.5">
          <div className="px-3 py-1 bg-[#14161f] border border-[#232734] rounded-xl text-center font-mono">
            <span className="text-[9px] text-slate-500 font-bold block uppercase">Điểm</span>
            <span className="text-xs font-bold text-sky-400">{score}</span>
          </div>
          <div className="px-3 py-1 bg-[#14161f] border border-[#232734] rounded-xl text-center font-mono">
            <span className="text-[9px] text-slate-500 font-bold block uppercase">Kỷ lục</span>
            <span className="text-xs font-bold text-amber-400">{bestScore}</span>
          </div>
          <button
            onClick={initGame}
            className="p-2 rounded-xl bg-[#14161f] hover:bg-[#1a1d28] border border-[#232734] text-slate-300 transition-colors cursor-pointer"
            title="Chơi lại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2048 4x4 Grid Board */}
      <div className="relative w-full aspect-square bg-[#14161f] border border-[#232734] rounded-2xl p-2.5 shadow-lg">
        <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2">
          {board.map((row, r) => 
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-full h-full rounded-xl flex items-center justify-center font-bold text-xl sm:text-2xl transition-all duration-100 ${getTileClass(val)}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-[#0c0d12]/90 rounded-2xl flex flex-col items-center justify-center gap-2.5 p-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-100">Hết nước đi!</h3>
            <p className="text-xs text-slate-400">Điểm: <strong className="text-amber-400 font-mono">{score}</strong></p>
            <button
              onClick={initGame}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer mt-1"
            >
              Chơi lại
            </button>
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Vuốt hoặc dùng phím mũi tên</span>
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
