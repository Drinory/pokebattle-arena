"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setupCanvasDPR } from "@/lib/util/dpr";
import { pointInRect } from "@/lib/util/math";
import type { Pokemon } from "@/types/pokemon";

export type BattleCanvasProps = {
  left?: Pokemon;
  right?: Pokemon; 
  onKo?: (winner: "left" | "right") => void;
};

type Phase = "IDLE" | "ATTACKING_LEFT" | "ATTACKING_RIGHT" | "HIT_RESOLVE" | "KO";

type BattleState = {
  phase: Phase;
  hpLeft: number;
  hpRight: number;
  animationTime: number;
  hoveredBar: string | null;
  mousePos: { x: number; y: number };
};

export default function BattleCanvas({ left, right, onKo }: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [battleState, setBattleState] = useState<BattleState>({
    phase: "IDLE",
    hpLeft: 100,
    hpRight: 100,
    animationTime: 0,
    hoveredBar: null,
    mousePos: { x: 0, y: 0 }
  });

  // Reset HP when Pokemon change
  useEffect(() => {
    setBattleState(prev => ({
      ...prev,
      hpLeft: left ? 100 : 100,
      hpRight: right ? 100 : 100,
      phase: "IDLE"
    }));
  }, [left?.name, right?.name]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    
    setBattleState(prev => ({
      ...prev,
      mousePos: { x: x / dpr, y: y / dpr } // Store in CSS pixels for hit testing
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    
    let animationId = 0;
    let running = true;
    
    const resize = () => {
      setupCanvasDPR(canvas, ctx);
    };
    
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.parentElement!);
    resize(); // Initial setup
    
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      if (!running) return;
      
      const deltaTime = Math.min(32, currentTime - lastTime);
      lastTime = currentTime;
      
      // Update animation time for sine wave and other animations
      setBattleState(prev => ({
        ...prev,
        animationTime: prev.animationTime + deltaTime
      }));
      
      draw(ctx, canvas, currentTime);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      running = false;
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [left, right]);

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const { width, height } = canvas.getBoundingClientRect();
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#e0f2fe"); // light blue
    gradient.addColorStop(1, "#fce7f3"); // light pink
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Ground line
    const groundY = height * 0.8;
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
    
    // Left Pokemon area
    if (left) {
      drawPokemonArea(ctx, left, "left", width * 0.25, groundY - 80, time);
      drawHPBar(ctx, left.name, battleState.hpLeft, width * 0.05, height * 0.1, "left");
    } else {
      drawPlaceholder(ctx, "Choose Left Fighter", width * 0.25, groundY - 40);
    }
    
    // Right Pokemon area  
    if (right) {
      drawPokemonArea(ctx, right, "right", width * 0.75, groundY - 80, time);
      drawHPBar(ctx, right.name, battleState.hpRight, width * 0.55, height * 0.1, "right");
    } else {
      drawPlaceholder(ctx, "Choose Right Fighter", width * 0.75, groundY - 40);
    }
    
    // Tooltip
    if (battleState.hoveredBar) {
      drawTooltip(ctx, battleState.mousePos.x, battleState.mousePos.y, battleState.hoveredBar);
    }
    
    // Phase indicator (debug)
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px monospace";
    ctx.fillText(`Phase: ${battleState.phase}`, 10, 30);
  };

  const drawPokemonArea = (
    ctx: CanvasRenderingContext2D, 
    pokemon: Pokemon, 
    side: "left" | "right",
    centerX: number, 
    baseY: number, 
    time: number
  ) => {
    // Idle animation - gentle sine bounce
    const bounce = Math.sin(time * 0.002) * 3;
    const y = baseY + bounce;
    
    // Placeholder sprite (colored rectangle based on type)
    const typeColors: Record<string, string> = {
      fire: "#ef4444",
      water: "#3b82f6", 
      electric: "#eab308",
      grass: "#22c55e",
      psychic: "#a855f7",
      ice: "#06b6d4",
      dragon: "#8b5cf6",
      dark: "#374151",
      fighting: "#dc2626",
      poison: "#9333ea",
      ground: "#a3a3a3",
      flying: "#60a5fa",
      bug: "#84cc16",
      rock: "#78716c",
      ghost: "#6b7280",
      steel: "#71717a",
      normal: "#9ca3af"
    };
    
    const color = typeColors[pokemon.typeMain] || "#9ca3af";
    
    // Pokemon sprite placeholder
    ctx.fillStyle = color;
    ctx.fillRect(centerX - 30, y - 60, 60, 60);
    
    // Border
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 30, y - 60, 60, 60);
    
    // Name
    ctx.fillStyle = "#1f2937";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(pokemon.name, centerX, y + 20);
    
    // Type badge
    ctx.fillStyle = color;
    ctx.fillRect(centerX - 20, y + 25, 40, 15);
    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    ctx.fillText(pokemon.typeMain, centerX, y + 35);
  };

  const drawPlaceholder = (ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number) => {
    // Dashed outline
    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(centerX - 30, y - 30, 60, 60);
    ctx.setLineDash([]); // Reset dash
    
    // Text
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, centerX, y + 50);
  };

  const drawHPBar = (
    ctx: CanvasRenderingContext2D, 
    name: string, 
    hp: number, 
    x: number, 
    y: number,
    side: "left" | "right"
  ) => {
    const barWidth = 150;
    const barHeight = 20;
    
    // Check if mouse is hovering over this bar
    const isHovered = pointInRect(
      battleState.mousePos.x, 
      battleState.mousePos.y, 
      x, y, barWidth, barHeight + 20
    );
    
    if (isHovered && battleState.hoveredBar !== `${side}-hp`) {
      setBattleState(prev => ({ ...prev, hoveredBar: `${side}-hp` }));
    } else if (!isHovered && battleState.hoveredBar === `${side}-hp`) {
      setBattleState(prev => ({ ...prev, hoveredBar: null }));
    }
    
    // Background
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // HP fill
    const hpWidth = (hp / 100) * barWidth;
    ctx.fillStyle = hp > 50 ? "#22c55e" : hp > 25 ? "#eab308" : "#ef4444";
    ctx.fillRect(x, y, hpWidth, barHeight);
    
    // Border
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Label
    ctx.fillStyle = "#1f2937";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${name} HP: ${hp}/100`, x, y - 5);
    
    // Hover highlight
    if (isHovered) {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
    }
  };

  const drawTooltip = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
    const padding = 8;
    const fontSize = 12;
    ctx.font = `${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(text).width;
    
    // Background
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(x + 10, y - 25, textWidth + padding * 2, fontSize + padding);
    
    // Text
    ctx.fillStyle = "white";
    ctx.fillText(text, x + 10 + padding, y - 10);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[360px] rounded-lg border bg-white cursor-crosshair"
      onMouseMove={handleMouseMove}
      aria-label={`Battle canvas. ${left?.name || "No left fighter"} vs ${right?.name || "No right fighter"}. Left HP: ${battleState.hpLeft}, Right HP: ${battleState.hpRight}`}
    />
  );
}
