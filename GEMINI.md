## Project
Laundry Tag Scanner — a web app that scans garment care tags (ISO 3758 symbols)
and returns plain-language care instructions.


## Stack
- Backend: Bun (native TypeScript, no build step for dev) + Bun.serve for HTTP
- Frontend: TypeScript, browser camera capture via getUserMedia
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

