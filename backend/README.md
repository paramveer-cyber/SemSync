# SemSync — Backend

Node.js + Express 5 REST + SSE API. Drizzle ORM over Postgres (Neon serverless
driver).

Part of the [SemSync](../README.md) monorepo — see the root README for overall
architecture, core flows, and full API reference.

---

## Table of Contents

- [Stack](#stack)
- [Structure](#structure)
- [Request Lifecycle](#request-lifecycle)
- [Module Shape](#module-shape)
- [Achievements: Event-Driven Instead of CRUD](#achievements-event-driven-instead-of-crud)
- [Database](#database)
- [Getting Started](#getting-started)

---

## Stack

```
Node.js + Express 5           — ESM throughout ("type": "module")
Drizzle ORM                   — schema + queries
@neondatabase/serverless      — Postgres driver, WebSocket-based pooling
Zod                           — request validation
jsonwebtoken + bcryptjs       — JWT auth, password hashing where applicable
google-auth-library, googleapis — Google OAuth + Classroom token exchange
express-rate-limit            — per-route rate limiting
helmet                        — security headers
ws                            — SSE/WebSocket support
```

---

## Structure

```
src/
├── index.js                  app entry: middleware stack, route mounting
│
├── common/
│   ├── config/                env-driven config
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   ├── rateLimiter.js     one limiter per sensitive route
│   │   └── validate.js        zod schema → 400 on failure
│   ├── utils/
│   │   ├── api-error.js       typed error class
│   │   ├── dates.js
│   │   ├── hash.js
│   │   ├── tokenLogic.js      JWT sign/verify
│   │   └── xp.js               XP/level math
│   └── sse.js                 SSE client registry + push helpers
│
├── db/
│   ├── schema.js              all 11 Drizzle table definitions
│   ├── queries.js             shared cross-module queries
│   ├── gamification.js        XP/level/streak read+write helpers
│   └── index.js                Neon serverless connection
│
└── modules/
    ├── auth/          routes → controller → services → model
    ├── courses/        routes → controller → services → model
    ├── evals/           routes → controller → services → model
    ├── focus/            routes → controller → service → model/db
    ├── achievements/    routes → catalog / middleware → evaluator → service → queries
    └── events/           routes only (SSE fan-out)
```

---

## Request Lifecycle

```
  incoming request
        │
        ▼
  ┌───────────┐   ┌─────────────┐   ┌───────────────┐   ┌──────────┐
  │  helmet    │──►│ cors + cookie │──►│ authMiddleware  │──►│ rate     │
  │            │   │ parser        │   │ (JWT verify)    │   │ limiter  │
  └───────────┘   └─────────────┘   └───────────────┘   └────┬─────┘
                                                              │
                                                              ▼
                                                    ┌──────────────┐
                                                    │ validate()     │
                                                    │ (zod schema)   │
                                                    └──────┬───────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  controller    │
                                                    └──────┬───────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │   service      │  business logic
                                                    └──────┬───────┘  lives ONLY here
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  Drizzle query │
                                                    └──────┬───────┘
                                                           │
                                                           ▼
                                                       Postgres (Neon)
```

`/events/stream` skips the JWT-cookie middleware chain (it authenticates off a
query-string token instead, since `EventSource` can't set cookies cross-origin
the same way) and skips rate limiting on the stream connection itself.

---

## Module Shape

Standard CRUD-ish modules (`auth`, `courses`, `evals`, `focus`) are 4–5 files:

```
  <module>.routes.js       Express Router, wires middleware + validation
  <module>.controller.js   req/res handling, status codes, no business logic
  <module>.service(s).js   the actual logic — the only layer allowed to
                            contain business rules
  <module>.model.js        zod schemas for that module's request bodies
  <module>.db.js           (focus only) module-local query helpers,
                            where other modules put this in db/queries.js
```

---

## Achievements: Event-Driven Instead of CRUD

The achievements module doesn't fit the CRUD shape — it reacts to things
happening elsewhere in the app, so it's built around an event log instead:

```
  achievement.routes.js       GET /achievements/catalog only
  achievement.catalog.js      static list of all achievements + tiers
  achievement.definitions.js  threshold rules per achievement
  achievement.middleware.js   eventObserver() — imported into OTHER modules'
                                routes (focus, auth, etc.) to log an event
                                after a request succeeds
  achievement.evaluator.js    given a new event, checks whether any
                                achievement's threshold was just crossed
  achievement.service.js      writes unlocks + awards XP
  achievement.queries.js      reads for progress / unlocked state
```

```
  other module's route handler finishes
              │
              ▼
     eventObserver(slug, label, metaFn) runs
              │
              ▼
     insert row into `events` table
              │
              ▼
     achievement.evaluator checks thresholds
     against that user's event history
              │
      ┌───────┴───────┐
      ▼               ▼
  no unlock      unlock: insert into `user_achievements`,
                  award XP, pushAchievements() over SSE
```

Any route that should count toward an achievement wraps its handler with
`eventObserver(...)` from `achievement.middleware.js` — the achievements module
never needs to know about the internals of the module it's watching.

---

## Database

```
users
  │
  ├──< courses ──< evaluations
  ├──< events
  ├──1 user_stats
  ├──1 user_streaks
  ├──< user_achievements
  ├──< achievement_progress
  ├──< daily_goals
  └──1 timers
```

11 tables, one schema file (`src/db/schema.js`). Migrations are managed with
`drizzle-kit`:

```bash
npm run db:gen      # generate a migration from schema changes
npm run db:mig      # apply pending migrations
npm run db:push     # push schema directly (dev convenience, skips migration files)
```

---

## Getting Started

```bash
npm install
```

Create `.env` in `backend/` (see root README's
[Getting Started](../README.md#getting-started) for the required keys), then:

```bash
npx drizzle-kit push
npm run dev
```

`npm run dev` runs `node --watch index.js` — no nodemon dependency needed.
