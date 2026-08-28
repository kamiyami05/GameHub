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
      case 'large': return { w: 180, h: 215 };
      default: return { w: 135, h: 160 };
    }
  };

  const dim = getDimensions();

  // Resolve visual archetype
  const activeChar = isBot 
    ? (difficulty === 'easy' ? 'panda' : difficulty === 'hard' ? 'sage' : 'maton')
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

        {/* High-Definition Unique SVG Vector Characters */}
        <svg
          width={dim.w}
          height={dim.h}
          viewBox="0 0 200 230"
          className="drop-shadow-lg"
        >
          <defs>
            {/* Panda Shaders */}
            <linearGradient id="panda-hat" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="panda-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Fox Fairy Shaders */}
            <linearGradient id="fox-fur" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="fox-hanfu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
            <linearGradient id="fox-silk" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>

            {/* Tiger General Shaders */}
            <linearGradient id="tiger-armor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="tiger-fur" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            {/* Dragon Monarch Shaders */}
            <linearGradient id="dragon-skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="dragon-horn" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="dragon-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Sage Shaders */}
            <linearGradient id="sage-robe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="sage-inner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            {/* Mecha Shaders */}
            <linearGradient id="mecha-armor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="mecha-glow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>

            {/* Ma Ton Shaders */}
            <linearGradient id="maton-horn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
            <linearGradient id="maton-armor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#18181b" />
              <stop offset="100%" stopColor="#09090b" />
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

          {/* ========================================================================= */}
          {/* 1. ARCHETYPE: PANDA (ĐẠO SĨ GẤU TRÚC)                                   */}
          {/* ========================================================================= */}
          {activeChar === 'panda' && (
            <g id="char-panda">
              {/* Torso & Robe */}
              <path d="M 28 230 C 35 155, 60 135, 75 125 L 125 125 C 140 135, 165 155, 172 230 Z" fill="url(#panda-robe)" stroke="#0f172a" strokeWidth="2.5" />
              <path d="M 75 125 L 100 162 L 125 125 L 138 230 L 62 230 Z" fill="#475569" stroke="#0f172a" strokeWidth="2" />
              <path d="M 75 125 L 100 162 L 125 125" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
              <rect x="68" y="195" width="64" height="15" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
              <circle cx="100" cy="202" r="6" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.5" />

              {/* Ears */}
              <circle cx="54" cy="52" r="22" fill="#18181b" stroke="#09090b" strokeWidth="2.5" />
              <circle cx="54" cy="52" r="11" fill="#27272a" />
              <circle cx="146" cy="52" r="22" fill="#18181b" stroke="#09090b" strokeWidth="2.5" />
              <circle cx="146" cy="52" r="11" fill="#27272a" />

              {/* Head */}
              <ellipse cx="100" cy="85" rx="58" ry="46" fill="#ffffff" stroke="#09090b" strokeWidth="3.5" />

              {/* Conical Straw Hat */}
              <path d="M 68 35 C 68 12, 132 12, 132 35 Z" fill="url(#panda-hat)" stroke="#09090b" strokeWidth="3" />
              <path d="M 30 46 C 28 30, 172 30, 170 46 C 172 65, 28 65, 30 46 Z" fill="url(#panda-hat)" stroke="#09090b" strokeWidth="3" />
              <line x1="50" y1="46" x2="150" y2="46" stroke="#78350f" strokeWidth="2" />

              {/* Panda Signature Eye Patches */}
              <ellipse cx="76" cy="74" rx="14" ry="18" transform="rotate(-15 76 74)" fill="#18181b" />
              <ellipse cx="124" cy="74" rx="14" ry="18" transform="rotate(15 124 74)" fill="#18181b" />

              {/* Eyes & Snout */}
              <circle cx="78" cy="74" r="4.5" fill="#ffffff" />
              <circle cx="122" cy="74" r="4.5" fill="#ffffff" />
              <circle cx="78" cy="74" r="2.5" fill="#000000" />
              <circle cx="122" cy="74" r="2.5" fill="#000000" />

              <ellipse cx="100" cy="88" rx="8" ry="5" fill="#18181b" />
              <path d="M 100 93 L 100 97 M 94 97 Q 100 102 106 97" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 2. ARCHETYPE: FOX FAIRY (LINH HỒ TIÊN TỬ)                                */}
          {/* ========================================================================= */}
          {activeChar === 'fox' && (
            <g id="char-fox">
              {/* Flowing Hanfu Robe */}
              <path d="M 28 230 C 35 155, 60 135, 75 125 L 125 125 C 140 135, 165 155, 172 230 Z" fill="url(#fox-hanfu)" stroke="#881337" strokeWidth="2.5" />
              {/* Celestial Floating Silk Ribbons */}
              <path d="M 32 150 Q 15 170 25 210 Q 35 180 45 160 Z" fill="url(#fox-silk)" opacity="0.9" />
              <path d="M 168 150 Q 185 170 175 210 Q 165 180 155 160 Z" fill="url(#fox-silk)" opacity="0.9" />
              <path d="M 75 125 L 100 165 L 125 125 L 138 230 L 62 230 Z" fill="#ffe4e6" stroke="#881337" strokeWidth="2" />
              <rect x="66" y="195" width="68" height="15" rx="3" fill="#9f1239" stroke="#881337" strokeWidth="2" />
              <circle cx="100" cy="202" r="6" fill="#10b981" stroke="#ffe4e6" strokeWidth="1.5" />

              {/* Big Fluffy Fox Ears with Jade Earring */}
              <polygon points="35,75 60,10 82,70" fill="url(#fox-fur)" stroke="#881337" strokeWidth="2.5" />
              <polygon points="46,68 60,25 72,66" fill="#fff1f2" />
              <polygon points="165,75 140,10 118,70" fill="url(#fox-fur)" stroke="#881337" strokeWidth="2.5" />
              <polygon points="154,68 140,25 128,66" fill="#fff1f2" />
              {/* Earring */}
              <circle cx="34" cy="76" r="3.5" fill="#f59e0b" />
              <line x1="34" y1="80" x2="34" y2="92" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="34" cy="94" r="3" fill="#10b981" />

              {/* Fox Head & Sleek Muzzle */}
              <path d="M 45 65 C 45 40, 155 40, 155 65 C 160 95, 140 120, 100 128 C 60 120, 40 95, 45 65 Z" fill="url(#fox-fur)" stroke="#881337" strokeWidth="3" />
              {/* White Fox Cheeks */}
              <path d="M 52 75 C 60 95, 80 118, 100 126 C 120 118, 140 95, 148 75 C 130 92, 100 95, 100 95 C 100 95, 70 92, 52 75 Z" fill="#ffffff" />

              {/* Forehead Lotus / Bindi Mark */}
              <path d="M 100 48 Q 96 56 100 62 Q 104 56 100 48 Z" fill="#e11d48" />

              {/* Fox Eyes with Seductive Red Eyeliner */}
              <path d="M 64 74 Q 78 66 90 74 Q 78 80 64 74 Z" fill="#1e1b4b" stroke="#e11d48" strokeWidth="1.5" />
              <circle cx="78" cy="73" r="3" fill="#f43f5e" />
              <circle cx="79" cy="72" r="1" fill="#ffffff" />

              <path d="M 136 74 Q 122 66 110 74 Q 122 80 136 74 Z" fill="#1e1b4b" stroke="#e11d48" strokeWidth="1.5" />
              <circle cx="122" cy="73" r="3" fill="#f43f5e" />
              <circle cx="121" cy="72" r="1" fill="#ffffff" />

              {/* Fox Cute Nose & Smile */}
              <polygon points="97,94 103,94 100,98" fill="#881337" />
              <path d="M 94 104 Q 100 108 106 104" stroke="#881337" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 3. ARCHETYPE: WHITE TIGER GENERAL (BẠCH HỔ TƯỚNG QUÂN)                   */}
          {/* ========================================================================= */}
          {activeChar === 'tiger' && (
            <g id="char-tiger">
              {/* Golden Warrior Armor & Cape */}
              <path d="M 20 230 C 25 150, 55 125, 75 118 L 125 118 C 145 125, 175 150, 180 230 Z" fill="#b45309" stroke="#78350f" strokeWidth="2.5" />
              <path d="M 22 145 L 48 120 L 70 155 L 50 180 Z" fill="url(#tiger-armor)" stroke="#78350f" strokeWidth="2" />
              <path d="M 178 145 L 152 120 L 130 155 L 150 180 Z" fill="url(#tiger-armor)" stroke="#78350f" strokeWidth="2" />
              <path d="M 75 118 L 100 166 L 125 118 L 142 230 L 58 230 Z" fill="url(#tiger-armor)" stroke="#78350f" strokeWidth="2" />
              <rect x="62" y="195" width="76" height="16" rx="3" fill="#78350f" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="100" cy="203" r="7" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />

              {/* Tiger Rounded Ears */}
              <circle cx="52" cy="50" r="20" fill="url(#tiger-fur)" stroke="#09090b" strokeWidth="2.5" />
              <circle cx="52" cy="50" r="10" fill="#f59e0b" />
              <circle cx="148" cy="50" r="20" fill="url(#tiger-fur)" stroke="#09090b" strokeWidth="2.5" />
              <circle cx="148" cy="50" r="10" fill="#f59e0b" />

              {/* White Tiger Face */}
              <ellipse cx="100" cy="85" rx="58" ry="46" fill="url(#tiger-fur)" stroke="#09090b" strokeWidth="3.5" />

              {/* Forehead "王" (King) Tiger Stripes */}
              <g stroke="#09090b" strokeWidth="3" strokeLinecap="round">
                <line x1="88" y1="46" x2="112" y2="46" />
                <line x1="90" y1="53" x2="110" y2="53" />
                <line x1="86" y1="60" x2="114" y2="60" />
                <line x1="100" y1="44" x2="100" y2="62" />
              </g>

              {/* Cheek Stripes */}
              <path d="M 46 76 L 62 80 M 48 86 L 64 88" stroke="#09090b" strokeWidth="3" strokeLinecap="round" />
              <path d="M 154 76 L 138 80 M 152 86 L 136 88" stroke="#09090b" strokeWidth="3" strokeLinecap="round" />

              {/* Fierce Tiger Eyes */}
              <circle cx="76" cy="74" r="6" fill="#f59e0b" stroke="#09090b" strokeWidth="2" />
              <circle cx="76" cy="74" r="2.5" fill="#000000" />
              <circle cx="124" cy="74" r="6" fill="#f59e0b" stroke="#09090b" strokeWidth="2" />
              <circle cx="124" cy="74" r="2.5" fill="#000000" />
              <path d="M 68 68 L 86 64" stroke="#09090b" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 132 68 L 114 64" stroke="#09090b" strokeWidth="3.5" strokeLinecap="round" />

              {/* Snout with Whiskers */}
              <ellipse cx="100" cy="94" rx="14" ry="9" fill="#ffffff" stroke="#09090b" strokeWidth="1.5" />
              <polygon points="96,90 104,90 100,95" fill="#e11d48" />
              <path d="M 94 99 Q 100 103 106 99" stroke="#09090b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 4. ARCHETYPE: DRAGON MONARCH (THẦN LONG THÁNH TÔN)                        */}
          {/* ========================================================================= */}
          {activeChar === 'dragon' && (
            <g id="char-dragon">
              {/* Imperial Dragon Robe */}
              <path d="M 22 230 C 30 148, 55 125, 75 118 L 125 118 C 145 125, 170 148, 178 230 Z" fill="url(#dragon-robe)" stroke="#ca8a04" strokeWidth="2.5" />
              <path d="M 75 118 L 100 166 L 125 118 L 142 230 L 58 230 Z" fill="#0369a1" stroke="#ca8a04" strokeWidth="2" />
              <path d="M 75 118 L 100 166 L 125 118" fill="none" stroke="#fde047" strokeWidth="3" />
              <rect x="62" y="195" width="76" height="16" rx="3" fill="#0f172a" stroke="#fde047" strokeWidth="2" />
              <circle cx="100" cy="203" r="8" fill="#38bdf8" stroke="#fde047" strokeWidth="2" />

              {/* Branching Majestic Golden Dragon Horns */}
              <path d="M 65 48 C 50 25, 30 10, 16 18 C 24 35, 42 45, 58 52 Z" fill="url(#dragon-horn)" stroke="#a16207" strokeWidth="2" />
              <path d="M 38 22 C 34 8, 22 4, 18 12 C 24 20, 32 24, 38 22 Z" fill="url(#dragon-horn)" stroke="#a16207" strokeWidth="1.5" />

              <path d="M 135 48 C 150 25, 170 10, 184 18 C 176 35, 158 45, 142 52 Z" fill="url(#dragon-horn)" stroke="#a16207" strokeWidth="2" />
              <path d="M 162 22 C 166 8, 178 4, 182 12 C 176 20, 168 24, 162 22 Z" fill="url(#dragon-horn)" stroke="#a16207" strokeWidth="1.5" />

              {/* Imperial Dragon Crown */}
              <path d="M 72 44 L 80 18 L 100 28 L 120 18 L 128 44 Z" fill="url(#dragon-horn)" stroke="#a16207" strokeWidth="2.5" />
              <circle cx="100" cy="38" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />

              {/* Azure Dragon Head & Scales */}
              <ellipse cx="100" cy="85" rx="58" ry="46" fill="url(#dragon-skin)" stroke="#075985" strokeWidth="3" />

              {/* Scales pattern on cheeks */}
              <path d="M 52 76 Q 60 72 68 76 M 50 84 Q 58 80 66 84" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
              <path d="M 148 76 Q 140 72 132 76 M 150 84 Q 142 80 134 84" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

              {/* Piercing Glowing Dragon Eyes */}
              <path d="M 64 74 Q 78 66 90 74 Q 78 82 64 74 Z" fill="#0c4a6e" stroke="#fde047" strokeWidth="2" />
              <ellipse cx="78" cy="74" rx="2.5" ry="5" fill="#fde047" />
              <circle cx="78" cy="74" r="1.5" fill="#ffffff" />

              <path d="M 136 74 Q 122 66 110 74 Q 122 82 136 74 Z" fill="#0c4a6e" stroke="#fde047" strokeWidth="2" />
              <ellipse cx="122" cy="74" rx="2.5" ry="5" fill="#fde047" />
              <circle cx="122" cy="74" r="1.5" fill="#ffffff" />

              {/* Flowing Majestic Dragon Whiskers (Long Tu) */}
              <path d="M 88 94 C 70 102, 50 120, 40 155" stroke="#fde047" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 112 94 C 130 102, 150 120, 160 155" stroke="#fde047" strokeWidth="3.5" strokeLinecap="round" fill="none" />

              {/* Snout & Mouth */}
              <circle cx="94" cy="90" r="2.5" fill="#0369a1" />
              <circle cx="106" cy="90" r="2.5" fill="#0369a1" />
              <path d="M 86 100 Q 100 106 114 100" stroke="#082f49" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 5. ARCHETYPE: SAGE / TIEN TON (TRÚC LÂM PHÁP SƯ / VÔ CỰC TIÊN TÔN)        */}
          {/* ========================================================================= */}
          {activeChar === 'sage' && (
            <g id="char-sage">
              {/* Celestial White & Blue Robe */}
              <path d="M 24 230 C 32 150, 58 130, 75 120 L 125 120 C 142 130, 168 150, 176 230 Z" fill="url(#sage-robe)" stroke="#94a3b8" strokeWidth="2.5" />
              <path d="M 75 120 L 100 165 L 125 120 L 140 230 L 60 230 Z" fill="url(#sage-inner)" stroke="#0369a1" strokeWidth="2" />
              <path d="M 75 120 L 100 165 L 125 120" fill="none" stroke="#f59e0b" strokeWidth="3" />
              <rect x="64" y="195" width="72" height="16" rx="3" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
              <circle cx="100" cy="203" r="8" fill="#38bdf8" stroke="#f59e0b" strokeWidth="1.5" />

              {/* Topknot Hair & Jade Hairpin */}
              <circle cx="100" cy="22" r="16" fill="#18181b" stroke="#09090b" strokeWidth="2" />
              <path d="M 55 22 L 145 22" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
              <circle cx="145" cy="22" r="4" fill="#f59e0b" />
              <path d="M 76 42 L 84 18 L 100 28 L 116 18 L 124 42 Z" fill="url(#dragon-horn)" stroke="#d97706" strokeWidth="2.5" />

              {/* Head */}
              <ellipse cx="100" cy="85" rx="58" ry="46" fill="#ffffff" stroke="#09090b" strokeWidth="3.5" />

              {/* Third Eye / Yin-Yang Mark */}
              <circle cx="100" cy="52" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />

              {/* Long Flowing White Eyebrows */}
              <path d="M 64 68 Q 80 62 92 68 Q 82 56 64 68 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M 136 68 Q 120 62 108 68 Q 118 56 136 68 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Calm Eyes */}
              <circle cx="78" cy="74" r="4.5" fill="#000000" />
              <circle cx="122" cy="74" r="4.5" fill="#000000" />

              {/* Flowing Silver Beard */}
              <path d="M 75 92 C 70 120, 85 160, 100 175 C 115 160, 130 120, 125 92 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
              <path d="M 85 96 Q 100 102 115 96" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 6. ARCHETYPE: MECHA WARRIOR (CYBER CƠ GIÁP)                               */}
          {/* ========================================================================= */}
          {activeChar === 'mecha' && (
            <g id="char-mecha">
              {/* Titan Exoskeleton Armor */}
              <path d="M 22 230 C 30 150, 56 128, 75 120 L 125 120 C 144 128, 170 150, 178 230 Z" fill="url(#mecha-armor)" stroke="#0891b2" strokeWidth="2.5" />
              <path d="M 75 120 L 100 160 L 125 120 L 138 230 L 62 230 Z" fill="#155e75" stroke="#06b6d4" strokeWidth="2" />
              <rect x="65" y="195" width="70" height="15" rx="3" fill="#0e7490" stroke="#22d3ee" strokeWidth="2" />
              {/* Arc Reactor Core */}
              <circle cx="100" cy="202" r="8" fill="#22d3ee" stroke="#cffafe" strokeWidth="2" />

              {/* Sci-Fi Ear Antennae */}
              <rect x="34" y="55" width="14" height="30" rx="4" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
              <rect x="152" y="55" width="14" height="30" rx="4" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
              <circle cx="41" cy="70" r="3" fill="#22d3ee" />
              <circle cx="159" cy="70" r="3" fill="#22d3ee" />

              {/* Mecha Head Helmet */}
              <polygon points="50,45 150,45 162,100 100,126 38,100" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />

              {/* Glowing Cyberpunk Visor with Expression */}
              <rect x="54" y="66" width="92" height="22" rx="6" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
              {/* Neon LED Display Eyes inside Visor */}
              <g stroke="#ffffff" strokeWidth="3" strokeLinecap="round">
                {currentEmotion === 'happy' ? (
                  <>
                    <path d="M 68 78 Q 76 70 84 78" fill="none" />
                    <path d="M 116 78 Q 124 70 132 78" fill="none" />
                  </>
                ) : currentEmotion === 'shocked' ? (
                  <>
                    <circle cx="76" cy="77" r="4" fill="#ffffff" />
                    <circle cx="124" cy="77" r="4" fill="#ffffff" />
                  </>
                ) : (
                  <>
                    <line x1="68" y1="77" x2="84" y2="77" />
                    <line x1="116" y1="77" x2="132" y2="77" />
                  </>
                )}
              </g>

              {/* Ventilation Grills */}
              <line x1="86" y1="104" x2="114" y2="104" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
              <line x1="90" y1="110" x2="110" y2="110" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 7. ARCHETYPE: MA TON (CỬU U MA TÔN - BOT HARD/IMPOSSIBLE)                  */}
          {/* ========================================================================= */}
          {activeChar === 'maton' && (
            <g id="char-maton">
              {/* Netherworld Gothic Spiked Armor */}
              <path d="M 22 230 C 30 148, 55 125, 75 118 L 125 118 C 145 125, 170 148, 178 230 Z" fill="url(#maton-armor)" stroke="#dc2626" strokeWidth="2.5" />
              <path d="M 20 165 L 45 135 L 65 175 Z" fill="#991b1b" stroke="#dc2626" strokeWidth="2" />
              <path d="M 180 165 L 155 135 L 135 175 Z" fill="#991b1b" stroke="#dc2626" strokeWidth="2" />
              <path d="M 75 118 L 100 166 L 125 118 L 142 230 L 58 230 Z" fill="#7f1d1d" stroke="#dc2626" strokeWidth="2" />
              <rect x="62" y="195" width="76" height="16" rx="3" fill="#09090b" stroke="#ef4444" strokeWidth="2" />
              <circle cx="100" cy="203" r="8" fill="#ef4444" stroke="#fca5a5" strokeWidth="2" />

              {/* Massive Demonic Obsidian Horns */}
              <path d="M 65 42 C 45 15, 25 -5, 12 5 C 22 30, 48 48, 62 48 Z" fill="url(#maton-horn)" stroke="#ef4444" strokeWidth="2.5" />
              <path d="M 135 42 C 155 15, 175 -5, 188 5 C 178 30, 152 48, 138 48 Z" fill="url(#maton-horn)" stroke="#ef4444" strokeWidth="2.5" />

              {/* Demonic Spiked Tiara */}
              <path d="M 72 44 L 80 16 L 100 32 L 120 16 L 128 44 Z" fill="#18181b" stroke="#ef4444" strokeWidth="2.5" />
              <circle cx="100" cy="42" r="4" fill="#ef4444" />

              {/* Dark Overlord Face */}
              <ellipse cx="100" cy="85" rx="58" ry="46" fill="#1c1917" stroke="#dc2626" strokeWidth="3" />

              {/* Glowing Red Eyes with Dark Shadow Sockets */}
              <ellipse cx="76" cy="74" rx="10" ry="6" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
              <circle cx="76" cy="74" r="4.5" fill="#ef4444" />
              <circle cx="76" cy="74" r="2" fill="#ffffff" />

              <ellipse cx="124" cy="74" rx="10" ry="6" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
              <circle cx="124" cy="74" r="4.5" fill="#ef4444" />
              <circle cx="124" cy="74" r="2" fill="#ffffff" />

              <path d="M 64 66 L 86 60" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
              <path d="M 136 66 L 114 60" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />

              {/* Sinister Mouth with Sharp Fangs */}
              <path d="M 78 96 Q 100 88 122 96 Q 124 112 100 114 Q 76 112 78 96 Z" fill="#450a0a" stroke="#dc2626" strokeWidth="2" />
              <polygon points="84,96 88,102 92,96" fill="#ffffff" />
              <polygon points="108,96 112,102 116,96" fill="#ffffff" />
            </g>
          )}
        </svg>

        {/* Character Title Badge */}
        {size !== 'small' && (
          <div className="mt-1 flex items-center justify-center gap-1.5 px-3 py-0.5 bg-[#14161f] border border-[#232734] rounded-lg text-center text-xs">
            <span className="font-semibold text-slate-200">{displayName}</span>
            <span className="text-[10px] font-mono text-slate-400">({elo}/900)</span>
          </div>
        )}
      </div>
    </div>
  );
}
