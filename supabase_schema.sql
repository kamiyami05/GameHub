-- ==============================================================================
-- ARCADE HUB - SUPABASE DATABASE INITIALIZATION SCHEMA
-- ==============================================================================
-- Hướng dẫn: Copy toàn bộ đoạn script này dán vào SQL Editor trong Supabase Dashboard
-- rồi bấm nút "RUN" để tạo toàn bộ bảng, quyền bảo mật (RLS) và hàm tính điểm Elo.
-- ==============================================================================

-- 1. BẢNG PROFILES (Lưu thông tin người dùng và thành tích tất cả các game)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  
  -- Thành tích Cờ Caro (Elo, thắng/thua)
  caro_elo INTEGER DEFAULT 1000 NOT NULL,
  caro_wins INTEGER DEFAULT 0 NOT NULL,
  caro_losses INTEGER DEFAULT 0 NOT NULL,
  caro_draws INTEGER DEFAULT 0 NOT NULL,
  caro_total_games INTEGER DEFAULT 0 NOT NULL,
  
  -- Điểm cao nhất game 2048
  game_2048_highscore INTEGER DEFAULT 0 NOT NULL,
  
  -- Thời gian phá đảo Dò Mìn nhanh nhất (giây) & số ván thắng
  minesweeper_best_time INTEGER DEFAULT NULL,
  minesweeper_wins INTEGER DEFAULT 0 NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 2. BẢNG LỊCH SỬ ĐẤU CỜ CARO
CREATE TABLE IF NOT EXISTS public.caro_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  difficulty TEXT NOT NULL,       -- 'easy' | 'hard' | 'impossible'
  result TEXT NOT NULL,           -- 'win' | 'loss' | 'draw'
  moves_count INTEGER DEFAULT 0,
  old_elo INTEGER NOT NULL,
  new_elo INTEGER NOT NULL,
  elo_change INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- 3. KÍCH HOẠT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caro_matches ENABLE ROW LEVEL SECURITY;

-- Policy Profiles: Mọi người đều có thể xem (để hiển thị BXH), chính chủ mới được sửa
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policy Matches: Mọi người có thể xem lịch sử, chỉ user đăng nhập mới được thêm ván đấu
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON public.caro_matches;
CREATE POLICY "Matches are viewable by everyone" 
  ON public.caro_matches FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own matches" ON public.caro_matches;
CREATE POLICY "Users can insert their own matches" 
  ON public.caro_matches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 4. TỰ ĐỘNG TẠO PROFILE KHI ĐĂNG KÝ EMAIL HOẶC GOOGLE OAUTH
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. HÀM TÍNH ĐIỂM ELO VÀ CẬP NHẬT KẾT QUẢ TRẬN ĐẤU CARO (RPC)
CREATE OR REPLACE FUNCTION public.record_caro_result(
  p_difficulty TEXT,
  p_result TEXT,
  p_moves_count INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_elo INTEGER;
  v_bot_elo INTEGER;
  v_k INTEGER;
  v_actual_score FLOAT;
  v_expected_score FLOAT;
  v_elo_change INTEGER;
  v_new_elo INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để lưu kết quả';
  END IF;

  -- Lấy Elo hiện tại của user
  SELECT caro_elo INTO v_current_elo FROM public.profiles WHERE id = v_user_id;
  IF v_current_elo IS NULL THEN
    v_current_elo := 1000;
  END IF;

  -- Xác định Elo bot & Hệ số K
  IF p_difficulty = 'easy' THEN
    v_bot_elo := 800;
    v_k := 16;
  ELSIF p_difficulty = 'impossible' THEN
    v_bot_elo := 1600;
    v_k := 32;
  ELSE -- 'hard'
    v_bot_elo := 1200;
    v_k := 24;
  END IF;

  -- Điểm thực tế
  IF p_result = 'win' THEN
    v_actual_score := 1.0;
  ELSIF p_result = 'draw' THEN
    v_actual_score := 0.5;
  ELSE
    v_actual_score := 0.0;
  END IF;

  -- Công thức Elo chuẩn FIDE
  v_expected_score := 1.0 / (1.0 + POWER(10.0, (v_bot_elo - v_current_elo)::FLOAT / 400.0));
  v_elo_change := ROUND(v_k * (v_actual_score - v_expected_score));

  -- Đảm bảo thắng có cộng điểm, thua có trừ điểm tối thiểu
  IF p_result = 'win' AND v_elo_change <= 0 THEN
    v_elo_change := 2;
  ELSIF p_result = 'loss' AND v_elo_change >= 0 THEN
    v_elo_change := -2;
  END IF;

  v_new_elo := GREATEST(100, v_current_elo + v_elo_change);

  -- Cập nhật profile
  UPDATE public.profiles
  SET 
    caro_elo = v_new_elo,
    caro_total_games = caro_total_games + 1,
    caro_wins = CASE WHEN p_result = 'win' THEN caro_wins + 1 ELSE caro_wins END,
    caro_losses = CASE WHEN p_result = 'loss' THEN caro_losses + 1 ELSE caro_losses END,
    caro_draws = CASE WHEN p_result = 'draw' THEN caro_draws + 1 ELSE caro_draws END,
    updated_at = timezone('utc'::TEXT, now())
  WHERE id = v_user_id;

  -- Lưu lịch sử ván cờ
  INSERT INTO public.caro_matches (user_id, difficulty, result, moves_count, old_elo, new_elo, elo_change)
  VALUES (v_user_id, p_difficulty, p_result, p_moves_count, v_current_elo, v_new_elo, v_elo_change);

  RETURN jsonb_build_object(
    'old_elo', v_current_elo,
    'new_elo', v_new_elo,
    'elo_change', v_elo_change
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. HÀM CẬP NHẬT ĐIỂM CAO GAME 2048 (RPC)
CREATE OR REPLACE FUNCTION public.update_2048_score(
  p_score INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_high INTEGER;
  v_new_high INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập';
  END IF;

  SELECT game_2048_highscore INTO v_current_high FROM public.profiles WHERE id = v_user_id;
  v_new_high := GREATEST(COALESCE(v_current_high, 0), p_score);

  UPDATE public.profiles
  SET 
    game_2048_highscore = v_new_high,
    updated_at = timezone('utc'::TEXT, now())
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'old_highscore', v_current_high,
    'new_highscore', v_new_high
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. HÀM CẬP NHẬT THỜI GIAN THẮNG DÒ MÌN (RPC)
CREATE OR REPLACE FUNCTION public.update_minesweeper_time(
  p_time_seconds INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_best INTEGER;
  v_new_best INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập';
  END IF;

  SELECT minesweeper_best_time INTO v_current_best FROM public.profiles WHERE id = v_user_id;
  
  IF v_current_best IS NULL OR p_time_seconds < v_current_best THEN
    v_new_best := p_time_seconds;
  ELSE
    v_new_best := v_current_best;
  END IF;

  UPDATE public.profiles
  SET 
    minesweeper_best_time = v_new_best,
    minesweeper_wins = minesweeper_wins + 1,
    updated_at = timezone('utc'::TEXT, now())
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'old_best_time', v_current_best,
    'new_best_time', v_new_best
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
