-- ==============================================================================
-- ARCADE HUB - SUPABASE DATABASE SCHEMA (MULTI-GAME & GOOGLE OAUTH)
-- ==============================================================================
-- Hướng dẫn: Dán toàn bộ script này vào SQL Editor trong Supabase Dashboard và bấm RUN.
-- Hỗ trợ: Google OAuth, Email Auth, Cờ Caro Elo, 2048 High Score, Dò Mìn Best Time
-- ==============================================================================

-- 1. BẢNG PROFILES (Đa Game)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  email text,
  
  -- Cờ Caro
  caro_elo integer default 1000 not null check (caro_elo >= 100),
  caro_wins integer default 0 not null check (caro_wins >= 0),
  caro_losses integer default 0 not null check (caro_losses >= 0),
  caro_draws integer default 0 not null check (caro_draws >= 0),
  caro_total_games integer default 0 not null check (caro_total_games >= 0),

  -- 2048 Game
  game_2048_highscore integer default 0 not null check (game_2048_highscore >= 0),
  
  -- Dò Mìn (Thời gian tính bằng giây, thấp hơn là tốt hơn)
  minesweeper_best_time integer default null check (minesweeper_best_time is null or minesweeper_best_time > 0),
  minesweeper_wins integer default 0 not null check (minesweeper_wins >= 0),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. BẢNG MATCH_HISTORY (Lịch sử các ván đấu)
create table if not exists public.match_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_type text not null check (game_type in ('caro', '2048', 'minesweeper')),
  difficulty text default 'normal',
  result text not null, -- 'win', 'loss', 'draw', 'completed', 'score'
  score_value integer not null, -- elo change hoặc final score hoặc time in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.match_history enable row level security;

-- Profiles: Cho phép xem công khai (để hiện Bảng Xếp Hạng)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Profiles: Người dùng chỉ được sửa thông tin của mình
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Match History: Cho phép xem công khai
drop policy if exists "Match history viewable by everyone" on public.match_history;
create policy "Match history viewable by everyone"
  on public.match_history for select
  using (true);

-- Match History: Chỉ insert qua RPC hoặc của chính mình
drop policy if exists "Users can insert own matches" on public.match_history;
create policy "Users can insert own matches"
  on public.match_history for insert
  with check (auth.uid() = user_id);

-- 4. TRIGGER TỰ ĐỘNG TẠO PROFILE TỪ GOOGLE OAUTH & EMAIL SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_username text;
  v_avatar text;
begin
  -- Lấy tên hiển thị từ metadata của Google hoặc Email
  v_username := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );

  -- Lấy avatar từ Google
  v_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  );

  -- Đảm bảo username không trùng lặp
  if exists (select 1 from public.profiles where username = v_username) then
    v_username := v_username || '_' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username, email, avatar_url, caro_elo)
  values (new.id, v_username, new.email, v_avatar, 1000)
  on conflict (id) do update
  set email = excluded.email,
      avatar_url = case when profiles.avatar_url is null or profiles.avatar_url = '' then excluded.avatar_url else profiles.avatar_url end;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. RPC HÀM TÍNH ELO CỜ CARO (record_caro_result)
