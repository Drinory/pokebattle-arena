import { z } from "zod";
import type { Pokemon } from "@/types/pokemon";

const PokeList = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(z.object({ 
    name: z.string(), 
    url: z.string().url() 
  }))
});

const PokeDetails = z.object({
  name: z.string(),
  sprites: z.object({ 
    front_default: z.string().nullable() 
  }),
  types: z.array(z.object({ 
    type: z.object({ name: z.string() }) 
  })),
  stats: z.array(z.object({
    base_stat: z.number(),
    stat: z.object({ name: z.string() })
  }))
});

export async function listPokemon() {
  // Fetch all Pokemon at once - there are approximately 1300 Pokemon in the PokeAPI, so we set limit=2000 to safely get everything without performance penalty
  const r = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=2000`);
  if (!r.ok) throw new Error(`Failed to fetch Pokemon list: ${r.status}`);
  const j = await r.json();
  return PokeList.parse(j);
}

// Search implementation: Use query parameter to filter the list client-side by name matching.
export function filterPokemonByName(results: { name: string; url: string }[], query: string) {
  if (!query.trim()) return results;
  return results.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
}

// Client-side pagination helper
export function paginateResults<T>(items: T[], page: number, itemsPerPage: number) {
  const startIndex = page * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return {
    items: items.slice(startIndex, endIndex),
    totalItems: items.length,
    totalPages: Math.ceil(items.length / itemsPerPage),
    currentPage: page,
    hasNextPage: endIndex < items.length,
    hasPreviousPage: page > 0
  };
}

export async function getPokemon(name: string): Promise<Pokemon> {
  const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`);
  if (!r.ok) throw new Error(`Failed to fetch Pokemon ${name}: ${r.status}`);
  const j = await r.json();
  const d = PokeDetails.parse(j);
  
  const mapName = (n: string) => ({
    hp: "hp", 
    attack: "atk", 
    defense: "def",
    "special-attack": "spa", 
    "special-defense": "spd", 
    speed: "spe"
  } as const)[n] as keyof Pokemon["stats"] | undefined;

  const stats: Partial<Pokemon["stats"]> = {};
  d.stats.forEach(s => {
    const key = mapName(s.stat.name);
    if (key) {
      stats[key] = s.base_stat;
    }
  });

  const out: Pokemon = {
    name: d.name,
    spriteUrl: d.sprites.front_default,
    typeMain: d.types[0]?.type.name ?? "normal",
    stats: {
      hp: stats.hp ?? 50, 
      atk: stats.atk ?? 50, 
      def: stats.def ?? 50,
      spa: stats.spa ?? 50, 
      spd: stats.spd ?? 50, 
      spe: stats.spe ?? 50
    }
  };

  return out;
}

// Mock fallback data (for rate-limiting / CORS issues)
export const mockPokemon: Pokemon[] = [
  {
    name: "charizard",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
    typeMain: "fire",
    stats: { hp: 78, atk: 84, def: 78, spa: 109, spd: 85, spe: 100 }
  },
  {
    name: "pikachu", 
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    typeMain: "electric",
    stats: { hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90 }
  },
  {
    name: "blastoise",
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png", 
    typeMain: "water",
    stats: { hp: 79, atk: 83, def: 100, spa: 85, spd: 105, spe: 78 }
  }
];
