import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials missing. Copy .env.example to .env and fill in your values.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export function isSupabaseConfigured() {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseUrl !== 'https://your-project.supabase.co'
  );
}

export function getRankInfo(elo = 1000) {
  if (elo < 1000) return { name: 'Đồng', tier: 'tier-C', icon: '🥉', color: '#cd7f32' };
  if (elo < 1200) return { name: 'Bạc', tier: 'tier-B', icon: '🥈', color: '#94a3b8' };
  if (elo < 1400) return { name: 'Vàng', tier: 'tier-A', icon: '🥇', color: '#f59e0b' };
  if (elo < 1600) return { name: 'Bạch Kim', tier: 'tier-S', icon: '💎', color: '#38bdf8' };
  if (elo < 1800) return { name: 'Kim Cương', tier: 'tier-S', icon: '🔮', color: '#a855f7' };
  if (elo < 2000) return { name: 'Cao Thủ', tier: 'tier-S', icon: '👑', color: '#ef4444' };
  return { name: 'Đại Cao Thủ', tier: 'tier-S', icon: '⚡', color: '#eab308' };
}
