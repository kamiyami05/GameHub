import React, { useState, useEffect } from 'react';
import { audio } from '@/lib/audio';

const PLAYER_QUOTES = {
  idle: [
    'Tâm như chỉ thủy, hạ cờ quyết đoán!',
    'Đến lượt ta xuất chiêu rồi!',
    'Thế cờ này có thể mở ra đại cục.',
    'Nhìn thấu sơ hở của đối phương rồi!'
  ],
  thinking: [
    'Đang suy tính bước tiếp theo...',
    'Khai thông kinh mạch, tính toán trận thế...',
    'Nước này cần cẩn trọng phòng thủ...',
    'Đạo hữu đi nước cờ hiểm thật!'
  ],
  confident: [
    'Thế cờ đã thành, chuẩn bị đón chiêu!',
    'Đại thế đã định, khó lòng hóa giải!',
    'Tuyệt kỹ cờ vây xuất trận!'
  ],
  shocked: [
    'Ủa?! Nước cờ này hiểm hóc quá!',
    'Đối phương giăng bẫy từ lúc nào vậy?!',
    'Căng thẳng rồi đây!'
  ],
  happy: [
    'Thắng lợi giòn giã! Ván cờ tuyệt vời!',
    'Linh lực thăng hoa, cảnh giới đột phá!',
    'Cảm ơn đối thủ đã so tài!'
  ],
  sad: [
    'Sơ suất một nước, đành chịu thua...',
    'Ván sau ta nhất định sẽ phục thù!',
    'Hôm nay vận khí chưa thông...'
  ]
};

const BOT_QUOTES = {
  idle: [
    'Mau hạ cờ đi đạo hữu!',
    'Bổn tọa đợi đã lâu rồi đấy!',
    'Đạo hữu đang tính kế gì sao?',
    'Đừng để bổn tọa ngủ quên nha!'
  ],
  thinking: [
    'Bổn tọa đang suy tính...',
    'Khai mở thần thức...',
    'Nước đi này không tệ!',
    'Chuẩn bị nhận chiêu!'
  ],
  taunt: [
    'Nước cờ còn non lắm!',
    'Chuẩn bị thua đi đạo hữu!',
    'Nước đi này sơ hở quá!',
    'Bổn tọa xin nhẹ điểm Elo nhé!'
  ],
  confident: [
    'Bổn tọa đã nắm chắc phần thắng!',
    'Thế cờ này vô phương cứu chữa!',
    'Chấp nhận thất bại đi tiểu bối!'
  ],
  shocked: [
    'Ủa?! Đạo hữu luyện cấm thuật sao?!',
    'Nước cờ hiểm hóc thật!',
    'Căng thẳng rồi đây!',
    'Không thể coi thường đạo hữu!'
  ],
  happy: [
    'Hahaha! Bổn tọa thắng rồi!',
    'Cảm ơn điểm Elo của đạo hữu!',
    'Ván cờ tuyệt vời!'
  ]
};

// 3 Giai đoạn cảm xúc khi Bot thua
const BOT_LOSE_PROGRESSION = [
  {
    stage: 1,
    dialogue: 'Hôm nay ngã ngựa rồi... 😔',
    quoteColor: 'text-slate-300'
  },
  {
    stage: 2,
    dialogue: 'Hu hu hu! Bị trừ điểm Elo rồi! 😭😭',
    quoteColor: 'text-sky-300'
  },
  {
    stage: 3,
    dialogue: 'ĐỦ RỒI! Ván sau ta phục thù! 😡🔥',
    quoteColor: 'text-rose-400'
  }
];

