# 🎮 Arcade Hub - Cổng Mini-Game Trực Tuyến (React + Vite)

Nền tảng cổng Mini-Game web được xây dựng hoàn chỉnh bằng **React 18 + Vite + Tailwind CSS + Lucide Icons**, tích hợp **Supabase Cloud (Đăng nhập 1-Click Google OAuth & Email)**, hệ thống tính điểm **Elo Ranking chuẩn quốc tế cho Cờ Caro**, **Highscore cho 2048**, **Speedrun cho Dò Mìn**, và âm thanh Web Audio Synthesizer.

---

## 🌟 Các trò chơi tích hợp trong Arcade Hub

| Trò chơi | Thể loại | Cách tính điểm / Rank | Tính năng nổi bật |
| :--- | :--- | :--- | :--- |
| ⚔️ **Cờ Caro (Gomoku 15x15)** | Đối kháng Trí tuệ | **Hệ thống điểm Elo** (Thắng cộng, thua trừ) | 3 cấp độ AI (Dễ 800, Khó 1200, Siêu khó 1600), hiệu ứng hạt Canvas, 5 ô thắng phát sáng 3 giây. |
| 🔢 **2048 Classic** | Giải đố Số học | **Điểm số kỷ lục (Highscore)** | Bàn cờ 4x4, phím mũi tên / WASD (PC) + vuốt cảm ứng Mobile mượt mà, lưu điểm kỷ lục. |
| 💣 **Dò Mìn (Minesweeper)** | Tốc độ & Logic | **Thời gian hoàn thành (Speedrun)** | 3 cấp độ (9x9, 12x12, 14x14), nước đầu an toàn 100%, nút cắm cờ chuyên dụng cho điện thoại. |

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (React + Vite)

### 1. Khởi động môi trường phát triển (Dev Server):
```bash
npm run dev
```
Trình duyệt sẽ tự động mở tại: `http://localhost:3000`

### 2. Build bản phát hành (Production Build):
```bash
npm run build
```
Thư mục `dist/` đã sẵn sàng để deploy lên Vercel, Netlify, Cloudflare Pages hoặc bất kỳ hosting nào.

---

## ⚡ Hướng dẫn cấu hình Supabase Cloud (Google Auth & Database)

### Bước 1: Chạy Script SQL tạo bảng
1. Mở dự án trên [Supabase.com](https://supabase.com).
2. Vào mục **SQL Editor** ➡️ Copy toàn bộ nội dung file [`supabase_schema.sql`](file:///d:/code/Caro/supabase_schema.sql) và bấm **Run**.

### Bước 2: Bật Google Login (Tùy chọn)
1. Trong Supabase Dashboard, vào **Authentication ➡️ Providers ➡️ Google**.
2. Bật Google Provider và nhập **Client ID** & **Client Secret** từ Google Cloud Console.

### Bước 3: Kết nối Game với Supabase
1. Vào **Project Settings ➡️ API** để lấy **Project URL** và **anon public key**.
2. Mở game ➡️ Nhấp vào biểu tượng **Cài đặt (⚙️)** ở góc trên bên phải thanh điều hướng ➡️ Dán URL và Key ➡️ Bấm **Lưu & Kết Nối**!

> **Ghi chú**: Nếu chưa kết nối Supabase, cổng game vẫn hoạt động trơn tru 100% ở **Chế độ Khách (Guest Mode)** và lưu điểm cục bộ.

---

## 📁 Cấu trúc Dự án React + Vite

```text
d:\code\Caro\
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # Thanh điều hướng trên cùng & avatar profile
│   │   ├── Lobby.jsx            # Trang chủ chọn game (Caro, 2048, Dò Mìn)
│   │   ├── CaroGame.jsx         # Bàn cờ chiến Caro AI, hiệu ứng 3s, confetti
│   │   ├── Game2048.jsx         # Game 2048 vuốt cảm ứng & phím mũi tên
│   │   ├── MinesweeperGame.jsx  # Game Dò Mìn speedrun & cắm cờ mobile
│   │   ├── Leaderboard.jsx      # Bảng xếp hạng đa game thời gian thực
│   │   ├── Rules.jsx            # Hướng dẫn luật chơi & cấp bậc Rank Elo
│   │   ├── AuthModal.jsx        # Modal Đăng nhập 1-Click Google & Email
│   │   └── SettingsModal.jsx    # Modal Cấu hình URL & Key Supabase
│   ├── lib/
│   │   ├── audio.js             # Web Audio Synthesizer SFX & Rung Haptic
│   │   ├── caroAI.js            # Engine AI Minimax Alpha-Beta 3 cấp độ
│   │   └── supabase.js          # Kết nối Supabase SDK, Google OAuth & RPC
│   ├── App.jsx                  # Root App điều phối chuyển cảnh màn hình
│   ├── index.css                # Tailwind directives & styles
│   └── main.jsx                 # React DOM Root
├── package.json                 # Cấu hình dependencies (React 18, Vite, Tailwind)
├── tailwind.config.js           # Cấu hình Tailwind CSS
├── vite.config.js               # Cấu hình Vite bundler
├── supabase_schema.sql          # SQL Schema bảng profiles, match_history & RPC
└── README.md                    # Tài liệu hướng dẫn
```
