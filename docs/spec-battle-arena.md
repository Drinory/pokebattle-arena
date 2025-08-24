# PokéBattle Arena — Ultimate Spec & Canvas Guide

> **Purpose**
> Build a small Next.js web app that showcases:
>
> * Native **HTML `<canvas>`** mastery (render loop, interactivity, responsiveness)
> * Solid FE architecture (typed API layer, UI states, clean structure)
> * A clear **AI‑assisted workflow** (Cursor/Claude sessions with validation notes)
>
> **Time‑box:** ~8 hours total (see Milestones)

---

## 0) Cursor Rules (read first)

* Use **native Canvas 2D API** for the battle (no Fabric/Konva/Chart libs).
* TypeScript **strict**; avoid `any`. Prefer small pure helpers (`clamp`, `lerp`, `qbezier`).
* Performance first: run `requestAnimationFrame` **only** when animating or when hover state changes.
* Use shadcn/ui components for UI (buttons, inputs, skeletons, alerts, toasts).
* If you propose a dependency, **stop and ask** (or omit).
* Prefer deterministic, small functions over big classes. Keep modules focused.

---

## 1) Summary (what we’re building)

An interactive **mini‑battle** between two Pokémon:

* **Left vs Right** sprites face off on a native `<canvas>`
* **Idle animation** (gentle sine‑bounce)
* **Attack** action: projectile (type‑styled) → **hit detection** → **shake‑on‑hit** → **HP bar decrement** → **KO** state
* **Hover tooltips** over HP/stat bars
* **Responsive** to container size and **high‑DPR** aware

Outside the canvas:

* Pokémon **list/search** with client pagination
* Choose **Attacker/Defender** to load into the canvas
* One **Attack** button (shadcn/ui) to initiate the animation
* Loading/empty/error states done tastefully (skeletons/alerts)

> **Stretch (only if time remains):** an **Export Poster** dialog using **Fabric.js** (separate from the battle canvas) to compose a simple “winner card” and export PNG.

---

## 2) Requirements (hard constraints)

* **Next.js 15** (App Router), deployed to **Vercel**
* **HTTP Basic Auth** via `middleware.ts`
* **shadcn/ui** for UI (Button, Card, Input, Skeleton, Alert, Toast)
* **Remote API:** PokéAPI (≥2 endpoints: **list** + **details**) with client pagination/filter and good UI states
* **Canvas:** Must be **native HTML Canvas 2D API** for the battle (no Fabric for the core)
* **AI workflow:** Export **3–5** concise Cursor/Claude sessions to `docs/ai/`, each with a short **validation note**
* **Docs:** `README.md` + `docs/solution-walkthrough.md`

---

## 3) Non‑goals (keep scope tight)

* No full auth system beyond Basic Auth
* No SSR for API pages (client fetch is fine for the exercise)
* No complex full type‑effectiveness matrix; use a **tiny subset** or **simple multiplier map**
* No audio; no multiplayer; no persistence

---

## 4) Architecture

### 4.1 Directory structure

```
app/
  layout.tsx
  page.tsx            # list + selectors + canvas panel
  middleware.ts       # Basic Auth
components/
  battle-canvas.tsx   # native canvas component
  pokemon-list.tsx    # list + search + pagination
  ui/*                # shadcn components
lib/
  api/
    poke.ts           # fetchers (list, details), zod types, mapping
  util/
    dpr.ts            # DPR scaling helpers
    rng.ts            # seeded/random helpers (optional)
types/
  pokemon.ts          # domain types
docs/
  spec-battle-arena.md
  cheatsheet.md
  solution-walkthrough.md
  ai/
    sessions.md
```

### 4.2 Data flow

* `pokemon-list.tsx` fetches **list** (offset/limit) and allows **search**
* On select **A** and **B**, fetch **details** (stats, types, sprite URLs)
* Pass `{ left, right }` data into `<BattleCanvas />` as props

### 4.3 State model (high level)

* **UI state** (Zustand or React state): selections, loading/error for list/details
* **Canvas internal state** (inside component): images ready, HP values, animation phase

### 4.4 Mock Mode (for reliability)

* If PokéAPI fails or rate‑limits, fall back to **2–3 hardcoded Pokémon** (placeholder sprites + stats) so the canvas still runs (document this in the README).

---

## 5) API contract (PokéAPI)

### 5.1 Endpoints

* List: `GET https://pokeapi.co/api/v2/pokemon?limit=24&offset=0`
* Details: `GET https://pokeapi.co/api/v2/pokemon/{name}`

### 5.2 Fields needed from Details

* `sprites.front_default` (URL)
* `stats` → base stats (HP, Attack, Defense, Special‑Attack, Special‑Defense, Speed)
* `types` (use **first type** name for projectile color theme)

