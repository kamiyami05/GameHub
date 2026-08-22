import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const getGuestProfile = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('arcade_guest_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
  }
  return {
    id: 'guest',
    username: 'Khách Ẩn Danh',
    avatar_url: '',
    email: '',
    caro_elo: 1000,
    caro_wins: 0,
    caro_losses: 0,
    caro_draws: 0,
    caro_total_games: 0,
    game_2048_highscore: 0,
    minesweeper_best_time: null,
    minesweeper_wins: 0
  };
};

const saveGuestProfile = (profile) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('arcade_guest_profile', JSON.stringify(profile));
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  profile: getGuestProfile(),
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          set({ user: session.user, session });
          await get().fetchProfile();
        } else {
          set({ profile: getGuestProfile() });
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          set({ user: session?.user ?? null, session });
          if (session?.user) {
            await get().fetchProfile();
          } else {
            set({ profile: getGuestProfile() });
          }
        });
      } else {
        set({ profile: getGuestProfile() });
      }
    } catch (error) {
      console.error('Auth init error:', error);
      set({ profile: getGuestProfile() });
    } finally {
      set({ initialized: true });
    }
  },

  signUp: async (email, password, fullName) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Chưa cấu hình Supabase. Vui lòng cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env');
    }
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username: fullName }
      }
    });
    if (error) {
      set({ loading: false });
      throw error;
    }
    if (data.user) {
      set({ user: data.user, session: data.session });
      await get().fetchProfile();
    }
    set({ loading: false });
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Chưa cấu hình Supabase. Vui lòng cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env');
    }
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      throw error;
    }
    set({ user: data.user, session: data.session, loading: false });
    await get().fetchProfile();
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Chưa cấu hình Supabase. Vui lòng cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    const guest = getGuestProfile();
    set({ user: null, session: null, profile: guest });
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user || !isSupabaseConfigured()) {
      set({ profile: getGuestProfile() });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      if (data) set({ profile: data });
    } catch (e) {
      console.warn('Profile fetch warning:', e);
      set({ profile: getGuestProfile() });
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user || !isSupabaseConfigured()) return;
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    if (data) set({ profile: data });
  },

  // Record Caro Match Elo
  recordCaroMatch: async (difficulty, result, movesCount) => {
    const user = get().user;
    if (!user || !isSupabaseConfigured()) {
      const guest = getGuestProfile();
      const botEloMap = { easy: 800, hard: 1200, impossible: 1600 };
      const kMap = { easy: 16, hard: 24, impossible: 32 };
      const botElo = botEloMap[difficulty] || 1000;
      const k = kMap[difficulty] || 24;

      const actualScore = result === 'win' ? 1.0 : (result === 'draw' ? 0.5 : 0.0);
      const expectedScore = 1.0 / (1.0 + Math.pow(10, (botElo - guest.caro_elo) / 400.0));
      let eloChange = Math.round(k * (actualScore - expectedScore));

      if (result === 'win' && eloChange <= 0) eloChange = 2;
      if (result === 'loss' && eloChange >= 0) eloChange = -2;

      const oldElo = guest.caro_elo;
      guest.caro_elo = Math.max(100, guest.caro_elo + eloChange);
      guest.caro_total_games = (guest.caro_total_games || 0) + 1;
      if (result === 'win') guest.caro_wins = (guest.caro_wins || 0) + 1;
      else if (result === 'loss') guest.caro_losses = (guest.caro_losses || 0) + 1;
      else guest.caro_draws = (guest.caro_draws || 0) + 1;

      saveGuestProfile(guest);
      set({ profile: guest });
      return { old_elo: oldElo, new_elo: guest.caro_elo, elo_change: eloChange };
    }

    try {
      const { data, error } = await supabase.rpc('record_caro_result', {
        p_difficulty: difficulty,
        p_result: result,
        p_moves_count: movesCount
      });
      if (error) throw error;
      await get().fetchProfile();
      return data;
    } catch (e) {
      console.error('Error recording caro match:', e);
      throw e;
    }
  },

  // Record 2048 Highscore
  record2048Score: async (score) => {
    const user = get().user;
    if (!user || !isSupabaseConfigured()) {
      const guest = getGuestProfile();
      const oldHigh = guest.game_2048_highscore || 0;
      if (score > oldHigh) {
        guest.game_2048_highscore = score;
        saveGuestProfile(guest);
        set({ profile: guest });
      }
      return { old_highscore: oldHigh, new_highscore: guest.game_2048_highscore };
    }

    try {
      const { data, error } = await supabase.rpc('update_2048_score', { p_score: score });
      if (error) throw error;
      await get().fetchProfile();
      return data;
    } catch (e) {
      console.error('Error updating 2048 score:', e);
      return { new_highscore: score };
    }
  },

  // Record Minesweeper Best Time
  recordMinesweeperWin: async (timeSeconds) => {
    const user = get().user;
    if (!user || !isSupabaseConfigured()) {
      const guest = getGuestProfile();
      const oldBest = guest.minesweeper_best_time;
      if (oldBest === null || timeSeconds < oldBest) {
        guest.minesweeper_best_time = timeSeconds;
      }
      guest.minesweeper_wins = (guest.minesweeper_wins || 0) + 1;
      saveGuestProfile(guest);
      set({ profile: guest });
      return { old_best_time: oldBest, new_best_time: guest.minesweeper_best_time };
    }

    try {
      const { data, error } = await supabase.rpc('update_minesweeper_time', { p_time_seconds: timeSeconds });
      if (error) throw error;
      await get().fetchProfile();
      return data;
    } catch (e) {
      console.error('Error recording minesweeper win:', e);
      return { new_best_time: timeSeconds };
    }
  },

  // Leaderboard
  getLeaderboard: async (gameType = 'caro', limit = 50) => {
    if (!isSupabaseConfigured()) {
      // Return empty list if Supabase is not connected so we don't display fake data
      return [];
    }

    try {
      let query = supabase.from('profiles').select('*');
      if (gameType === 'caro') query = query.order('caro_elo', { ascending: false });
      else if (gameType === '2048') query = query.order('game_2048_highscore', { ascending: false });
      else query = query.not('minesweeper_best_time', 'is', null).order('minesweeper_best_time', { ascending: true });

      const { data, error } = await query.limit(limit);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Leaderboard error:', e);
      return [];
    }
  }
}));
