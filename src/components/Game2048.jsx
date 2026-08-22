import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, BookOpen, Trophy, LogOut, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '@/lib/audio';
import { useAuthStore } from '@/store/authStore';
import GamePortalMenu from './GamePortalMenu';

const SIZE = 4;

export default function Game2048({ onBack }) {
  const { profile, record2048Score, getLeaderboard } = useAuthStore();
  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'playing'
  const [showInstructions, setShowInstructions] = useState(false);
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
        confetti({ particleCount: 80, spread: 70 });
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
      case 2: return 'bg-[#242833] text-slate-200 border border-[#3e4248]';
      case 4: return 'bg-[#2d3240] text-slate-100 border border-[#474f63]';
      case 8: return 'bg-sky-600 text-white font-black shadow-sm';
      case 16: return 'bg-sky-700 text-white font-black shadow-sm';
      case 32: return 'bg-teal-600 text-white font-black shadow-sm';
      case 64: return 'bg-emerald-600 text-white font-black shadow-sm';
      case 128: return 'bg-amber-600 text-white font-black text-xl sm:text-2xl shadow-sm';
      case 256: return 'bg-orange-600 text-white font-black text-xl sm:text-2xl shadow-sm';
      case 512: return 'bg-rose-600 text-white font-black text-xl sm:text-2xl shadow-sm';
      case 1024: return 'bg-purple-600 text-white font-black text-lg sm:text-xl shadow-md';
      case 2048: return 'bg-pink-600 text-white font-black text-lg sm:text-xl shadow-lg shadow-pink-500/50';
      default: return 'bg-[#14161b]/60 border border-[#3e4248]/40';
    }
  };

  if (viewMode === 'menu') {
    return (
      <div className="w-full relative">
        <GamePortalMenu
          title="2048 Classic"
          icon="🔢"
          tagline="Ghép nối các khối số trên bàn cờ 4x4 để chinh phục con số 2048 huyền thoại"
          onStartGame={handleStartGame}
          onOpenInstructions={() => setShowInstructions(true)}
          onOpenLeaderboard={open2048Leaderboard}
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

              <div className="flex items-center gap-2 mb-4 text-amber-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-base font-black uppercase tracking-wide">Hướng Dẫn 2048</h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-medium">
                <p>• <strong>Điều khiển:</strong> Dùng 4 phím mũi tên hoặc <strong>W, A, S, D</strong> trên máy tính, hoặc <strong>vuốt màn hình</strong> trên điện thoại.</p>
                <p>• <strong>Ghép số:</strong> Khi 2 ô có cùng giá trị chạm vào nhau, chúng sẽ gộp lại thành 1 ô có giá trị gấp đôi (2+2=4, 4+4=8, ...).</p>
                <p>• <strong>Mẹo hay:</strong> Luôn dồn khối số lớn nhất về một góc cố định (ví dụ: góc dưới cùng bên phải) và xếp các số giảm dần xung quanh.</p>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors mt-6 shadow-sm"
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

              <div className="flex items-center gap-2 mb-4 text-amber-400">
                <Trophy className="w-5 h-5" />
                <h3 className="text-base font-black uppercase tracking-wide">Bảng Xếp Hạng 2048</h3>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {leaderboardData.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#14161b] border border-[#3e4248] text-center text-xs text-slate-400">
                    <p className="font-bold text-slate-200">Chế độ Offline</p>
                    <p className="text-[11px] text-slate-500 mt-1">Kỷ lục hiện tại của bạn: <strong className="text-amber-400 font-mono">{profile?.game_2048_highscore || 0} điểm</strong></p>
                  </div>
                ) : (
                  leaderboardData.map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-[#14161b] border border-[#3e4248] text-xs">
                      <div className="flex items-center gap-2.5 font-bold text-slate-200">
                        <span className="font-mono">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                        <span>{p.username}</span>
                      </div>
                      <span className="font-black text-sky-400 font-mono">{p.game_2048_highscore} điểm</span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors mt-6 shadow-sm"
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
      className="w-full max-w-lg flex flex-col items-center gap-4 animate-fadeIn pb-8 mx-auto"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c1f27] hover:bg-[#242833] border border-[#3e4248] text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu Game</span>
        </button>

        <div className="flex gap-2">
          <div className="px-4 py-1.5 bg-[#1c1f27] border border-[#3e4248] rounded-xl text-center font-mono shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Điểm</span>
            <span className="text-sm font-black text-sky-400">{score}</span>
          </div>
          <div className="px-4 py-1.5 bg-[#1c1f27] border border-[#3e4248] rounded-xl text-center font-mono shadow-sm">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Kỷ lục</span>
            <span className="text-sm font-black text-amber-400">{bestScore}</span>
          </div>
          <button
            onClick={initGame}
            className="p-2.5 rounded-xl bg-[#1c1f27] hover:bg-[#242833] border border-[#3e4248] text-slate-300 transition-colors shadow-sm"
            title="Chơi lại"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2048 4x4 Grid Board */}
      <div className="relative w-full aspect-square bg-[#1c1f27] border border-[#3e4248] rounded-3xl p-4 shadow-2xl">
        <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-3">
          {board.map((row, r) => 
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`w-full h-full rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl transition-all duration-100 ${getTileClass(val)}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-[#14161b]/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 p-4 animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-100">Hết Nước Đi!</h3>
            <p className="text-xs text-slate-400 font-medium">Tổng điểm đạt được: <strong className="text-amber-400 font-mono text-sm">{score}</strong></p>
            <button
              onClick={initGame}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition-colors shadow-md"
            >
              Chơi Ván Mới
            </button>
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">
          Dùng phím mũi tên / WASD hoặc vuốt màn hình
        </p>

        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-[#1c1f27] hover:bg-rose-500/10 border border-[#3e4248] hover:border-rose-500/30 text-slate-400 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Thoát Ra Sảnh</span>
        </button>
      </div>
    </div>
  );
}
