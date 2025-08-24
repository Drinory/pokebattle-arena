"use client";

import { useEffect, useState } from "react";
import { listPokemon, getPokemon, filterPokemonByName, paginateResults, mockPokemon } from "@/lib/api/poke";
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
  const [allItems, setAllItems] = useState<{ name: string; url: string }[]>([]);
  const [filteredItems, setFilteredItems] = useState<{ name: string; url: string }[]>([]);
  const [paginatedItems, setPaginatedItems] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingPokemon, setLoadingPokemon] = useState<string | null>(null);
  const [useMockMode, setUseMockMode] = useState(false);

  const itemsPerPage = 24;

  // Load ALL Pokemon list once
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await listPokemon();
        setAllItems(res.results);
        setUseMockMode(false);
      } catch (err) {
        console.warn("PokéAPI failed, falling back to mock mode:", err);
        setError("API unavailable - using demo Pokémon");
        setAllItems(mockPokemon.map(p => ({ name: p.name, url: "" })));
        setUseMockMode(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // Only run once on mount

  // Filter items based on search and reset to first page
  useEffect(() => {
    const filtered = filterPokemonByName(allItems, searchQuery);
    setFilteredItems(filtered);
    setCurrentPage(0); // Reset to first page when search changes
  }, [allItems, searchQuery]);

  // Apply pagination to filtered results
  useEffect(() => {
    const paginated = paginateResults(filteredItems, currentPage, itemsPerPage);
    setPaginatedItems(paginated.items);
    setTotalPages(paginated.totalPages);
    setTotalItems(paginated.totalItems);
  }, [filteredItems, currentPage]);

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

  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="left-3 top-1/2 h-4 h-9 flex-1" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-19 h-6" />
          <Skeleton className="w-19 h-6" />
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
      {paginatedItems.length === 0 ? (
        <Alert>
          <AlertDescription>
            {searchQuery ? `No Pokémon found matching "${searchQuery}"` : "No Pokémon available"}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 p-1 gap-2 max-h-[30vh] sm:max-h-[400px] overflow-y-auto">
          {paginatedItems.map((pokemon) => {
            const isSelected = selectedLeft?.name === pokemon.name || selectedRight?.name === pokemon.name;
            const isLoading = loadingPokemon === pokemon.name;

            return (
              <Card key={pokemon.name} className={`${isSelected ? "ring-1 ring-gray-500 bg-gray-100" : ""}`}>
                <CardContent className="p-2 sm:p-3">
                  <div className="text-xs sm:text-sm font-medium capitalize mb-1 sm:mb-2 truncate">{pokemon.name}</div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs px-1 sm:px-3"
                      disabled={isLoading || selectedLeft?.name === pokemon.name}
                      onClick={() => handleSelectPokemon(pokemon.name, "left")}
                    >
                      {isLoading ? (
                        <Zap className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <span className="hidden sm:inline">← Left</span>
                          <span className="sm:hidden">L</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs px-1 sm:px-3"
                      disabled={isLoading || selectedRight?.name === pokemon.name}
                      onClick={() => handleSelectPokemon(pokemon.name, "right")}
                    >
                      {isLoading ? (
                        <Zap className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <span className="hidden sm:inline">Right →</span>
                          <span className="sm:hidden">R</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!useMockMode && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
          <div className="text-center sm:text-left">
            <span className="hidden sm:inline">Showing </span>
            {currentPage * itemsPerPage + 1}-{Math.min((currentPage + 1) * itemsPerPage, totalItems)} of {totalItems}
            {searchQuery && (
              <span className="hidden sm:inline"> (filtered from {allItems.length})</span>
            )}
          </div>
          <div className="flex gap-1 sm:gap-2 justify-center sm:justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={!canGoPrevious}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </Button>
            <span className="flex items-center px-1 sm:px-2 text-xs">
              {currentPage + 1}/{totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={!canGoNext}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="text-xs"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
