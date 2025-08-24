---
description: Cursor rules for this Next.js + TypeScript + Tailwind project
globs: app/**/*.tsx, app/**/*.ts, components/**/*.tsx, lib/**/*.ts, types/**/*.ts, docs/**/*.md
---

# Cursor Rules — Next.js + TS + Tailwind (PokéBattle Arena)

**Goal:** Keep outputs aligned with the take‑home constraints. Prefer native Canvas 2D, strict TypeScript, and minimal dependencies.

## 1) Principles (Project‑specific)
- **App Router**, **TypeScript strict**, **Tailwind + shadcn/ui**.
- **Native Canvas 2D only** for the battle; **no Fabric / Konva / Chart.js**.
- **Client‑side fetch** for PokéAPI list + details (per spec); do **not** add server actions or SSR for this exercise.
- Keep code small and composable: helpers in `lib/`, domain types in `types/`.
- Return **only code** when asked for code. No prose in code responses.

## 2) Structure & Naming
- Route UI in `app/`, shared UI in `components/`, utilities in `lib/`, domain types in `types/`.
- Kebab‑case directories (e.g., `components/battle-canvas.tsx`).
- Use **Server Components by default**; mark client components explicitly with `"use client"`.

## 3) Components
- **Client components**: the canvas battle, any component with state/effects/event listeners.
- Wrap lazy/non‑critical UI with `dynamic(() => import(...), { ssr: false })` **only if needed**.
- Provide `Suspense` fallbacks where appropriate; add minimal `error.tsx`/`loading.tsx` only if used.

## 4) Data Fetching
- For this exercise: **fetch PokéAPI on the client** and handle **loading/error/empty** states.
- If using SWR/React Query, keep it light; otherwise use `fetch` + local state.
- Do not introduce server actions, external caches, or DB dependencies.

## 5) Performance
- Canvas: manage a single `requestAnimationFrame` loop; **run only during activity**.
- Use `ResizeObserver` + DPR scaling (`ctx.setTransform(DPR,0,0,DPR,0,0)`).
- Avoid unnecessary React re‑renders: use refs for canvas state; memoize expensive calcs.
- No extra global listeners; clean up in `useEffect`.

## 6) Accessibility & UX
- Buttons/inputs keyboard accessible (shadcn helps).
- Canvas has `aria-label`; provide friendly copy for empty/error states.

## 7) Styling
- Tailwind utilities + shadcn components (no custom CSS frameworks).
- Keep classes readable; factor repeated patterns into small components.

## 8) Types, Lint, Tests
- No `any`; prefer precise types. Helper functions are small and pure.
- Keep ESLint/Prettier clean.
- Optional tests: tiny Vitest unit tests for helpers (time‑boxed).

## 9) Guardrails (repeat in prompts)
- **Native Canvas 2D only** — no external canvas/chart libs.
- **Client fetch only** for PokéAPI in this app.
- **Strict TS**; code should compile without `// @ts-ignore`.
- **Return only code** when requested; otherwise keep responses concise.

## 10) Snippets to anchor outputs
```ts
// components/battle-canvas.tsx
"use client";
export type BattleCanvasProps = {
  left?: Pokemon; right?: Pokemon; onKo?: (w: "left"|"right") => void;
};
```
```ts
// lib/util/math.ts
export const clamp = (v:number, lo:number, hi:number) => Math.max(lo, Math.min(hi, v));
export const lerp  = (a:number, b:number, t:number) => a + (b - a) * t;
```