### 5.3 Domain mapping

```ts
// types/pokemon.ts
export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type Pokemon = {
  name: string;
  spriteUrl: string | null;
  typeMain: string;                 // e.g., "fire"
  stats: Record<StatKey, number>;   // 1..255
};
```

*(Optional)* Zod + mapping outline:

```ts
// lib/api/poke.ts
import { z } from "zod";

const PokeList = z.object({
  count: z.number(),
  results: z.array(z.object({ name: z.string(), url: z.string().url() }))
});

const PokeDetails = z.object({
  name: z.string(),
  sprites: z.object({ front_default: z.string().nullable() }),
  types: z.array(z.object({ type: z.object({ name: z.string() }) })),
  stats: z.array(z.object({
    base_stat: z.number(),
    stat: z.object({ name: z.string() })
  }))
});

export async function listPokemon(offset=0, limit=24) {
  const r = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
  const j = await r.json();
  return PokeList.parse(j);
}

// Search implementation: Use query parameter to filter the list client-side by name matching.

export async function getPokemon(name: string) {
  const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  const j = await r.json();
  const d = PokeDetails.parse(j);
  const mapName = (n:string) => ({
    hp: "hp", attack: "atk", defense: "def",
    "special-attack": "spa", "special-defense": "spd", speed: "spe"
  } as const)[n] as keyof Pokemon["stats"] | undefined;

  const stats: Partial<Pokemon["stats"]> = {};
  d.stats.forEach(s => {
    const key = mapName(s.stat.name);
    if (key) (stats as any)[key] = s.base_stat;
  });

  const out: Pokemon = {
    name: d.name,
    spriteUrl: d.sprites.front_default,
    typeMain: d.types[0]?.type.name ?? "normal",
    stats: {
      hp: stats.hp ?? 50, atk: stats.atk ?? 50, def: stats.def ?? 50,
      spa: stats.spa ?? 50, spd: stats.spd ?? 50, spe: stats.spe ?? 50
    }
  };

  return out;
}
```

---


### 5.4 Search & pagination behavior
- Pagination: use `limit=24` with `offset` increments of 24 (`/pokemon?limit=24&offset={n}`).
- Search: client-side filter by **name substring** over the current page results; debounce input (e.g., 250ms).
- States: when typing, show a lightweight "filtering…" skeleton if local list is large; when page changes, show loading skeleton and handle empty/error gracefully.


## 6) Canvas design (deep‑dive)

### 6.1 Component contract

```ts
// components/battle-canvas.tsx
export type BattleCanvasProps = {
  left?: Pokemon;     // undefined until selected
  right?: Pokemon;
  onKo?: (winner: "left" | "right") => void;
};
```

### 6.2 Rendering stages

* **Background:** gradient or subtle grid (pre‑render to offscreen if desired)
* **Sprites:** left/right images (scaled to fit). If missing, draw placeholder silhouette box
* **Bars:** HP bars under each sprite; below them 2–3 small stat bars (Atk/Def/Speed) for quick context
* **Tooltips:** hover over bar regions → light tooltip (rounded rect) with current value
* **Projectiles:** drawn during Attack phase; small particle burst on hit

### 6.3 Animation phases (state machine)

```
IDLE
  - sprites bob on sine; hover tooltips enabled
ATTACKING_LEFT | ATTACKING_RIGHT
  - projectile moves along quadratic curve
  - on arrival → HIT_RESOLVE
HIT_RESOLVE
  - target shakes (decay ~250ms)
  - HP reduces with tween (~300ms)
  - if HP <= 0 → KO
  - else → IDLE
KO
  - Draw "KO!" banner; freeze attacks; call onKo
```

### 6.4 Damage & timing (simple)

```ts
// Deterministic enough for demo
const damage = (A: Pokemon, D: Pokemon, mult: number) => {
  const raw = (A.stats.atk - D.stats.def * 0.5) * mult;
  const jitter = 0.9 + Math.random()*0.2; // 0.9..1.1
  return clamp(Math.round(raw * jitter), 1, 50);
};

// Minimal multiplier map (extend if time permits)
const typeMultiplier = (atkType: string, defType: string) => {
  const m: Record<string, Record<string, number>> = {
    fire: { grass: 1.5 },
    water: { fire: 1.5 },
    electric: { water: 1.5 }
  };
  return m[atkType]?.[defType] ?? 1.0;
};

// Timing targets
// projectile: ~500–700ms; shake: ~250ms (ease‑out); HP tween: ~300ms
```

### 6.5 Interactions

* **Attack button** (outside canvas via shadcn Button)

  * Disabled if a phase is in progress or if a side has 0 HP
  * Alternates turns: left attacks first, then right, etc.
