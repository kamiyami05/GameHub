import { createClient } from '@supabase/supabase-js';

// Clean and sanitize environment variables to prevent malformed URL crashes
let rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
let rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^['"]|['"]$/g, '');

// Auto-prefix https:// if missing
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}

const isValidHttpUrl = (string) => {
  if (!string) return false;
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const validUrl = isValidHttpUrl(rawUrl) ? rawUrl : 'https://placeholder-project.supabase.co';
const validKey = rawKey && rawKey.length > 10 ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase = createClient(validUrl, validKey);

export function isSupabaseConfigured() {
  return (
    isValidHttpUrl(rawUrl) &&
    rawKey.length > 20 &&
    !rawUrl.includes('placeholder') &&
    !rawUrl.includes('your-project')
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
