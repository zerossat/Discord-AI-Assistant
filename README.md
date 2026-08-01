# 🤖 Discord AI Assistant

Modern, full-stack **Discord AI Assistant** — Một Discord Bot siêu thông minh (built with **Discord.js v14** & **Google Gemini API**) tích hợp **Next.js 15 Admin Dashboard**, trình phát nhạc, game AI giải trí, hệ thống Leveling/XP và AI Auto-Mod kiểm duyệt tự động.

Monorepo quản lý bởi **pnpm Workspaces + Turborepo**.

---

## ✨ Features (Tính năng nổi bật)

### 🤖 1. AI Chat & Trợ lý thông minh
| Lệnh | Mô tả |
| :--- | :--- |
| `/ask <question> [file]` | Trò chuyện ngữ cảnh liên tục với AI Gemini (hỗ trợ đọc & phân tích đính kèm PDF, TXT, CSV, JSON, Code). |
| `/imagine <prompt> [style]` | Sáng tạo hình ảnh nghệ thuật AI độ phân giải cao từ mô tả văn bản (Cyberpunk, Anime, Realistic,...). |
| `/code <prompt>` | Sinh mã nguồn lập trình chuẩn mực kèm giải thích chi tiết & Best Practices. |
| `/summary [limit]` | Tóm tắt các tin nhắn gần đây trong kênh chat (10–100 tin). |
| `/translate <to> <text> [from]` | Dịch thuật đa ngôn ngữ theo thời gian thực. |
| `/reset-memory` | Xóa bộ nhớ ngữ cảnh trò chuyện hiện tại. |

---

### 🎮 2. Trò chơi AI & Giải trí (Game AI & Gamification)
| Lệnh | Mô tả |
| :--- | :--- |
| `/hackbot start\|guess\|hint\|stop` | **Hack the Bot**: Thử thách Prompt Injection đánh lừa AI tiết lộ mật khẩu két sắt bí mật. |
| `/guessprompt start\|guess\|hint\|stop` | **Đoán Prompt Ảnh AI**: AI tạo 1 bức ảnh ẩn, thành viên nhìn ảnh đoán từ khóa gốc. |
| `/gacha` | **Thẻ Bài Gacha AI**: Điểm danh hằng ngày nhận thẻ bài nhân vật AI độc bản (Common, Rare, Epic, Legendary) kèm chỉ số ATK/DEF/HP. |
| `/cards [user]` | **Kho Thẻ Bài**: Xem bộ sưu tập thẻ bài AI Gacha sở hữu. |
| `/titles view\|claim` | **Danh Hiệu Hài Hước**: AI tự đọc thói quen nhắn tin và sắc phong danh hiệu vui nhộn độc quyền. |
| `/quiz start\|hint\|answer\|skip` | **Đuổi Hình Bắt Chữ**: Trò chơi đố vui tương tác nút bấm và gợi ý thời gian thực. |
| `/tarot [số lá] [câu hỏi]` | **Bói Bài Tarot**: Rút 1 hoặc 3 lá bài Tarot và nhờ AI giải đoán thông điệp. |
| `/ship <người 1> [người 2]` | **Bói Hợp Đôi**: Đo độ hợp % giữa hai người chơi kèm nhận xét hài hước. |

---

### 🏆 3. Cấp độ (Leveling / XP) & Bảng xếp hạng
| Lệnh | Mô tả |
| :--- | :--- |
| `/rank [user]` | Hiển thị Thẻ Cấp độ (Level), điểm XP tích lũy và thanh tiến trình ASCII `[████████░░░░]`. |
| `/leaderboard` | Bảng xếp hạng Top 10 cao thủ có XP cao nhất server. |

---

### 🔊 4. Âm thanh & Phát nhạc (Voice & Music)
| Lệnh | Mô tả |
| :--- | :--- |
| `/play <truy vấn/URL>` | Phát nhạc chất lượng cao từ YouTube / SoundCloud / Spotify. |
| `/pause` / `/resume` | Tạm dừng hoặc tiếp tục phát nhạc. |
| `/skip` / `/stop` / `/queue` | Bỏ qua bài hát, dừng phát & xóa hàng chờ nhạc. |
| `/tts <nội dung> [giọng]` | Đọc văn bản thành giọng nói trong Voice Channel (Google TTS / Gemini Audio). |
| `/leave` | Cho bot rời khỏi kênh thoại. |

---

### 🛡️ 5. Quản trị Server & Kiểm duyệt tự động (AI Auto-Mod)
| Lệnh | Mô tả |
| :--- | :--- |
| `/config view\|set` | Xem và điều chỉnh cấu hình Server (AI Model, System Prompt, Bật/tắt AI Auto-Mod, Prefix). |
| `/stats` | Thống kê số lượng Token AI tiêu thụ và quy mô hoạt động của bot. |
| `/help` / `/menu` | Danh sách hướng dẫn toàn bộ câu lệnh & Menu tương tác theo nhóm. |

---

## 🧱 Tech Stack

