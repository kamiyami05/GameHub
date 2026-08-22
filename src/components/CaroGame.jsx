import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, Undo2, LogOut, BookOpen, Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CARO_SIZE, EMPTY, PLAYER, AI, checkCaroWinner, getCaroBestMove, inBounds } from '@/lib/caroAI';
import { audio } from '@/lib/audio';
import { useAuthStore } from '@/store/authStore';
import { getRankInfo } from '@/lib/supabase';
import GamePortalMenu from './GamePortalMenu';
import BotCharacterModel from './BotCharacterModel';

export default function CaroGame({ onBack }) {
  const { profile, recordCaroMatch, getLeaderboard } = useAuthStore();
  const [viewMode, setViewMode] = useState('menu'); // 'menu' | 'playing'
  const [showInstructions, setShowInstructions] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const [board, setBoard] = useState(() => Array.from({ length: CARO_SIZE }, () => Array(CARO_SIZE).fill(EMPTY)));
  const [moveHistory, setMoveHistory] = useState([]);
  const [difficulty, setDifficulty] = useState('hard');
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [winningCells, setWinningCells] = useState(null);
  const [statusText, setStatusText] = useState('Lượt của bạn (X)');
  const [matchResult, setMatchResult] = useState(null);

  // Bot Emotion State
  const [botEmotion, setBotEmotion] = useState('idle'); // 'idle' | 'thinking' | 'taunt' | 'shocked' | 'happy' | 'sad'

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);
  const winTimerRef = useRef(null);

  const botConfig = {
    easy: { name: 'Đạo Sĩ Gấu Trúc', elo: 800, badge: 'tier-C', tag: 'Đạo Sĩ (800)' },
    hard: { name: 'Vô Cực Tiên Tôn', elo: 1200, badge: 'tier-A', tag: 'Tiên Tôn (1200)' },
    impossible: { name: 'Cửu U Ma Tôn', elo: 1600, badge: 'tier-S', tag: 'Ma Tôn (1600)' }
  };

  const caroDifficulties = [
    { id: 'easy', label: 'Đạo Sĩ Gấu Trúc (800 Elo)', sublabel: 'Luyện tập làm quen quy tắc, nước đi cơ bản' },
    { id: 'hard', label: 'Vô Cực Tiên Tôn (1200 Elo)', sublabel: 'Tính toán chặn 3, giăng bẫy 4 nước biến hóa' },
    { id: 'impossible', label: 'Cửu U Ma Tôn (1600 Elo)', sublabel: 'Cấm thuật Minimax Alpha-Beta thâm sâu' }
  ];

  const handleStartGame = (diffId) => {
    const selectedDiff = diffId || difficulty;
    setDifficulty(selectedDiff);
    startNewGame(selectedDiff);
    setViewMode('playing');
  };

  const startNewGame = (diff = difficulty) => {
    if (winTimerRef.current) clearTimeout(winTimerRef.current);
    setBoard(Array.from({ length: CARO_SIZE }, () => Array(CARO_SIZE).fill(EMPTY)));
    setMoveHistory([]);
    setIsGameOver(false);
    setPlayerTurn(true);
    setWinningCells(null);
    setMatchResult(null);
    setBotEmotion('idle');
    particlesRef.current = [];
    setStatusText('Lượt của bạn (X)');
    audio.playClick();
  };

  // Check if a move creates 4 in a row
  const countMaxConsecutive = (grid, r, c, targetPlayer) => {
    let maxC = 1;
    const dirs = [[[0, 1], [0, -1]], [[1, 0], [-1, 0]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];
    for (const dir of dirs) {
      let count = 1;
      for (const [dr, dc] of dir) {
        let nr = r + dr, nc = c + dc;
        while (inBounds(nr, nc) && grid[nr][nc] === targetPlayer) {
          count++;
          nr += dr; nc += dc;
        }
      }
      if (count > maxC) maxC = count;
    }
    return maxC;
  };

  const handleUndo = () => {
    if (isGameOver || moveHistory.length === 0 || !playerTurn) return;
    if (winTimerRef.current) clearTimeout(winTimerRef.current);

    const newHistory = [...moveHistory];
    const newBoard = board.map(row => [...row]);

    if (newHistory.length >= 2) {
      const m1 = newHistory.pop(); newBoard[m1.r][m1.c] = EMPTY;
      const m2 = newHistory.pop(); newBoard[m2.r][m2.c] = EMPTY;
    } else if (newHistory.length === 1) {
      const m1 = newHistory.pop(); newBoard[m1.r][m1.c] = EMPTY;
    }

    setBoard(newBoard);
    setMoveHistory(newHistory);
    setPlayerTurn(true);
    setWinningCells(null);
    setBotEmotion('taunt');
    particlesRef.current = [];
    setStatusText('Lượt của bạn (X)');
    audio.playClick();
  };

  const spawnParticles = (r, c, color) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const padding = rect.width / (CARO_SIZE + 1);
    const cellSize = (rect.width - 2 * padding) / (CARO_SIZE - 1);
    const x = padding + c * cellSize;
    const y = padding + r * cellSize;

    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.8;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        size: 2 + Math.random() * 2.5
      });
    }
  };

  const handleCanvasClick = (e) => {
    if (isGameOver || !playerTurn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const padding = rect.width / (CARO_SIZE + 1);
    const cellSize = (rect.width - 2 * padding) / (CARO_SIZE - 1);

    const c = Math.round((e.clientX - rect.left - padding) / cellSize);
    const r = Math.round((e.clientY - rect.top - padding) / cellSize);

    if (r >= 0 && r < CARO_SIZE && c >= 0 && c < CARO_SIZE && board[r][c] === EMPTY) {
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = PLAYER;
      const newHistory = [...moveHistory, { r, c, player: PLAYER }];

      setBoard(newBoard);
      setMoveHistory(newHistory);
      audio.playMove(true);
      spawnParticles(r, c, '#38bdf8');

      const winCheck = checkCaroWinner(newBoard);
      if (winCheck) {
        handleGameEnd(winCheck, newHistory);
        return;
      }

      // Check player threat
      const playerConsecutive = countMaxConsecutive(newBoard, r, c, PLAYER);
      if (playerConsecutive >= 4) {
        setBotEmotion('shocked');
      } else {
        setBotEmotion('thinking');
      }

      setPlayerTurn(false);
      setStatusText('Bot đang tính... 🧠');

      setTimeout(() => {
        const botMove = getCaroBestMove(newBoard, difficulty);
        if (botMove && newBoard[botMove.r][botMove.c] === EMPTY) {
          newBoard[botMove.r][botMove.c] = AI;
          const aiHistory = [...newHistory, { r: botMove.r, c: botMove.c, player: AI }];
          setBoard(newBoard);
          setMoveHistory(aiHistory);
          audio.playMove(false);
          spawnParticles(botMove.r, botMove.c, '#f43f5e');

          const aiWinCheck = checkCaroWinner(newBoard);
          if (aiWinCheck) {
            handleGameEnd(aiWinCheck, aiHistory);
            return;
          }

          const botConsecutive = countMaxConsecutive(newBoard, botMove.r, botMove.c, AI);
          if (botConsecutive >= 4) {
            setBotEmotion('taunt');
          } else {
            setBotEmotion('idle');
          }
        }
        setPlayerTurn(true);
        setStatusText('Lượt của bạn (X)');
      }, difficulty === 'easy' ? 200 : (difficulty === 'hard' ? 350 : 500));
    }
  };

  const handleGameEnd = (result, history) => {
    setIsGameOver(true);
    setWinningCells(result.cells || []);

    let outcome = 'draw';
    if (result.winner === PLAYER) {
      outcome = 'win';
      setBotEmotion('sad'); // Bot cries
      audio.playWin();
      setStatusText('🎉 Bạn thắng! (Đang tổng kết...)');
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    } else if (result.winner === AI) {
      outcome = 'loss';
      setBotEmotion('happy'); // Bot laughs
      audio.playLose();
      setStatusText('🤖 Bot thắng! (Đang tổng kết...)');
    } else {
      setBotEmotion('taunt');
      setStatusText('🤝 Hòa cờ! (Đang tổng kết...)');
    }

    winTimerRef.current = setTimeout(async () => {
      try {
        const res = await recordCaroMatch(difficulty, outcome, history.length);
        setMatchResult({
          outcome,
          eloChange: res.elo_change,
          newElo: res.new_elo
        });
      } catch (e) {
        setMatchResult({ outcome, eloChange: 0, newElo: profile?.caro_elo || 1000 });
      }
    }, 3000);
  };

  const openCaroLeaderboard = async () => {
    setShowLeaderboard(true);
    const data = await getLeaderboard('caro', 20);
    setLeaderboardData(data || []);
  };

  // Canvas Engine 20x20
  useEffect(() => {
    if (viewMode !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height || rect.width);
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background
      ctx.fillStyle = '#12141a';
      ctx.fillRect(0, 0, size, size);

      const padding = size / (CARO_SIZE + 1);
      const cellSize = (size - 2 * padding) / (CARO_SIZE - 1);

      // Sharp Grid Lines 20x20
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#272b36';
      for (let i = 0; i < CARO_SIZE; i++) {
        const pos = Math.round(padding + i * cellSize) + 0.5;
        ctx.beginPath();
        ctx.moveTo(padding, pos);
        ctx.lineTo(padding + (CARO_SIZE - 1) * cellSize, pos);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pos, padding);
        ctx.lineTo(pos, padding + (CARO_SIZE - 1) * cellSize);
        ctx.stroke();
      }

      // Star Points on 20x20 Grid
      [3, 9, 15].forEach(r => {
        [3, 9, 15].forEach(c => {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(padding + c * cellSize, padding + r * cellSize, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // Render Stones
      for (let r = 0; r < CARO_SIZE; r++) {
        for (let c = 0; c < CARO_SIZE; c++) {
          const x = padding + c * cellSize;
          const y = padding + r * cellSize;
          const rad = cellSize * 0.34;

          if (board[r][c] === PLAYER) {
            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = Math.max(2, cellSize * 0.14);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - rad, y - rad); ctx.lineTo(x + rad, y + rad);
            ctx.moveTo(x + rad, y - rad); ctx.lineTo(x - rad, y + rad);
            ctx.stroke();
            ctx.restore();
          } else if (board[r][c] === AI) {
            ctx.save();
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = Math.max(2, cellSize * 0.14);
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Last Move Highlight
      if (moveHistory.length > 0) {
        const last = moveHistory[moveHistory.length - 1];
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(padding + last.c * cellSize, padding + last.r * cellSize, cellSize * 0.44, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 5 Winning Stones Beam
      if (winningCells && winningCells.length >= 5) {
        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = Math.max(3.5, cellSize * 0.2);
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.lineCap = 'round';

        ctx.beginPath();
        const first = winningCells[0];
        const last = winningCells[winningCells.length - 1];
        ctx.moveTo(padding + first.c * cellSize, padding + first.r * cellSize);
        ctx.lineTo(padding + last.c * cellSize, padding + last.r * cellSize);
        ctx.stroke();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        winningCells.forEach(cell => {
          ctx.beginPath();
          ctx.arc(padding + cell.c * cellSize, padding + cell.r * cellSize, cellSize * 0.46, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // Particles
      if (particlesRef.current.length > 0) {
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx; p.y += p.vy; p.alpha -= 0.035;

          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
          } else {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewMode, board, moveHistory, winningCells]);

  if (viewMode === 'menu') {
    return (
      <div className="w-full relative">
        <GamePortalMenu
          title="Cờ Caro 20x20 AI"
          icon="⚔️"
          tagline="Bàn cờ đại chiến 20x20 với thuật toán Minimax Alpha-Beta 3 cấp độ"
          difficulties={caroDifficulties}
          onStartGame={handleStartGame}
          onOpenInstructions={() => setShowInstructions(true)}
          onOpenLeaderboard={openCaroLeaderboard}
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

              <div className="flex items-center gap-2 mb-4 text-sky-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-base font-black uppercase tracking-wide">Hướng Dẫn Cờ Caro 20x20</h3>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-medium">
                <p>• <strong>Bàn cờ:</strong> Kích thước mở rộng <strong>20x20 ô</strong> tạo không gian chiến thuật sâu sắc.</p>
                <p>• <strong>Quân cờ:</strong> Bạn cầm quân <strong>X (đi trước)</strong>, Bot cầm quân <strong>O (đi sau)</strong>.</p>
                <p>• <strong>Mục tiêu:</strong> Tạo chuỗi <strong>5 quân cờ liên tiếp</strong> (ngang, dọc hoặc đường chéo) để giành chiến thắng.</p>
                <p>• <strong>Hệ số Elo:</strong> Thắng Bot cấp độ cao sẽ nhận nhiều điểm Elo; thua sẽ bị trừ điểm theo công thức Elo quốc tế.</p>
              </div>

              <button
                onClick={() => setShowInstructions(false)}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors mt-6 shadow-sm"
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
                <h3 className="text-base font-black uppercase tracking-wide">Bảng Xếp Hạng Caro</h3>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {leaderboardData.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#14161b] border border-[#3e4248] text-center text-xs text-slate-400">
                    <p className="font-bold text-slate-200">Chế độ Offline</p>
                    <p className="text-[11px] text-slate-500 mt-1">Kỷ lục hiện tại của bạn: <strong className="text-amber-400 font-mono">{profile?.caro_elo || 1000} Elo</strong></p>
                  </div>
                ) : (
                  leaderboardData.map((p, idx) => (
                    <div key={p.id || idx} className="flex items-center justify-between p-3 rounded-2xl bg-[#14161b] border border-[#3e4248] text-xs">
                      <div className="flex items-center gap-2.5 font-bold text-slate-200">
                        <span className="font-mono">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}</span>
                        <span>{p.username}</span>
                      </div>
                      <span className="font-black text-amber-400 font-mono">{p.caro_elo} Elo</span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors mt-6 shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active Playing Screen
  return (
    <div className="w-full flex flex-col items-center animate-fadeIn pb-8">
      {/* Top Header Row */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMode('menu')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c1f27] hover:bg-[#242833] border border-[#3e4248] text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu Game</span>
        </button>

        {/* Difficulty Selector */}
        <div className="flex bg-[#1c1f27] border border-[#3e4248] rounded-xl p-1 gap-1">
          {['easy', 'hard', 'impossible'].map(level => (
            <button
              key={level}
              onClick={() => { setDifficulty(level); startNewGame(level); }}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${difficulty === level
                  ? 'bg-[#242833] text-sky-400 border border-[#3e4248] shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {botConfig[level].tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Game Layout: 2 Columns on Desktop */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Big Crisp Canvas Board */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full max-w-[580px] aspect-square bg-[#12141a] border border-[#3e4248] rounded-2xl overflow-hidden shadow-2xl relative">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full h-full cursor-pointer touch-none block"
            />
          </div>
        </div>

        {/* Right Column: Interactive Bot Model, Battle Stats & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full max-w-[580px] lg:max-w-none mx-auto">
          {/* Animated Interactive Bot Character Model with 10s Taunts */}
          <div className="w-full bg-[#1c1f27]/90 backdrop-blur-md border border-[#3e4248] rounded-3xl p-4 flex flex-col items-center shadow-lg">
            <BotCharacterModel
              emotion={botEmotion}
              size="medium"
              botName={botConfig[difficulty].name}
              botElo={botConfig[difficulty].elo}
              showDialogue={true}
              autoTauntInterval={10000}
            />
          </div>

          {/* Player vs Match Stats */}
          <div className="w-full grid grid-cols-2 gap-3">
            {/* Player Card */}
            <div className="bg-[#1c1f27] border border-[#3e4248] rounded-2xl p-3.5 flex flex-col items-center text-center shadow-sm">
              {profile?.avatar_url && (profile.avatar_url.startsWith('http') || profile.avatar_url.startsWith('/') || profile.avatar_url.startsWith('data:')) ? (
                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover mb-2 border border-sky-500/40" />
              ) : profile?.avatar_url ? (
                <span className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-lg mb-2 select-none">
                  {profile.avatar_url}
                </span>
              ) : (
                <span className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-black text-sm mb-2 select-none">
                  X
                </span>
              )}
              <span className="text-xs font-black text-slate-100 truncate w-full px-1">{profile?.username || 'Bạn'}</span>
              <span className="text-[11px] text-amber-400 font-mono font-bold mt-0.5">{profile?.caro_elo || 1000} Elo</span>
            </div>

            {/* Match Status */}
            <div className="bg-[#1c1f27] border border-[#3e4248] rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">TRẠNG THÁI</span>
              <span className="text-xs font-black text-sky-400 leading-tight">{statusText}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-1">{moveHistory.length} nước đi</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full">
            <button
              onClick={handleUndo}
              disabled={isGameOver || moveHistory.length === 0 || !playerTurn}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1c1f27] hover:bg-[#242833] disabled:opacity-40 disabled:cursor-not-allowed border border-[#3e4248] text-slate-300 font-bold text-xs transition-all shadow-sm"
            >
              <Undo2 className="w-4 h-4" />
              <span>Trùng sinh</span>
            </button>

            <button
              onClick={() => startNewGame(difficulty)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đòng quy Vu Tận</span>
            </button>
          </div>

          {/* Exit to Main Lobby */}
          <button
            onClick={onBack}
            className="w-full py-2.5 rounded-xl bg-[#1c1f27] hover:bg-rose-500/10 border border-[#3e4248] hover:border-rose-500/30 text-slate-400 hover:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Thoát Ra Sảnh Chính</span>
          </button>
        </div>
      </div>

      {/* Match Result Modal with Character Model Highlight */}
      {matchResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-sm bg-[#1c1f27] border border-[#3e4248] rounded-3xl p-6 text-center flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden">
            {/* Ambient result glow */}
            <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-28 rounded-full blur-3xl pointer-events-none ${matchResult.outcome === 'win' ? 'bg-emerald-500/25' : 'bg-rose-500/25'
              }`}></div>

            {/* Prominent Animated Bot Character Model with Outcome Reaction */}
            <BotCharacterModel
              emotion={matchResult.outcome === 'win' ? 'sad' : (matchResult.outcome === 'loss' ? 'happy' : 'taunt')}
              size="large"
              botName={botConfig[difficulty].name}
              botElo={botConfig[difficulty].elo}
              showDialogue={true}
              autoTauntInterval={null}
            />

            <div>
              <h3 className={`text-xl font-black tracking-tight ${matchResult.outcome === 'win' ? 'text-emerald-400' : matchResult.outcome === 'loss' ? 'text-rose-400' : 'text-slate-400'
                }`}>
                {matchResult.outcome === 'win' ? 'CHIẾN THẮNG RỰC RỠ!' : matchResult.outcome === 'loss' ? 'BẠN ĐÃ THẤT BẠI!' : 'HÒA CỜ!'}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Kết quả đã được đồng bộ vào xếp hạng</p>
            </div>

            {/* Elo Change Pill */}
            <div className="w-full flex items-center justify-around py-3 px-4 rounded-2xl bg-[#14161b] border border-[#3e4248]">
              <div>
                <span className="text-[10px] text-slate-500 block font-bold font-mono">BIẾN THIÊN</span>
                <span className={`text-base font-black font-mono ${matchResult.eloChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {matchResult.eloChange > 0 ? `+${matchResult.eloChange}` : matchResult.eloChange} Elo
                </span>
              </div>
              <div className="w-px h-8 bg-[#3e4248]"></div>
              <div>
                <span className="text-[10px] text-slate-500 block font-bold font-mono">ELO MỚI</span>
                <span className="text-base font-black text-amber-400 font-mono">{matchResult.newElo}</span>
              </div>
            </div>

            <div className="flex gap-2.5 w-full mt-2">
              <button
                onClick={() => startNewGame(difficulty)}
                className="flex-1 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                Đấu lại
              </button>
              <button
                onClick={() => setViewMode('menu')}
                className="flex-1 py-3 rounded-2xl bg-[#242833] hover:bg-[#2d3240] text-slate-300 font-bold text-xs transition-all active:scale-95"
              >
                Menu Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
