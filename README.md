<p align="center">
  <img src="assets/logo.png" alt="Filmly Logo" width="120" />
</p>

<h1 align="center">Filmly</h1>

<p align="center">
  <b>Curate Your Cinema</b> — A social film discovery platform for cinephiles to track, review, discuss, and discover movies.
</p>

<p align="center">
  <a href="https://filmlyweb.vercel.app">🌐 Live Demo</a> &nbsp;•&nbsp;
  <a href="#features">Features</a> &nbsp;•&nbsp;
  <a href="#tech-stack">Tech Stack</a> &nbsp;•&nbsp;
  <a href="#getting-started">Getting Started</a>
</p>

---

## ✨ Features

### 🎬 Film Discovery
- **Trending & Today's Picks** — Curated homepage with a hero spotlight carousel, trending this week, and daily picks powered by TMDB
- **Film Details** — Rich film pages with poster galleries, backdrops, logos, cast & crew info, and metadata from TMDB + OMDB
- **Oscar Badge** — Films that have won or been nominated for Academy Awards are automatically tagged with an Oscar badge via a fast-lookup dataset
- **Person Pages** — Actor and director profiles with biographies, social links, and full filmographies
- **Search** — Global film search powered by TMDB, plus user search to find fellow cinephiles

### ⭐ Reviews & Ratings
- **Write Reviews** — Detailed reviews with star ratings, spoiler flags, and rewatch indicators
- **Review Versioning** — Full edit history so you can track how your opinions evolve
- **Likes & Comments** — Like and discuss reviews from other users
- **Reporting** — Report inappropriate reviews for moderation

### 📒 Diary
- **Mood-Aware Logging** — Log every movie viewing with 10 mood options (contemplative, joyful, melancholic, energized, curious, peaceful, anxious, inspired, nostalgic, thrilled), each with its own emoji and color theme
- **Viewing Context** — Record where you watched (home, cinema, etc.), the format (IMAX, 4K, streaming, Blu-ray), and who you watched with
- **Vibes & Notes** — Tag viewings with custom vibes (cozy, date night, solo marathon) and add personal diary notes
- **Privacy Controls** — Mark entries as private and optionally link them to your review

### 📋 Collaborative Lists
- **Create & Curate** — Build personal, collaborative, or template-based film lists with descriptions, tags, and custom cover images
- **Collaboration** — Invite contributors with role-based access (Owner, Editor, Contributor, Viewer) with invite accept/decline flows
- **Social Engagement** — Like, save, and share lists; trending and popularity scores surface the best lists
- **Ranked Lists** — Toggle ranked mode for ordered lists with drag-and-drop reordering
- **Privacy Modes** — Public, unlisted, or private visibility settings
- **Activity Feed** — Full activity history showing who added/removed films, title changes, and contributor updates

### 🔖 Watchlist
- Personal watchlist to save films you want to watch, with add/remove from any film page

### 💬 Real-Time Film Chat
- **Live Discussion Rooms** — Every film has a real-time chat room powered by Supabase Realtime broadcast channels
- **Rich Messaging** — Edit messages, react with emojis, mark messages as spoilers
- **Online Presence** — See who else is online discussing the same film
- **Moderation** — User banning system to keep discussions healthy

### 👥 Social
- **Follow System** — Follow other users to stay updated on their activity
- **User Profiles** — Customizable profiles with avatar, cover image, bio, location, and social links (Instagram, Twitter, website)
- **Privacy Settings** — Toggle profile/review visibility for private accounts
- **Notifications** — Real-time notification bell for follows, review likes, comments, list invites, and more

### 🔐 Authentication
- **JWT Auth** — Secure access + refresh token authentication with configurable TTLs
- **Password Reset** — Email-based password reset flow via Brevo with time-limited codes
- **Account Settings** — Update profile, change password, and manage privacy from settings page

---

## 🛠️ Tech Stack

