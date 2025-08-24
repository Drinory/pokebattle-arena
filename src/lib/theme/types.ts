// TypeScript type definitions for the theme system

import { colors } from "./colors";
import { symbols } from "./symbols";

export type PokemonType = keyof typeof colors.types;
export type ThemeColors = typeof colors;
export type ThemeSymbols = typeof symbols;
