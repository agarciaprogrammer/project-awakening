# PROJECT AWAKENING

A personal fitness RPG tracker (PWA). Calisthenics + treadmill sessions earn XP, level up an 8‑bit hero, and push you down a linear world map. Everything lives in `localStorage` — no backend, no accounts.

```bash
npm install
npm run dev        # http://localhost:5173 (also exposed on your LAN for iPhone testing)
npm run build      # typecheck + static build to dist/ (Vercel-ready)
npm test           # progression / reducer unit tests
```

## Layout
- `src/domain/` — types, XP & level rules (`progression.ts`), stats, missions, zones, unlocks, exercise catalog. Pure functions.
- `src/storage/storage.ts` — the only `localStorage` access: versioned key, validation, backup import/export.
- `src/state/` — reducer (all state transitions) + React context.
- `src/screens/`, `src/components/` — UI; pixel art is drawn from character grids in SVG.

## Rules
- Strength XP = `min(50, 15 + 5 × exercises with ≥1 completed set)`; 0 if nothing completed.
- Treadmill XP = `min(50, floor(seconds / 60))`.
- Level `n → n+1` needs `round(40 + 12 × √(n − 1))` XP (no cap). 15 designed zones × 10 levels = LV 150, then endless "Eco" cycles. Progress is always derived from saved sessions.
- Atributos (cada uno con su propio nivel, costo del nivel n → n+1 = paso × n): Fuerza = series completadas (paso 10), Resistencia = minutos de cardio (paso 30), Constancia = días distintos con sesión (paso 3).
- Rest days (default Mon & Wed) never cost anything.

`npm run icons` regenerates the PNG app icons.
