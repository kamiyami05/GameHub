import React, { useState, useEffect } from 'react';
import { audio } from '@/lib/audio';

const XIANXIA_GENZ_QUOTES = {
  idle: [
    'Tiểu bối tính overthinking đến bao giờ? Bổn tọa bế quan 3 vạn năm còn nhanh hơn!',
    'Nước cờ này của đạo hữu hơi bị flop, linh căn xem ra chưa giác ngộ rồi!',
    'Mau hạ cờ đi đạo hữu ơi, đừng để bổn tọa phải phát tín hiệu ét-o-ét!',
    'Tâm bất biến giữa dòng đời vạn biến, nhưng mà tiểu bối ngâm cờ lâu quá ta trầm cảm á!',
    'Đạo hữu có cần bổn tọa buff cho viên Linh Đan tăng IQ để hạ cờ không?'
  ],
  thinking: [
    'Bổn tọa đang mở Thiên Nhãn thông linh, tính toán 10 vạn thiên cơ...',
    'Đang tụ khí đan điền, vận chuyển 36 tầng cấm thuật khắc chế đạo hữu!',
    'Hừm, nước đi này của đạo hữu cũng có chút phong thái flex linh lực đấy!',
    'Đợi bổn tiên tôn tải xong bí kíp cờ vây Thượng Cổ rồi outplay tiểu bối!',
    'Khai mở Thần Thức cảnh giới Đại Thừa, chuẩn bị cho tiểu bối cook luôn!'
  ],
  taunt: [
    'Nước cờ non như gà mới nhập môn, tu vi tiểu bối thế này sao độ kiếp nổi?!',
    'Tiểu bối đi nước này là tự hủy đan điền, đúng chuẩn một chiếc red flag to bự!',
    'Nước đi vào lòng đất rồi tiểu bối ơi, quả này thì Thần Tiên cũng gánh không nổi!',
    'Xin nhẹ điểm Elo của đạo hữu về bồi bổ chân nguyên tu vi cho bổn tọa nhé!',
    'Tiểu bối đã sẵn sàng nhận lấy quả đắng thiên kiếp giáng xuống đầu chưa? Gét gô!',
    'Thế cờ này của bổn tọa 10 điểm không có nhưng, tiểu bối chuẩn bị cook đi!',
    'Flexing trình độ cờ vây thượng thừa, tiểu bối chỉ có nước cút khỏi bí cảnh!'
  ],
  shocked: [
    'Ủa alo?! Tiền bối luyện được cấm thuật thượng cổ ở xó xỉnh nào đấy?!',
    'Á à, tiền bối dám gài bẫy bổn tọa à?! Quả này hơi bị cấn rồi nha!',
    'Căng cực! Tiền bối vừa kích hoạt đại sát trận gì thế này?! Ét o ét!',
    'Khoan đã, tiền bối có mang theo bàn tay vàng (hack) không đấy?!',
    'Linh lực ba động kinh hoàng thế này, chẳng lẽ đạo hữu là ẩn thế tiền bối?!'
  ],
  happy: [
    'Hahahahaha! Tiểu bối tu vi non nớt mà dám đọ trí với Bổn Tiên Tôn? Cook liền!',
    'Cảm ơn đạo hữu đã cúng dường điểm Elo, bổn tọa chính thức phi thăng!',
    'Chiến thắng quá slay! Tiểu bối về núi tu luyện thêm 500 năm nữa đi nhé!',
    'Hahahahaha Thầy Ba cười rung chuyển tam giới! Bổn tọa out trình toàn tập!'
  ],
  poke: [
    'Tiểu bối chớ có nghịch ngợm linh thể của bổn tọa, lo mà độ kiếp đi!',
    'Dám cả gan chọc lét Tiên Tôn? Coi chừng bổn tọa giáng sấm sét thiên lôi đấy!',
    'Đừng có chạm vào dung nhan thượng đẳng của bổn tọa, tập trung đánh cờ đi!'
  ]
};

