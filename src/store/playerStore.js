import { create } from 'zustand';

export const CHARACTERS = {
  panda: {
    id: 'panda',
    name: 'Đạo Sĩ Gấu Trúc',
    title: 'Trúc Lâm Kiếm Khách',
    icon: '🐼',
    color: '#38bdf8',
    description: 'Trầm ổn, tĩnh tâm, lấy nhu thắng cương'
  },
  fox: {
    id: 'fox',
    name: 'Linh Hồ Tiên Tử',
    title: 'Cửu Vĩ Thiên Hồ',
    icon: '🦊',
    color: '#f43f5e',
    description: 'Lanh lợi, sắc sảo, biến hóa khôn lường'
  },
  tiger: {
    id: 'tiger',
    name: 'Bạch Hổ Tướng Quân',
    title: 'Vạn Quân Thần Tướng',
    icon: '🐯',
    color: '#f59e0b',
    description: 'Hào sảng, uy dũng, tiến công mãnh liệt'
  },
  dragon: {
    id: 'dragon',
    name: 'Thần Long Thánh Tôn',
    title: 'Đông Hải Long Quân',
    icon: '🐉',
    color: '#10b981',
    description: 'Quyền uy tối thượng, thần bí thâm sâu'
  },
  sage: {
    id: 'sage',
    name: 'Trúc Lâm Pháp Sư',
    title: 'Cửu Thiên Đạo Nhân',
    icon: '🧙',
    color: '#8b5cf6',
    description: 'Uyên bác tinh thông, liệu sự như thần'
  },
  mecha: {
    id: 'mecha',
    name: 'Cyber Cơ Giáp',
    title: 'Chiến Binh Tương Lai',
    icon: '🤖',
    color: '#06b6d4',
    description: 'Chuẩn xác tuyệt đối, tính toán siêu tốc'
  }
};

// 10 Bậc Cảnh Giới Tu Tiên (0 = Phàm Nhân, Max = 900 Độ Kiếp)
export const RANKS = [
  { minElo: 0, maxElo: 0, name: 'Phàm Nhân', icon: '🌱', color: '#94a3b8' },
  { minElo: 1, maxElo: 99, name: 'Luyện Khí', icon: '🥉', color: '#38bdf8' },
  { minElo: 100, maxElo: 199, name: 'Trúc Cơ', icon: '🥈', color: '#2dd4bf' },
  { minElo: 200, maxElo: 299, name: 'Kim Đan', icon: '🥇', color: '#f59e0b' },
  { minElo: 300, maxElo: 399, name: 'Nguyên Anh', icon: '💎', color: '#6366f1' },
  { minElo: 400, maxElo: 499, name: 'Hóa Thần', icon: '🔮', color: '#a855f7' },
  { minElo: 500, maxElo: 599, name: 'Luyện Hư', icon: '⚡', color: '#ec4899' },
  { minElo: 600, maxElo: 699, name: 'Hợp Thể', icon: '🔥', color: '#f43f5e' },
  { minElo: 700, maxElo: 799, name: 'Đại Thừa', icon: '🌌', color: '#e11d48' },
  { minElo: 800, maxElo: 900, name: 'Độ Kiếp', icon: '👑', color: '#fbbf24' }
];

export const getRankInfo = (elo) => {
  const val = Math.max(0, Math.min(900, Number(elo) || 0));
  if (val === 0) return RANKS[0]; // Phàm Nhân
  for (let i = RANKS.length - 1; i >= 1; i--) {
    if (val >= RANKS[i].minElo) return RANKS[i];
  }
  return RANKS[0];
};

const STORAGE_KEY = 'caro_arena_player_data';

const getInitialData = () => {
  if (typeof window === 'undefined') {
    return {
      characterId: 'panda',
      username: 'Kỳ Thủ',
      elo: 0, // 0 = Phàm Nhân
      wins: 0,
      losses: 0,
      draws: 0,
      winStreak: 0,
      bestStreak: 0,
      pieceTheme: 'cyber'
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Clamp previously stored Elo to 0 - 900 range
      let parsedElo = Number(data.elo);
      if (isNaN(parsedElo)) parsedElo = 0;
      if (parsedElo > 900) parsedElo = 900;
      if (parsedElo < 0) parsedElo = 0;

      return {
        characterId: data.characterId || 'panda',
        username: data.username || 'Kỳ Thủ',
        elo: parsedElo,
        wins: Number(data.wins) || 0,
        losses: Number(data.losses) || 0,
        draws: Number(data.draws) || 0,
        winStreak: Number(data.winStreak) || 0,
        bestStreak: Number(data.bestStreak) || 0,
        pieceTheme: data.pieceTheme || 'cyber'
      };
    }
  } catch {}

  return {
    characterId: 'panda',
    username: 'Kỳ Thủ',
    elo: 0, // 0 = Phàm Nhân
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestStreak: 0,
    pieceTheme: 'cyber'
  };
};

export const usePlayerStore = create((set, get) => ({
  ...getInitialData(),

  updateProfile: (partial) => {
    set((state) => {
      const updated = { ...state, ...partial };
      // Clamp Elo to max 900, min 0
      if (typeof updated.elo === 'number') {
        updated.elo = Math.max(0, Math.min(900, Math.round(updated.elo)));
      }
      const toSave = {
        characterId: updated.characterId,
        username: updated.username,
        elo: updated.elo,
        wins: updated.wins,
        losses: updated.losses,
        draws: updated.draws,
        winStreak: updated.winStreak,
        bestStreak: updated.bestStreak,
        pieceTheme: updated.pieceTheme
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {}
      return updated;
    });
  },

  recordMatchResult: (difficulty, outcome, moveCount) => {
    const state = get();
    let eloChange = 0;
    let newWins = state.wins;
    let newLosses = state.losses;
    let newDraws = state.draws;
    let newStreak = state.winStreak;

    if (outcome === 'win') {
      // Points gained per difficulty
      if (difficulty === 'impossible') {
        eloChange = 40; // Hard bot (Độ Kiếp)
      } else if (difficulty === 'hard') {
        eloChange = 25; // Medium bot (Hóa Thần)
      } else {
        eloChange = 15; // Easy bot (Luyện Khí)
      }
      newWins += 1;
      newStreak += 1;
    } else if (outcome === 'loss') {
      if (difficulty === 'impossible') {
        eloChange = -10;
      } else if (difficulty === 'hard') {
        eloChange = -15;
      } else {
        eloChange = -8;
      }
      newLosses += 1;
      newStreak = 0;
    } else {
      eloChange = 0;
      newDraws += 1;
    }

    // Clamped strictly between 0 and 900
    const newElo = Math.max(0, Math.min(900, state.elo + eloChange));
    const effectiveChange = newElo - state.elo;
    const newBestStreak = Math.max(state.bestStreak, newStreak);

    const updated = {
      elo: newElo,
      wins: newWins,
      losses: newLosses,
      draws: newDraws,
      winStreak: newStreak,
      bestStreak: newBestStreak
    };

    get().updateProfile(updated);

    return {
      eloChange: effectiveChange,
      newElo,
      newStreak
    };
  }
}));