create or replace function public.record_caro_result(
  p_difficulty text,
  p_result text,
  p_moves_count integer
)
returns json as $$
declare
  v_user_id uuid;
  v_current_elo integer;
  v_bot_elo integer;
  v_k_factor integer;
  v_expected_score float;
  v_actual_score float;
  v_elo_change integer;
  v_new_elo integer;
  v_wins integer;
  v_losses integer;
  v_draws integer;
  v_total_games integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized: Bạn cần đăng nhập.';
  end if;

  select caro_elo, caro_wins, caro_losses, caro_draws, caro_total_games
  into v_current_elo, v_wins, v_losses, v_draws, v_total_games
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Không tìm thấy hồ sơ người chơi.';
  end if;

  if p_difficulty = 'easy' then v_bot_elo := 800; v_k_factor := 16;
  elsif p_difficulty = 'hard' then v_bot_elo := 1200; v_k_factor := 24;
  elsif p_difficulty = 'impossible' then v_bot_elo := 1600; v_k_factor := 32;
  else v_bot_elo := 1000; v_k_factor := 24;
  end if;

  if p_result = 'win' then v_actual_score := 1.0; v_wins := v_wins + 1;
  elsif p_result = 'draw' then v_actual_score := 0.5; v_draws := v_draws + 1;
  elsif p_result = 'loss' then v_actual_score := 0.0; v_losses := v_losses + 1;
  else raise exception 'Kết quả không hợp lệ.';
  end if;

  v_total_games := v_total_games + 1;
  v_expected_score := 1.0 / (1.0 + power(10.0, (v_bot_elo - v_current_elo)::float / 400.0));
  v_elo_change := round(v_k_factor * (v_actual_score - v_expected_score));

  if p_result = 'win' and v_elo_change <= 0 then v_elo_change := 2;
  elsif p_result = 'loss' and v_elo_change >= 0 then v_elo_change := -2;
  end if;

  v_new_elo := greatest(100, v_current_elo + v_elo_change);

  update public.profiles
  set caro_elo = v_new_elo,
      caro_wins = v_wins,
      caro_losses = v_losses,
      caro_draws = v_draws,
      caro_total_games = v_total_games,
      updated_at = now()
  where id = v_user_id;

  insert into public.match_history (user_id, game_type, difficulty, result, score_value, created_at)
  values (v_user_id, 'caro', p_difficulty, p_result, v_elo_change, now());

  return json_build_object(
    'old_elo', v_current_elo,
    'new_elo', v_new_elo,
    'elo_change', v_elo_change,
    'wins', v_wins,
    'losses', v_losses,
    'draws', v_draws,
    'total_games', v_total_games
  );
end;
$$ language plpgsql security definer;

-- 6. RPC HÀM CẬP NHẬT HIGHSCORE 2048 (update_2048_score)
create or replace function public.update_2048_score(p_score integer)
returns json as $$
declare
  v_user_id uuid;
  v_old_high integer;
  v_new_high integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Unauthorized'; end if;

  select game_2048_highscore into v_old_high from public.profiles where id = v_user_id;
  v_new_high := greatest(coalesce(v_old_high, 0), p_score);

  update public.profiles set game_2048_highscore = v_new_high, updated_at = now() where id = v_user_id;
  insert into public.match_history (user_id, game_type, result, score_value, created_at)
  values (v_user_id, '2048', 'score', p_score, now());

  return json_build_object('old_highscore', v_old_high, 'new_highscore', v_new_high, 'is_new_record', p_score > v_old_high);
end;
$$ language plpgsql security definer;

-- 7. RPC HÀM CẬP NHẬT THỜI GIAN DÒ MÌN (update_minesweeper_time)
create or replace function public.update_minesweeper_time(p_time_seconds integer)
returns json as $$
declare
  v_user_id uuid;
  v_old_best integer;
  v_new_best integer;
  v_wins integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Unauthorized'; end if;

  select minesweeper_best_time, minesweeper_wins into v_old_best, v_wins from public.profiles where id = v_user_id;
  
  if v_old_best is null or p_time_seconds < v_old_best then
    v_new_best := p_time_seconds;
  else
    v_new_best := v_old_best;
  end if;

  v_wins := coalesce(v_wins, 0) + 1;

  update public.profiles set minesweeper_best_time = v_new_best, minesweeper_wins = v_wins, updated_at = now() where id = v_user_id;
  insert into public.match_history (user_id, game_type, result, score_value, created_at)
  values (v_user_id, 'minesweeper', 'win', p_time_seconds, now());

  return json_build_object('old_best_time', v_old_best, 'new_best_time', v_new_best, 'is_new_record', (v_old_best is null or p_time_seconds < v_old_best));
end;
$$ language plpgsql security definer;
