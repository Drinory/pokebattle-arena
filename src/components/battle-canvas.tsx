"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { setupCanvasDPR } from "@/lib/util/dpr";
import { pointInRect, qbezier, clamp, lerp } from "@/lib/util/math";
import type { Pokemon } from "@/types/pokemon";

export type BattleCanvasProps = {
  left?: Pokemon;
  right?: Pokemon;
  onKo?: (winner: "left" | "right") => void;
};

export type BattleCanvasRef = {
  triggerAttack: () => void;
};

type Phase = "IDLE" | "ATTACKING_LEFT" | "ATTACKING_RIGHT" | "HIT_RESOLVE" | "KO";

type BattleState = {
  phase: Phase;
  hpLeft: number;
  hpRight: number;
  hoveredBar: string | null;
  mousePos: { x: number; y: number };
  spritesLoaded: boolean;
  loadingSprites: boolean;
  spriteImages: {
    left: HTMLImageElement | null;
    right: HTMLImageElement | null;
  };
  currentTurn: "left" | "right";
  targetHp: { left: number; right: number };
};

type AnimationState = {
  animationTime: number;
  attackAnimationTime: number;
  projectilePos: { x: number; y: number } | null;
  shakeOffset: { left: { x: number; y: number }; right: { x: number; y: number } };
};

