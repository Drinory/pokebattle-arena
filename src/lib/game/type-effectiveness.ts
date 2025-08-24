// Pokémon type effectiveness chart for battle calculations
// Based on official Pokémon game mechanics

export const typeEffectiveness: Record<string, Record<string, number>> = {
  // Fire type
  fire: { 
    grass: 2.0, ice: 2.0, bug: 2.0, steel: 2.0, 
    water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 
  },
  
  // Water type  
  water: { 
    fire: 2.0, ground: 2.0, rock: 2.0, 
    water: 0.5, grass: 0.5, dragon: 0.5 
  },
  
  // Electric type
  electric: { 
    water: 2.0, flying: 2.0, 
    grass: 0.5, electric: 0.5, dragon: 0.5, ground: 0.0 
  },
  
  // Grass type
  grass: { 
    water: 2.0, ground: 2.0, rock: 2.0, 
    fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 
  },
  
  // Ice type
  ice: { 
    grass: 2.0, ground: 2.0, flying: 2.0, dragon: 2.0, 
    fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 
  },
  
  // Fighting type
  fighting: { 
    normal: 2.0, ice: 2.0, rock: 2.0, dark: 2.0, steel: 2.0, 
    poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0.0 
  },
  
  // Poison type
  poison: { 
    grass: 2.0, fairy: 2.0, 
    poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0.0 
  },
  
  // Ground type
  ground: { 
    fire: 2.0, electric: 2.0, poison: 2.0, rock: 2.0, steel: 2.0, 
    grass: 0.5, bug: 0.5, flying: 0.0 
  },
  
  // Flying type
  flying: { 
    grass: 2.0, fighting: 2.0, bug: 2.0,
    electric: 0.5, ice: 0.5, rock: 0.5, steel: 0.5 
  },
  
  // Psychic type
  psychic: { 
    fighting: 2.0, poison: 2.0, 
    psychic: 0.5, steel: 0.5, dark: 0.0 
  },
  
  // Bug type
  bug: { 
    grass: 2.0, psychic: 2.0, dark: 2.0, 
    fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 
  },
  
  // Rock type
  rock: { 
    fire: 2.0, ice: 2.0, flying: 2.0, bug: 2.0, 
    fighting: 0.5, ground: 0.5, steel: 0.5 
  },
  
  // Ghost type
  ghost: { 
    psychic: 2.0, ghost: 2.0, 
    dark: 0.5, normal: 0.0 
  },
  
  // Dragon type
  dragon: { 
    dragon: 2.0, 
    steel: 0.5, fairy: 0.0 
  },
  
  // Dark type
  dark: { 
    psychic: 2.0,
    fighting: 0.5, ghost: 0.5, dark: 0.5 
  },
  
  // Steel type
  steel: { 
    ice: 2.0, rock: 2.0, fairy: 2.0, 
    fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 
  },
  
  // Fairy type
  fairy: { 
    fighting: 2.0, dragon: 2.0, dark: 2.0, 
    fire: 0.5, poison: 0.5, steel: 0.5 
  },
  
  // Normal type
  normal: { 
    rock: 0.5, steel: 0.5, ghost: 0.0 
  }
} as const;

/**
 * Get the type effectiveness multiplier for an attack
 * @param attackType - The type of the attacking move
 * @param defendType - The type of the defending Pokémon
 * @returns Effectiveness multiplier (2.0 = super effective, 0.5 = not very effective, 0.0 = no effect, 1.0 = normal)
 */
export const getTypeEffectiveness = (attackType: string, defendType: string): number => {
  return typeEffectiveness[attackType]?.[defendType] ?? 1.0;
};
