import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Undo2, Sparkles, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CARO_SIZE, EMPTY, PLAYER, AI, checkCaroWinner, getCaroBestMove } from '@/lib/caroAI';
import { audio } from '@/lib/audio';
import { usePlayerStore, CHARACTERS, getRankInfo } from '@/store/playerStore';
import CharacterModel from './CharacterModel';

const BOT_CONFIG = {
  easy: { id: 'panda', name: 'Đạo Sĩ Gấu Trúc', title: 'Luyện Khí Sơ Kỳ', elo: 800, tag: 'Dễ' },
  hard: { id: 'sage', name: 'Vô Cực Tiên Tôn', title: 'Kim Đan Hậu Kỳ', elo: 1200, tag: 'Vừa' },
  impossible: { id: 'dragon', name: 'Cửu U Ma Tôn', title: 'Hóa Thần Đại Viên Mãn', elo: 1600, tag: 'Khó' }
};

export default function CaroGame({ onOpenCharacterSelect }) {
  const { characterId, username, elo, winStreak, bestStreak, recordMatchResult } = usePlayerStore();
  const [board, setBoard] = useState(() => Array.from({ length: CARO_SIZE }, () => Array(CARO_SIZE).fill(EMPTY)));
  const [moveHistory, setMoveHistory] = useState([]);
  const [difficulty, setDifficulty] = useState('hard');
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [winningCells, setWinningCells] = useState(null);
  const [statusText, setStatusText] = useState('Lượt của bạn (X)');
  const [matchResult, setMatchResult] = useState(null);

  // Dynamic emotional states
  const [playerEmotion, setPlayerEmotion] = useState('idle');
  const [botEmotion, setBotEmotion] = useState('idle');

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);
  const winTimerRef = useRef(null);

  const playerChar = CHARACTERS[characterId] || CHARACTERS.panda;
  const currentRank = getRankInfo(elo);

  const startNewGame = useCallback((diff = difficulty) => {
    if (winTimerRef.current) clearTimeout(winTimerRef.current);
    setBoard(Array.from({ length: CARO_SIZE }, () => Array(CARO_SIZE).fill(EMPTY)));
    setMoveHistory([]);
    setIsGameOver(false);
    setPlayerTurn(true);
    setWinningCells(null);
    setMatchResult(null);
    setPlayerEmotion('idle');
    setBotEmotion('idle');
    particlesRef.current = [];
    setStatusText('Lượt của bạn (X)');
    audio.playClick();
  }, [difficulty]);

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
    setPlayerEmotion('idle');
    setBotEmotion('idle');
    setStatusText('Lượt của bạn (X)');
    audio.playClick();
  };

  const spawnParticles = (r, c, color) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const padding = 6;
    const cellSize = (rect.width - 2 * padding) / CARO_SIZE;
    const cx = padding + (c + 0.5) * cellSize;
    const cy = padding + (r + 0.5) * cellSize;

    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.8;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        size: 2 + Math.random() * 2
      });
    }
  };

  const handleCanvasClick = (e) => {
    if (isGameOver || !playerTurn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const padding = 6;
    const cellSize = (rect.width - 2 * padding) / CARO_SIZE;

    const c = Math.floor((e.clientX - rect.left - padding) / cellSize);
    const r = Math.floor((e.clientY - rect.top - padding) / cellSize);

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

      setPlayerEmotion('confident');
      setBotEmotion('thinking');
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

          setBotEmotion('idle');
          setPlayerEmotion('idle');
        }
        setPlayerTurn(true);
        setStatusText('Lượt của bạn (X)');
      }, 300);
    }
  };

  const handleGameEnd = (result, history) => {
    setIsGameOver(true);
    setWinningCells(result.cells || []);

    let outcome = 'draw';
    if (result.winner === PLAYER) {
      outcome = 'win';
      setPlayerEmotion('happy');
      setBotEmotion('sad');
      audio.playWin();
      setStatusText('Chiến Thắng!');
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    } else if (result.winner === AI) {
      outcome = 'loss';
      setPlayerEmotion('sad');
      setBotEmotion('happy');
      audio.playLose();
      setStatusText('Thất Bại!');
    } else {
      outcome = 'draw';
      setPlayerEmotion('idle');
      setBotEmotion('idle');
      setStatusText('Hòa cờ!');
    }

    winTimerRef.current = setTimeout(() => {
      const res = recordMatchResult(difficulty, outcome, history.length);
      setMatchResult({
        outcome,
        eloChange: res.eloChange,
        newElo: res.newElo,
        newStreak: res.newStreak
      });
    }, 1800);
  };

  // Canvas Engine 20x20 Playing Inside Cell Squares
  useEffect(() => {
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
      ctx.fillStyle = '#0f1016';
      ctx.fillRect(0, 0, size, size);

      const padding = 6;
      const cellSize = (size - 2 * padding) / CARO_SIZE;

      // 1. Grid Cells
      for (let r = 0; r < CARO_SIZE; r++) {
        for (let c = 0; c < CARO_SIZE; c++) {
          const cellX = padding + c * cellSize;
          const cellY = padding + r * cellSize;

          ctx.fillStyle = (r + c) % 2 === 0 ? '#13151e' : '#101118';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);

          ctx.strokeStyle = '#1d212c';
          ctx.lineWidth = 1;
          ctx.strokeRect(cellX + 0.5, cellY + 0.5, cellSize, cellSize);
        }
      }

      // 2. Star Points on 20x20 Grid
      [3, 9, 15].forEach(r => {
        [3, 9, 15].forEach(c => {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(padding + (c + 0.5) * cellSize, padding + (r + 0.5) * cellSize, 2, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      // 3. Pieces inside Cells
      for (let r = 0; r < CARO_SIZE; r++) {
        for (let c = 0; c < CARO_SIZE; c++) {
          const x = padding + (c + 0.5) * cellSize;
          const y = padding + (r + 0.5) * cellSize;
          const rad = cellSize * 0.35;

          if (board[r][c] === PLAYER) {
            ctx.save();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = Math.max(2, cellSize * 0.15);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - rad, y - rad); ctx.lineTo(x + rad, y + rad);
            ctx.moveTo(x + rad, y - rad); ctx.lineTo(x - rad, y + rad);
            ctx.stroke();
            ctx.restore();
          } else if (board[r][c] === AI) {
            ctx.save();
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = Math.max(2, cellSize * 0.15);
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 4. Last Move Highlight
      if (moveHistory.length > 0) {
        const last = moveHistory[moveHistory.length - 1];
        const cellX = padding + last.c * cellSize;
        const cellY = padding + last.r * cellSize;
        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
        ctx.restore();
      }

      // 5. Winning 5 Cells Beam
      if (winningCells && winningCells.length >= 5) {
        ctx.save();
        winningCells.forEach(cell => {
          const cellX = padding + cell.c * cellSize;
          const cellY = padding + cell.r * cellSize;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cellX + 0.5, cellY + 0.5, cellSize, cellSize);
        });

        const first = winningCells[0];
        const last = winningCells[winningCells.length - 1];
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = Math.max(3, cellSize * 0.2);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(padding + (first.c + 0.5) * cellSize, padding + (first.r + 0.5) * cellSize);
        ctx.lineTo(padding + (last.c + 0.5) * cellSize, padding + (last.r + 0.5) * cellSize);
        ctx.stroke();
        ctx.restore();
      }

      // 6. Particles
      if (particlesRef.current.length > 0) {
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx; p.y += p.vy; p.alpha -= 0.04;

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
  }, [board, moveHistory, winningCells]);

  const activeBot = BOT_CONFIG[difficulty];

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn pb-6">
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        {/* Difficulty Selector */}
        <div className="flex bg-[#14161f] border border-[#232734] rounded-xl p-0.5 gap-0.5">
          {['easy', 'hard', 'impossible'].map(level => (
            <button
              key={level}
              onClick={() => { setDifficulty(level); startNewGame(level); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                difficulty === level
                  ? 'bg-[#222634] text-sky-400 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {BOT_CONFIG[level].tag} ({BOT_CONFIG[level].elo})
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={isGameOver || moveHistory.length === 0 || !playerTurn}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#14161f] hover:bg-[#1a1d28] disabled:opacity-30 disabled:cursor-not-allowed border border-[#232734] text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            title="Đi lại nước trước"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Đi lại</span>
          </button>

          <button
            onClick={() => startNewGame(difficulty)}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            title="Bắt đầu ván mới"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ván mới</span>
          </button>
        </div>
      </div>

      {/* Mobile Top Mini Duel Bar */}
      <div className="lg:hidden w-full max-w-[560px] grid grid-cols-2 gap-2 mb-3">
        {/* Mobile Player Mini Pill */}
        <div 
          onClick={onOpenCharacterSelect}
          className="bg-[#14161f] border border-[#232734] rounded-xl p-2 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-xl">{playerChar.icon}</span>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">{username} (X)</span>
              <span className="text-[10px] font-mono text-amber-400">{elo} Elo</span>
            </div>
          </div>
          <Sparkles className="w-3 h-3 text-slate-500 shrink-0" />
        </div>

        {/* Mobile Bot Mini Pill */}
        <div className="bg-[#14161f] border border-[#232734] rounded-xl p-2 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xl">{difficulty === 'easy' ? '🐼' : difficulty === 'hard' ? '🧙' : '🐉'}</span>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">{activeBot.name} (O)</span>
              <span className="text-[10px] font-mono text-rose-400">{activeBot.elo} Elo</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">AI</span>
        </div>
      </div>

      {/* Main Game Layout: 3 Columns on Desktop, Board on Top on Mobile */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left Column: Player Character Avatar & Stats (Desktop) */}
        <div className="hidden lg:flex lg:col-span-3 flex-col items-center gap-3">
          <div className="w-full bg-[#14161f] border border-[#232734] rounded-2xl p-3 flex flex-col items-center">
            <CharacterModel
              characterId={characterId}
              emotion={playerEmotion}
              size="medium"
              displayName={username}
              elo={elo}
              showDialogue={true}
            />
            <button
              onClick={onOpenCharacterSelect}
              className="mt-2 text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Đổi tạo hình nhân vật</span>
            </button>
          </div>

          {/* Player Rank Card */}
          <div className="w-full bg-[#14161f] border border-[#232734] rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-slate-500 block uppercase">Cảnh Giới</span>
            <span className="text-xs font-bold font-mono" style={{ color: currentRank.color }}>
              {currentRank.icon} {currentRank.name}
            </span>
          </div>
        </div>

        {/* Center: Big Canvas Board */}
        <div className="lg:col-span-6 flex flex-col items-center w-full">
          <div className="w-full max-w-[560px] aspect-square bg-[#0f1016] border border-[#232734] rounded-2xl overflow-hidden shadow-lg relative">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full h-full cursor-pointer touch-none block"
            />
          </div>

          {/* Turn Status Bar */}
          <div className="w-full max-w-[560px] flex items-center justify-between px-3 py-1.5 mt-2 bg-[#14161f] border border-[#232734] rounded-xl text-xs">
            <span className="font-bold text-sky-400">{statusText}</span>
            <span className="text-[10px] text-slate-500 font-mono">{moveHistory.length} nước đi</span>
          </div>
        </div>

        {/* Right Column: Bot Character Avatar & Stats */}
        <div className="lg:col-span-3 flex flex-col items-center gap-3 w-full max-w-[560px] lg:max-w-none mx-auto">
          <div className="w-full bg-[#14161f] border border-[#232734] rounded-2xl p-3 flex flex-col items-center">
            <CharacterModel
              isBot={true}
              difficulty={difficulty}
              emotion={botEmotion}
              size="medium"
              displayName={activeBot.name}
              elo={activeBot.elo}
              showDialogue={true}
              autoTauntInterval={12000}
            />
          </div>

          {/* Bot Difficulty Tag Card */}
          <div className="w-full bg-[#14161f] border border-[#232734] rounded-xl p-2.5 text-center">
            <span className="text-[10px] text-slate-500 block uppercase">Đối Thủ AI</span>
            <span className="text-xs font-bold text-rose-400 font-mono">
              {activeBot.title}
            </span>
          </div>
        </div>
      </div>

      {/* Match Result Modal */}
      {matchResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-xs bg-[#14161f] border border-[#232734] rounded-2xl p-5 text-center flex flex-col items-center gap-3 shadow-xl">
            {/* Bot Model with reaction and interactive poke */}
            <CharacterModel
              isBot={true}
              difficulty={difficulty}
              emotion={matchResult.outcome === 'win' ? 'sad' : (matchResult.outcome === 'loss' ? 'happy' : 'idle')}
              size="medium"
              displayName={activeBot.name}
              elo={activeBot.elo}
              showDialogue={true}
              autoTauntInterval={null}
            />

            <div>
              <h3 className={`text-base font-bold ${
                matchResult.outcome === 'win' ? 'text-emerald-400' : matchResult.outcome === 'loss' ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {matchResult.outcome === 'win' ? 'Bạn thắng!' : matchResult.outcome === 'loss' ? 'Bạn thua!' : 'Hòa cờ!'}
              </h3>
              <span className={`text-xs font-mono font-bold block mt-1 ${
                matchResult.eloChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {matchResult.eloChange > 0 ? `+${matchResult.eloChange}` : matchResult.eloChange} Elo (Hiện tại: {matchResult.newElo})
              </span>
              {matchResult.newStreak > 1 && (
                <span className="text-[11px] text-amber-400 font-bold block mt-0.5">
                  🔥 Chuỗi Thắng: {matchResult.newStreak}
                </span>
              )}
            </div>

            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={() => startNewGame(difficulty)}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Chơi Ván Mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
