# 🎓 SemSync — Academic Productivity Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-💚-brightgreen.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blueviolet.svg)](./CONTRIBUTING.md)
[![Made with React](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](#tech-stack)
[![Made with Express](https://img.shields.io/badge/Backend-Express%205-black.svg)](#tech-stack)

SemSync is a full-stack, open-source academic productivity tracker for students
— weighted-evaluation grade tracking, Google Classroom sync, a server-persisted
Focus Timer, a Kanban task board, a deadline calendar, and a full gamification
layer (XP, streaks, tiered achievements). Everything self-serve, single-tenant,
no org/admin layer.

Originally built for the IIIT Delhi context (hence the Classroom integration and
academic-calendar assumptions), but usable by anyone.

This is an open-source project. Forks, issues, and pull requests are welcome —
see [Contributing](#contributing).

---

## Table of Contents

- [Features](#features)
- [Monorepo Layout](#monorepo-layout)
- [System Architecture](#system-architecture)
- [Backend Module Shape](#backend-module-shape)
- [Core Flows](#core-flows)
- [Database Schema](#database-schema)
- [API Overview](#api-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [License](#license)

---

## Features

**Courses & Evaluations** Courses carry credits + a target grade. Each course
holds weighted evaluation items (quiz / exam / assignment / lab / project /
viva). Current grade and the required average on remaining evaluations to hit
the target are computed live.

**Google Classroom Sync** Google OAuth grants a read-only Classroom scope. The
token is stored server-side; the Classroom UI then talks to the Google Classroom
REST API directly from the browser using that token — the backend never proxies
Classroom data, it only custodies the token (connect / fetch / revoke).

**Focus Timer** Pomodoro-style timer whose state (`running` / `paused` / elapsed
seconds) lives in Postgres, not `localStorage` — survives a refresh or a closed
tab. Can be linked to a task or evaluation, or run untracked. Completion feeds
XP, streaks, and daily goals.

**Task Center** Kanban board for coursework and general tasks.

**Calendar** Month view merging evaluations, tasks, and synced Classroom
deadlines, colour-coded per course.

**Gamification** XP + levels, streaks with limited freezes, tiered achievements
evaluated off an internal event log, cinematic unlock reveals, daily goals with
XP rewards.

**Settings** Live theme (colour) and typography customisers — both write
straight to CSS custom properties on `document.documentElement` — plus reminder
preferences, account management, and data export.

**Auth** Google OAuth only. No separate password system. JWT access token +
rotating refresh token in `httpOnly` cookies.

---

## Monorepo Layout

```
semsync/
├── frontend/      React 19 + TypeScript SPA (Vite)
├── backend/       Node.js + Express 5 REST + SSE API
├── LICENSE
├── CONTRIBUTING.md
└── README.md      (this file)
```

Each package has its own README with package-specific detail:

- [`frontend/README.md`](./frontend/README.md)
- [`backend/README.md`](./backend/README.md)

---

## System Architecture

```
                         ┌──────────────────────────────┐
                         │           Browser              │
                         │   React 19 + TS SPA  (Vite)    │
                         └───────────────┬────────────────┘
                                         │
                    ┌────────────────────┼─────────────────────┐
                    │ HTTPS (JWT cookie) │                     │ direct call, user's
                    ▼                    │                     ▼ own Classroom token
      ┌──────────────────────────┐       │        ┌──────────────────────────────┐
      │       Express 5 API        │       │        │  classroom.googleapis.com     │
      │ ┌────────┬─────────────┐  │       │        │  (Google Classroom REST API)   │
      │ │ auth    │ courses     │  │       │        └──────────────────────────────┘
      │ │ evals   │ focus       │  │       │
      │ │ achieve │ events(SSE) │  │       │  SSE stream
      │ └────────┴─────────────┘  │       │  (live achievement pushes)
      │  helmet · rate-limit ·     │◄──────┘
      │  zod validation · JWT      │
      └──────────────┬─────────────┘
                     │ Drizzle ORM
                     ▼
      ┌──────────────────────────┐
      │   Postgres (Neon)          │
      │   serverless driver        │
      └──────────────────────────┘
```

The backend never touches Classroom data directly — it only stores the Classroom
OAuth token for the user. The frontend fetches Classroom courses, coursework,
and grades straight from Google using that token, then persists whatever the
user chooses to sync into `courses` / `evaluations` via the normal courses API.

---

## Backend Module Shape

Every domain module (`auth`, `courses`, `evals`, `focus`) follows the same
4-layer shape:

```
   HTTP request
        │
        ▼
  ┌───────────┐     ┌────────────┐     ┌───────────┐     ┌───────────────┐
  │  routes    │ ──► │ controller  │ ──► │  service   │ ──► │  db / model     │
  │ (wiring,   │     │ (req/res,   │     │ (business  │     │ (Drizzle query, │
  │  validate, │     │  status     │     │  logic)    │     │  zod shapes)    │
  │  rate-lim) │     │  codes)     │     │            │     │                 │
  └───────────┘     └────────────┘     └───────────┘     └───────────────┘
```

`achievements` extends this with a catalog + evaluator, since it's driven by
events rather than direct CRUD:

```
  routes ──► catalog.js (static achievement definitions, GET /catalog)
         └─► middleware.js  ──►  evaluator.js  ──►  service.js  ──►  queries.js
              (eventObserver     (checks thresholds   (unlock +      (achievement /
               hooked into        against event log)   XP write)      progress reads)
               other modules'
               routes)
```

`events` is intentionally thin — just the SSE stream (`/events/stream`) plus a
dev-only cosmetic preview endpoint. No controller/service layer needed for a
pure fan-out.

---

## Core Flows

### Google OAuth login

```
 User          Frontend            Backend             Google
  │                │                   │                   │
  │  Click Login   │                   │                   │
  ├───────────────►│                   │                   │
  │                │  redirect to      │                   │
  │                │  Google consent   │                   │
  │                ├──────────────────────────────────────►│
  │                │                   │   auth code        │
  │                │◄──────────────────────────────────────┤
  │                │  POST /auth/google (code)              │
  │                ├──────────────────►│                   │
  │                │                   │  exchange code    │
  │                │                   ├──────────────────►│
  │                │                   │  access+refresh   │
  │                │                   │◄──────────────────┤
  │                │                   │  upsert user       │
  │                │                   │  (Drizzle→Neon)     │
  │                │  set JWT cookies  │                   │
  │                │◄──────────────────┤                   │
  │  logged in     │                   │                   │
  │◄───────────────┤                   │                   │
```

### Classroom sync (token-custody, not proxy)

```
 User        Frontend                 Backend              Google Classroom
  │             │                         │                       │
  │ link acct   │                         │                       │
  ├────────────►│  consent (Classroom     │                       │
  │             │  read-only scope)       │                       │
  │             ├────────────────────────────────────────────────►│
  │             │◄────────────────────────────────────────────────┤
  │             │  POST /auth/classroom-connect (authCode)         │
  │             ├────────────────────────►│                       │
  │             │                          │  exchange + store     │
  │             │                          │  classroom token       │
  │             │                          │  (Drizzle→Neon)         │
  │             │  linked                  │                       │
  │             │◄─────────────────────────┤                       │
  │             │                                                  │
  │             │  GET /auth/classroom-token                        │
  │             ├────────────────────────►│                       │
  │             │  token                   │                       │
  │             │◄─────────────────────────┤                       │
  │             │                                                  │
  │             │  GET classroom.googleapis.com/v1/courses         │
  │             ├──────────────────────────────────────────────────►│
  │             │  courses / coursework / grades                    │
  │             │◄──────────────────────────────────────────────────┤
  │             │  user picks what to sync                          │
  │             │  → POST /courses, /courses/:id/evaluations         │
  │             ├────────────────────────►│  writes to Postgres      │
```

### Focus Timer (server-persisted)

```
 Frontend                        Backend                     Postgres
    │                               │                             │
    │  POST /focus/start            │                             │
    ├──────────────────────────────►│                             │
    │                                │  insert into `timers`        │
    │                                │  (status: running)           │
    │                                ├────────────────────────────►│
    │  timer state (from DB)         │◄────────────────────────────┤
    │◄───────────────────────────────┤                             │
    │                                │                             │
    │  … tab closed / refreshed …    │                             │
    │                                │                             │
    │  GET /focus/  (timerGet)       │                             │
    ├──────────────────────────────►│  read `timers` row            │
    │  resumes exactly where it left │  compute elapsed from         │
    │  off, no client-side drift     │  startedAt/pausedElapsed       │
    │◄───────────────────────────────┤                             │
    │                                │                             │
    │  POST /focus/end               │                             │
    ├──────────────────────────────►│  update `user_stats`,         │
    │                                │  `user_streaks`, insert       │
    │                                │  `events`, run achievement    │
    │                                │  evaluator                    │
    │  updated XP / streak / any     │                             │
    │  newly unlocked achievements   │                             │
    │◄───────────────────────────────┤                             │
```

### Achievement unlock

```
  tracked action (timer.end, task.created, classroom.linked, ...)
                          │
                          ▼
              eventObserver middleware fires
              on the originating route
                          │
                          ▼
                 write row to `events`
                          │
                          ▼
           achievement.evaluator checks thresholds
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
      progress unchanged      threshold crossed
              │                       │
              ▼                       ▼
        no-op, done          insert `user_achievements`
                              (+ tier, + xpAwarded)
                                      │
                                      ▼
                        pushAchievements() → SSE stream
                                      │
                                      ▼
                   frontend receives event on /events/stream
                   → AchievementContext updates
                   → CinematicUnlock reveal plays
```

---

## Database Schema

```
users
  │
  ├──< courses ──< evaluations
  │
  ├──1 user_stats               (XP, level, minutes)
  ├──1 user_streaks             (current/longest streak, freezes)
  ├──< user_achievements        (unlocked, tier, xpAwarded)
  ├──< achievement_progress     (progress toward locked achievements)
  ├──< daily_goals              (per-day goal + xpReward)
  ├──1 timers                   (live focus-timer state, one active per user)
  └──< events                   (generic tracked-action log, feeds achievements)
```

11 tables total, all in one Drizzle schema (`backend/src/db/schema.js`),
Postgres via Neon's serverless driver.

---

## API Overview

| Domain           | Examples                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**         | `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/classroom-connect`, `GET/DELETE /auth/classroom-token` |
| **Courses**      | `GET/POST /courses`, `DELETE /courses/:id`                                                                                         |
| **Evaluations**  | `GET/POST /courses/:courseId/evaluations`, `PUT/DELETE /evaluations/:id`                                                           |
| **Focus**        | `GET /focus`, `POST /focus/start`, `/pause`, `/resume`, `/extend`, `/sync`, `/end`, `POST /focus/track/page`, `/focus/track/task`  |
| **Achievements** | `GET /achievements/catalog`                                                                                                        |
| **Events**       | `GET /events/stream` (SSE), `POST /events/experience-achievement` (dev preview)                                                    |

Every route except `/events/stream` and auth's own login/refresh endpoints sits
behind JWT auth + `express-rate-limit`. Every write path is `zod`-validated
before it reaches the service layer.

---

## Tech Stack

| Layer        | Tech                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| Frontend     | React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7                         |
| Charts       | MUI X Charts / X Charts Pro (+ Emotion, required by MUI)                            |
| Animation    | `motion` (Framer Motion), gated behind a reduced-motion preference                  |
| State        | React Context API (no Redux)                                                        |
| Backend      | Node.js, Express 5                                                                  |
| ORM / DB     | Drizzle ORM, Postgres (Neon serverless driver)                                      |
| Validation   | Zod                                                                                 |
| Auth         | Google OAuth (`google-auth-library`, `googleapis`), JWT (access + rotating refresh) |
| Live updates | Server-Sent Events                                                                  |
| Security     | Helmet, `express-rate-limit`                                                        |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Postgres database (e.g. a free [Neon](https://neon.tech) project)
- A Google Cloud OAuth Client ID with the Classroom read-only scope enabled

### 1. Clone and install

```bash
git clone https://github.com/your-username/semsync.git
cd semsync
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

`backend/.env`

```
DATABASE_URL=postgres://...
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

`frontend/.env`

```
VITE_BASE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Run migrations and start both apps

```bash
cd backend && npx drizzle-kit push && npm run dev
cd frontend && npm run dev
```

See the package READMEs for more detail:
[`backend/README.md`](./backend/README.md),
[`frontend/README.md`](./frontend/README.md).

---

## Contributing

SemSync is open source and welcomes issues, forks, and pull requests. Read
[`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a PR — short version:

- Follow the existing 4-layer pattern per backend module (routes → controller →
  service → db)
- No business logic outside the service layer
- Match the existing frontend context/lib conventions rather than introducing
  new patterns
- Open an issue first for anything non-trivial so the approach can be agreed
  before you write code

---

## License

MIT — see [LICENSE](./LICENSE). Free to use, modify, and distribute, including
commercially, with attribution.
