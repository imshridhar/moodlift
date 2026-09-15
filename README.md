# 🌟 MoodLift — Daily Emotional Well-being & Motivation Platform

> Track your moods, journal your thoughts, discover patterns, and build emotional resilience — one day at a time.

![MoodLift](https://img.shields.io/badge/MoodLift-Production%20Ready-f2751a?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)

---

## 🏗️ Architecture

```
moodlift/
├── backend/                 # Node.js / Express API
│   ├── src/
│   │   ├── config/          # Database & Redis config
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Data access layer
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # External services
│   │   ├── utils/           # JWT, logger, error classes
│   │   ├── database/        # Migrations & seeds
│   │   └── server.js        # App entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/      # Reusable UI & feature components
│   │   ├── pages/           # Route-level page components
│   │   ├── services/        # Axios API client
│   │   ├── store/           # Zustand state management
│   │   └── main.tsx         # App entry point
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml       # Full stack orchestration
├── nginx.conf               # Reverse proxy configuration
└── .github/workflows/       # CI/CD pipeline
```

## 🚀 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 20 + Express** | REST API server |
| **PostgreSQL 16** | Primary database |
| **Redis 7** | Caching, session blacklist |
| **JWT** | Stateless authentication |
| **bcryptjs** | Password hashing |
| **Winston** | Structured logging |
| **express-validator** | Request validation |
| **Helmet + CORS** | Security headers |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **TanStack Query** | Server state management |
| **Zustand** | Client state (auth) |
| **Recharts** | Data visualisation |
| **React Hook Form + Zod** | Form management |

---

## ✨ Features

- **🎭 Mood Check-in** — 10-point scale with emoji, energy, anxiety, sleep tracking
- **📔 Journal** — Rich text entries, daily prompts, tags, word count
- **📊 Insights** — Line charts, bar charts, radar by day-of-week, time-of-day patterns
- **🏆 Achievements** — Gamified milestones with rarity tiers
- **🔥 Streaks** — Consecutive daily check-in tracking
- **💬 Daily Quotes** — Mood-matched motivational quotes
- **🔔 Notifications** — In-app notification center
- **🌙 Dark Mode** — Full light/dark/system theme support
- **🔐 Secure Auth** — JWT access + refresh token rotation, token blacklisting

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7
- Docker (optional)

### Quick Start with Docker

```bash
# Clone & start all services
git clone https://github.com/your-org/moodlift
cd moodlift

# Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your secrets

# Start everything
docker compose up -d

# Run database migrations
docker compose exec backend node src/database/migrate.js

# App running at:
# Frontend: http://localhost
# API:      http://localhost:5000/api/v1
# Health:   http://localhost:5000/health
```

### Manual Setup

```bash
# 1. Backend
cd backend
cp .env.example .env   # configure your .env
npm install
node src/database/migrate.js   # run migrations
npm run dev            # starts on :5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev            # starts on :5173
```

---

## 🔑 API Reference

### Authentication
```
POST   /api/v1/auth/register      Register new user
POST   /api/v1/auth/login         Login
POST   /api/v1/auth/logout        Logout (blacklist token)
POST   /api/v1/auth/refresh       Refresh access token
GET    /api/v1/auth/me            Get current user
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

### Moods
```
POST   /api/v1/moods              Log mood entry
GET    /api/v1/moods              Mood history (paginated)
GET    /api/v1/moods/today        Today's entry
GET    /api/v1/moods/stats/summary   Statistics & trends
GET    /api/v1/moods/:id          Single entry
PUT    /api/v1/moods/:id          Update entry
DELETE /api/v1/moods/:id          Delete entry
```

### Journal
```
GET    /api/v1/journal            All entries (search, tag filter)
POST   /api/v1/journal            Create entry
GET    /api/v1/journal/:id        Single entry
PUT    /api/v1/journal/:id        Update entry
DELETE /api/v1/journal/:id        Delete entry
GET    /api/v1/journal/prompts/daily  Daily writing prompt
```

### Insights & Analytics
```
GET    /api/v1/insights           AI-generated insights
GET    /api/v1/analytics/overview Full analytics overview
```

---

## 🔒 Security

- **Helmet.js** — HTTP security headers
- **CORS** — Whitelist-based origin control
- **Rate limiting** — 100 req/15min global, 10 req/15min for auth
- **JWT rotation** — Short-lived access tokens (7d) + refresh tokens (30d)
- **Token blacklisting** — Redis-backed logout invalidation
- **Password hashing** — bcrypt with cost factor 12
- **SQL injection** — Parameterised queries throughout
- **Input validation** — express-validator on all endpoints

---

## 🚢 Production Deployment

```bash
# Set production secrets
export JWT_SECRET="your-256-bit-secret"
export JWT_REFRESH_SECRET="your-other-secret"
export DB_PASSWORD="strong-db-password"
export REDIS_PASSWORD="strong-redis-password"

# Deploy
docker compose up -d --build

# Check health
curl http://your-domain.com/health
```

### Environment Variables (Required for Production)
| Variable | Description |
|---|---|
| `JWT_SECRET` | 256-bit random string |
| `JWT_REFRESH_SECRET` | Different 256-bit random string |
| `DB_PASSWORD` | PostgreSQL password |
| `REDIS_PASSWORD` | Redis password |
| `SMTP_*` | Email configuration |
| `FRONTEND_URL` | Your production frontend URL |

---

## 📄 License

MIT © MoodLift
