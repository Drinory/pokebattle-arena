"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { setupCanvasDPR } from "@/lib/util/dpr";
import { pointInRect, qbezier, clamp, lerp } from "@/lib/util/math";
import { playAudio } from "@/lib/util/audio";
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
  spritesLoaded: boolean;
  loadingSprites: boolean;
  spriteImages: {
    left: HTMLImageElement | null;
    right: HTMLImageElement | null;
  };
  currentTurn: "left" | "right";
  targetHp: { left: number; right: number };
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type AnimationState = {
  animationTime: number;
  attackAnimationTime: number;
  projectilePos: { x: number; y: number } | null;
  shakeOffset: { left: { x: number; y: number }; right: { x: number; y: number } };
  hoveredBar: string | null;
  mousePos: { x: number; y: number };
  particles: Particle[];
};

const BattleCanvas = forwardRef<BattleCanvasRef, BattleCanvasProps>(
  ({ left, right, onKo }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationStateRef = useRef<AnimationState>({
      animationTime: 0,
      attackAnimationTime: 0,
      projectilePos: null,
      shakeOffset: { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
      hoveredBar: null,
      mousePos: { x: 0, y: 0 },
      particles: []
    });

    // Refs to store current values for the animation loop without causing re-renders
    const battleStateRef = useRef<BattleState | null>(null);
    const leftPokemonRef = useRef<Pokemon | undefined>(left);
    const rightPokemonRef = useRef<Pokemon | undefined>(right);

    const [battleState, setBattleState] = useState<BattleState>({
      phase: "IDLE",
      hpLeft: 100,
      hpRight: 100,
      spritesLoaded: false,
      loadingSprites: false,
      spriteImages: {
        left: null,
        right: null
      },
      currentTurn: "left",
      targetHp: { left: 100, right: 100 }
    });

    // Keep refs in sync with current values
    useEffect(() => {
      battleStateRef.current = battleState;
    }, [battleState]);

    useEffect(() => {
      leftPokemonRef.current = left;
    }, [left]);

    useEffect(() => {
      rightPokemonRef.current = right;
    }, [right]);

    // Expose attack function to parent
    useImperativeHandle(ref, () => ({
      triggerAttack: () => {
        const currentBattleState = battleStateRef.current;
        const currentLeft = leftPokemonRef.current;
        const currentRight = rightPokemonRef.current;

        if (currentBattleState?.phase === "IDLE" && currentLeft && currentRight) {
          // Play attacker's cry
          const attacker = currentBattleState.currentTurn === "left" ? currentLeft : currentRight;
          if (attacker.cryUrl) {
            playAudio(attacker.cryUrl, 0.4);
          }

          // Batch state update and animation reset for better performance
          setBattleState(prev => ({
            ...prev,
            phase: prev.currentTurn === "left" ? "ATTACKING_LEFT" : "ATTACKING_RIGHT"
          }));

          // Reset animation state immediately to avoid frame delays
          const animState = animationStateRef.current;
          animState.attackAnimationTime = 0;
          animState.projectilePos = null;
        }
      }
    }), []); // Remove dependencies to make imperative handle stable

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

    const loadSprites = useCallback(async (leftPokemon?: Pokemon, rightPokemon?: Pokemon) => {
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
    }, []);

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
            // Calculate damage using current pokemon refs
            const currentLeft = leftPokemonRef.current;
            const currentRight = rightPokemonRef.current;

            if (!currentLeft || !currentRight) return prev;

            const attacker = prev.phase === "ATTACKING_LEFT" ? currentLeft : currentRight;
            const defender = prev.phase === "ATTACKING_LEFT" ? currentRight : currentLeft;
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

          // Start shake animation and particle burst
          const canvas = canvasRef.current;
          if (canvas) {
            const { width, height } = canvas.getBoundingClientRect();
            const groundY = height * 0.8;

            if (battleState.phase === "ATTACKING_LEFT") {
              animationStateRef.current.shakeOffset.right = { x: 5, y: 0 };
              // Create particles at right Pokemon position
              createParticles(width * 0.75, groundY - 80);
            } else {
              animationStateRef.current.shakeOffset.left = { x: -5, y: 0 };
              // Create particles at left Pokemon position
              createParticles(width * 0.25, groundY - 80);
            }
          }
          animationStateRef.current.attackAnimationTime = 0;
        }, 600); // Projectile duration

        return () => clearTimeout(timer);
      }
    }, [battleState.phase]); // Remove left, right dependencies

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

      // Check hover for HP bars with responsive positioning
      let newHoveredBar: string | null = null;
      const currentLeft = leftPokemonRef.current;
      const currentRight = rightPokemonRef.current;

      // Responsive bar width calculation (matches drawHPBar)
      const maxBarWidth = Math.min(150, rect.width * 0.25);

      if (currentLeft) {
        const leftHPBarBounds = {
          x: rect.width * 0.05,
          y: rect.height * 0.2,
          width: maxBarWidth,
          height: 40
        };
        if (pointInRect(mousePos.x, mousePos.y, leftHPBarBounds.x, leftHPBarBounds.y, leftHPBarBounds.width, leftHPBarBounds.height)) {
          newHoveredBar = "left-hp";
        }
      }

      if (currentRight && !newHoveredBar) {
        const rightHPBarBounds = {
          x: rect.width - maxBarWidth - (rect.width * 0.05),
          y: rect.height * 0.2,
          width: maxBarWidth,
          height: 40
        };
        if (pointInRect(mousePos.x, mousePos.y, rightHPBarBounds.x, rightHPBarBounds.y, rightHPBarBounds.width, rightHPBarBounds.height)) {
          newHoveredBar = "right-hp";
        }
      }

      // Update animation state ref instead of React state to avoid re-renders
      animationStateRef.current.mousePos = mousePos;
      animationStateRef.current.hoveredBar = newHoveredBar;
    }, []); // Remove dependencies to make mouse handling stable

    const handleCanvasClick = useCallback(() => {
      const currentBattleState = battleStateRef.current;
      const currentLeft = leftPokemonRef.current;
      const currentRight = rightPokemonRef.current;

      if (currentBattleState?.phase === "IDLE" && currentLeft && currentRight) {
        // Play attacker's cry
        const attacker = currentBattleState.currentTurn === "left" ? currentLeft : currentRight;
        if (attacker.cryUrl) {
          playAudio(attacker.cryUrl, 0.4);
        }

        // Batch state update and animation reset for better performance
        setBattleState(prev => ({
          ...prev,
          phase: prev.currentTurn === "left" ? "ATTACKING_LEFT" : "ATTACKING_RIGHT"
        }));

        // Reset animation state immediately to avoid frame delays
        const animState = animationStateRef.current;
        animState.attackAnimationTime = 0;
        animState.projectilePos = null;
      }
    }, []); // Remove dependencies to make click handling stable

    // Stable animation loop - minimal dependencies to prevent restarts
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

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

        // Update particles
        updateParticles(deltaTime);

        // Get current battle state from ref (always up to date)
        const currentBattleState = battleStateRef.current;
        if (!currentBattleState) return;

        // Update projectile position during attack
        if (currentBattleState.phase === "ATTACKING_LEFT" || currentBattleState.phase === "ATTACKING_RIGHT") {
          animationStateRef.current.attackAnimationTime += deltaTime;
          const projectileDuration = 600;
          const progress = Math.min(animationStateRef.current.attackAnimationTime / projectileDuration, 1);

          if (progress < 1) {
            const { width } = canvas.getBoundingClientRect();
            const startX = currentBattleState.phase === "ATTACKING_LEFT" ? width * 0.25 : width * 0.75;
            const endX = currentBattleState.phase === "ATTACKING_LEFT" ? width * 0.75 : width * 0.25;
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
        if (currentBattleState.phase === "HIT_RESOLVE") {
          animationStateRef.current.attackAnimationTime += deltaTime;
          const shakeProgress = Math.min(animationStateRef.current.attackAnimationTime / 250, 1);
          const shakeDecay = Math.pow(1 - shakeProgress, 2);

          if (currentBattleState.currentTurn === "left") {
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
    }, []); // Empty dependency array for stable animation loop

    // Create particle burst on hit
    const createParticles = useCallback((x: number, y: number) => {
      const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#45b7d1', '#96ceb4'];
      const particles: Particle[] = [];

      // Create 8-12 particles for impact effect
      const particleCount = 8 + Math.floor(Math.random() * 5);

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 3;
        const life = 40 + Math.random() * 20;

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 2, // Slight upward bias
          life,
          maxLife: life,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 3
        });
      }

      animationStateRef.current.particles.push(...particles);
    }, []);

    // Update particle physics
    const updateParticles = useCallback((deltaTime: number) => {
      const particles = animationStateRef.current.particles;

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // Update position
        particle.x += particle.vx * deltaTime * 0.1;
        particle.y += particle.vy * deltaTime * 0.1;

        // Update velocity (gravity and friction)
        particle.vy += 0.2 * deltaTime * 0.1; // Gravity
        particle.vx *= 0.98; // Friction
        particle.vy *= 0.98;

        // Update life
        particle.life -= deltaTime * 0.1;

        // Remove dead particles
        if (particle.life <= 0) {
          particles.splice(i, 1);
        }
      }
    }, []);

    // Damage calculation
    const calculateDamage = useCallback((attacker: Pokemon, defender: Pokemon): number => {
      const baseAttack = attacker.stats.atk;
      const defense = defender.stats.def;
      const typeMultiplier = getTypeMultiplier(attacker.typeMain, defender.typeMain);

      const raw = (baseAttack - defense * 0.5) * typeMultiplier;
      const jitter = 0.9 + Math.random() * 0.2;
      return clamp(Math.round(raw * jitter), 5, 40);
    }, []);

    // Type effectiveness - comprehensive matrix for more strategic battles
    const getTypeMultiplier = (atkType: string, defType: string): number => {
      const effectiveness: Record<string, Record<string, number>> = {
        // Fire type
        fire: { grass: 2.0, ice: 2.0, bug: 2.0, steel: 2.0, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
        // Water type
        water: { fire: 2.0, ground: 2.0, rock: 2.0, water: 0.5, grass: 0.5, dragon: 0.5 },
        // Electric type
        electric: { water: 2.0, flying: 2.0, grass: 0.5, electric: 0.5, dragon: 0.5, ground: 0.0 },
        // Grass type
        grass: { water: 2.0, ground: 2.0, rock: 2.0, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
        // Ice type
        ice: { grass: 2.0, ground: 2.0, flying: 2.0, dragon: 2.0, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
        // Fighting type
        fighting: { normal: 2.0, ice: 2.0, rock: 2.0, dark: 2.0, steel: 2.0, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0.0 },
        // Poison type
        poison: { grass: 2.0, fairy: 2.0, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0.0 },
        // Ground type
        ground: { fire: 2.0, electric: 2.0, poison: 2.0, rock: 2.0, steel: 2.0, grass: 0.5, bug: 0.5, flying: 0.0 },
        // Flying type
        flying: { electric: 0.5, ice: 0.5, rock: 0.5, steel: 0.5, grass: 2.0, fighting: 2.0, bug: 2.0 },
        // Psychic type
        psychic: { fighting: 2.0, poison: 2.0, psychic: 0.5, steel: 0.5, dark: 0.0 },
        // Bug type
        bug: { grass: 2.0, psychic: 2.0, dark: 2.0, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
        // Rock type
        rock: { fire: 2.0, ice: 2.0, flying: 2.0, bug: 2.0, fighting: 0.5, ground: 0.5, steel: 0.5 },
        // Ghost type
        ghost: { psychic: 2.0, ghost: 2.0, dark: 0.5, normal: 0.0 },
        // Dragon type
        dragon: { dragon: 2.0, steel: 0.5, fairy: 0.0 },
        // Dark type
        dark: { fighting: 0.5, ghost: 0.5, dark: 0.5, psychic: 2.0 },
        // Steel type
        steel: { ice: 2.0, rock: 2.0, fairy: 2.0, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
        // Fairy type
        fairy: { fighting: 2.0, dragon: 2.0, dark: 2.0, fire: 0.5, poison: 0.5, steel: 0.5 },
        // Normal type
        normal: { rock: 0.5, ghost: 0.0, steel: 0.5 }
      };
      return effectiveness[atkType]?.[defType] ?? 1.0;
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
      const { width, height } = canvas.getBoundingClientRect();
      const currentBattleState = battleStateRef.current; // Get current state from ref
      const currentLeft = leftPokemonRef.current;
      const currentRight = rightPokemonRef.current;
      const animState = animationStateRef.current;

      if (!currentBattleState) return;

      // Responsive scaling helper - scales based on canvas width
      const getResponsiveSize = (baseSize: number) => Math.max(baseSize * 0.6, Math.min(baseSize, width * baseSize / 800));
      const getResponsiveFontSize = (baseSize: number) => Math.max(baseSize * 0.75, Math.min(baseSize, width * baseSize / 800));

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
      if (currentBattleState.loadingSprites) {
        ctx.fillStyle = "#6b7280";
        ctx.font = `${getResponsiveFontSize(16)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Loading sprites...", width / 2, height / 2);
      }

      // Left Pokemon area
      if (currentLeft) {
        const leftX = width * 0.25 + animState.shakeOffset.left.x;
        const leftY = groundY - 80 + animState.shakeOffset.left.y;
        drawPokemonArea(ctx, currentLeft, "left", leftX, leftY, time, currentBattleState.spriteImages.left, getResponsiveSize(80), getResponsiveFontSize);
        // Left HP bar positioned from left edge with padding
        const leftHPBarX = width * 0.05;
        drawHPBar(ctx, currentLeft.name, getCurrentHP("left"), leftHPBarX, height * 0.2, "left", width);
      } else {
        drawPlaceholder(ctx, "Choose Left Fighter", width * 0.25, groundY - 40, getResponsiveFontSize);
      }

      // Right Pokemon area
      if (currentRight) {
        const rightX = width * 0.75 + animState.shakeOffset.right.x;
        const rightY = groundY - 80 + animState.shakeOffset.right.y;
        drawPokemonArea(ctx, currentRight, "right", rightX, rightY, time, currentBattleState.spriteImages.right, getResponsiveSize(80), getResponsiveFontSize);
        // Right HP bar positioned from right edge to prevent overflow
        const maxBarWidth = Math.min(150, width * 0.25);
        const rightHPBarX = width - maxBarWidth - (width * 0.05);
        drawHPBar(ctx, currentRight.name, getCurrentHP("right"), rightHPBarX, height * 0.2, "right", width);
      } else {
        drawPlaceholder(ctx, "Choose Right Fighter", width * 0.75, groundY - 40, getResponsiveFontSize);
      }

      // Projectile
      if (animState.projectilePos) {
        drawProjectile(ctx, animState.projectilePos.x, animState.projectilePos.y, currentBattleState.phase);
      }

      // Particles
      drawParticles(ctx, animState.particles);

      // Tooltip (using ref data instead of state)
      if (animState.hoveredBar && (currentLeft || currentRight)) {
        const pokemon = animState.hoveredBar === "left-hp" ? currentLeft : currentRight;
        if (pokemon) {
          drawPokemonTooltip(ctx, animState.mousePos.x, animState.mousePos.y, pokemon, getCurrentHP(animState.hoveredBar === "left-hp" ? "left" : "right"));
        }
      }

      // KO Banner
      if (currentBattleState.phase === "KO") {
        drawKoBanner(ctx, width, height, getResponsiveFontSize);
      }

      // Turn indicator
      if (currentBattleState.phase === "IDLE" && currentLeft && currentRight) {
        ctx.fillStyle = "#3b82f6";
        ctx.font = `${getResponsiveFontSize(14)}px sans-serif`;
        ctx.textAlign = "center";
        const turnText = `${currentBattleState.currentTurn === "left" ? currentLeft.name : currentRight.name}'s turn`;
        ctx.fillText(turnText, width / 2, 50);
      }

      // Phase indicator
      ctx.fillStyle = "#6b7280";
      ctx.font = `${getResponsiveFontSize(10)}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText(`Phase: ${currentBattleState.phase}`, 10, 30);
    }, []); // Remove all dependencies to make draw function stable

    // Get current HP with tweening during hit resolve
    const getCurrentHP = (side: "left" | "right"): number => {
      const currentBattleState = battleStateRef.current;
      if (!currentBattleState) return 100;

      if (currentBattleState.phase === "HIT_RESOLVE") {
        const progress = Math.max(0, (animationStateRef.current.attackAnimationTime - 250) / 300);
        const currentHp = side === "left" ? currentBattleState.hpLeft : currentBattleState.hpRight;
        const targetHp = currentBattleState.targetHp[side];
        return lerp(currentHp, targetHp, Math.min(progress, 1));
      }
      return side === "left" ? currentBattleState.hpLeft : currentBattleState.hpRight;
    };

    const drawPokemonArea = (
      ctx: CanvasRenderingContext2D,
      pokemon: Pokemon,
      side: "left" | "right",
      centerX: number,
      baseY: number,
      time: number,
      spriteImage: HTMLImageElement | null,
      spriteSize: number,
      getFontSize: (size: number) => number
    ) => {
      const bounce = Math.sin(time * 0.002) * 3;
      const y = baseY + bounce;

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
      ctx.font = `${getFontSize(14)}px sans-serif`;
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
      const badgeWidth = Math.max(40, getFontSize(10) * 4);
      const badgeHeight = Math.max(15, getFontSize(10) + 5);
      ctx.fillRect(centerX - badgeWidth/2, y + spriteSize/2 + 25, badgeWidth, badgeHeight);
      ctx.fillStyle = "white";
      ctx.font = `${getFontSize(10)}px sans-serif`;
      ctx.fillText(pokemon.typeMain, centerX, y + spriteSize/2 + 25 + badgeHeight/2 + getFontSize(10)/3);
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

    const drawPlaceholder = (ctx: CanvasRenderingContext2D, text: string, centerX: number, y: number, getFontSize: (size: number) => number) => {
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.strokeRect(centerX - 30, y - 30, 60, 60);
      ctx.setLineDash([]);

      ctx.fillStyle = "#6b7280";
      ctx.font = `${getFontSize(12)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(text, centerX, y + 50);
    };

    const drawHPBar = (
      ctx: CanvasRenderingContext2D,
      name: string,
      hp: number,
      x: number,
      y: number,
      side: "left" | "right",
      canvasWidth: number
    ) => {
      // Responsive bar width: max 150px, but scale down on small screens
      const maxBarWidth = Math.min(150, canvasWidth * 0.25);
      const barWidth = maxBarWidth;
      const barHeight = 20;

      const isHovered = animationStateRef.current.hoveredBar === `${side}-hp`;

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
      const fontSize = Math.max(10, Math.min(12, canvasWidth * 12 / 800));
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`${name} HP: ${Math.round(hp)}/100`, x, y - 5);

      // Hover highlight
      if (isHovered) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
      }
    };

    const drawPokemonTooltip = (ctx: CanvasRenderingContext2D, x: number, y: number, pokemon: Pokemon, currentHp: number) => {
      const padding = 12;
      const lineHeight = 18;
      const fontSize = 12;
      const titleFontSize = 14;
      
      ctx.font = `${fontSize}px sans-serif`;
      
      // Prepare tooltip content
      const lines = [
        `${pokemon.name.toUpperCase()}`,
        `Type: ${pokemon.typeMain}`,
        `HP: ${Math.round(currentHp)}/100`,
        ``,
        `STATS:`,
        `ATK: ${pokemon.stats.atk}  DEF: ${pokemon.stats.def}`,
        `SPA: ${pokemon.stats.spa}  SPD: ${pokemon.stats.spd}`,
        `SPE: ${pokemon.stats.spe}`
      ];
      
      // Calculate tooltip dimensions
      ctx.font = `bold ${titleFontSize}px sans-serif`;
      const titleWidth = ctx.measureText(lines[0]).width;
      ctx.font = `${fontSize}px sans-serif`;
      
      const maxWidth = Math.max(
        titleWidth,
        ...lines.slice(1).map(line => ctx.measureText(line).width)
      );
      
      const tooltipWidth = maxWidth + padding * 2;
      const tooltipHeight = lines.length * lineHeight + padding * 2;
      
      // Position tooltip to avoid edges
      const canvas = ctx.canvas;
      let tooltipX = x + 15;
      let tooltipY = y - tooltipHeight - 10;
      
      // Adjust if tooltip would go off-screen
      if (tooltipX + tooltipWidth > canvas.width) {
        tooltipX = x - tooltipWidth - 15;
      }
      if (tooltipY < 0) {
        tooltipY = y + 15;
      }
      
      // Draw tooltip background with border
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
      
      ctx.strokeStyle = pokemon.typeMain === "fire" ? "#ef4444" : 
                       pokemon.typeMain === "water" ? "#3b82f6" :
                       pokemon.typeMain === "electric" ? "#eab308" :
                       pokemon.typeMain === "grass" ? "#22c55e" : "#9ca3af";
      ctx.lineWidth = 2;
      ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
      
      // Draw content
      let currentY = tooltipY + padding + lineHeight;
      
      lines.forEach((line, index) => {
        if (index === 0) {
          // Title
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${titleFontSize}px sans-serif`;
        } else if (line === "STATS:") {
          // Stats header
          ctx.fillStyle = "#94a3b8";
          ctx.font = `bold ${fontSize}px sans-serif`;
        } else if (line === "") {
          // Skip empty lines but advance Y
          currentY += lineHeight * 0.5;
          return;
        } else {
          // Regular content
          ctx.fillStyle = "#e2e8f0";
          ctx.font = `${fontSize}px sans-serif`;
        }
        
        ctx.fillText(line, tooltipX + padding, currentY);
        currentY += lineHeight;
      });
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

    const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
      particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        const size = particle.size * alpha;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = particle.color;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
    };

    const drawKoBanner = (ctx: CanvasRenderingContext2D, width: number, height: number, getFontSize: (size: number) => number) => {
      const currentBattleState = battleStateRef.current;
      const currentLeft = leftPokemonRef.current;
      const currentRight = rightPokemonRef.current;

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#ef4444";
      const koFontSize = getFontSize(48);
      ctx.font = `bold ${koFontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.strokeText("K.O.!", width / 2, height / 2);
      ctx.fillText("K.O.!", width / 2, height / 2);

      if (currentBattleState) {
        const winner = currentBattleState.hpLeft <= 0 ? currentRight?.name : currentLeft?.name;
        if (winner) {
          ctx.fillStyle = "white";
          ctx.font = `${getFontSize(24)}px sans-serif`;
          ctx.fillText(`${winner} wins!`, width / 2, height / 2 + 60);
        }
      }
    };

    return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-[min(360px,50vh)] sm:h-[360px] rounded-lg border bg-white cursor-crosshair"
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