- **Bot & API Server:** Node.js, TypeScript, Discord.js v14, `@discordjs/voice`, Express, Mongoose (MongoDB), ioredis (Redis), `@google/genai`, Zod, Pino, Swagger.
- **Dashboard Admin:** Next.js 15 (App Router), TailwindCSS, shadcn-style UI, NextAuth.js (Discord OAuth2).
- **Shared Core:** `@daa/shared` package chứa Domain Types, Zod Schemas & Constants.
- **Tooling & Cloud:** pnpm workspaces, Turborepo, Docker, Railway, GitHub Actions CI/CD.

---

## 📁 Monorepo Layout

```
discord-ai-assistant/
├── apps/
│   ├── bot/                 # Discord Bot + Express REST API (Swagger)
│   │   └── src/
│   │       ├── ai/          # Gemini service, prompts & tarot data
│   │       ├── commands/    # Slash commands (/ask, /imagine, /hackbot, /gacha, /rank,...)
│   │       ├── config/      # Zod-validated env
│   │       ├── database/    # Mongoose models + repositories + seed
│   │       ├── discord/     # Discord Gateway Client
│   │       ├── events/      # InteractionCreate & MessageCreate (XP & Auto-Mod)
│   │       ├── server/      # Express API Server, Swagger UI, Auth middleware
│   │       ├── services/    # Chat, Memory, AutoMod, Image, HackBot, Gacha, Titles services
│   │       └── index.ts     # Bootstrap entry point
│   └── dashboard/           # Next.js 15 Admin Web Dashboard
│       ├── app/             # App Router pages (Servers, Conversations, Status, Users)
│       ├── components/      # UI components
│       └── lib/             # Auth, Bot API client
├── packages/
│   └── shared/              # @daa/shared — Types, Constants & Zod helpers
├── docker/                  # MongoDB init script
├── docs/                    # Architecture & API documentation
├── railway.json             # Railway Deployment Config
├── Dockerfile               # Production Dockerfile
└── docker-compose.yml       # Local multi-container compose
```

---

## 🔐 Biến Môi Trường (Environment Variables)

| Variable | App | Mô tả |
| :--- | :--- | :--- |
| `DISCORD_TOKEN` | bot | Bot Token lấy từ Discord Developer Portal. |
| `DISCORD_CLIENT_ID` | bot | Application Client ID — dùng đăng ký Slash Commands. |
| `DISCORD_CLIENT_SECRET` | dashboard | OAuth2 Client Secret. |
| `DISCORD_DEV_GUILD_ID` | bot | *(Tùy chọn)* ID Server thử nghiệm để cập nhật lệnh tức thì. |
| `GEMINI_API_KEY` / `GEMINI_API_KEYS` | bot | API Key Gemini (hỗ trợ danh sách phân cách bởi dấu phẩy để xoay vòng khi 429). |
| `GEMINI_MODEL` | bot | Model AI mặc định (ví dụ: `gemini-2.5-flash`). |
| `MONGODB_URI` | bot | Chuỗi kết nối cơ sở dữ liệu MongoDB. |
| `REDIS_URL` | bot | Chuỗi kết nối bộ nhớ đệm Redis. |
| `JWT_SECRET` | bot + dashboard | Khoá bí mật dùng xác thực giao tiếp API giữa Dashboard & Bot. |
| `NEXTAUTH_SECRET` | dashboard | Secret phiên đăng nhập NextAuth. |
| `BOT_API_URL` | dashboard | Đường dẫn Server API của Bot (ví dụ: `http://localhost:4000`). |

---

## 🚀 Hướng Dẫn Chạy Nhanh (Quick Start)

### 1. Chạy với Docker (Khuyên dùng)

```bash
# 1. Tạo file cấu hình môi trường
cp .env.example .env
# -> Điền DISCORD_TOKEN, DISCORD_CLIENT_ID, GEMINI_API_KEY,...

# 2. Khởi chạy toàn bộ dịch vụ (MongoDB, Redis, Bot, Dashboard)
docker compose up -d

# 3. Đăng ký các lệnh Slash Commands với Discord
docker compose exec bot pnpm deploy:commands
```

- **Dashboard Web:** `http://localhost:3000`
- **Bot API & Swagger Docs:** `http://localhost:4000/api/docs`

---

### 2. Phát triển Cục bộ (Local Development)

```bash
# Cài đặt toàn bộ dependencies
pnpm install

# Khởi chạy MongoDB & Redis qua Docker
docker compose up -d mongo redis

# Đăng ký Slash Commands
pnpm bot:deploy-commands

# Chạy đồng thời Bot + Dashboard với Turborepo
pnpm dev
```

---

### 3. Deploy lên Railway

Dự án đã tích hợp sẵn `railway.json` và `Dockerfile` chuẩn hóa:

```bash
# Đăng nhập và deploy trực tiếp bằng Railway CLI
railway login
railway up --service humorous-creativity
```

---

## 📊 Dashboard Admin & REST API

### 1. Dashboard Web
Truy cập `http://localhost:3000` đăng nhập thông qua Discord:
- Giám sát lượng Token AI tiêu thụ thời gian thực.
- Quản lý danh sách các Server, tùy chỉnh Prompt Hệ thống và AI Model từng Server.
- Xem nhật ký các cuộc trò chuyện và danh sách thành viên.

### 2. Swagger API Documentation
Truy cập `http://localhost:4000/api/docs` để xem tài liệu OpenAPI chuẩn hóa.

---

## 📄 License

Dự án phát triển theo giấy phép [MIT License](LICENSE).