# 🎮 Cờ Caro AI - Gomoku Master

Game cờ Caro (Gomoku) 15x15 chơi trực tiếp với Bot AI trên trình duyệt, hỗ trợ đa nền tảng (Mobile & PC), giao diện hiện đại với Theme Sáng/Tối, hiệu ứng âm thanh tổng hợp và 2 cấp độ thử thách.

---

## 🚀 Tính năng nổi bật

- 🧠 **2 Cấp độ AI thông minh**:
  - 🟢 **Dễ (Easy)**: AI đánh giá cơ bản, có 35% đi nước tự nhiên, phù hợp cho người mới làm quen hoặc giải trí nhẹ nhàng.
  - 🔴 **Khó (Hard - Master AI)**: Tích hợp thuật toán **Minimax + Alpha-Beta Pruning** kết hợp **Ma trận nhận diện mẫu hình (Pattern Evaluation)**, nhận biết tức thì các thế 4 mở, 4 chặn, 3 mở, đòn bẫy đôi 3-3 và có hệ số phòng thủ cao.
- 📊 **Thống kê Session**: Theo dõi tổng số ván đấu, số trận thắng, thua, hòa và tỉ lệ thắng (%) trong phiên chơi (lưu qua `sessionStorage`).
- 🌓 **Theme Sáng / Tối (Light & Dark Mode)**: Chuyển đổi giao diện mượt mà, tự động lưu sở thích người dùng vào `localStorage`.
- 📱 **100% Responsive cho Mobile & Desktop**:
  - Bàn cờ tự co giãn theo kích thước màn hình (`width: min(92vw, 540px)`).
  - Tối ưu chạm cảm ứng trên iOS & Android (`touch-action: manipulation`).
  - Hỗ trợ rung phản hồi xúc giác (**Haptic Feedback**) khi chạm nước đi và kết thúc ván.
- ✨ **Hiệu ứng chiến thắng trực quan**: Khi có bên thắng, chuỗi 5 ô cờ chiến thắng sẽ phát sáng neon rực rỡ và giữ trong **3 giây** để quan sát trước khi hiển thị popup kết quả.
- 🔊 **Âm thanh Web Audio Synthesizer**: Tự động tổng hợp âm thanh bằng tần số sóng âm (Sine, Triangle, Sawtooth), hoạt động mượt mà offline 100% không lo lỗi file hay mất kết nối mạng.
- ↩️ **Hỗ trợ Đi lại (Undo)** và **Ván mới (Reset)** linh hoạt.

---

## 🛠️ Công nghệ sử dụng

| Lĩnh vực | Công nghệ / Kỹ thuật | Mô tả chi tiết |
| :--- | :--- | :--- |
| **Giao diện (UI/UX)** | **HTML5 & CSS3** | Cấu trúc chuẩn SEO, CSS Variables, CSS Grid $15 \times 15$, Flexbox layout, Keyframe Animations, Glassmorphism Modal. |
| **Typography** | **Google Fonts** | Phông chữ hiện đại `Plus Jakarta Sans`. |
| **Engine Game** | **Vanilla JavaScript (ES6+)** | Chạy trực tiếp trên trình duyệt, **Zero-dependency** (không cần cài thêm thư viện nặng). |
| **Âm thanh** | **Web Audio API** | Tổng hợp sóng âm trực tiếp từ trình duyệt (`AudioContext`, `OscillatorNode`, `GainNode`), tương thích chuẩn Mobile iOS Safari & Android Chrome. |
| **Phản hồi xúc giác**| **Vibration API** | Rung phản hồi (`navigator.vibrate`) khi đánh cờ hoặc thắng/thua. |
| **Lưu trữ dữ liệu** | **Web Storage API** | `sessionStorage` lưu điểm phiên chơi, `localStorage` lưu cài đặt Theme. |
| **Thuật toán AI** | **Minimax + Alpha-Beta Pruning** | Cây tìm kiếm nước đi tối ưu với độ sâu tính toán cao. |
| **Tối ưu tìm kiếm AI**| **Candidate Moves Generator** | Giới hạn vùng quét ô cờ trong bán kính 1–2 ô quanh các quân đã đánh, giảm không gian tìm kiếm từ 225 ô xuống còn 10–15 ô tiềm năng. |
| **Đánh giá thế trận**| **Heuristic Pattern Matcher** | Hệ thống nhận diện chuỗi: $5$ liên tiếp, $4$ mở 2 đầu, $4$ chặn 1 đầu, $3$ mở 2 đầu, $3$ chặn 1 đầu, $2$ mở, đòn bẫy đôi 3-3. |

