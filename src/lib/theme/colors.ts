// Pure color definitions for the application theme

export const colors = {
  // Pokémon type colors - authoritative source
  types: {
    fire: "#ef4444",
    water: "#3b82f6", 
    electric: "#eab308",
    grass: "#22c55e",
    ice: "#06b6d4",
    fighting: "#dc2626",
    poison: "#9333ea", 
    ground: "#a3a3a3",
    flying: "#60a5fa",
    psychic: "#a855f7",
    bug: "#84cc16",
    rock: "#78716c",
    ghost: "#6b7280",
    dragon: "#8b5cf6",
    dark: "#374151",
    steel: "#71717a",
    fairy: "#f472b6",
    normal: "#9ca3af"
  },

  // UI semantic colors
  ui: {
    // Backgrounds
    background: {
      primary: "#ffffff",
      secondary: "#f8fafc",
      canvas: {
        start: "#e0f2fe",
        end: "#fce7f3"
      },
      overlay: "rgba(0, 0, 0, 0.7)",
      tooltip: "rgba(0, 0, 0, 0.9)"
    },

    // Text colors
    text: {
      primary: "#1f2937",
      secondary: "#6b7280", 
      muted: "#94a3b8",
      inverse: "#ffffff",
      light: "#e2e8f0"
    },

    // Border and outline colors
    border: {
      primary: "#374151",
      secondary: "#e5e7eb",
      muted: "#9ca3af",
      accent: "#3b82f6"
    },

    // Status colors
    status: {
      success: "#22c55e",
      warning: "#eab308", 
      danger: "#ef4444",
      info: "#3b82f6"
    }
  },

  // HP bar color system
  hp: {
    background: "#e5e7eb",
    healthy: "#22c55e",    // > 50%
    warning: "#eab308",    // 25-50%
    critical: "#ef4444"    // < 25%
  },

  // Particle effect colors
  particles: [
    "#ff6b6b",  // Red
    "#ffd93d",  // Yellow
    "#6bcf7f",  // Green
    "#4ecdc4",  // Cyan
    "#45b7d1",  // Blue
    "#96ceb4"   // Mint
  ]
} as const;