### Architecture
| Layer | Technology |
|---|---|
| **Monorepo** | [Turborepo](https://turbo.build) + [pnpm](https://pnpm.io) workspaces |
| **Frontend** | [React 19](https://react.dev) + [Vite 7](https://vite.dev) + [TypeScript](https://www.typescriptlang.org) |
| **Backend** | [Express 5](https://expressjs.com) + [TypeScript](https://www.typescriptlang.org) |
| **Database** | [PostgreSQL 16](https://www.postgresql.org) via [Prisma ORM](https://www.prisma.io) |
| **Realtime** | [Supabase](https://supabase.com) (Realtime broadcast, storage, presence) |
| **Caching** | [Redis](https://redis.io) via [ioredis](https://github.com/redis/ioredis) |
| **Deployment** | [Vercel](https://vercel.com) (frontend & API) |

### Frontend
- **Styling** — Tailwind CSS 4 with custom dark theme (glassmorphism, amber accents)
- **State** — [Zustand](https://zustand.docs.pmnd.rs) for auth, chat, and list stores
- **Data Fetching** — [TanStack React Query](https://tanstack.com/query) + [Axios](https://axios-http.com)
- **Forms** — React Hook Form + Zod validation
- **Routing** — React Router 7 with lazy-loaded pages
- **UI** — Radix UI primitives (Dialog, Dropdown), Lucide icons, Recharts for data viz
- **Fonts** — Google Fonts (Outfit)

### Backend
- **Security** — Helmet, CORS, rate limiting (read + write tiers)
- **Auth** — JWT (access + refresh tokens), bcryptjs password hashing
- **Validation** — express-validator for request validation
- **File Uploads** — Multer + Supabase Storage (avatars, cover images)
- **Email** — Brevo (Sendinblue) transactional email for password resets
- **External APIs** — TMDB (films, people, trending, search), OMDB (IMDb ratings)
- **Logging** — Morgan HTTP request logger

---

## 📂 Project Structure

```
filmly/
├── apps/
│   ├── api/                    # Express API server
│   │   ├── prisma/             # Schema, migrations, seed
│   │   └── src/
│   │       ├── controllers/    # Request handlers
│   │       ├── services/       # Business logic layer
│   │       ├── routes/         # API route definitions
│   │       ├── middleware/     # Auth & error middleware
│   │       ├── config/         # App configuration
│   │       └── utils/          # Helpers
│   └── web/                    # React SPA
│       └── src/
│           ├── components/     # Reusable UI components
│           │   ├── chat/       # Real-time chat components
│           │   ├── diary/      # Diary entry & mood selector
│           │   ├── film/       # Film cards, carousels, galleries
│           │   ├── layout/     # Header, sidebar, notifications
│           │   ├── lists/      # List management components
│           │   ├── review/     # Review cards & forms
│           │   └── user/       # Profile & settings components
│           ├── pages/          # Route-level page components
│           ├── services/       # API client & service layer
│           ├── stores/         # Zustand state stores
│           ├── hooks/          # Custom React hooks
│           └── constants/      # Mood configs, etc.
├── packages/
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Shared utilities
├── docker-compose.yml          # Local PostgreSQL setup
├── turbo.json                  # Turborepo task config
└── pnpm-workspace.yaml         # Workspace definitions
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- [pnpm](https://pnpm.io) ≥ 9
- [Docker](https://www.docker.com/) (for local PostgreSQL)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/filmly.git
cd filmly
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start the Database

```bash
docker-compose up -d
```

This spins up a PostgreSQL 16 instance on port `5432` with credentials:
- **User:** `filmly`
- **Password:** `filmly_password`
- **Database:** `filmly`

### 4. Configure Environment Variables

#### API (`apps/api/.env`)

Copy the example and fill in your keys:

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT signing |
| `TMDB_API_KEY` | ✅ | [TMDB API](https://www.themoviedb.org/settings/api) key |
| `PORT` | | Server port (default: `4000`) |
| `REDIS_URL` | | Redis connection URL |
| `OMDB_API_KEY` | | [OMDB API](https://www.omdbapi.com/apikey.aspx) key for IMDb ratings |
| `SUPABASE_URL` | | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | | Supabase service role key (for chat & storage) |
| `CLOUDINARY_CLOUD_NAME` | | Cloudinary config (if using) |
| `BREVO_API_KEY` | | Brevo API key for password reset emails |
| `BREVO_SENDER_EMAIL` | | Sender email for password resets |

#### Web (`apps/web/.env`)

```bash
cp apps/web/.env.example apps/web/.env
```

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API URL (default: `http://localhost:4000`) |
| `VITE_SUPABASE_URL` | | Supabase project URL (for real-time chat) |
| `VITE_SUPABASE_ANON_KEY` | | Supabase anonymous key |

### 5. Run Database Migrations & Seed

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed
```

### 6. Start Development Servers

From the root directory:

```bash
# Start both API and Web concurrently
pnpm --filter api dev &
pnpm --filter web dev
```

Or run individually:

```bash
# API (http://localhost:4000)
cd apps/api && pnpm dev

# Web (http://localhost:5173)
cd apps/web && pnpm dev
```

---

## 🗃️ Database

Filmly uses **Prisma ORM** with PostgreSQL. The schema includes 20+ models:

| Model | Description |
|---|---|
| `User` | Accounts with profiles, social links, privacy settings |
| `Film` | Cached TMDB film data with posters, backdrops, logos |
| `Person` | Actor/director profiles with biographies |
| `FilmCredit` | Cast & crew relationships |
| `Review` | User reviews with ratings, spoiler flags |
| `ReviewVersion` | Edit history for reviews |
| `ReviewLike` / `ReviewComment` | Social engagement on reviews |
| `Rating` | Standalone star ratings |
| `Watchlist` / `WatchlistItem` | Personal watchlists |
| `DiaryEntry` | Mood-based viewing diary with vibes and context |
| `List` / `ListFilm` | Collaborative film lists |
| `ListContributor` | Role-based list collaboration |
| `ListLike` / `ListSave` | List social engagement |
| `ListActivity` / `ListView` | Activity tracking & analytics |
| `Follow` | User follow relationships |
| `Notification` | In-app notification system |
| `RefreshToken` | JWT refresh token management |
| `PasswordResetCode` | Email-based password reset flow |

### Useful Prisma Commands

```bash
pnpm prisma studio       # Visual database browser
pnpm prisma migrate dev   # Run pending migrations
pnpm prisma db seed       # Seed initial data
pnpm prisma generate      # Regenerate Prisma client
```

---

## 🌐 Deployment

The app is deployed on **Vercel**:

- **Frontend**: [filmlyweb.vercel.app](https://filmlyweb.vercel.app)
- **API**: Deployed as a Vercel serverless function

Both `apps/api` and `apps/web` include `vercel.json` configurations for seamless deployment.

---

## 📜 API Overview

All API routes are prefixed with `/api`. Key endpoints:

| Route | Description |
|---|---|
| `POST /api/auth/signup` | Register a new account |
| `POST /api/auth/login` | Login with email & password |
| `GET /api/films/:id` | Get film details |
| `GET /api/films/search?q=` | Search films via TMDB |
| `POST /api/reviews` | Create or update a review |
| `GET /api/reviews/film/:id` | Get reviews for a film |
| `POST /api/ratings` | Rate a film |
| `GET /api/watchlist/default` | Get user's watchlist |
| `POST /api/diary` | Create a diary entry |
| `GET /api/lists` | Browse public lists |
| `POST /api/lists` | Create a new list |
| `GET /api/users/:username` | Get user profile |
| `GET /api/notifications` | Get user notifications |
| `GET /health` | API health check |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

<p align="center">
  Made with ❤️ for cinema lovers
</p>
