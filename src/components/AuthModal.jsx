import React, { useState } from 'react';
import { X, Mail, Lock, User, LogOut, Check, Edit3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
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

  const translateError = (msg) => {
    if (!msg) return 'Đã xảy ra lỗi, vui lòng thử lại.';
    if (msg.includes('Invalid login credentials')) return 'Email hoặc mật khẩu không đúng.';
    if (msg.includes('User already registered')) return 'Email này đã tồn tại.';
    if (msg.includes('Password should be at least 6 characters')) return 'Mật khẩu tối thiểu 6 ký tự.';
    if (msg.includes('rate limit')) return 'Quá nhiều yêu cầu, thử lại sau.';
    return msg;
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
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
    setLoading(true);

    try {
      audio.playClick();
      if (tab === 'register') {
        try {
          await signUp(email, password, username || email.split('@')[0]);
          setSuccessMsg('Đăng ký thành công!');
        } catch (signupErr) {
          try {
            await signIn(email, password);
            setSuccessMsg('Đăng nhập thành công!');
          } catch {
            throw signupErr;
          }
        }
      } else {
        await signIn(email, password);
        setSuccessMsg('Đăng nhập thành công!');
      }
      setTimeout(() => onClose(), 500);
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
  };

  const handleSelectPresetAvatar = async (emoji) => {
    audio.playClick();
    await updateProfile({ avatar_url: emoji });
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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#14161f] border border-[#232734] rounded-2xl p-5 relative shadow-xl"
      >
        <button
          onClick={() => { audio.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {(!isGuest || tab === 'guest') ? (
          /* Profile View */
          <div className="flex flex-col items-center gap-3.5">
            <div className="flex flex-col items-center text-center mt-1">
              <div className="w-14 h-14 rounded-xl bg-[#1b1e2a] border border-[#282d3d] flex items-center justify-center text-2xl mb-2">
                {profile?.avatar_url && profile.avatar_url.length <= 4 ? (
                  profile.avatar_url
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <span>{profile?.username?.charAt(0)?.toUpperCase() || 'K'}</span>
                )}
              </div>

              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    maxLength={20}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2 py-0.5 rounded-lg bg-[#0f1016] border border-sky-500 text-xs font-semibold text-slate-100 outline-none text-center"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveProfileName}
                    className="p-1 rounded-md bg-sky-500 text-white text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-bold text-slate-100">{profile?.username || 'Khách'}</h3>
                  <button
                    onClick={() => { setIsEditingName(true); setEditName(profile?.username || ''); }}
                    className="p-0.5 text-slate-400 hover:text-sky-400"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {user ? user.email : 'Tài khoản Khách'}
              </span>
            </div>

            {/* Avatar Selector */}
            <div className="w-full bg-[#0f1016] border border-[#1d212c] rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 font-semibold block mb-1.5 text-center">
                Chọn Avatar
              </span>
              <div className="grid grid-cols-6 gap-1">
                {AVATAR_PRESETS.map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPresetAvatar(emoji)}
                    className={`h-8 rounded-lg flex items-center justify-center text-base transition-colors ${
                      profile?.avatar_url === emoji 
                        ? 'bg-sky-500/20 border border-sky-400' 
                        : 'bg-[#1b1e2a] hover:bg-[#222635]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="w-full grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-[#0f1016] border border-[#1d212c] rounded-lg p-2">
                <span className="text-[10px] text-slate-400 block">Caro</span>
                <span className="text-xs font-bold text-amber-400 font-mono">{profile?.caro_elo || 1000}</span>
              </div>
              <div className="bg-[#0f1016] border border-[#1d212c] rounded-lg p-2">
                <span className="text-[10px] text-slate-400 block">2048</span>
                <span className="text-xs font-bold text-sky-400 font-mono">{profile?.game_2048_highscore || 0}</span>
              </div>
              <div className="bg-[#0f1016] border border-[#1d212c] rounded-lg p-2">
                <span className="text-[10px] text-slate-400 block">Dò Mìn</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {profile?.minesweeper_best_time ? `${profile.minesweeper_best_time}s` : '--'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="w-full flex gap-2 mt-1">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setTab('login')}
                    className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Đăng nhập Online
                  </button>
                  <button
                    onClick={() => { audio.playClick(); onClose(); }}
                    className="px-4 py-2 rounded-xl bg-[#1b1e2a] hover:bg-[#222635] text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Login / Register Form */
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-100 text-center">
              {tab === 'register' ? 'Đăng ký tài khoản' : 'Đăng nhập'}
            </h3>

            {/* Google OAuth */}
            <button
              onClick={handleGoogleAuth}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Đăng nhập với Google</span>
            </button>

            {/* Tab switch */}
            <div className="flex bg-[#0f1016] border border-[#1d212c] rounded-xl p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => { audio.playClick(); setTab('login'); }}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'login' ? 'bg-[#1b1e2a] text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => { audio.playClick(); setTab('register'); }}
                className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  tab === 'register' ? 'bg-[#1b1e2a] text-slate-100' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Đăng ký
              </button>
            </div>

            {errorMsg && (
              <div className="p-2 rounded-lg bg-rose-500/15 text-rose-300 text-xs text-center">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs text-center">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
              {tab === 'register' && (
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Tên hiển thị"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0f1016] border border-[#232734] text-xs text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0f1016] border border-[#232734] text-xs text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0f1016] border border-[#232734] text-xs text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors mt-1 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Đang xử lý...' : (tab === 'register' ? 'Tạo tài khoản' : 'Đăng nhập')}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { audio.playClick(); setTab('guest'); }}
              className="text-[11px] text-slate-400 hover:text-slate-200 text-center transition-colors cursor-pointer mt-0.5"
            >
              Hồ sơ Khách (Chơi Offline)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
