# PokéBattle Arena

A Next.js 15 interactive Pokémon battle simulator featuring real-time canvas animations, complete PokéAPI integration, and turn-based combat mechanics. Built with shadcn/ui and protected by HTTP Basic authentication.

## Quick Start

### Local Development

```bash
# Clone and install dependencies
git clone <repository-url>
cd drinory
npm install

# Set authentication credentials (optional - defaults provided)
export BASIC_USER=demo
export BASIC_PASS=demo123

# Start development server
npm run dev
```

Visit `http://localhost:3000` and authenticate with:
- **Username**: `demo` (or your BASIC_USER)
- **Password**: `demo123` (or your BASIC_PASS)

### Production

**Live Demo**: [https://drinory.vercel.app](https://drinory.vercel.app)

**Credentials**:
- Username: `demo`
- Password: `demo123`

Auto-deploys from `main` branch via Vercel integration.

## Architecture

### Folder Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── layout.tsx          # Root layout with global styles
│   └── page.tsx            # Main battle arena page
├── components/             # React components
│   ├── ui/                 # shadcn/ui components (Button, Card, etc.)
│   ├── pokemon-list.tsx    # Pokémon selection with search/pagination
│   └── battle-canvas.tsx   # Interactive canvas battle component
├── lib/
│   ├── api/
│   │   └── poke.ts         # PokéAPI integration layer
│   ├── theme/              # Design system & visual assets
│   │   ├── colors.ts       # Color palette definitions
│   │   ├── symbols.ts      # Emoji projectiles & visual symbols
│   │   ├── types.ts        # Theme TypeScript definitions
│   │   └── index.ts        # Unified theme exports & helpers
│   ├── game/               # Game mechanics & data
│   │   ├── type-effectiveness.ts # Pokémon type battle matrix
│   │   └── index.ts        # Game data exports
│   ├── util/
│   │   ├── audio.ts        # Web Audio API utilities
│   │   ├── dpr.ts          # Device pixel ratio handling
│   │   └── math.ts         # Canvas math utilities
│   └── utils.ts            # Shared utilities
├── types/
│   └── pokemon.ts          # TypeScript schemas
└── middleware.ts           # HTTP Basic auth protection
```

### Key Decisions

- **Client-Side Data Fetching**: Chose client-side over SSR for simpler state management and better interactivity during development phase
- **Canvas API**: Native HTML5 Canvas instead of libraries to showcase low-level graphics programming skills
- **Modular Architecture**: Separated theme system, game mechanics, and utilities for maintainability and reusability
- **State Management**: React state + refs for animation performance (avoiding unnecessary re-renders)
- **Design System**: Centralized theme with semantic color tokens and reusable visual assets
- **Audio Integration**: Native Web Audio API for Pokémon cries without external dependencies
- **Authentication**: HTTP Basic auth without external providers (as specified) with environment variable configuration
- **Error Handling**: Graceful degradation with mock data fallbacks when PokéAPI is unavailable

## API Integration

### Endpoints Used

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `GET /api/v2/pokemon?limit=2000` | List all Pokémon | `limit=2000` to fetch complete dataset (~1300 items) |
| `GET /api/v2/pokemon/{name}` | Get individual Pokémon details | `name` - Pokémon identifier |

### Types & Validation

**Core Domain Type** (`types/pokemon.ts`):
```typescript
export type Pokemon = {
  name: string;
  spriteUrl: string | null;
  typeMain: string;
  stats: {
    hp: number; atk: number; def: number;
    spa: number; spd: number; spe: number;
  };
};
```

**API Validation**: Uses Zod schemas for runtime type safety:
- `PokeList` - Validates paginated list responses
- `PokeDetails` - Validates individual Pokémon data
- Automatic parsing with error boundaries

### Error Handling Strategy

1. **Network Failures**: Fallback to mock dataset (Charizard, Pikachu, Blastoise)
2. **Invalid Responses**: Zod validation with meaningful error messages  
3. **Missing Sprites**: Colored rectangles based on Pokémon type
4. **Rate Limiting**: Mock mode gracefully handles API unavailability
5. **Loading States**: Skeleton components and loading indicators

## Features

### 🔐 Authentication
- HTTP Basic auth protecting all routes
- Configurable via environment variables
- Graceful challenge/response flow

### 🎮 Pokémon Selection
- **Complete Dataset**: All ~1300 Pokémon available
- **Real-time Search**: Filter by name with instant results
- **Client-side Pagination**: 24 items per page with navigation
- **Responsive Design**: Mobile-optimized grid layout
- **Loading States**: Skeleton placeholders during fetch

### ⚔️ Interactive Battle Canvas
- **Turn-based Combat**: Alternating attacks with visual feedback and audio cues
- **Type-Specific Projectiles**: 18 unique emoji projectiles (🔥⚡💧🌿👊🔮👻🐲) with glowing effects
- **Comprehensive Battle System**: Full 18x18 type effectiveness matrix for strategic depth
- **Particle Effects**: Physics-based hit animations with colorful particle bursts
- **Victory Celebration**: Multi-wave confetti system with realistic physics animations
- **Audio Integration**: Authentic Pokémon cries played during attacks via PokéAPI
- **Enhanced Tooltips**: Detailed stat information on HP bar hover
- **Real-time Animations**: Projectile trajectories, screen shake, HP tweening
- **Responsive Rendering**: Scales to screen size with device pixel ratio support
- **Performance Optimized**: RequestAnimationFrame with cleanup, minimal re-renders
- **Accessibility**: ARIA labels, keyboard support, screen reader friendly

#### Battle Mechanics
- Damage calculation based on attack/defense stats with type effectiveness
- HP visualization with color-coded bars (green/yellow/red)
- Sprite loading with fallback to type-colored placeholders
- Victory detection with celebration animations

### 🎮 Complete Game Flow
- **Setup Phase**: Interactive Pokémon selection with real-time search and pagination
- **Battle Phase**: Turn-based combat with visual and audio feedback
- **Victory Phase**: Confetti celebration with winner announcement and statistics
- **Restart System**: One-click game reset for continuous play
- **Smart UI States**: Contextual guidance and button states based on game progress
- **Responsive Layout**: Mobile-optimized design with proper touch targets

### 🎨 Design System & Architecture
- **Modular Theme System**: Centralized colors, symbols, and visual assets
- **Semantic Color Tokens**: Type-safe color management with helper functions
- **Game Data Separation**: Battle mechanics and type effectiveness extracted into dedicated modules
- **Clean Import Paths**: Organized imports (`@/lib/theme`, `@/lib/game`) for better developer experience
- **TypeScript Integration**: Comprehensive type definitions across theme and game systems

## Technologies Used

- **Framework**: Next.js 15 (App Router)
- **UI Library**: shadcn/ui + Tailwind CSS
- **Type Safety**: TypeScript + Zod validation
- **Graphics**: HTML5 Canvas API
- **Audio**: Web Audio API for Pokémon cries
- **Authentication**: HTTP Basic auth middleware
- **Deployment**: Vercel with auto-deploy
- **API**: PokéAPI (RESTful integration)
- **Development**: ESLint + Prettier

## Development Notes

- **Performance**: Canvas animations use RAF for 60fps, refs prevent unnecessary React re-renders
- **Particle Systems**: Efficient confetti and hit effect systems with automatic cleanup
- **Responsiveness**: ResizeObserver + device pixel ratio for crisp rendering on all screens
- **Game State Management**: Clean state flow from setup → battle → victory → restart
- **Type Safety**: Strict TypeScript with no `any` types, comprehensive error boundaries
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation support

---

*Built as a technical demonstration showcasing modern web development practices, API integration, and interactive graphics programming.*
