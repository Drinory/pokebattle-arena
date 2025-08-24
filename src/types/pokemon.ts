export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export type Pokemon = {
  name: string;
  spriteUrl: string | null;
  typeMain: string;                 // e.g., "fire"
  stats: Record<StatKey, number>;   // 1..255
};