export default function CharacterModel({
  characterId = 'panda', // 'panda' | 'fox' | 'tiger' | 'dragon' | 'sage' | 'mecha'
  isBot = false,
  difficulty = 'hard', // for bot: 'easy' | 'hard' | 'impossible'
  emotion = 'idle', // 'idle' | 'thinking' | 'confident' | 'shocked' | 'happy' | 'sad'
  size = 'medium', // 'small' | 'medium' | 'large'
  displayName = 'Kỳ Thủ',
  elo = 1000,
  showDialogue = true,
  autoTauntInterval = 12000
}) {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const [dialogue, setDialogue] = useState('');
  const [isPoked, setIsPoked] = useState(false);
  const [loseStage, setLoseStage] = useState(1);

  // Sync emotion & dialogue
  useEffect(() => {
    setCurrentEmotion(emotion);
    if (isBot && emotion === 'sad') {
      setLoseStage(1);
      setDialogue(BOT_LOSE_PROGRESSION[0].dialogue);
    } else {
      const quoteDict = isBot ? BOT_QUOTES : PLAYER_QUOTES;
      const list = quoteDict[emotion] || quoteDict.idle;
      setDialogue(list[Math.floor(Math.random() * list.length)]);
    }
  }, [emotion, isBot]);

  // Periodic random banter during match
  useEffect(() => {
    if (!autoTauntInterval || emotion === 'happy' || emotion === 'sad') return;

    const interval = setInterval(() => {
      const quoteDict = isBot ? BOT_QUOTES : PLAYER_QUOTES;
      const pool = isBot ? (BOT_QUOTES.taunt || BOT_QUOTES.idle) : (PLAYER_QUOTES.confident || PLAYER_QUOTES.idle);
      const rand = pool[Math.floor(Math.random() * pool.length)];
      setDialogue(rand);

      setTimeout(() => {
        if (emotion !== 'happy' && emotion !== 'sad') {
          setCurrentEmotion(emotion || 'idle');
        }
      }, 3500);
    }, autoTauntInterval);

    return () => clearInterval(interval);
  }, [autoTauntInterval, emotion, isBot]);

  const handlePoke = () => {
    audio.playClick();
    setIsPoked(true);

    if (isBot && emotion === 'sad') {
      setLoseStage(prev => {
        const nextStage = Math.min(prev + 1, 3);
        const pInfo = BOT_LOSE_PROGRESSION[nextStage - 1];
        setDialogue(pInfo.dialogue);
        return nextStage;
      });
      setTimeout(() => setIsPoked(false), 250);
      return;
    }

    if (isBot) {
      setCurrentEmotion('taunt');
      const pList = BOT_QUOTES.taunt || BOT_QUOTES.idle;
      setDialogue(pList[Math.floor(Math.random() * pList.length)]);
    } else {
      setCurrentEmotion('confident');
      const pList = PLAYER_QUOTES.confident || PLAYER_QUOTES.idle;
      setDialogue(pList[Math.floor(Math.random() * pList.length)]);
    }

    setTimeout(() => {
      setIsPoked(false);
      setCurrentEmotion(emotion);
    }, 2000);
  };

  const getDimensions = () => {
    switch (size) {
      case 'small': return { w: 90, h: 110 };
      case 'large': return { w: 180, h: 210 };
      default: return { w: 130, h: 155 };
    }
  };

  const dim = getDimensions();

  // Resolve visual archetype
  const activeChar = isBot 
    ? (difficulty === 'easy' ? 'panda' : difficulty === 'hard' ? 'sage' : 'dragon')
    : characterId;

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Speech Bubble */}
      {showDialogue && dialogue && (
        <div className="relative mb-2 max-w-[220px] bg-[#14161f]/95 border border-[#232734] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium text-center z-10 shadow-md">
          <p className={`font-semibold ${
            isBot && emotion === 'sad' ? BOT_LOSE_PROGRESSION[loseStage - 1].quoteColor : 'text-slate-200'
          }`}>
            "{dialogue}"
          </p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#14161f] border-r border-b border-[#232734] rotate-45"></div>
        </div>
      )}

      {/* Interactive Avatar Container */}
      <div 
        onClick={handlePoke}
        title="Nhấn vào để tương tác"
        className={`relative cursor-pointer transition-all duration-200 ${
          isPoked 
            ? 'scale-105 -rotate-1' 
            : isBot && emotion === 'sad' && loseStage === 3
              ? 'animate-bounce'
              : 'hover:scale-[1.02] active:scale-95'
        }`}
      >
        {/* Floating text '👈 Nhấn' on Bot when defeated */}
        {isBot && emotion === 'sad' && (
          <div className="absolute top-[52%] -translate-y-1/2 -right-3 sm:-right-6 z-30 pointer-events-none animate-bounce">
            <span className="text-amber-400 font-bold text-xs select-none flex items-center gap-1">
              👈 Nhấn
            </span>
          </div>
        )}

        {/* SVG Vector Model */}
        <svg
          width={dim.w}
          height={dim.h}
          viewBox="0 0 200 230"
          className="drop-shadow-md"
        >
          <defs>
            {/* Common & Character Specific Gradients */}
            <linearGradient id="grad-panda-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2c3647" />
              <stop offset="100%" stopColor="#1e2430" />
            </linearGradient>
            <linearGradient id="grad-fox-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="grad-tiger-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="grad-dragon-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="grad-sage-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="grad-mecha-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#164e63" />
            </linearGradient>

            {/* Hat Gradients */}
            <linearGradient id="grad-straw-hat" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="grad-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="grad-horns" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>

          {/* Flame aura when ANGRY (Bot Stage 3) */}
          {isBot && emotion === 'sad' && loseStage === 3 && (
            <g id="anger-flames" className="animate-pulse">
              <path d="M 35 25 Q 25 5 40 12 Q 50 -5 55 20 Z" fill="#ef4444" opacity="0.9" />
              <path d="M 165 25 Q 175 5 160 12 Q 150 -5 145 20 Z" fill="#ef4444" opacity="0.9" />
              <path d="M 90 8 Q 100 -10 110 8 Z" fill="#f97316" opacity="0.9" />
            </g>
          )}

          {/* ================= 1. TORSO & OUTFITS ================= */}
          <g id="character-torso">
            {activeChar === 'panda' && (
              <g>
                <path
                  d="M 28 230 C 35 155, 60 135, 75 125 L 125 125 C 140 135, 165 155, 172 230 Z"
                  fill={isBot && emotion === 'sad' && loseStage === 3 ? '#3f1c24' : 'url(#grad-panda-robe)'}
                  stroke="#161c28"
                  strokeWidth="2.5"
                />
                <path d="M 75 125 L 100 162 L 125 125 L 138 230 L 62 230 Z" fill="#64748b" stroke="#161c28" strokeWidth="2" />
                <rect x="68" y="195" width="64" height="15" rx="3" fill="#475569" stroke="#161c28" strokeWidth="2" />
                <circle cx="100" cy="202" r="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
              </g>
            )}

            {activeChar === 'fox' && (
              <g>
                <path
                  d="M 28 230 C 35 155, 60 135, 75 125 L 125 125 C 140 135, 165 155, 172 230 Z"
                  fill="url(#grad-fox-robe)"
                  stroke="#881337"
                  strokeWidth="2.5"
                />
                <path d="M 75 125 L 100 165 L 125 125 L 135 230 L 65 230 Z" fill="#fda4af" stroke="#881337" strokeWidth="2" />
                <rect x="66" y="195" width="68" height="15" rx="3" fill="#be123c" stroke="#881337" strokeWidth="2" />
                <circle cx="100" cy="202" r="7" fill="#fb7185" stroke="#ffe4e6" strokeWidth="1.5" />
              </g>
            )}

            {activeChar === 'tiger' && (
              <g>
                <path
                  d="M 24 230 C 32 150, 58 130, 75 120 L 125 120 C 142 130, 168 150, 176 230 Z"
                  fill="url(#grad-tiger-robe)"
                  stroke="#78350f"
                  strokeWidth="2.5"
                />
                <path d="M 25 170 L 45 140 L 65 175 Z" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
                <path d="M 175 170 L 155 140 L 135 175 Z" fill="#d97706" stroke="#78350f" strokeWidth="1.5" />
                <path d="M 75 120 L 100 165 L 125 120 L 140 230 L 60 230 Z" fill="#fed7aa" stroke="#78350f" strokeWidth="2" />
                <rect x="64" y="195" width="72" height="16" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="2" />
              </g>
            )}

            {activeChar === 'dragon' && (
              <g>
                <path
                  d="M 22 230 C 30 148, 55 125, 75 118 L 125 118 C 145 125, 170 148, 178 230 Z"
                  fill={isBot && difficulty === 'impossible' ? '#18181b' : 'url(#grad-dragon-robe)'}
                  stroke={isBot && difficulty === 'impossible' ? '#dc2626' : '#0284c7'}
                  strokeWidth="2.5"
                />
                <path d="M 75 118 L 100 166 L 125 118 L 142 230 L 58 230 Z" fill="#0369a1" stroke="#0284c7" strokeWidth="2" />
                <rect x="62" y="195" width="76" height="16" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="100" cy="203" r="8" fill="#38bdf8" stroke="#f0f9ff" strokeWidth="1.5" />
              </g>
            )}

            {activeChar === 'sage' && (
              <g>
                <path
                  d="M 24 230 C 32 150, 58 130, 75 120 L 125 120 C 142 130, 168 150, 176 230 Z"
                  fill="url(#grad-sage-robe)"
                  stroke="#475569"
                  strokeWidth="2.5"
                />
                <path d="M 75 120 L 100 165 L 125 120 L 140 230 L 60 230 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
                <path d="M 75 120 L 100 165 L 125 120" fill="none" stroke="#f59e0b" strokeWidth="3" />
                <rect x="64" y="195" width="72" height="16" rx="3" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
                <circle cx="100" cy="203" r="8" fill="#38bdf8" stroke="#f59e0b" strokeWidth="1.5" />
              </g>
            )}

            {activeChar === 'mecha' && (
              <g>
                <path
                  d="M 22 230 C 30 150, 56 128, 75 120 L 125 120 C 144 128, 170 150, 178 230 Z"
                  fill="url(#grad-mecha-robe)"
                  stroke="#0891b2"
                  strokeWidth="2.5"
                />
                <path d="M 75 120 L 100 160 L 125 120 L 138 230 L 62 230 Z" fill="#155e75" stroke="#06b6d4" strokeWidth="2" />
                <rect x="65" y="195" width="70" height="15" rx="3" fill="#0e7490" stroke="#22d3ee" strokeWidth="2" />
                <circle cx="100" cy="202" r="7" fill="#22d3ee" stroke="#cffafe" strokeWidth="1.5" />
              </g>
            )}
          </g>

          {/* ================= 2. HEAD & DISTINCT GEAR ================= */}
          <g id="character-head">
            {/* Base Ears */}
            {activeChar === 'panda' && (
              <g>
                <circle cx="56" cy="50" r="20" fill="#18181b" stroke="#09090b" strokeWidth="2.5" />
                <circle cx="144" cy="50" r="20" fill="#18181b" stroke="#09090b" strokeWidth="2.5" />
              </g>
            )}
            {activeChar === 'fox' && (
              <g>
                <polygon points="40,65 65,20 80,65" fill="#f43f5e" stroke="#881337" strokeWidth="2.5" />
                <polygon points="50,60 65,32 72,60" fill="#ffe4e6" />
                <polygon points="160,65 135,20 120,65" fill="#f43f5e" stroke="#881337" strokeWidth="2.5" />
                <polygon points="150,60 135,32 128,60" fill="#ffe4e6" />
              </g>
            )}
            {activeChar === 'tiger' && (
              <g>
                <circle cx="54" cy="48" r="18" fill="#f59e0b" stroke="#78350f" strokeWidth="2.5" />
                <circle cx="54" cy="48" r="10" fill="#fef3c7" />
                <circle cx="146" cy="48" r="18" fill="#f59e0b" stroke="#78350f" strokeWidth="2.5" />
                <circle cx="146" cy="48" r="10" fill="#fef3c7" />
              </g>
            )}
            {activeChar === 'dragon' && (
              <g>
                <path d="M 65 42 C 45 20, 30 0, 18 12 C 28 35, 52 48, 62 48 Z" fill="url(#grad-horns)" stroke="#dc2626" strokeWidth="2.5" />
                <path d="M 135 42 C 155 20, 170 0, 182 12 C 172 35, 148 48, 138 48 Z" fill="url(#grad-horns)" stroke="#dc2626" strokeWidth="2.5" />
              </g>
            )}
            {activeChar === 'sage' && (
              <g>
                <circle cx="56" cy="50" r="18" fill="#18181b" stroke="#09090b" strokeWidth="2" />
                <circle cx="144" cy="50" r="18" fill="#18181b" stroke="#09090b" strokeWidth="2" />
              </g>
            )}
            {activeChar === 'mecha' && (
              <g>
                <rect x="36" y="55" width="14" height="24" rx="4" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
                <rect x="150" y="55" width="14" height="24" rx="4" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
              </g>
            )}

            {/* Base Face Ellipse */}
            <ellipse 
              cx="100" 
              cy="85" 
              rx="58" 
              ry="46" 
              fill={
                activeChar === 'mecha' ? '#0f172a' :
                activeChar === 'tiger' ? '#fef3c7' :
                activeChar === 'fox' ? '#fff1f2' :
                (isBot && emotion === 'sad' && loseStage === 3 ? '#fee2e2' : '#ffffff')
              } 
              stroke={activeChar === 'mecha' ? '#06b6d4' : '#09090b'} 
              strokeWidth="3.5" 
            />

            {/* Headgear Decor */}
            {activeChar === 'panda' && (
              <g id="hat-straw">
                <path d="M 68 35 C 68 12, 132 12, 132 35 Z" fill="url(#grad-straw-hat)" stroke="#09090b" strokeWidth="3" />
                <path d="M 32 46 C 30 32, 170 32, 168 46 C 170 65, 30 65, 32 46 Z" fill="url(#grad-straw-hat)" stroke="#09090b" strokeWidth="3" />
              </g>
            )}
            {activeChar === 'fox' && (
              <g id="fox-jewel">
                <circle cx="100" cy="50" r="6" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
              </g>
            )}
            {activeChar === 'tiger' && (
              <g id="tiger-stripes">
                <path d="M 100 48 L 100 62 M 90 54 L 110 54" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
            {activeChar === 'dragon' && (
              <g id="dragon-crown">
                <path d="M 72 44 L 80 20 L 100 34 L 120 20 L 128 44 Z" fill="url(#grad-gold)" stroke="#d97706" strokeWidth="2.5" />
                <circle cx="100" cy="50" r="5" fill="#38bdf8" />
              </g>
            )}
            {activeChar === 'sage' && (
              <g id="sage-crown">
                <circle cx="100" cy="22" r="16" fill="#18181b" stroke="#09090b" strokeWidth="2" />
                <path d="M 60 22 L 140 22" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                <path d="M 76 42 L 84 18 L 100 28 L 116 18 L 124 42 Z" fill="url(#grad-gold)" stroke="#d97706" strokeWidth="2.5" />
              </g>
            )}
            {activeChar === 'mecha' && (
              <g id="mecha-visor">
                <rect x="60" y="65" width="80" height="18" rx="6" fill="#22d3ee" stroke="#0891b2" strokeWidth="2" />
                <line x1="65" y1="74" x2="135" y2="74" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
              </g>
            )}

            {/* ================= 3. FACIAL EXPRESSIONS ================= */}
            {/* Non-Mecha Eyes & Mouth */}
            {activeChar !== 'mecha' && (
              <g id="face-features">
                {currentEmotion === 'confident' || currentEmotion === 'taunt' ? (
                  <g id="face-confident">
                    <path d="M 68 70 L 86 64" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 132 70 L 114 64" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="78" cy="74" r="4.5" fill="#000000" />
                    <circle cx="122" cy="74" r="4.5" fill="#000000" />
                    <path d="M 80 94 Q 100 88 120 94 Q 122 108 100 110 Q 78 108 80 94 Z" fill="#18181b" stroke="#000000" strokeWidth="2.5" />
                    <path d="M 84 94 Q 100 90 116 94" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                ) : currentEmotion === 'happy' ? (
                  <g id="face-happy">
                    <path d="M 70 74 Q 80 64 90 74" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 110 74 Q 120 64 130 74" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 68 90 Q 100 125 132 90 Z" fill="#991b1b" stroke="#000000" strokeWidth="3" />
                    <path d="M 72 92 Q 100 106 128 92" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
                  </g>
                ) : currentEmotion === 'shocked' ? (
                  <g id="face-shocked">
                    <circle cx="76" cy="72" r="6" fill="#000000" />
                    <circle cx="124" cy="72" r="6" fill="#000000" />
                    <ellipse cx="100" cy="100" rx="10" ry="14" fill="#18181b" stroke="#000000" strokeWidth="2.5" />
                    {/* Sweat drop */}
                    <path d="M 135 60 Q 140 50 145 60 Q 140 68 135 60 Z" fill="#38bdf8" />
                  </g>
                ) : currentEmotion === 'sad' ? (
                  <g id="face-sad">
                    {isBot && loseStage === 2 ? (
                      <g>
                        <path d="M 70 74 Q 80 82 90 74" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 110 74 Q 120 82 130 74" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 75 78 C 65 105, 55 140, 60 185" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />
                        <path d="M 125 78 C 118 105, 110 140, 115 185" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />
                        <path d="M 80 106 Q 100 94 120 106" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                      </g>
                    ) : isBot && loseStage === 3 ? (
                      <g>
                        <path d="M 64 74 L 88 58" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M 136 74 L 112 58" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
                        <circle cx="78" cy="74" r="6.5" fill="#ef4444" stroke="#000000" strokeWidth="2" />
                        <circle cx="122" cy="74" r="6.5" fill="#ef4444" stroke="#000000" strokeWidth="2" />
                        <path d="M 76 94 Q 100 86 124 94 Q 126 112 100 114 Q 74 112 76 94 Z" fill="#991b1b" stroke="#000000" strokeWidth="3" />
                      </g>
                    ) : (
                      <g>
                        <path d="M 68 62 Q 78 72 88 62" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 132 62 Q 122 72 112 62" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="78" cy="76" r="4.5" fill="#000000" />
                        <circle cx="122" cy="76" r="4.5" fill="#000000" />
                        <path d="M 85 106 Q 100 94 115 106" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="128" cy="88" r="2.5" fill="#38bdf8" />
                      </g>
                    )}
                  </g>
                ) : currentEmotion === 'thinking' ? (
                  <g id="face-thinking">
                    <circle cx="74" cy="72" r="4.5" fill="#000000" />
                    <circle cx="118" cy="72" r="4.5" fill="#000000" />
                    <line x1="85" y1="98" x2="115" y2="98" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                  </g>
                ) : (
                  <g id="face-idle">
                    <circle cx="76" cy="72" r="4.5" fill="#000000" />
                    <circle cx="120" cy="72" r="4.5" fill="#000000" />
                    <path d="M 84 96 Q 100 104 116 96" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}
              </g>
            )}

            {/* Mecha Digital Mouth */}
            {activeChar === 'mecha' && (
              <g id="mecha-mouth">
                <rect x="80" y="96" width="40" height="8" rx="2" fill="#0891b2" stroke="#22d3ee" strokeWidth="1.5" />
                <line x1="85" y1="100" x2="115" y2="100" stroke="#a5f3fc" strokeWidth="2" />
              </g>
            )}
          </g>
        </svg>

        {/* Character Title Badge */}
        {size !== 'small' && (
          <div className="mt-1 flex items-center justify-center gap-1.5 px-3 py-0.5 bg-[#14161f] border border-[#232734] rounded-lg text-center text-xs">
            <span className="font-semibold text-slate-200">{displayName}</span>
            <span className="text-[10px] font-mono text-slate-400">({elo})</span>
          </div>
        )}
      </div>
    </div>
  );
}