// 3 GIAI ĐOẠN CẢM XÚC KHI THUA: BUỒN > KHÓC > TỨC GIẬN (Đạo hữu, Bổn tọa, Tiền bối)
const LOSE_PROGRESSION = [
  {
    stage: 1,
    title: 'Giai đoạn 1: Buồn Bã 😔',
    dialogue: 'Bổn Tiên Tôn hôm nay ngã ngựa trước tiền bối rồi... Trầm cảm thực sự, tâm trạng tụt dốc không phanh... 😔',
    quoteColor: 'text-slate-300'
  },
  {
    stage: 2,
    title: 'Giai đoạn 2: Khóc Ròng 😭😭',
    dialogue: 'Hu hu hu! Đã thua tiền bối rồi mà sao đạo hữu còn ấn ta hoài vậy?! Trừ mất điểm Elo của bổn tọa rồi hu hu hu! 😭😭',
    quoteColor: 'text-sky-300'
  },
  {
    stage: 3,
    title: 'Giai đoạn 3: Tức Giận Hóa Điên 😡🔥',
    dialogue: 'ĐỦ RỒI ĐẤY! NGHĨ BỔN TIÊN TÔN NÀY DỄ BẮT NẠT À?! VÁN SAU BỔN TỌA CÀO NÁT MẶT ĐẠO HỮU! 😡🔥',
    quoteColor: 'text-rose-400'
  }
];

