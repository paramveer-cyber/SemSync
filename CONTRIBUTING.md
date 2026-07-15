# Contributing to SemSync

Thanks for considering a contribution — SemSync is open source and issues,
forks, and pull requests are genuinely welcome.

## Before You Start

For anything non-trivial (new feature, schema change, refactor spanning multiple
modules), open an issue first describing the approach. Saves you from writing a
PR that gets re-routed. Small fixes (typos, obvious bugs, docs) can go straight
to a PR.

## Project Conventions

These are load-bearing, not stylistic preference — please match them:

- **Backend**: every module follows `routes → controller → service → db/model`.
  Business logic lives in the service layer only — controllers stay thin
  (req/res + status codes), routes stay wiring-only (middleware + validation).
- **Achievements**: don't add direct calls into the achievements module from
  business logic. Use `eventObserver()` in the route file instead, and let the
  evaluator react to the event log.
- **Frontend**: match the existing Context pattern (preset object → CSS custom
  properties → `localStorage`) if you're adding another customisation surface.
  Don't introduce a new state-management library — Context is the whole app's
  approach, intentionally.
- **Descriptive variable names**, spelled out — no single-letter names outside
  trivial loop indices.
- **KISS (Keep it simple stupid) / DRY (Do not repeat yourself).** Don't add
  abstraction layers, config options, or generalised utilities for a single call
  site. Solve the problem in front of you.

## Setting Up

See the root [README](./README.md#getting-started), or the package-specific
[`backend/README.md`](./backend/README.md) and
[`frontend/README.md`](./frontend/README.md).

## Pull Requests

- Keep PRs scoped to one change — easier to review, easier to revert if
  something's wrong.
- Describe _what_ changed and _why_, not just what files touched.
- If you touched the DB schema, include the generated migration
  (`npm run db:gen` in `backend/`), don't hand-edit migration files.

## Reporting Bugs / Requesting Features

Open a GitHub issue. Bugs: steps to reproduce, expected vs actual behaviour.
Features: what problem it solves, not just what it should do.

## Code of Conduct

Be respectful, be constructive, assume good faith. Disagreements about approach
are fine and expected, personal attacks aren't.

Thank You.
