import React, { useState } from 'react';
import { X, Mail, Lock, User, LogOut, Check, Sparkles, Shield, Trophy, Flame, Zap, Edit3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isSupabaseConfigured, getRankInfo } from '@/lib/supabase';
import { audio } from '@/lib/audio';

const AVATAR_PRESETS = [
  '🐼', '🦊', '🐯', '🐉', '🧙', '⚡', '👑', '🤖', '👾', '🐱', '🐺', '🦁'
];

export default function AuthModal({ isOpen, onClose }) {
  const { user, profile, signInWithGoogle, signIn, signUp, signOut, updateProfile } = useAuthStore();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'guest'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [editName, setEditName] = useState(profile?.username || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();
  const rank = getRankInfo(profile?.caro_elo || 1000);

  const translateError = (msg) => {
    if (!msg) return 'Đã xảy ra lỗi, vui lòng thử lại.';
    if (msg.includes('Invalid login credentials')) return 'Email hoặc mật khẩu không chính xác.';
    if (msg.includes('User already registered')) return 'Email này đã được đăng ký tài khoản.';
    if (msg.includes('Password should be at least 6 characters')) return 'Mật khẩu phải có tối thiểu 6 ký tự.';
    if (msg.includes('Email not confirmed')) return 'Vui lòng kiểm tra hộp thư để xác thực email.';
    if (msg.includes('rate limit')) return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
    return msg;
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      audio.playClick();
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(translateError(err.message));
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      audio.playClick();
      if (tab === 'register') {
        await signUp(email, password, username || email.split('@')[0]);
        setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
      } else {
        await signIn(email, password);
        setSuccessMsg('Đăng nhập thành công!');
      }
      setTimeout(() => onClose(), 600);
    } catch (err) {
      setErrorMsg(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfileName = async () => {
    if (!editName.trim()) return;
    audio.playClick();
    await updateProfile({ username: editName.trim() });
    setIsEditingName(false);
    setSuccessMsg('Đã lưu tên hiển thị mới!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleSelectPresetAvatar = async (emoji) => {
    audio.playClick();
    await updateProfile({ avatar_url: emoji });
    setSuccessMsg('Đã cập nhật Avatar!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleSignOut = async () => {
    audio.playClick();
    await signOut();
    onClose();
  };

  const isGuest = !user;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md bg-[#1c1f27] border border-[#3e4248] rounded-3xl p-5 sm:p-6 relative shadow-2xl overflow-hidden"
      >
        {/* Glow Accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-28 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#242833] transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ===================== VIEW 1: PROFILE MANAGEMENT (LOGGED IN OR GUEST PROFILE) ===================== */}
        {(!isGuest || tab === 'guest') ? (
          <div className="flex flex-col items-center gap-4">
            {/* Header / Avatar */}
            <div className="flex flex-col items-center text-center relative mt-1">
              <div className="relative group">
                {profile?.avatar_url && profile.avatar_url.length <= 4 ? (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#242833] to-[#14161b] border-2 border-sky-500/50 flex items-center justify-center text-3xl shadow-xl shadow-sky-500/10">
                    {profile.avatar_url}
                  </div>
                ) : profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-500/50 shadow-xl" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-2xl font-black text-white shadow-xl">
                    {profile?.username?.charAt(0)?.toUpperCase() || 'K'}
                  </div>
                )}

                {/* Rank Badge Indicator */}
                <div 
                  className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-lg border border-[#3e4248] text-[10px] font-black flex items-center gap-1 shadow-md bg-[#14161b]"
                  style={{ color: rank.color }}
                >
                  <span>{rank.icon}</span>
                  <span>{rank.name}</span>
                </div>
              </div>

              {/* Username & Edit */}
              <div className="mt-2.5 flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={20}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-2.5 py-1 rounded-xl bg-[#14161b] border border-sky-500 text-xs font-bold text-slate-100 outline-none text-center"
                      placeholder="Nhập tên mới..."
                      autoFocus
                    />
                    <button
                      onClick={handleSaveProfileName}
                      className="p-1 rounded-lg bg-sky-500 text-white hover:bg-sky-400 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-slate-100">{profile?.username || 'Khách Ẩn Danh'}</h3>
                    <button
                      onClick={() => { setIsEditingName(true); setEditName(profile?.username || ''); }}
                      className="p-1 text-slate-500 hover:text-sky-400 transition-colors"
                      title="Đổi tên hiển thị"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 font-mono">
                {user ? user.email : 'Tài khoản Cục Bộ (Khách)'}
              </p>
            </div>

            {/* Avatar Selector Presets */}
            <div className="w-full bg-[#14161b] border border-[#3e4248] rounded-2xl p-3">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 text-center">
                Chọn Avatar Vui Nhộn
              </span>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_PRESETS.map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPresetAvatar(emoji)}
                    className={`h-9 rounded-xl flex items-center justify-center text-lg hover:scale-110 active:scale-95 transition-all ${
                      profile?.avatar_url === emoji 
                        ? 'bg-sky-500/20 border-2 border-sky-400' 
                        : 'bg-[#242833] hover:bg-[#2d3240] border border-transparent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="w-full grid grid-cols-3 gap-2">
              <div className="bg-[#14161b] border border-[#3e4248] rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-slate-400 font-semibold block">Cờ Caro</span>
                <span className="text-sm font-black text-amber-400 font-mono">{profile?.caro_elo || 1000}</span>
                <span className="text-[9px] text-slate-500 block">Elo ({profile?.caro_wins || 0}W)</span>
              </div>
              <div className="bg-[#14161b] border border-[#3e4248] rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-slate-400 font-semibold block">Game 2048</span>
                <span className="text-sm font-black text-sky-400 font-mono">{profile?.game_2048_highscore || 0}</span>
                <span className="text-[9px] text-slate-500 block">Kỷ lục điểm</span>
              </div>
              <div className="bg-[#14161b] border border-[#3e4248] rounded-xl p-2.5 text-center">
                <span className="text-[10px] text-slate-400 font-semibold block">Dò Mìn</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {profile?.minesweeper_best_time ? `${profile.minesweeper_best_time}s` : '--'}
                </span>
                <span className="text-[9px] text-slate-500 block">Phá đảo nhanh</span>
              </div>
            </div>

            {/* Notifications */}
            {successMsg && (
              <div className="w-full p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center animate-fadeIn">
                {successMsg}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="w-full flex gap-2 mt-1">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng Xuất</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setTab('login')}
                    className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
                  >
                    Đăng Nhập Online
                  </button>
                  <button
                    onClick={() => { audio.playClick(); onClose(); }}
                    className="py-2.5 px-4 rounded-xl bg-[#242833] hover:bg-[#2d3240] text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Tiếp Tục Chơi
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ===================== VIEW 2: AUTH SIGN IN / SIGN UP FORM ===================== */
          <div className="flex flex-col gap-3.5">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-black tracking-wider uppercase mb-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Tài Khoản Cao Thủ</span>
              </div>
              <h3 className="text-lg font-black text-slate-100 tracking-tight">
                {tab === 'register' ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Web Game'}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Đồng bộ điểm Elo, leo Bảng Xếp Hạng & lưu kỷ lục
              </p>
            </div>

            {/* Google One-Click OAuth */}
            <button
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Đăng nhập nhanh với Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-[#3e4248]"></div>
              <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase">HOẶC DÙNG EMAIL</span>
              <div className="flex-1 h-px bg-[#3e4248]"></div>
            </div>

            {/* Tabs */}
            <div className="flex bg-[#14161b] border border-[#3e4248] rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => { audio.playClick(); setTab('login'); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'login' ? 'bg-[#242833] text-slate-100 border border-[#3e4248] shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => { audio.playClick(); setTab('register'); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'register' ? 'bg-[#242833] text-slate-100 border border-[#3e4248] shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Đăng Ký
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-center animate-fadeIn">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center animate-fadeIn">
                {successMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2.5">
              {tab === 'register' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Tên hiển thị (Nickname)</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Ví dụ: VuaCoCaro99"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#14161b] border border-[#3e4248] text-xs text-slate-100 outline-none focus:border-sky-500 font-medium transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#14161b] border border-[#3e4248] text-xs text-slate-100 outline-none focus:border-sky-500 font-medium transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#14161b] border border-[#3e4248] text-xs text-slate-100 outline-none focus:border-sky-500 font-medium transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs transition-all mt-1 shadow-lg shadow-sky-500/25 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Đang xử lý...' : (tab === 'register' ? 'Tạo Tài Khoản Mới' : 'Đăng Nhập')}
              </button>
            </form>

            {/* Quick Guest Switch Button */}
            <div className="pt-1 text-center border-t border-[#3e4248]/50">
              <button
                type="button"
                onClick={() => { audio.playClick(); setTab('guest'); }}
                className="text-[11px] text-slate-400 hover:text-sky-400 font-bold transition-colors"
              >
                👤 Hoặc tùy chỉnh Hồ Sơ Khách (Chơi Cục Bộ)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