* **Hover** (inside canvas)

  * Track mouse; compute canvas‑space coords (`getBoundingClientRect` + DPR)
  * If within HP/stat bar rects, show tooltip

### 6.6 Responsiveness & DPR

* Use `ResizeObserver` to match the canvas to its container
* Scale drawing by device pixel ratio (DPR): `canvas.width/height = cssSize * DPR`; then `ctx.setTransform(DPR,0,0,DPR,0,0)`

### 6.7 Performance notes

* Run `requestAnimationFrame` **only** when animating (attack/KO/hover highlight) or on hover state change
* Memoize static layers (grid/background) on an offscreen canvas if needed
* Preload **both** sprites before entering `IDLE`

---

## 7) UI/UX

* **Layout:** split view → left: list (search + pagination); right: canvas card with controls
* **States:**

  * List loading → skeleton list
  * Details loading → spinner overlay on canvas; canvas also draws “Loading…”
  * Error → shadcn Alert + in‑canvas error text
  * Empty → “No results” copy
* **Copy tone:** concise, friendly (“Choose two Pokémon to begin”)

### Accessibility

* Buttons/inputs fully keyboard accessible (shadcn provides ARIA)
* Canvas has `aria-label` and offscreen text summarizing state
  e.g., “Charizard vs Pikachu. Charizard HP 57/100; Pikachu HP 29/100.”
* Color contrast: HP bars accessible; KO banner readable

---

## 8) Risk management

### Primary risks & mitigations

1. **Sprite loading/CORS**
   Mitigate: use `sprites.front_default`; wrap in `Promise.all`; render placeholder on failure
2. **Canvas math/coords bugs**
   Mitigate: start with static layout; add hover bounds **after** sprites/bars exist; unit‑test `pointInRect`
3. **Time overrun on particles/FX**
   Mitigate: MVP first → single projectile (beam/circle). Particles only if time remains
4. **Perf issues on mobile**
   Mitigate: rAF only during activity; pre‑render background; cap particle count (or skip)
5. **API slowness**
   Mitigate: small page size (limit=24); debounce search; graceful empty state; **Mock Mode** fallback

### Fallback plan (if battle hits a blocker in hour 1–2)

Swap canvas to a **compact radar/mini‑bars overlay** (still native canvas):

* Draw 6‑stat mini radar or bars for 1 Pokémon
* Keep list/selection/states unchanged
* Document the decision in `solution-walkthrough.md`

---

## 9) AI workflow (what to use AI for & how to log)

Create **short** sessions (3–5), each with:

* **Prompt** (1–2 paragraphs max)
* **Output** (trimmed to the relevant code)
* **Validation note** (2–4 sentences: what changed and why)

### Planned sessions

1. **Canvas boilerplate** — React canvas with rAF, `ResizeObserver`, DPR scaling
2. **Projectile + collision** — Quadratic curve, arrival detection, shake & HP tween
3. **Image loading** — Two remote sprites with `Promise.all` + fallback drawing
4. **API types** — Zod/TS for list/details and domain mapping
5. **States & copy** — Loading/empty/error copy; shadcn Alerts/Toasts

**Rule:** No blind copy‑paste. Always run locally, edit for types/perf, and state changes in the validation note.

### Seed prompts (drop into `docs/ai/*.md`)

* *Canvas boilerplate:*
  “Create a React TS component `BattleCanvas` using native Canvas 2D as per the guide: rAF loop, `ResizeObserver`, DPR scaling, idle sine‑bounce. No external libs. Return only the component.”
* *Projectile & collision:*
  “Using the state machine in the spec (§6.3) and `qbezier`, add an attack phase with a quadratic projectile, collision at defender center, shake (~250ms), HP tween (~300ms), KO banner, and turn alternation.”
* *Image loading:*
  “Load two remote sprites with `new Image()` + `Promise.all`; draw scaled with aspect fit; placeholders on failure; crisp rendering on DPR>1.”
* *API types & mapping:*
  “From PokéAPI responses, write Zod schemas + mapping to `Pokemon` (hp/atk/def/spa/spd/spe, first type, front_default). Handle missing sprites gracefully.”
* *States & UX polish:*
  “Implement loading/empty/error states: skeleton list, in‑canvas ‘Loading…’, shadcn Alert for error; add tooltips on HP/stat bars via canvas hit testing.”

---

## 10) Milestones (time‑box)

1. **Scaffold & Auth & shadcn (45m)**
   App Router; `middleware.ts` (Basic Auth); base layout; install shadcn
2. **API layer & List UI (45m)**
   List fetcher + search + pagination + skeleton/empty/error
3. **Canvas shell (45m)**
   `<BattleCanvas />` with rAF on, DPR & `ResizeObserver` wired; draw placeholders