const BattleCanvas = forwardRef<BattleCanvasRef, BattleCanvasProps>(
  ({ left, right, onKo }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationStateRef = useRef<AnimationState>({
      animationTime: 0,
      attackAnimationTime: 0,
      projectilePos: null,
      shakeOffset: { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }
    });

    const [battleState, setBattleState] = useState<BattleState>({
      phase: "IDLE",
      hpLeft: 100,
      hpRight: 100,
      hoveredBar: null,
      mousePos: { x: 0, y: 0 },
      spritesLoaded: false,
      loadingSprites: false,
      spriteImages: {
        left: null,
        right: null
      },
      currentTurn: "left",
      targetHp: { left: 100, right: 100 }
    });

    // Expose attack function to parent
    useImperativeHandle(ref, () => ({
      triggerAttack: () => {
        if (battleState.phase === "IDLE" && left && right) {
          setBattleState(prev => ({
            ...prev,
            phase: prev.currentTurn === "left" ? "ATTACKING_LEFT" : "ATTACKING_RIGHT"
          }));
          animationStateRef.current.attackAnimationTime = 0;
          animationStateRef.current.projectilePos = null;
        }
      }
    }), [battleState.phase, left, right, battleState.currentTurn]);

    // Load sprites when Pokemon change
    useEffect(() => {
      setBattleState(prev => ({
        ...prev,
        hpLeft: 100,
        hpRight: 100,
        targetHp: { left: 100, right: 100 },
        phase: "IDLE",
        spritesLoaded: false,
        loadingSprites: false,
        spriteImages: { left: null, right: null },
        currentTurn: "left"
      }));

      if (left?.spriteUrl || right?.spriteUrl) {
        loadSprites(left, right);
      }
    }, [left?.name, right?.name]);

    const loadSprites = async (leftPokemon?: Pokemon, rightPokemon?: Pokemon) => {
      setBattleState(prev => ({ ...prev, loadingSprites: true }));

      try {
        const promises: Promise<HTMLImageElement | null>[] = [];

        // Load left sprite
        if (leftPokemon?.spriteUrl) {
          promises.push(loadImage(leftPokemon.spriteUrl));
        } else {
          promises.push(Promise.resolve(null));
        }

        // Load right sprite
        if (rightPokemon?.spriteUrl) {
          promises.push(loadImage(rightPokemon.spriteUrl));
        } else {
          promises.push(Promise.resolve(null));
        }

        const [leftImage, rightImage] = await Promise.all(promises);
        setBattleState(prev => ({
          ...prev,
          spritesLoaded: true,
          loadingSprites: false,
          spriteImages: {
            left: leftImage,
            right: rightImage
          }
        }));
      } catch (error) {
        console.warn("Failed to load some sprites:", error);
        setBattleState(prev => ({
          ...prev,
          spritesLoaded: true,
          loadingSprites: false
        }));
      }
    };

    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn(`Failed to load image: ${url}`);
          resolve(null);
        };

        img.src = url;
      });
    };

    // State machine logic - separate from animation loop
    useEffect(() => {
      if (battleState.phase === "ATTACKING_LEFT" || battleState.phase === "ATTACKING_RIGHT") {
        const timer = setTimeout(() => {
          // Transition to HIT_RESOLVE after projectile animation
          setBattleState(prev => {
            // Calculate damage
            const attacker = prev.phase === "ATTACKING_LEFT" ? left! : right!;
            const defender = prev.phase === "ATTACKING_LEFT" ? right! : left!;
            const damage = calculateDamage(attacker, defender);

            const newTargetHp = { ...prev.targetHp };
            if (prev.phase === "ATTACKING_LEFT") {
              newTargetHp.right = Math.max(0, prev.hpRight - damage);
            } else {
              newTargetHp.left = Math.max(0, prev.hpLeft - damage);
            }

            return {
              ...prev,
              phase: "HIT_RESOLVE",
              targetHp: newTargetHp
            };
          });

          // Start shake animation
          if (battleState.phase === "ATTACKING_LEFT") {
            animationStateRef.current.shakeOffset.right = { x: 5, y: 0 };
          } else {
            animationStateRef.current.shakeOffset.left = { x: -5, y: 0 };
          }
          animationStateRef.current.attackAnimationTime = 0;
        }, 600); // Projectile duration

        return () => clearTimeout(timer);
      }
    }, [battleState.phase, left, right]);

    useEffect(() => {
      if (battleState.phase === "HIT_RESOLVE") {
        const timer = setTimeout(() => {
          setBattleState(prev => {
            // Check for KO
            if (prev.targetHp.left <= 0 || prev.targetHp.right <= 0) {
              const winner = prev.targetHp.left <= 0 ? "right" : "left";
              onKo?.(winner);
              return {
                ...prev,
                phase: "KO",
                hpLeft: prev.targetHp.left,
                hpRight: prev.targetHp.right
              };
            } else {
              // Continue battle - switch turns
              return {
                ...prev,
                phase: "IDLE",
                currentTurn: prev.currentTurn === "left" ? "right" : "left",
                hpLeft: prev.targetHp.left,
                hpRight: prev.targetHp.right
              };
            }
          });

          // Reset shake and projectile
          animationStateRef.current.shakeOffset = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
          animationStateRef.current.projectilePos = null;
        }, 550); // Shake + HP tween duration

        return () => clearTimeout(timer);
      }
    }, [battleState.phase, onKo, battleState.targetHp]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      const mousePos = { x: x / dpr, y: y / dpr };

      // Check hover for HP bars
      let newHoveredBar: string | null = null;

            if (left) {
        const leftHPBarBounds = {
          x: rect.width * 0.05,
          y: rect.height * 0.2,
          width: 150,
          height: 40
        };
        if (pointInRect(mousePos.x, mousePos.y, leftHPBarBounds.x, leftHPBarBounds.y, leftHPBarBounds.width, leftHPBarBounds.height)) {
          newHoveredBar = "left-hp";
        }
      }

      if (right && !newHoveredBar) {
        const rightHPBarBounds = {
          x: rect.width * 0.75,
          y: rect.height * 0.2,
          width: 150,
          height: 40
        };
        if (pointInRect(mousePos.x, mousePos.y, rightHPBarBounds.x, rightHPBarBounds.y, rightHPBarBounds.width, rightHPBarBounds.height)) {
          newHoveredBar = "right-hp";
        }
      }

      setBattleState(prev => ({
        ...prev,
        mousePos,
        hoveredBar: newHoveredBar
      }));
    }, [left, right]);

    const handleCanvasClick = useCallback(() => {
      if (battleState.phase === "IDLE" && left && right) {
        setBattleState(prev => ({
          ...prev,
          phase: prev.currentTurn === "left" ? "ATTACKING_LEFT" : "ATTACKING_RIGHT"
        }));
        animationStateRef.current.attackAnimationTime = 0;
        animationStateRef.current.projectilePos = null;
      }
    }, [battleState.phase, left, right, battleState.currentTurn]);

    // Animation loop - only handles drawing and time-based animations
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
      resize();

      let lastTime = performance.now();

      const animate = (currentTime: number) => {
        if (!running) return;

        const deltaTime = Math.min(32, currentTime - lastTime);
        lastTime = currentTime;

        // Update animation timers
        animationStateRef.current.animationTime += deltaTime;

        // Update projectile position during attack
        if (battleState.phase === "ATTACKING_LEFT" || battleState.phase === "ATTACKING_RIGHT") {
          animationStateRef.current.attackAnimationTime += deltaTime;
          const projectileDuration = 600;
          const progress = Math.min(animationStateRef.current.attackAnimationTime / projectileDuration, 1);

          if (progress < 1) {
            const { width } = canvas.getBoundingClientRect();
            const startX = battleState.phase === "ATTACKING_LEFT" ? width * 0.25 : width * 0.75;
            const endX = battleState.phase === "ATTACKING_LEFT" ? width * 0.75 : width * 0.25;
            const midX = (startX + endX) / 2;
            const y = canvas.getBoundingClientRect().height * 0.5;

            const [x, currentY] = qbezier(
              [startX, y],
              [midX, y - 50],
              [endX, y],
              progress
            );

            animationStateRef.current.projectilePos = { x, y: currentY };
          }
        }

        // Update shake animation during hit resolve
        if (battleState.phase === "HIT_RESOLVE") {
          animationStateRef.current.attackAnimationTime += deltaTime;
          const shakeProgress = Math.min(animationStateRef.current.attackAnimationTime / 250, 1);
          const shakeDecay = Math.pow(1 - shakeProgress, 2);

          if (battleState.currentTurn === "left") {
            animationStateRef.current.shakeOffset.right.x = 5 * shakeDecay * Math.sin(animationStateRef.current.attackAnimationTime * 0.1);
          } else {
            animationStateRef.current.shakeOffset.left.x = -5 * shakeDecay * Math.sin(animationStateRef.current.attackAnimationTime * 0.1);
          }
        }

        draw(ctx, canvas, currentTime);

        animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);

      return () => {
        running = false;
        cancelAnimationFrame(animationId);
        resizeObserver.disconnect();
      };
    }, [battleState.phase, battleState.currentTurn, left, right, battleState.spriteImages]);

    // Damage calculation
    const calculateDamage = (attacker: Pokemon, defender: Pokemon): number => {
      const baseAttack = attacker.stats.atk;
      const defense = defender.stats.def;
      const typeMultiplier = getTypeMultiplier(attacker.typeMain, defender.typeMain);

      const raw = (baseAttack - defense * 0.5) * typeMultiplier;
      const jitter = 0.9 + Math.random() * 0.2;
      return clamp(Math.round(raw * jitter), 5, 40);
    };

    // Type effectiveness
    const getTypeMultiplier = (atkType: string, defType: string): number => {
      const effectiveness: Record<string, Record<string, number>> = {
        fire: { grass: 1.5, water: 0.5 },
        water: { fire: 1.5, electric: 0.5 },
        electric: { water: 1.5, grass: 0.5 },
        grass: { water: 1.5, fire: 0.5 }
      };
      return effectiveness[atkType]?.[defType] ?? 1.0;
    };

    const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
      const { width, height } = canvas.getBoundingClientRect();

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#e0f2fe");
      gradient.addColorStop(1, "#fce7f3");
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

      // Loading indicator
      if (battleState.loadingSprites) {
        ctx.fillStyle = "#6b7280";
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Loading sprites...", width / 2, height / 2);
      }

      // Left Pokemon area
      if (left) {
        const leftX = width * 0.25 + animationStateRef.current.shakeOffset.left.x;
        const leftY = groundY - 80 + animationStateRef.current.shakeOffset.left.y;
        drawPokemonArea(ctx, left, "left", leftX, leftY, time, battleState.spriteImages.left);
        drawHPBar(ctx, left.name, getCurrentHP("left"), width * 0.05, height * 0.2, "left");
      } else {
        drawPlaceholder(ctx, "Choose Left Fighter", width * 0.25, groundY - 40);
      }

      // Right Pokemon area
      if (right) {
        const rightX = width * 0.75 + animationStateRef.current.shakeOffset.right.x;
        const rightY = groundY - 80 + animationStateRef.current.shakeOffset.right.y;
        drawPokemonArea(ctx, right, "right", rightX, rightY, time, battleState.spriteImages.right);
        drawHPBar(ctx, right.name, getCurrentHP("right"), width * 0.75, height * 0.2, "right");
      } else {
        drawPlaceholder(ctx, "Choose Right Fighter", width * 0.75, groundY - 40);
      }

      // Projectile
      if (animationStateRef.current.projectilePos) {
        drawProjectile(ctx, animationStateRef.current.projectilePos.x, animationStateRef.current.projectilePos.y, battleState.phase);
      }

      // Tooltip
      if (battleState.hoveredBar) {
        drawTooltip(ctx, battleState.mousePos.x, battleState.mousePos.y, battleState.hoveredBar);
      }

      // KO Banner
      if (battleState.phase === "KO") {
        drawKoBanner(ctx, width, height);
      }

      // Turn indicator
      if (battleState.phase === "IDLE" && left && right) {
        ctx.fillStyle = "#3b82f6";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        const turnText = `${battleState.currentTurn === "left" ? left.name : right.name}'s turn`;
        ctx.fillText(turnText, width / 2, 50);
      }

      // Phase indicator
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`Phase: ${battleState.phase}`, 10, 30);
    };

    // Get current HP with tweening during hit resolve
    const getCurrentHP = (side: "left" | "right"): number => {
      if (battleState.phase === "HIT_RESOLVE") {
        const progress = Math.max(0, (animationStateRef.current.attackAnimationTime - 250) / 300);
        const currentHp = side === "left" ? battleState.hpLeft : battleState.hpRight;
        const targetHp = battleState.targetHp[side];
        return lerp(currentHp, targetHp, Math.min(progress, 1));
      }
      return side === "left" ? battleState.hpLeft : battleState.hpRight;
    };

    const drawPokemonArea = (
      ctx: CanvasRenderingContext2D,
      pokemon: Pokemon,
      side: "left" | "right",
      centerX: number,
      baseY: number,
      time: number,
      spriteImage: HTMLImageElement | null
    ) => {
      const bounce = Math.sin(time * 0.002) * 3;
      const y = baseY + bounce;
      const spriteSize = 80;

      if (spriteImage) {
        drawSpriteAspectFit(ctx, spriteImage, centerX, y - spriteSize/2, spriteSize, spriteSize);
      } else {
        const typeColors: Record<string, string> = {
          fire: "#ef4444", water: "#3b82f6", electric: "#eab308", grass: "#22c55e",
          psychic: "#a855f7", ice: "#06b6d4", dragon: "#8b5cf6", dark: "#374151",
          fighting: "#dc2626", poison: "#9333ea", ground: "#a3a3a3", flying: "#60a5fa",
          bug: "#84cc16", rock: "#78716c", ghost: "#6b7280", steel: "#71717a", normal: "#9ca3af"
        };

        const color = typeColors[pokemon.typeMain] || "#9ca3af";
        ctx.fillStyle = color;
        ctx.fillRect(centerX - spriteSize/2, y - spriteSize/2, spriteSize, spriteSize);
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - spriteSize/2, y - spriteSize/2, spriteSize, spriteSize);
      }

      // Name
      ctx.fillStyle = "#1f2937";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(pokemon.name, centerX, y + spriteSize/2 + 20);

      // Type badge
      const typeColors: Record<string, string> = {
        fire: "#ef4444", water: "#3b82f6", electric: "#eab308", grass: "#22c55e",
        psychic: "#a855f7", ice: "#06b6d4", dragon: "#8b5cf6", dark: "#374151",
        fighting: "#dc2626", poison: "#9333ea", ground: "#a3a3a3", flying: "#60a5fa",
        bug: "#84cc16", rock: "#78716c", ghost: "#6b7280", steel: "#71717a", normal: "#9ca3af"
      };

      const color = typeColors[pokemon.typeMain] || "#9ca3af";
      ctx.fillStyle = color;
      ctx.fillRect(centerX - 20, y + spriteSize/2 + 25, 40, 15);
      ctx.fillStyle = "white";
      ctx.font = "10px sans-serif";
      ctx.fillText(pokemon.typeMain, centerX, y + spriteSize/2 + 35);
    };

    const drawSpriteAspectFit = (
      ctx: CanvasRenderingContext2D,
      image: HTMLImageElement,
      centerX: number,
      centerY: number,
      maxWidth: number,
      maxHeight: number
    ) => {
      const imgAspect = image.width / image.height;
      const containerAspect = maxWidth / maxHeight;

      let drawWidth, drawHeight;

      if (imgAspect > containerAspect) {
        drawWidth = maxWidth;
        drawHeight = maxWidth / imgAspect;
      } else {
        drawHeight = maxHeight;
        drawWidth = maxHeight * imgAspect;
      }

      const x = centerX - drawWidth / 2;
      const y = centerY - drawHeight / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, x, y, drawWidth, drawHeight);
    };

    const drawPlaceholder = (ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number) => {
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(centerX - 30, y - 30, 60, 60);
      ctx.setLineDash([]);

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

      const isHovered = battleState.hoveredBar === `${side}-hp`;

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
      ctx.fillText(`${name} HP: ${Math.round(hp)}/100`, x, y - 5);

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

      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(x + 10, y - 25, textWidth + padding * 2, fontSize + padding);

      ctx.fillStyle = "white";
      ctx.fillText(text, x + 10 + padding, y - 10);
    };

    const drawProjectile = (ctx: CanvasRenderingContext2D, x: number, y: number, phase: Phase) => {
      const isLeftAttacking = phase === "ATTACKING_LEFT";
      const attacker = isLeftAttacking ? left : right;
      const typeColors: Record<string, string> = {
        fire: "#ef4444", water: "#3b82f6", electric: "#eab308", grass: "#22c55e"
      };
      const color = typeColors[attacker?.typeMain || "normal"] || "#9ca3af";

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawKoBanner = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.strokeText("K.O.!", width / 2, height / 2);
      ctx.fillText("K.O.!", width / 2, height / 2);

      const winner = battleState.hpLeft <= 0 ? right?.name : left?.name;
      if (winner) {
        ctx.fillStyle = "white";
        ctx.font = "24px sans-serif";
        ctx.fillText(`${winner} wins!`, width / 2, height / 2 + 60);
      }
    };

    return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-[360px] rounded-lg border bg-white cursor-crosshair"
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          aria-label={`Battle canvas. ${left?.name || "No left fighter"} vs ${right?.name || "No right fighter"}. Left HP: ${battleState.hpLeft}, Right HP: ${battleState.hpRight}`}
        />
        {battleState.phase !== "IDLE" && battleState.phase !== "KO" && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
            {battleState.phase === "ATTACKING_LEFT" || battleState.phase === "ATTACKING_RIGHT"
              ? "Attacking..."
              : "Hit!"}
          </div>
        )}
      </div>
    );
  }
);

BattleCanvas.displayName = "BattleCanvas";

export default BattleCanvas;
