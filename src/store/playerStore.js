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

export const RANKS = [
  { minElo: 0, name: 'Luyện Khí', icon: '🥉', color: '#94a3b8' },
  { minElo: 900, name: 'Trúc Cơ', icon: '🥈', color: '#cbd5e1' },
  { minElo: 1100, name: 'Kim Đan', icon: '🥇', color: '#f59e0b' },
  { minElo: 1300, name: 'Nguyên Anh', icon: '💎', color: '#38bdf8' },
  { minElo: 1500, name: 'Hóa Thần', icon: '🔮', color: '#a855f7' },
  { minElo: 1700, name: 'Tiên Tôn', icon: '👑', color: '#f43f5e' }
];

export const getRankInfo = (elo) => {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (elo >= r.minElo) rank = r;
  }
  return rank;
};

const STORAGE_KEY = 'caro_arena_player_data';

const getInitialData = () => {
  if (typeof window === 'undefined') {
    return {
      characterId: 'panda',
      username: 'Kỳ Thủ',
      elo: 1000,
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
      return {
        characterId: data.characterId || 'panda',
        username: data.username || 'Kỳ Thủ',
        elo: Number(data.elo) || 1000,
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
    elo: 1000,
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
    const diffK = difficulty === 'impossible' ? 1.5 : (difficulty === 'hard' ? 1.0 : 0.6);

    let eloChange = 0;
    let newWins = state.wins;
    let newLosses = state.losses;
    let newDraws = state.draws;
    let newStreak = state.winStreak;

    if (outcome === 'win') {
      eloChange = Math.round(25 * diffK);
      newWins += 1;
      newStreak += 1;
    } else if (outcome === 'loss') {
      eloChange = -Math.round(15 / diffK);
      newLosses += 1;
      newStreak = 0;
    } else {
      eloChange = 0;
      newDraws += 1;
    }

    const newElo = Math.max(100, state.elo + eloChange);
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
      eloChange,
      newElo,
      newStreak
    };
  }
}));
