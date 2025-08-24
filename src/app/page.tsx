"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowLeft, ArrowRight } from "lucide-react";
import PokemonList from "@/components/pokemon-list";
import BattleCanvas from "@/components/battle-canvas";
import type { Pokemon } from "@/types/pokemon";

export default function PokeBattleArena() {
  const [selectedLeft, setSelectedLeft] = useState<Pokemon | undefined>();
  const [selectedRight, setSelectedRight] = useState<Pokemon | undefined>();
  const [winner, setWinner] = useState<"left" | "right" | undefined>();
  const battleCanvasRef = useRef<{ triggerAttack: () => void }>(null);

  const handleKo = (winnerSide: "left" | "right") => {
    // HACK: this is a hack to wait for the animation to finish
    setTimeout(() => setWinner(winnerSide), 1000)
  };

  const handleRestart = () => {
    setSelectedLeft(undefined);
    setSelectedRight(undefined);
    setWinner(undefined);
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
                  disabled={!selectedLeft || !selectedRight || !!winner}
                  onClick={() => {
                    battleCanvasRef.current?.triggerAttack();
                  }}
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
              <BattleCanvas
                ref={battleCanvasRef}
                left={selectedLeft}
                right={selectedRight}
                onKo={handleKo}
              />
            </CardContent>
          </Card>
        </div>

        {/* Status Footer */}
        <div className="mt-8 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              {!winner && (
                <CardDescription className="text-base">
                  {selectedLeft && selectedRight
                    ? "⚔️ Ready to battle!"
                    : "Select both fighters to begin"
                  }
                </CardDescription>
              )}

              {winner && (
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    🏆 Victory!
                  </Badge>
                  <CardTitle className="text-2xl">
                    {(winner === "left" ? selectedLeft?.name : selectedRight?.name)} Wins!
                  </CardTitle>
                </div>
              )}
            </CardHeader>

            <CardContent className="text-center ">
              <Button
                variant={winner ? "default" : "outline"}
                onClick={handleRestart}
                className="flex items-center gap-2 w-full sm:w-auto mx-auto"
                size={winner ? "lg" : "default"}
              >
                <Zap className="h-4 w-4" />
                {winner ? "Start New Battle" : "Reset Arena"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
