# SemSync — Frontend

React 19 + TypeScript SPA, built with Vite, styled with Tailwind CSS v4.

Part of the [SemSync](../README.md) monorepo — see the root README for overall
architecture, core flows, and API reference.

---

## Table of Contents

- [Stack](#stack)
- [Structure](#structure)
- [Context Layer](#context-layer)
- [Styling Approach](#styling-approach)
- [Data Flow](#data-flow)
- [Getting Started](#getting-started)

---

## Stack

```
React 19 + TypeScript
Vite                      — dev server / bundler
React Router 7            — routing
Tailwind CSS v4           — CSS-native @theme config, not tailwind.config.js
MUI X Charts / Charts Pro — progress + XP visualisations (+ Emotion, required by MUI)
motion (Framer Motion)    — micro-interactions, achievement reveals
lucide-react              — icon set
react-fast-marquee        — ticker component
@react-oauth/google       — Google login button
```

State management is plain React Context — no Redux, no Zustand.

---

## Structure

```
src/
├── pages/                 one file per route, mostly self-contained
│   ├── Dashboard.tsx
│   ├── CoursesPage.tsx / CoursePage.tsx
│   ├── ClassroomPage.tsx
│   ├── FocusTimerPage.tsx
│   ├── TaskCenterPage.tsx
│   ├── CalendarPage.tsx
│   ├── ProgressPage.tsx
│   ├── SettingsPage.tsx
│   └── LoginPage / LandingPage / AboutPage / LegalPage / UserPage
│
├── components/
│   ├── Sidebar.tsx / Header.tsx / Layout.tsx      shared shell
│   ├── XPBar.tsx / StreakDisplay.tsx / DailyGoals.tsx
│   ├── Ticker.tsx / ToastStack.tsx / LoadingBar.tsx / InfoTooltip.tsx
│   ├── OnboardingTutorial.tsx / SessionComplete.tsx
│   ├── modals/          AddCourseModal, AddEvalModal, EditEvalModal,
│   │                     SyncCourseModal, ConfirmModal, Modal (base)
│   ├── achievements/    AchievementToastStack, CinematicUnlock
│   └── settings/        AppearanceTab, DataTab, InfoTab, PreferencesTab
│
├── context/              6 providers, see below
├── lib/                  api client, caching, sound, token storage
├── data/                 static content (themes, onboarding copy, tooltips)
├── hooks/                useDelayedSkeleton.ts
└── main.tsx
```

Pages own most of their logic directly rather than delegating to custom hooks —
the `hooks/` folder is intentionally thin. Shared UI beyond the Sidebar / Header
/ Layout shell is pulled out only where it's reused across more than one page.

---

## Context Layer

```
        ┌────────────────┐
        │  AuthContext     │  user session, login/logout, token refresh
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │  ThemeContext      │  colour preset → CSS custom properties
        └────────┬─────────┘  → document.documentElement → localStorage
                 │
        ┌────────▼─────────┐
        │  TypographyContext │  font preset → CSS custom properties
        └────────┬─────────┘  → document.documentElement → localStorage
                 │
        ┌────────▼─────────┐
        │ AnimationPreferenceContext │  reduced-motion toggle,
        └────────┬─────────┘         read by every `motion` animation
                 │
        ┌────────▼─────────┐
        │ NotificationContext │  toast queue
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │ AchievementContext │  subscribes to /events/stream (SSE),
        └──────────────────┘   drives AchievementToastStack + CinematicUnlock
```

Theme and Typography follow an identical pattern: a preset object is mapped to
CSS variables, written onto `document.documentElement`, then persisted to
`localStorage` so the choice survives a reload without a round trip to the
backend.

---

## Styling Approach

```
index.css
  └── Tailwind v4 @theme block
        defines --color-*, --font-*, --text-* as CSS variables
        (these are the same variables ThemeContext / TypographyContext
         overwrite at runtime for live customisation)

Per-page styling
  └── inline style={{}} objects are the dominant method,
      Tailwind utility classes used alongside, not instead of
```

This is a deliberate trade-off: inline styles make each page trivially
self-contained at the cost of some duplication across pages. If you're adding a
new page, follow the existing pages' pattern rather than introducing a new
styling convention.

---

## Data Flow

```
   Page component
        │
        ▼
   lib/api.js  ─────────►  Express backend (JWT cookie auth)
        │
        ▼
   lib/dataService.ts  ── shapes/aggregates API responses for pages
        │
        ▼
   lib/sessionCache.ts ── short-lived in-memory cache to avoid
                            refetching on every navigation
```

`lib/api.js` and `lib/tokenStore.js` are plain JS, not TypeScript — everything
else in `src/` is typed. This is a known gap, not an intentional split; PRs
converting them to `.ts` with proper request/response types are welcome.

---

## Getting Started

```bash
npm install
```

Create `.env` in `frontend/` (see root README's
[Getting Started](../README.md#getting-started) for the required keys), then:

```bash
npm run dev
```

```
npm run dev        vite dev server
npm run build       production build
npm run preview     preview the production build locally
```
