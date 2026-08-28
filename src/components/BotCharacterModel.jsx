import React, { useState, useEffect } from 'react';
import { audio } from '@/lib/audio';

const XIANXIA_QUOTES = {
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
  ],
  poke: [
    'Đừng chọc bổn tọa nữa!',
    'Tập trung đánh cờ đi đạo hữu!',
    'Coi chừng bổn tọa giáng sấm sét đấy!'
  ]
};

// 3 Cảm xúc khi thua (Buồn -> Khóc -> Tức giận)
const LOSE_PROGRESSION = [
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

export default function BotCharacterModel({
  emotion = 'idle',
  difficulty = 'easy',
  size = 'medium',
  botName = 'Đạo Sĩ Gấu Trúc',
  botElo = 800,
  showDialogue = true,
  autoTauntInterval = 12000
}) {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const [dialogue, setDialogue] = useState('Đạo hữu đã sẵn sàng chưa?');
  const [isPoked, setIsPoked] = useState(false);
  const [loseStage, setLoseStage] = useState(1);

  useEffect(() => {
    setCurrentEmotion(emotion);
    if (emotion === 'sad') {
      setLoseStage(1);
      setDialogue(LOSE_PROGRESSION[0].dialogue);
    } else {
      const list = XIANXIA_QUOTES[emotion] || XIANXIA_QUOTES.idle;
      setDialogue(list[Math.floor(Math.random() * list.length)]);
    }
  }, [emotion]);

  useEffect(() => {
    if (!autoTauntInterval || emotion === 'happy' || emotion === 'sad') return;

    const interval = setInterval(() => {
      const tauntList = XIANXIA_QUOTES.taunt;
      const randomTaunt = tauntList[Math.floor(Math.random() * tauntList.length)];
      setDialogue(randomTaunt);
      setCurrentEmotion('taunt');

      setTimeout(() => {
        if (emotion !== 'happy' && emotion !== 'sad') {
          setCurrentEmotion(emotion || 'idle');
        }
      }, 3500);
    }, autoTauntInterval);

    return () => clearInterval(interval);
  }, [autoTauntInterval, emotion]);

  const handlePoke = () => {
    audio.playClick();
    setIsPoked(true);

    if (emotion === 'sad') {
      setLoseStage(prev => {
        const nextStage = Math.min(prev + 1, 3);
        const pInfo = LOSE_PROGRESSION[nextStage - 1];
        setDialogue(pInfo.dialogue);
        return nextStage;
      });
      setTimeout(() => setIsPoked(false), 250);
      return;
    }

    setCurrentEmotion('taunt');
    const pList = XIANXIA_QUOTES.poke;
    setDialogue(pList[Math.floor(Math.random() * pList.length)]);

    setTimeout(() => {
      setIsPoked(false);
      setCurrentEmotion(emotion);
    }, 2000);
  };

  const getDimensions = () => {
    switch (size) {
      case 'small': return { w: 110, h: 130 };
      case 'large': return { w: 190, h: 220 };
      default: return { w: 140, h: 165 };
    }
  };

  const dim = getDimensions();

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Speech Bubble */}
      {showDialogue && (
        <div className="relative mb-2 max-w-[240px] bg-[#14161f]/95 border border-[#232734] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium text-center z-10 shadow-md">
          <p className={`font-semibold ${
            emotion === 'sad' ? LOSE_PROGRESSION[loseStage - 1].quoteColor : 'text-slate-200'
          }`}>
            "{dialogue}"
          </p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#14161f] border-r border-b border-[#232734] rotate-45"></div>
        </div>
      )}

      {/* Bot Container */}
      <div 
        onClick={handlePoke}
        title="Nhấn vào để tương tác"
        className={`relative cursor-pointer transition-all duration-200 ${
          isPoked 
            ? 'scale-105 -rotate-1' 
            : emotion === 'sad' && loseStage === 3
              ? 'animate-bounce'
              : 'hover:scale-[1.02] active:scale-95'
        }`}
      >
        {/* Floating text only (No border, clean text "Nhấn") */}
        {emotion === 'sad' && (
          <div className="absolute -top-3.5 right-1 sm:right-3 z-30 pointer-events-none animate-bounce">
            <span className="text-amber-400 font-bold text-xs select-none">
              Nhấn 👆
            </span>
          </div>
        )}

        {/* SVG Vector Bot Character */}
        <svg
          width={dim.w}
          height={dim.h}
          viewBox="0 0 200 230"
          className="drop-shadow-md"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="robe-daosi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2c3647" />
              <stop offset="100%" stopColor="#1e2430" />
            </linearGradient>
            <linearGradient id="robe-tienton" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="robe-maton" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1c24" />
              <stop offset="100%" stopColor="#0c0d12" />
            </linearGradient>
            <linearGradient id="hat-straw" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            <linearGradient id="gold-crown" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="demon-horns" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>

          {/* Flame aura when ANGRY (Stage 3) */}
          {emotion === 'sad' && loseStage === 3 && (
            <g id="anger-flames" className="animate-pulse">
              <path d="M 35 25 Q 25 5 40 12 Q 50 -5 55 20 Z" fill="#ef4444" opacity="0.9" />
              <path d="M 165 25 Q 175 5 160 12 Q 150 -5 145 20 Z" fill="#ef4444" opacity="0.9" />
              <path d="M 90 8 Q 100 -10 110 8 Z" fill="#f97316" opacity="0.9" />
              <path d="M 140 38 L 150 42 M 142 46 L 148 34" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* ================= 1. TORSO & OUTFITS ================= */}
          {/* OUTFIT 1: ĐẠO SĨ GẤU TRÚC */}
          {difficulty === 'easy' && (
            <g id="upper-torso-daosi">
              <path
                d="M 28 230 C 35 155, 60 135, 75 125 L 125 125 C 140 135, 165 155, 172 230 Z"
                fill={emotion === 'sad' && loseStage === 3 ? '#3f1c24' : 'url(#robe-daosi)'}
                stroke="#161c28"
                strokeWidth="2.5"
              />
              <path
                d="M 75 125 L 100 162 L 125 125 L 138 230 L 62 230 Z"
                fill="#64748b"
                stroke="#161c28"
                strokeWidth="2"
              />
              <rect x="68" y="195" width="64" height="15" rx="3" fill="#475569" stroke="#161c28" strokeWidth="2" />
              <circle cx="100" cy="202" r="6" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
            </g>
          )}

          {/* OUTFIT 2: VÔ CỰC TIÊN TÔN */}
          {difficulty === 'hard' && (
            <g id="upper-torso-tienton">
              <path
                d="M 24 230 C 32 150, 58 130, 75 120 L 125 120 C 142 130, 168 150, 176 230 Z"
                fill={emotion === 'sad' && loseStage === 3 ? '#3f1c24' : 'url(#robe-tienton)'}
                stroke="#94a3b8"
                strokeWidth="2.5"
              />
              <path
                d="M 75 120 L 100 165 L 125 120 L 140 230 L 60 230 Z"
                fill="#0284c7"
                stroke="#0369a1"
                strokeWidth="2"
              />
              <path d="M 75 120 L 100 165 L 125 120" fill="none" stroke="#f59e0b" strokeWidth="3" />
              <rect x="64" y="195" width="72" height="16" rx="3" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
              <circle cx="100" cy="203" r="8" fill="#38bdf8" stroke="#f59e0b" strokeWidth="1.5" />
            </g>
          )}

          {/* OUTFIT 3: CỬU U MA TÔN */}
          {difficulty === 'impossible' && (
            <g id="upper-torso-maton">
              <path
                d="M 22 230 C 30 148, 55 125, 75 118 L 125 118 C 145 125, 170 148, 178 230 Z"
                fill={emotion === 'sad' && loseStage === 3 ? '#2a0e14' : 'url(#robe-maton)'}
                stroke="#dc2626"
                strokeWidth="2.5"
              />
              <path d="M 25 170 L 45 140 L 65 175 Z" fill="#991b1b" stroke="#dc2626" strokeWidth="1.5" />
              <path d="M 175 170 L 155 140 L 135 175 Z" fill="#991b1b" stroke="#dc2626" strokeWidth="1.5" />
              <path
                d="M 75 118 L 100 166 L 125 118 L 142 230 L 58 230 Z"
                fill="#7f1d1d"
                stroke="#991b1b"
                strokeWidth="2"
              />
              <rect x="62" y="195" width="76" height="16" rx="3" fill="#18181b" stroke="#dc2626" strokeWidth="2" />
              <circle cx="100" cy="203" r="8" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
            </g>
          )}

          {/* ================= 2. HEAD & HEADGEAR ================= */}
          <g id="head-group">
            {/* Panda Ears */}
            <circle cx="56" cy="50" r="20" fill="#18181b" stroke="#09090b" strokeWidth="2.5" />
            <circle cx="144" cy="50" r="20" fill="#18181b" stroke="#09090b" strokeWidth="2.5" />

            {/* Panda Face */}
            <ellipse 
              cx="100" 
              cy="85" 
              rx="58" 
              ry="46" 
              fill={emotion === 'sad' && loseStage === 3 ? '#fee2e2' : '#ffffff'} 
              stroke="#09090b" 
              strokeWidth="3.5" 
            />

            {/* --- Headgear 1: Nón cói Đạo Sĩ --- */}
            {difficulty === 'easy' && (
              <g id="hat-daosi">
                <path d="M 68 35 C 68 12, 132 12, 132 35 Z" fill="url(#hat-straw)" stroke="#09090b" strokeWidth="3" />
                <path d="M 32 46 C 30 32, 170 32, 168 46 C 170 65, 30 65, 32 46 Z" fill="url(#hat-straw)" stroke="#09090b" strokeWidth="3" />
                <path d="M 52 38 L 56 46 L 50 44 Z" fill="#78350f" />
              </g>
            )}

            {/* --- Headgear 2: Kim Quan Tiên Tôn --- */}
            {difficulty === 'hard' && (
              <g id="crown-tienton">
                <circle cx="100" cy="22" r="16" fill="#18181b" stroke="#09090b" strokeWidth="2" />
                <path d="M 60 22 L 140 22" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
                <circle cx="140" cy="22" r="4" fill="#f59e0b" />
                <path d="M 76 42 L 84 18 L 100 28 L 116 18 L 124 42 Z" fill="url(#gold-crown)" stroke="#d97706" strokeWidth="2.5" />
                <path d="M 100 50 L 104 56 L 100 62 L 96 56 Z" fill="#38bdf8" />
              </g>
            )}

            {/* --- Headgear 3: Ma Sừng Ma Tôn --- */}
            {difficulty === 'impossible' && (
              <g id="horns-maton">
                <path d="M 65 42 C 45 20, 30 0, 18 12 C 28 35, 52 48, 62 48 Z" fill="url(#demon-horns)" stroke="#dc2626" strokeWidth="2.5" />
                <path d="M 135 42 C 155 20, 170 0, 182 12 C 172 35, 148 48, 138 48 Z" fill="url(#demon-horns)" stroke="#dc2626" strokeWidth="2.5" />
                <path d="M 72 44 L 80 20 L 100 34 L 120 20 L 128 44 Z" fill="#18181b" stroke="#ef4444" strokeWidth="2.5" />
                <path d="M 100 50 Q 94 60 100 66 Q 106 60 100 50 Z" fill="#ef4444" />
              </g>
            )}

            {/* ================= 3. MEME FACIAL EXPRESSIONS ================= */}
            {/* TAUNT / DEFAULT */}
            {currentEmotion === 'taunt' && (
              <g id="face-taunt">
                <path d="M 68 70 L 86 64" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 132 70 L 114 64" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="78" cy="74" r="4.5" fill="#000000" />
                <circle cx="122" cy="74" r="4.5" fill="#000000" />
                <path d="M 80 94 Q 100 88 120 94 Q 122 108 100 110 Q 78 108 80 94 Z" fill="#18181b" stroke="#000000" strokeWidth="2.5" />
                <path d="M 84 94 Q 100 90 116 94" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
              </g>
            )}

            {/* HAPPY / LAUGH */}
            {currentEmotion === 'happy' && (
              <g id="face-happy">
                <path d="M 70 74 Q 80 64 90 74" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 110 74 Q 120 64 130 74" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 68 90 Q 100 125 132 90 Z" fill="#991b1b" stroke="#000000" strokeWidth="3" />
                <path d="M 72 92 Q 100 106 128 92" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
              </g>
            )}

            {/* SAD LOSE PROGRESSION (Buồn -> Khóc -> Tức giận) */}
            {emotion === 'sad' && (
              <g id="face-lose-progression">
                {/* Stage 1: Buồn */}
                {loseStage === 1 && (
                  <g>
                    <path d="M 68 62 Q 78 72 88 62" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 132 62 Q 122 72 112 62" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="78" cy="76" r="4.5" fill="#000000" />
                    <circle cx="122" cy="76" r="4.5" fill="#000000" />
                    <path d="M 85 106 Q 100 94 115 106" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="128" cy="88" r="2.5" fill="#38bdf8" />
                  </g>
                )}

                {/* Stage 2: Khóc */}
                {loseStage === 2 && (
                  <g>
                    <path d="M 70 74 Q 80 82 90 74" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 110 74 Q 120 82 130 74" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    {/* Animated Stream of Tears */}
                    <path d="M 75 78 C 65 105, 55 140, 60 185" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />
                    <path d="M 125 78 C 118 105, 110 140, 115 185" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" fill="none" />
                    <path d="M 80 106 Q 100 94 120 106" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}

                {/* Stage 3: Tức Giận */}
                {loseStage === 3 && (
                  <g>
                    <path d="M 64 74 L 88 58" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
                    <path d="M 136 74 L 112 58" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
                    <circle cx="78" cy="74" r="6.5" fill="#ef4444" stroke="#000000" strokeWidth="2" />
                    <circle cx="122" cy="74" r="6.5" fill="#ef4444" stroke="#000000" strokeWidth="2" />
                    <path d="M 76 94 Q 100 86 124 94 Q 126 112 100 114 Q 74 112 76 94 Z" fill="#991b1b" stroke="#000000" strokeWidth="3" />
                    <path d="M 80 94 Q 100 90 120 94" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                  </g>
                )}
              </g>
            )}

            {/* THINKING */}
            {currentEmotion === 'thinking' && (
              <g id="face-thinking">
                <circle cx="74" cy="72" r="4.5" fill="#000000" />
                <circle cx="118" cy="72" r="4.5" fill="#000000" />
                <line x1="85" y1="98" x2="115" y2="98" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}

            {/* IDLE */}
            {currentEmotion === 'idle' && (
              <g id="face-idle">
                <circle cx="76" cy="72" r="4.5" fill="#000000" />
                <circle cx="120" cy="72" r="4.5" fill="#000000" />
                <path d="M 84 96 Q 100 104 116 96" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}
          </g>
        </svg>

        {/* Minimal Character Title Badge */}
        {size !== 'small' && (
          <div className="mt-1 flex items-center justify-center gap-1.5 px-3 py-0.5 bg-[#14161f] border border-[#232734] rounded-lg text-center text-xs">
            <span className="font-semibold text-slate-200">{botName}</span>
            <span className="text-[10px] font-mono text-slate-400">({botElo})</span>
          </div>
        )}
      </div>
    </div>
  );
}
