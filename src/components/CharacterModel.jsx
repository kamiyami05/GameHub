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
    'Bổn tọa xin nhẹ điểm Tu Vi nhé!'
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
    'Cảm ơn điểm Tu Vi của đạo hữu!',
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
    dialogue: 'Hu hu hu! Bị trừ mất điểm Tu Vi rồi! 😭😭',
    quoteColor: 'text-sky-300'
  },
  {
    stage: 3,
    dialogue: 'ĐỦ RỒI! Ván sau ta phục thù! 😡🔥',
    quoteColor: 'text-rose-400'
  }
];

const CHARACTER_META = {
  panda: {
    name: 'Đạo Sĩ Gấu Trúc',
    auraColor: 'rgba(56, 189, 248, 0.4)',
    borderColor: '#38bdf8',
    icon: '🍃',
    src: '/avatars/panda.jpg',
    shockedSrc: '/avatars/panda_shocked.jpg',
    happySrc: '/avatars/panda_happy.jpg'
  },
  fox: {
    name: 'Linh Hồ Tiên Tử',
    auraColor: 'rgba(244, 63, 94, 0.45)',
    borderColor: '#f43f5e',
    icon: '🌸',
    src: '/avatars/fox.jpg'
  },
  tiger: {
    name: 'Bạch Hổ Tướng Quân',
    auraColor: 'rgba(245, 158, 11, 0.45)',
    borderColor: '#f59e0b',
    icon: '⚡',
    src: '/avatars/tiger.jpg'
  },
  dragon: {
    name: 'Thần Long Thánh Tôn',
    auraColor: 'rgba(14, 165, 233, 0.5)',
    borderColor: '#0284c7',
    icon: '🐉',
    src: '/avatars/dragon.jpg'
  },
  sage: {
    name: 'Vô Cực Tiên Tôn',
    auraColor: 'rgba(139, 92, 246, 0.45)',
    borderColor: '#8b5cf6',
    icon: '☯️',
    src: '/avatars/sage.jpg'
  },
  mecha: {
    name: 'Cyber Cơ Giáp',
    auraColor: 'rgba(6, 182, 212, 0.5)',
    borderColor: '#06b6d4',
    icon: '🌐',
    src: '/avatars/mecha.jpg'
  },
  maton: {
    name: 'Cửu U Ma Tôn',
    auraColor: 'rgba(225, 29, 72, 0.55)',
    borderColor: '#e11d48',
    icon: '🔥',
    src: '/avatars/maton.jpg',
    shockedSrc: '/avatars/maton_shocked.jpg',
    happySrc: '/avatars/maton_happy.jpg',
    cryingSrc: '/avatars/maton_crying.jpg',
    angrySrc: '/avatars/maton_angry.jpg'
  }
};

