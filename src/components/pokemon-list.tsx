"use client";

import { useEffect, useState } from "react";
import { listPokemon, getPokemon, filterPokemonByName, mockPokemon } from "@/lib/api/poke";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Zap, AlertTriangle } from "lucide-react";
import type { Pokemon } from "@/types/pokemon";

type PokemonListProps = {
  onPick: (slot: "left" | "right", pokemon: Pokemon) => void;
  selectedLeft?: Pokemon;
  selectedRight?: Pokemon;
};

export default function PokemonList({ onPick, selectedLeft, selectedRight }: PokemonListProps) {
  const [items, setItems] = useState<{ name: string; url: string }[]>([]);
  const [filteredItems, setFilteredItems] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingPokemon, setLoadingPokemon] = useState<string | null>(null);
  const [useMockMode, setUseMockMode] = useState(false);

  const limit = 24;

  // Load Pokemon list
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await listPokemon(offset, limit);
        setItems(res.results);
        setTotal(res.count);
        setUseMockMode(false);
      } catch (err) {
        console.warn("PokéAPI failed, falling back to mock mode:", err);
        setError("API unavailable - using demo Pokémon");
        setItems(mockPokemon.map(p => ({ name: p.name, url: "" })));
        setTotal(3);
        setUseMockMode(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [offset]);

  // Filter items based on search
  useEffect(() => {
    setFilteredItems(filterPokemonByName(items, searchQuery));
  }, [items, searchQuery]);

  const handleSelectPokemon = async (name: string, slot: "left" | "right") => {
    try {
      setLoadingPokemon(name);
      
      let pokemon: Pokemon;
      if (useMockMode) {
        const mock = mockPokemon.find(p => p.name === name);
        if (!mock) throw new Error("Mock Pokémon not found");
        pokemon = mock;
      } else {
        pokemon = await getPokemon(name);
      }
      
      onPick(slot, pokemon);
    } catch (err) {
      console.error("Failed to load Pokémon details:", err);
      // TODO: Could show a toast here
    } finally {
      setLoadingPokemon(null);
    }
  };

  const canGoPrevious = offset > 0;
  const canGoNext = offset + limit < total;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search Pokémon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selection Status */}
      <div className="flex gap-2 text-sm">
        <Badge variant={selectedLeft ? "default" : "outline"}>
          Left: {selectedLeft?.name || "None"}
        </Badge>
        <Badge variant={selectedRight ? "default" : "outline"}>
          Right: {selectedRight?.name || "None"}
        </Badge>
      </div>

      {/* Pokemon Grid */}
      {filteredItems.length === 0 ? (
        <Alert>
          <AlertDescription>
            {searchQuery ? `No Pokémon found matching "${searchQuery}"` : "No Pokémon available"}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
          {filteredItems.map((pokemon) => {
            const isSelected = selectedLeft?.name === pokemon.name || selectedRight?.name === pokemon.name;
            const isLoading = loadingPokemon === pokemon.name;
            
            return (
              <Card key={pokemon.name} className={`${isSelected ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-3">
                  <div className="text-sm font-medium capitalize mb-2">{pokemon.name}</div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      disabled={isLoading || selectedLeft?.name === pokemon.name}
                      onClick={() => handleSelectPokemon(pokemon.name, "left")}
                    >
                      {isLoading ? <Zap className="h-3 w-3 animate-spin" /> : "← Left"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      disabled={isLoading || selectedRight?.name === pokemon.name}
                      onClick={() => handleSelectPokemon(pokemon.name, "right")}
                    >
                      {isLoading ? <Zap className="h-3 w-3 animate-spin" /> : "Right →"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!useMockMode && !searchQuery && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!canGoPrevious}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!canGoNext}
              onClick={() => setOffset(offset + limit)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
