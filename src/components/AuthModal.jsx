import React, { useState } from 'react';
import { X, Mail, Lock, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { audio } from '@/lib/audio';

export default function AuthModal({ isOpen, onClose }) {
  const { user, profile, signInWithGoogle, signIn, signUp, signOut } = useAuthStore();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    try {
      audio.playClick();
      await signInWithGoogle();
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi đăng nhập Google.');
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      audio.playClick();
      if (tab === 'register') {
        await signUp(email, password, username);
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi xác thực.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    audio.playClick();
    await signOut();
    onClose();
  };

  const isGuest = !user;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-xs bg-[#1c1f27] border border-[#3e4248] rounded-2xl p-5 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-[#242833] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!isGuest ? (
          <div className="text-center flex flex-col items-center gap-3 py-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-sky-500 shadow-md" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-sky-600/30 flex items-center justify-center text-xl font-black text-sky-400 border border-sky-500/30">
                {profile?.username?.charAt(0)?.toUpperCase()}
              </div>
            )}

            <div>
              <h3 className="text-base font-black text-slate-100">{profile?.username}</h3>
              <p className="text-xs text-slate-400 font-medium font-mono">{user.email}</p>
            </div>

            <div className="w-full py-2.5 px-3 rounded-xl bg-[#14161b] border border-[#3e4248] text-xs font-bold text-slate-300">
              Cờ Caro: <span className="text-amber-400 font-black font-mono">{profile?.caro_elo || 1000} Elo</span>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors mt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <span className="section-kicker">★ Account Access</span>
              <h3 className="text-base font-black text-slate-100">Đăng Nhập Tài Khoản</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Lưu điểm Elo và tham gia Bảng Xếp Hạng</p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Tiếp tục với Google</span>
            </button>

            <div className="flex items-center gap-2 my-0.5">
              <div className="flex-1 h-px bg-[#3e4248]"></div>
              <span className="text-[9px] font-bold text-slate-500 font-mono">HOẶC EMAIL</span>
              <div className="flex-1 h-px bg-[#3e4248]"></div>
            </div>

            <div className="flex bg-[#14161b] border border-[#3e4248] rounded-xl p-0.5 gap-0.5">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  tab === 'login' ? 'bg-[#242833] text-slate-100 border border-[#3e4248]' : 'text-slate-500'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  tab === 'register' ? 'bg-[#242833] text-slate-100 border border-[#3e4248]' : 'text-slate-500'
                }`}
              >
                Đăng Ký
              </button>
            </div>

            {errorMsg && (
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2.5">
              {tab === 'register' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Tên hiển thị</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="HeroPlayer"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#14161b] border border-[#3e4248] text-xs text-slate-100 outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="hero@gmail.com"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#14161b] border border-[#3e4248] text-xs text-slate-100 outline-none focus:border-sky-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#14161b] border border-[#3e4248] text-xs text-slate-100 outline-none focus:border-sky-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors mt-1 shadow-sm disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : (tab === 'register' ? 'Tạo Tài Khoản' : 'Đăng Nhập')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
