# Cursor Cheatsheet — PokéBattle Arena

This quick reference maps your spec sections to precise prompts and guardrails for Cursor (or similar AI tools). Keep prompts short, point to a section, and demand native Canvas 2D (no external libs).

---

## Key Contracts (paste into prompts)
- Component: **`BattleCanvas`** (TS, client component)
  ```ts
  // props
  type BattleCanvasProps = {
    left?: Pokemon;
    right?: Pokemon;
    onKo?: (winner: "left" | "right") => void;
  };
  ```
- Types:
  ```ts
  type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
  type Pokemon = {
    name: string;
    spriteUrl: string | null;
    typeMain: string;
    stats: Record<StatKey, number>;
  };
  ```

---

## Section → Prompt targets

| Section | Use for prompts on… | Key rules / snippets |
|---|---|---|
| §6.3 State machine | Attack flow & phases | `IDLE → ATTACKING_LEFT/RIGHT → HIT_RESOLVE → KO`; keep `setPhase` transitions explicit. |
| §6.4 Damage calc | Damage logic | `raw = atk - def*0.5`, jitter 0.9–1.1, `clamp(1,50)`, minimal `typeMultiplier`. |
| §6.6 Responsiveness | DPR & resize | `ResizeObserver`; `canvas.width = cssW*DPR`; `ctx.setTransform(DPR,0,0,DPR,0,0)`. |
| §6.7 Performance | rAF policy | Run rAF only during animations or hover-state change; consider offscreen bg. |
| §5 API mapping | Data mapping | Map PokéAPI details → `Pokemon` (first type as `typeMain`, `front_default`). |
| §12.2 Canvas skeleton | Setup | Use the provided skeleton; fill draw calls; maintain clean `useEffect` cleanup. |
| §4.2 Data flow | Wiring | `pokemon-list` selects → fetch details → pass `{left,right}` into `BattleCanvas`. |
| §9 AI sessions | Logging | Each session ends with a **validation note** (what changed + why). |

---

## Canonical mini-prompts

1) **Canvas boilerplate**
> Using §12.2 and §6.6, generate `BattleCanvas` (TS, client). Wire `ResizeObserver`, DPR scaling, and a `requestAnimationFrame` loop that draws a background and two sprite placeholders with idle sine-bounce. **Native Canvas 2D only; no external libs.** Return only the component code.

2) **Projectile + collision**
> Based on §6.3 and `qbezier`, implement `ATTACKING_LEFT/RIGHT` with a quadratic projectile from attacker to defender center, arrival detection, then `HIT_RESOLVE` with shake (~250ms) and HP tween (~300ms). If HP ≤ 0, set `KO` and render a banner. Alternate turns.

3) **Image loading**
> Load `left.spriteUrl` and `right.spriteUrl` with `new Image()` + `Promise.all`. Draw aspect-fit, crisp on DPR>1. Fallback to placeholders if images fail. Keep the rAF loop controlled per §6.7.

4) **API types & mapping**
> From PokéAPI responses, write Zod schemas and a mapper to `Pokemon` (hp/atk/def/spa/spd/spe, `typeMain` = first type, `spriteUrl` from `front_default`). Handle missing sprites.

5) **States & tooltips**
> Add loading/empty/error states and hover tooltips for HP/stat bars (rect hit-tests using `getBoundingClientRect` + DPR). Use shadcn/ui for alerts/toasts. Keep Canvas drawing native.

---

## Guardrails to repeat in prompts
- **Native Canvas 2D only.** No Fabric/Konva/Chart.js.
- **Strict TS**, no `any`. Small pure helpers: `clamp`, `lerp`, `qbezier`.
- **Performance-first:** rAF only during activity; memoize static layers if needed.
- **Return only code** when asked for code. No prose in code responses.

---

## Quick acceptance (Canvas)
- Two sprites (or placeholders) render with idle bounce.
- Attack animates a projectile, applies damage, and can produce **KO**.
- Hover over HP/stat bars shows a tooltip.
- Resizes crisply on Retina (DPR scaling honored).

