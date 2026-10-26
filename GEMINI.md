## Project
Laundry Tag Scanner — a web app that scans garment care tags (ISO 3758 symbols)
and returns plain-language care instructions.


## Stack
- Backend: Bun (native TypeScript, no build step for dev) + Bun.serve for HTTP
- Frontend: React (TypeScript), Bun's native bundler for building — no separate
  Vite/webpack setup unless Bun's bundler proves insufficient
- Symbol detection: Gemini API (Flash model, free tier)
- Symbol → instruction mapping: static JSON lookup table (source of truth),
  typed with a Symbol interface
- Types: define shared types (e.g. DetectedSymbol, CareInstruction) in a
  single types.ts the frontend and backend both reference where possible

## Constraints
- Free tier only for now — no paid API usage. Stay within Gemini's free-tier
  rate limits (~15 RPM); do not add retry logic that silently burns quota.
- Keep MVP scope small: single image upload → symbol detection → instruction
  display. No auth, no multi-user features yet.

## Notes

## Code organization principles
- Single Responsibility: each file should have one clear job. Routes,
  business logic, and external service clients (Gemini, Supabase) must
  live in separate files, not all in server.ts.
- DRY: if the same logic (e.g. resolving detected symbols to instructions)
  is needed in more than one place, extract it into a shared function
  rather than duplicating it.
- Easier to change: avoid hardcoding values that are likely to change
  (model names, table names, bucket names) — centralize them as named
  constants in one config location.
- Backend structure to follow going forward:
  backend/
    server.ts    — HTTP server + route registration only
    routes/      — one file per route/resource
    services/    — external integrations (gemini.ts, supabase.ts)
    lib/         — shared business logic (e.g. symbol resolution)