---

## 📖 Bảng điểm thế cờ của AI (Pattern Evaluation)

Trong chế độ **Khó (Hard)**, thuật toán tính điểm từng ô cờ dựa trên ma trận mẫu hình:

| Mẫu hình (Pattern) | Ví dụ thế cờ | Ý nghĩa | Điểm trọng số |
| :--- | :--- | :--- | :--- |
| **FIVE (Thắng)** | `X X X X X` | 5 quân liên tiếp | $+100,000,000$ |
| **OPEN FOUR (4 mở)** | `_ X X X X _` | Đe dọa không thể cản phá | $+10,000,000$ |
| **BLOCKED FOUR (4 chặn/thủng)** | `O X X X X _` / `X X _ X X` | Bắt buộc đối phương phải đỡ ngay | $+1,000,000$ |
| **OPEN THREE (3 mở)** | `_ X X X _` / `_ X _ X X _` | Lượt sau sẽ thành 4 mở | $+120,000$ |
| **DOUBLE THREE (Đôi 3)** | Hai chuỗi 3 mở cùng lúc | Tạo thế cờ hiểm tương đương 4 mở | $+1,000,000$ |
| **BLOCKED THREE (3 chặn)** | `O X X X _ _` | Tiềm năng tấn công | $+4,000$ |
| **OPEN TWO (2 mở)** | `_ _ X X _ _` | Xây dựng thế trận ban đầu | $+400$ |
| **BLOCKED TWO (2 chặn)** | `O X X _ _ _` | Giá trị thấp | $+20$ |

> **Hệ số phòng thủ**: Điểm chặn đòn của đối thủ được nhân với **$1.2\times$** để Bot luôn ưu tiên triệt tiêu các thế 3 mở hoặc 4 của bạn từ sớm.

---

## 🎮 Cách sử dụng & Khởi chạy

### Cách 1: Mở trực tiếp (Nhanh nhất)
1. Truy cập thư mục chứa mã nguồn: `d:\code\Caro\`
2. Nhấp đúp chuột vào file **`index.html`** để mở ngay trên trình duyệt (Google Chrome, Microsoft Edge, Safari, Firefox,...).

### Cách 2: Chạy qua Web Server cục bộ (Tùy chọn)
Nếu bạn có cài sẵn **Node.js** hoặc **Python**, bạn có thể tạo local server để chơi thử trên cả các thiết bị cùng mạng Wi-Fi (điện thoại, tablet):

- **Bằng Python**:
  ```bash
  python -m http.server 8080
  ```
  Sau đó mở trình duyệt truy cập: `http://localhost:8080`

- **Bằng Node.js (npx serve)**:
  ```bash
  npx serve .
  ```

---

## 🎯 Hướng dẫn chơi

1. **Bắt đầu**: Mặc định bạn cầm quân xanh **X** và đi trước, Bot cầm quân đỏ **O**.
2. **Đánh cờ**: Nhấp hoặc chạm vào ô trống bất kỳ trên bàn cờ $15 \times 15$ để đặt quân.
3. **Đổi độ khó**: Nhấn vào nút **Dễ 🟢** hoặc **Khó 🔴** trên thanh điều khiển.
4. **Đi lại (Undo)**: Nếu đi nhầm, bấm nút **↩️ Đi lại** để rút lại nước cờ (rút cả lượt của bạn và lượt đối ứng của Bot).
5. **Chơi ván mới**: Bấm nút **🔄 Ván mới** bất cứ lúc nào.
6. **Đổi giao diện**: Bấm icon **🌓** ở góc trên cùng bên phải để chuyển giữa nền Sáng và Tối.

---

## 📂 Cấu trúc thư mục

```text
d:\code\Caro\
├── index.html      # Toàn bộ mã nguồn (Giao diện, CSS, Logic Game, Audio & AI Engine)
└── README.md       # Tài liệu giới thiệu, công nghệ và hướng dẫn sử dụng
```

---

## 📜 Bản quyền
Dự án được xây dựng phục vụ mục đích học tập, giải trí và nghiên cứu thuật toán AI Game dạng đối kháng hoàn hảo (Zero-sum Perfect Information Game).
