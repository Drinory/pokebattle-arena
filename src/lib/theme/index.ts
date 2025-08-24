// Theme system main entry point with helper functions

import { colors } from "./colors";
import { symbols } from "./symbols";

// Re-export for convenient access
export { colors } from "./colors";
export { symbols } from "./symbols";
export type { PokemonType, ThemeColors, ThemeSymbols } from "./types";

// Helper functions for common theme operations
export const getTypeColor = (type: string): string => {
  return colors.types[type as keyof typeof colors.types] || colors.types.normal;
};

export const getHpColor = (hpPercentage: number): string => {
  if (hpPercentage > 50) return colors.hp.healthy;
  if (hpPercentage > 25) return colors.hp.warning;
  return colors.hp.critical;
};

export const getRandomParticleColor = (): string => {
  return colors.particles[Math.floor(Math.random() * colors.particles.length)];
};

export const getTypeProjectile = (type: string): string => {
  return symbols.typeProjectiles[type as keyof typeof symbols.typeProjectiles] || symbols.typeProjectiles.normal;
};