export default function CharacterModel({
  characterId = 'panda',
  isBot = false,
  difficulty = 'hard',
  emotion = 'idle',
  size = 'medium',
  displayName = 'Kỳ Thủ',
  elo = 0,
  showDialogue = true,
  autoTauntInterval = 12000
}) {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const [dialogue, setDialogue] = useState('');
  const [isPoked, setIsPoked] = useState(false);
  const [loseStage, setLoseStage] = useState(1);

  // Determine active archetype key
  const activeKey = isBot 
    ? (difficulty === 'easy' ? 'panda' : difficulty === 'hard' ? 'sage' : 'maton')
    : characterId;

  const meta = CHARACTER_META[activeKey] || CHARACTER_META.panda;

  // Resolve dynamic expression image based on actual emotional state
  const getImageSource = () => {
    if (activeKey === 'maton') {
      if (emotion === 'sad') {
        if (loseStage === 3) return meta.angrySrc || meta.src;
        if (loseStage === 2) return meta.cryingSrc || meta.src;
        return meta.shockedSrc || meta.src;
      }
      if (currentEmotion === 'shocked') return meta.shockedSrc || meta.src;
      if (currentEmotion === 'happy' || currentEmotion === 'taunt') return meta.happySrc || meta.src;
      return meta.src;
    }

    if (activeKey === 'panda') {
      if (currentEmotion === 'shocked' || (emotion === 'sad' && loseStage >= 2)) {
        return meta.shockedSrc || meta.src;
      }
      if (currentEmotion === 'happy') return meta.happySrc || meta.src;
      return meta.src;
    }

    return meta.src;
  };

  const activeImageSrc = getImageSource();

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

  const getDimensionClasses = () => {
    switch (size) {
      case 'small': return 'w-24 h-24 sm:w-28 sm:h-28';
      case 'large': return 'w-44 h-44 sm:w-52 sm:h-52';
      default: return 'w-36 h-36 sm:w-40 sm:h-40';
    }
  };

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Dynamic Xianxia Speech Bubble */}
      {showDialogue && dialogue && (
        <div className="relative mb-2.5 max-w-[220px] sm:max-w-[250px] bg-[#14161f]/95 border border-[#232734] rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium text-center z-20 shadow-xl backdrop-blur-md animate-fadeIn">
          <p className={`font-semibold ${
            isBot && emotion === 'sad' ? BOT_LOSE_PROGRESSION[loseStage - 1].quoteColor : 'text-slate-100'
          }`}>
            "{dialogue}"
          </p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#14161f] border-r border-b border-[#232734] rotate-45"></div>
        </div>
      )}

      {/* Interactive Avatar Container with Dynamic Expression Switcher */}
      <div 
        onClick={handlePoke}
        title="Nhấn vào để tương tác"
        className={`relative cursor-pointer transition-all duration-200 ${
          isPoked 
            ? 'scale-105 -rotate-2' 
            : isBot && emotion === 'sad' && loseStage === 3
              ? 'animate-bounce'
              : 'hover:scale-[1.02] active:scale-95'
        }`}
      >
        {/* Floating text '👈 Nhấn' on Bot when defeated */}
        {isBot && emotion === 'sad' && (
          <div className="absolute top-[50%] -translate-y-1/2 -right-4 sm:-right-7 z-30 pointer-events-none animate-bounce">
            <span className="text-amber-400 font-bold text-xs select-none flex items-center gap-1 drop-shadow-md">
              👈 Nhấn
            </span>
          </div>
        )}

        {/* Ambient Glowing Aura Rings */}
        <div 
          className="absolute inset-0 rounded-3xl blur-xl opacity-60 transition-all duration-500 pointer-events-none"
          style={{ backgroundColor: meta.auraColor }}
        />

        {/* Main Character Portrait Card with REAL EXPRESSION CHANGING IMAGE */}
        <div 
          className={`relative rounded-3xl overflow-hidden border-2 shadow-2xl transition-all duration-300 ${getDimensionClasses()} ${
            currentEmotion === 'shocked' ? 'animate-pulse' : ''
          }`}
          style={{ borderColor: meta.borderColor }}
        >
          {/* Dynamic Illustration based on Emotion */}
          <img 
            key={`${activeKey}-${activeImageSrc}`}
            src={activeImageSrc} 
            alt={meta.name}
            className={`w-full h-full object-cover select-none transition-all duration-300 animate-fadeIn ${
              currentEmotion === 'shocked' 
                ? 'scale-105' 
                : currentEmotion === 'happy' 
                  ? 'scale-105' 
                  : isPoked 
                    ? 'scale-105' 
                    : 'scale-100'
            }`}
          />

          {/* Shimmer & Lighting Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />

          {/* Additional Dynamic FX Overlays */}
          {currentEmotion === 'thinking' && (
            <div className="absolute top-2 right-2 bg-[#14161f]/85 backdrop-blur-sm border border-sky-400/50 rounded-full px-2 py-0.5 text-xs text-sky-300 font-mono shadow-md animate-bounce pointer-events-none">
              💭 ...
            </div>
          )}

          {isBot && emotion === 'sad' && loseStage === 3 && (
            <div className="absolute inset-0 bg-rose-900/30 flex items-center justify-center pointer-events-none animate-pulse">
              <div className="text-xs font-bold text-white bg-red-600/90 px-2.5 py-1 rounded-full border border-red-400 shadow-lg animate-bounce">
                😡 BỐC HỎA!
              </div>
            </div>
          )}
        </div>

        {/* Character Title & Realm Badge */}
        {size !== 'small' && (
          <div className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1 bg-[#14161f]/95 border border-[#232734] rounded-xl text-center shadow-md">
            <span className="text-xs">{meta.icon}</span>
            <span className="font-bold text-slate-100 text-xs truncate max-w-[110px]">{displayName}</span>
            <span className="text-[10px] font-mono font-bold text-amber-400">({elo}/900)</span>
          </div>
        )}
      </div>
    </div>
  );
}
