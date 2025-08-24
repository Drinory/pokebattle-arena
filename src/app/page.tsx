"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowLeft, ArrowRight } from "lucide-react";
import PokemonList from "@/components/pokemon-list";
import type { Pokemon } from "@/types/pokemon";

export default function PokeBattleArena() {
  const [selectedLeft, setSelectedLeft] = useState<Pokemon | undefined>();
  const [selectedRight, setSelectedRight] = useState<Pokemon | undefined>();
  const [winner, setWinner] = useState<"left" | "right" | undefined>();

  const handleKo = (winnerSide: "left" | "right") => {
    setWinner(winnerSide);
  };

  const handlePokemonSelect = (slot: "left" | "right", pokemon: Pokemon) => {
    if (slot === "left") {
      setSelectedLeft(pokemon);
    } else {
      setSelectedRight(pokemon);
    }
    // Reset winner when new Pokemon are selected
    setWinner(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-2 h-4 w-4" />
            Interactive Canvas Battle
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            PokéBattle Arena
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Choose your fighters and watch them battle using native HTML Canvas 2D
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Pokemon List Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Choose Your Fighters</CardTitle>
              <CardDescription>
                Select two Pokémon to begin the battle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PokemonList 
                onPick={handlePokemonSelect}
                selectedLeft={selectedLeft}
                selectedRight={selectedRight}
              />
            </CardContent>
          </Card>

          {/* Battle Canvas Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Battle Arena</span>
                {winner && (
                  <Badge variant="outline">
                    {winner === "left" ? "Left" : "Right"} Wins!
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Interactive Canvas visualization with native 2D API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Battle Status */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">
                    {selectedLeft?.name || "Select Left Fighter"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!selectedLeft || !selectedRight}
                  // TODO: Connect to battle logic in Milestone 5
                >
                  ⚔️ Attack
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {selectedRight?.name || "Select Right Fighter"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Canvas Container */}
              <div className="rounded-lg border bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 p-4">
                {/* TODO: BattleCanvas component will go here */}
                <div className="flex h-[360px] items-center justify-center text-muted-foreground">
                  Canvas battle visualization will be implemented in Milestone 3...
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Footer */}
        <div className="mt-8 text-center">
          <Card className="inline-block">
            <CardContent className="px-6 py-3">
              <p className="text-sm text-muted-foreground">
                🎯 <strong>Milestone 2 In Progress:</strong> API integration, Pokemon list, search & pagination
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}