4. **Sprites & Idle (60m)**
   Load images, aspect‑fit draw, HP bars, sine‑bounce
5. **Attack flow (75m)**
   Projectile, collision, shake, HP tween, KO banner, turn alternation
6. **Docs & AI logs (60–90m)**
   `README.md`, `solution-walkthrough.md`, export **3–5** AI sessions into `docs/ai/`

> **Stretch (only if time remains):** Fabric “Poster Export.”

---

## 11) Acceptance criteria (DoD)

* App deploys on Vercel; routes gated by Basic Auth
* List view loads 24 Pokémon with search + pagination; graceful loading/empty/error
* Canvas:

  * Shows both selected sprites (or placeholders), HP bars visible
  * Idle bounce animation active
  * Hovering HP/stat bars shows tooltips
  * Clicking **Attack** animates projectile, decrements HP, and KO is achievable
  * Resizes smoothly; crisp on Retina (DPR scaling)
* Code quality: **strict TS**, ESLint/Prettier clean; modular structure
* AI logs (**3–5** md files) present with validation notes
* `README.md` + `docs/solution-walkthrough.md` complete

---

## 12) Implementation notes & snippets

### 12.1 Basic Auth middleware

```ts
// app/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER = process.env.BASIC_USER ?? "demo";
const PASS = process.env.BASIC_PASS ?? "demo123";

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' }
    });
  }
  const [u, p] = atob(auth.slice(6)).split(":");
  if (u !== USER || p !== PASS) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
// HACK: creds via env for demo; real apps use an auth provider.
```

### 12.2 Canvas skeleton

```tsx
// components/battle-canvas.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import type { Pokemon } from "@/types/pokemon";

export type BattleCanvasProps = {
  left?: Pokemon; right?: Pokemon; onKo?: (w: "left"|"right") => void;
};

export default function BattleCanvas({ left, right, onKo }: BattleCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"IDLE"|"ATTACK_L"|"ATTACK_R"|"HIT"|"KO">("IDLE");
  const [hp, setHp] = useState<{L:number; R:number}>({ L: 100, R: 100 });

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    let w = 0, h = 0, raf = 0, running = true;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = Math.max(320, Math.floor(rect.width));
      h = Math.max(240, Math.floor(rect.height));
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    resize();

    let t0 = performance.now();
    function frame(t: number) {
      const dt = Math.min(32, t - t0); t0 = t;
      ctx.clearRect(0,0,w,h);
      // draw background
      // draw sprites (with sine offset)
      // draw HP bars & tooltips if any
      // draw projectile if in ATTACK phase
      // advance animations/state machine here
      if (running) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [left, right]);

  return <canvas ref={ref} className="w-full h-[360px] rounded-2xl shadow" aria-label="Pokémon battle canvas" />;
}
```

### 12.3 Helper math

```ts
// lib/util/math.ts
export const clamp = (v:number, lo:number, hi:number) => Math.max(lo, Math.min(hi, v));
export const lerp  = (a:number, b:number, t:number) => a + (b - a) * t;
export const qbezier = (
  p0:[number,number], p1:[number,number], p2:[number,number], t:number
) => {
  const u = 1 - t;
  return [u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0], u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1]] as const;
};
```

---

## 13) Commit hygiene & env

* Use **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`)
* `.env.local` → `BASIC_USER=demo`, `BASIC_PASS=demo123` (document in README)
* Add `// HACK:` or `// FIXME:` comments where shortcuts are taken

---

## 14) Stretch goals (optional)

* **Fabric.js Poster Export:** open dialog, compose winner sprite + title + palette swatches, export PNG
* **Particles** on hit (cap to small count)
* **Undo/redo** history of attacks
* **Type effectiveness** fetched from `/type` endpoint for accurate multipliers

---

## 15) Appendix — Minimal list component sketch

```tsx
// components/pokemon-list.tsx (sketch)
"use client";
import { useEffect, useState } from "react";
import { listPokemon, getPokemon } from "@/lib/api/poke";
import type { Pokemon } from "@/types/pokemon";

export default function PokemonList({ onPick }: { onPick: (slot:"left"|"right", p:Pokemon)=>void }) {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 24;

  useEffect(() => { (async () => {
    setLoading(true);
    const res = await listPokemon(offset, limit);
    setItems(res.results.map(r => r.name));
    setLoading(false);
  })(); }, [offset]);

  if (loading) return <div className="space-y-2">{/* skeletons */}</div>;

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(name => (
        <button key={name} className="btn"
          onClick={async ()=> onPick("left", await getPokemon(name))}>
          {name}
        </button>
      ))}
    </div>
  );
}
```

---

**End of ultimate combined spec.**