export default function BotCharacterModel({
  emotion = 'idle', // 'idle' | 'thinking' | 'taunt' | 'shocked' | 'happy' | 'sad'
  size = 'medium', // 'small' | 'medium' | 'large'
  botName = 'Vô Cực Tiên Tôn',
  botElo = 1200,
  showDialogue = true,
  autoTauntInterval = 10000 // 10 seconds
}) {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const [dialogue, setDialogue] = useState('Bổn Tiên Tôn tại đây! Đạo hữu đã sẵn sàng đọ linh lực cờ vây chưa?');
  const [isPoked, setIsPoked] = useState(false);
  const [loseStage, setLoseStage] = useState(1); // 1: Buồn -> 2: Khóc -> 3: Tức Giận

  useEffect(() => {
    setCurrentEmotion(emotion);
    if (emotion === 'sad') {
      setLoseStage(1);
      setDialogue(LOSE_PROGRESSION[0].dialogue);
    } else {
      const list = XIANXIA_GENZ_QUOTES[emotion] || XIANXIA_GENZ_QUOTES.idle;
      setDialogue(list[Math.floor(Math.random() * list.length)]);
    }
  }, [emotion]);

  // 10-second recurring taunt interval during active play
  useEffect(() => {
    if (!autoTauntInterval || emotion === 'happy' || emotion === 'sad') return;

    const interval = setInterval(() => {
      const tauntList = XIANXIA_GENZ_QUOTES.taunt;
      const randomTaunt = tauntList[Math.floor(Math.random() * tauntList.length)];
      setDialogue(randomTaunt);
      setCurrentEmotion('taunt');

      // Reset back to idle after 4.5 seconds
      setTimeout(() => {
        if (emotion !== 'happy' && emotion !== 'sad') {
          setCurrentEmotion(emotion || 'idle');
        }
      }, 4500);
    }, autoTauntInterval);

    return () => clearInterval(interval);
  }, [autoTauntInterval, emotion]);

  // Handle Poke Click (Progression: Buồn -> Khóc -> Tức Giận)
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
      setTimeout(() => setIsPoked(false), 350);
      return;
    }

    setCurrentEmotion('taunt');
    const pList = XIANXIA_GENZ_QUOTES.poke;
    setDialogue(pList[Math.floor(Math.random() * pList.length)]);

    setTimeout(() => {
      setIsPoked(false);
      setCurrentEmotion(emotion);
    }, 2500);
  };

  const getDimensions = () => {
    switch (size) {
      case 'small': return { w: 120, h: 140 };
      case 'large': return { w: 230, h: 260 };
      default: return { w: 160, h: 185 };
    }
  };

  const dim = getDimensions();

  return (
    <div className="flex flex-col items-center select-none relative">
      {/* Dynamic Tu Tien + GenZ Speech Bubble */}
      {showDialogue && (
        <div className="relative mb-2.5 max-w-[280px] bg-[#1c1f27]/95 border border-[#3e4248] rounded-2xl px-3.5 py-2 text-xs text-slate-200 leading-relaxed font-medium shadow-2xl animate-fadeIn text-center">
          <p className={`italic font-black ${
            emotion === 'sad' ? LOSE_PROGRESSION[loseStage - 1].quoteColor : 'text-amber-300'
          }`}>
            "{dialogue}"
          </p>
          {/* Bubble Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1c1f27] border-r border-b border-[#3e4248] rotate-45"></div>
        </div>
      )}

      {/* Interactive Hint: Buồn > Khóc > Tức Giận */}
      {emotion === 'sad' && (
        <span className={`text-[10px] font-black mb-1.5 animate-pulse ${
          loseStage === 1 ? 'text-slate-400' : loseStage === 2 ? 'text-sky-400' : 'text-rose-500 font-extrabold'
        }`}>
          👆 Bấm vào Bổn Tọa: {LOSE_PROGRESSION[loseStage - 1].title} ({loseStage}/3)
        </span>
      )}

      {/* PANDA HALF-BODY BUST */}
      <div 
        onClick={handlePoke}
        title={emotion === 'sad' ? "Bấm để trêu chọc Bổn Tọa!" : "Bấm vào Bổn Tọa để tương tác"}
        className={`relative cursor-pointer transition-all duration-300 ${
          isPoked 
            ? 'scale-110 rotate-3' 
            : (emotion === 'sad' && loseStage === 3)
              ? 'animate-bounce drop-shadow-[0_0_20px_rgba(244,63,94,0.7)]'
              : 'hover:scale-102 active:scale-95'
        }`}
      >
        <svg
          width={dim.w}
          height={dim.h}
          viewBox="0 0 200 230"
          className="drop-shadow-[0_12px_28px_rgba(0,0,0,0.65)]"
        >
          {/* Flame / Steam aura when ANGRY (Stage 3) */}
          {emotion === 'sad' && loseStage === 3 && (
            <g id="anger-flames" className="animate-pulse">
              <path d="M 40 25 Q 30 5 45 12 Q 55 -5 60 20 Z" fill="#ef4444" opacity="0.85" />
              <path d="M 160 25 Q 170 5 155 12 Q 145 -5 140 20 Z" fill="#ef4444" opacity="0.85" />
              <path d="M 90 10 Q 100 -8 110 10 Z" fill="#f97316" opacity="0.9" />
              <path d="M 140 38 L 152 42 M 142 48 L 150 34" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {/* === 1. HALF-BODY UPPER TORSO & ANCIENT HANFU ROBE === */}
          <g id="upper-torso">
            <path
              d="M 28 230 C 35 155, 60 135, 75 125 L 125 125 C 140 135, 165 155, 172 230 Z"
              fill={emotion === 'sad' && loseStage === 3 ? '#451a23' : '#2e3e52'}
              stroke="#1a2330"
              strokeWidth="3"
            />

            <path
              d="M 75 125 L 100 162 L 125 125 L 138 230 L 62 230 Z"
              fill="#98a2b3"
              stroke="#1a2330"
              strokeWidth="2.5"
            />

            <path d="M 75 124 L 100 162 L 125 124" fill="none" stroke="#667085" strokeWidth="3" />
            <path d="M 85 138 L 108 175" fill="none" stroke="#667085" strokeWidth="2" />

            <rect x="68" y="195" width="64" height="15" rx="3" fill="#667085" stroke="#1a2330" strokeWidth="2.5" />
            <circle cx="100" cy="202" r="7" fill="#e0f2fe" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="100" cy="202" r="3" fill="#0f172a" />
            <path d="M 98 209 L 98 226 M 102 209 L 102 226" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* === 2. PANDA HEAD & ICONIC STRAW/FELT HAT === */}
          <g id="head-group">
            <circle cx="56" cy="50" r="20" fill="#18181b" stroke="#09090b" strokeWidth="3" />
            <circle cx="144" cy="50" r="20" fill="#18181b" stroke="#09090b" strokeWidth="3" />

            <ellipse cx="100" cy="56" rx="55" ry="12" fill="#d97706" opacity="0.3" />

            <ellipse 
              cx="100" 
              cy="85" 
              rx="58" 
              ry="46" 
              fill={emotion === 'sad' && loseStage === 3 ? '#fee2e2' : '#ffffff'} 
              stroke="#09090b" 
              strokeWidth="4" 
            />

            <g id="hat">
              <path
                d="M 68 35 C 68 12, 132 12, 132 35 Z"
                fill="#c68a35"
                stroke="#09090b"
                strokeWidth="3.5"
              />
              <path d="M 85 20 C 100 28, 115 20, 118 24" fill="none" stroke="#8c5817" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 67 33 Q 100 38 133 33 L 132 36 Q 100 42 68 36 Z" fill="#8c5817" stroke="#09090b" strokeWidth="1" />

              <path
                d="M 32 46 C 30 32, 170 32, 168 46 C 170 65, 30 65, 32 46 Z"
                fill="#d8963c"
                stroke="#09090b"
                strokeWidth="3.5"
              />
              <path d="M 52 38 L 56 46 L 50 44 Z" fill="#8c5817" />
            </g>

            {/* === 3. HIGH FIDELITY MEME FACE EXPRESSIONS === */}

            {/* 1. TAUNT / ANGRY DEFAULT */}
            {currentEmotion === 'taunt' && (
              <g id="face-taunt" className="animate-fadeIn">
                <path d="M 68 70 L 86 64" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                <path d="M 132 70 L 114 64" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                <circle cx="78" cy="74" r="4.5" fill="#000000" />
                <circle cx="79" cy="73" r="1.5" fill="#ffffff" />
                <circle cx="122" cy="74" r="4.5" fill="#000000" />
                <circle cx="121" cy="73" r="1.5" fill="#ffffff" />
                <path d="M 94 77 Q 100 73 106 77" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 92 82 Q 100 78 108 82" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                <ellipse cx="96" cy="85" rx="2" ry="1.5" fill="#000000" />
                <ellipse cx="104" cy="85" rx="2" ry="1.5" fill="#000000" />
                <path
                  d="M 80 94 Q 100 88 120 94 Q 122 108 100 110 Q 78 108 80 94 Z"
                  fill="#18181b"
                  stroke="#000000"
                  strokeWidth="3"
                />
                <path d="M 84 94 Q 100 90 116 94" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                <line x1="94" y1="94" x2="94" y2="99" stroke="#000000" strokeWidth="1.5" />
                <line x1="106" y1="94" x2="106" y2="99" stroke="#000000" strokeWidth="1.5" />
              </g>
            )}

            {/* 2. HAPPY / LAUGHING */}
            {currentEmotion === 'happy' && (
              <g id="face-happy" className="animate-fadeIn">
                <path d="M 66 65 Q 78 58 90 68" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 134 65 Q 122 58 110 68" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 70 74 Q 80 64 90 74" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                <path d="M 110 74 Q 120 64 130 74" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                <ellipse cx="100" cy="82" rx="4" ry="2.5" fill="#000000" />
                <path
                  d="M 68 90 Q 100 125 132 90 Z"
                  fill="#991b1b"
                  stroke="#000000"
                  strokeWidth="3.5"
                />
                <path d="M 72 92 Q 100 106 128 92" fill="#ffffff" stroke="#000000" strokeWidth="1.5" />
                <line x1="86" y1="92" x2="86" y2="102" stroke="#000000" strokeWidth="1.5" />
                <line x1="100" y1="92" x2="100" y2="105" stroke="#000000" strokeWidth="1.5" />
                <line x1="114" y1="92" x2="114" y2="102" stroke="#000000" strokeWidth="1.5" />
                <ellipse cx="60" cy="85" rx="7" ry="4" fill="#f43f5e" opacity="0.6" />
                <ellipse cx="140" cy="85" rx="7" ry="4" fill="#f43f5e" opacity="0.6" />
              </g>
            )}

            {/* 3. SAD / LOSE PROGRESSION: BUỒN > KHÓC > TỨC GIẬN */}
            {emotion === 'sad' && (
              <g id="face-lose-progression">
                {/* Giai đoạn 1: Buồn Bã */}
                {loseStage === 1 && (
                  <g className="animate-fadeIn">
                    <path d="M 68 62 Q 78 72 88 62" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 132 62 Q 122 72 112 62" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="78" cy="76" r="4.5" fill="#000000" />
                    <circle cx="78" cy="78" r="1.5" fill="#ffffff" />
                    <circle cx="122" cy="76" r="4.5" fill="#000000" />
                    <circle cx="122" cy="78" r="1.5" fill="#ffffff" />
                    <path d="M 85 106 Q 100 94 115 106" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <ellipse cx="128" cy="88" rx="2" ry="4" fill="#38bdf8" />
                  </g>
                )}

                {/* Giai đoạn 2: Khóc Ròng */}
                {loseStage === 2 && (
                  <g className="animate-fadeIn">
                    <path d="M 68 64 Q 78 72 88 64" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 132 64 Q 122 72 112 64" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 70 74 Q 80 82 90 74" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 110 74 Q 120 82 130 74" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 75 78 C 65 105, 55 140, 60 185 C 65 190, 80 190, 82 185 C 84 140, 80 105, 78 78 Z" fill="#38bdf8" opacity="0.85" />
                    <path d="M 125 78 C 118 105, 110 140, 115 185 C 118 190, 132 190, 138 185 C 142 140, 132 105, 130 78 Z" fill="#38bdf8" opacity="0.85" />
                    <path d="M 80 106 Q 90 95 100 106 Q 110 117 120 106" fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
                  </g>
                )}

                {/* Giai đoạn 3: Tức Giận Hóa Điên */}
                {loseStage === 3 && (
                  <g className="animate-fadeIn">
                    <path d="M 64 74 L 88 58" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 136 74 L 112 58" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
                    <circle cx="78" cy="74" r="7" fill="#ef4444" stroke="#000000" strokeWidth="2" />
                    <circle cx="78" cy="74" r="3" fill="#000000" />
                    <circle cx="122" cy="74" r="7" fill="#ef4444" stroke="#000000" strokeWidth="2" />
                    <circle cx="122" cy="74" r="3" fill="#000000" />
                    <path d="M 94 74 Q 100 70 106 74" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 92 78 Q 100 74 108 78" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 76 94 Q 100 86 124 94 Q 126 112 100 114 Q 74 112 76 94 Z" fill="#991b1b" stroke="#000000" strokeWidth="3.5" />
                    <path d="M 80 94 Q 100 90 120 94" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                    <line x1="90" y1="94" x2="90" y2="102" stroke="#000000" strokeWidth="2" />
                    <line x1="100" y1="94" x2="100" y2="104" stroke="#000000" strokeWidth="2" />
                    <line x1="110" y1="94" x2="110" y2="102" stroke="#000000" strokeWidth="2" />
                  </g>
                )}
              </g>
            )}

            {/* 4. SHOCKED */}
            {currentEmotion === 'shocked' && (
              <g id="face-shocked" className="animate-fadeIn">
                <path d="M 68 60 Q 80 52 90 60" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 132 60 Q 120 52 110 60" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                <circle cx="78" cy="72" r="9" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
                <circle cx="78" cy="72" r="3.5" fill="#000000" />
                <circle cx="122" cy="72" r="9" fill="#ffffff" stroke="#000000" strokeWidth="2.5" />
                <circle cx="122" cy="72" r="3.5" fill="#000000" />
                <ellipse cx="100" cy="102" rx="14" ry="16" fill="#18181b" stroke="#000000" strokeWidth="3" />
                <path d="M 148 55 C 158 68, 158 76, 150 82 C 142 76, 142 68, 148 55 Z" fill="#38bdf8" />
              </g>
            )}

            {/* 5. THINKING */}
            {currentEmotion === 'thinking' && (
              <g id="face-thinking" className="animate-fadeIn">
                <path d="M 68 62 L 88 66" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 112 58 Q 124 52 134 60" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                <circle cx="74" cy="72" r="5" fill="#000000" />
                <circle cx="73" cy="71" r="1.5" fill="#ffffff" />
                <circle cx="118" cy="72" r="5" fill="#000000" />
                <circle cx="117" cy="71" r="1.5" fill="#ffffff" />
                <ellipse cx="100" cy="80" rx="3.5" ry="2" fill="#000000" />
                <line x1="85" y1="98" x2="115" y2="98" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
              </g>
            )}

            {/* 6. IDLE */}
            {currentEmotion === 'idle' && (
              <g id="face-idle" className="animate-fadeIn">
                <path d="M 70 66 Q 80 62 90 68" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                <path d="M 130 66 Q 120 62 110 68" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
                <circle cx="76" cy="72" r="4.5" fill="#000000" />
                <circle cx="75" cy="71" r="1.5" fill="#ffffff" />
                <circle cx="120" cy="72" r="4.5" fill="#000000" />
                <circle cx="119" cy="71" r="1.5" fill="#ffffff" />
                <ellipse cx="100" cy="82" rx="4" ry="2.5" fill="#000000" />
                <path d="M 82 96 Q 100 106 118 94" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
              </g>
            )}
          </g>
        </svg>

        {/* Character Title Badge */}
        {size !== 'small' && (
          <div className="mt-1 flex items-center justify-center gap-1.5 px-3.5 py-1 bg-[#14161b] border border-[#3e4248] rounded-xl text-center shadow-md">
            <span className="text-[11px] font-black text-amber-400">
              {emotion === 'sad' ? LOSE_PROGRESSION[loseStage - 1].title : `🐼 ${botName}`}
            </span>
            <span className="text-[10px] font-mono font-bold text-rose-400">({botElo} Elo)</span>
          </div>
        )}
      </div>
    </div>
  );
}
