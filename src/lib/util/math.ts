export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const qbezier = (
  p0: [number, number], 
  p1: [number, number], 
  p2: [number, number], 
  t: number
) => {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], 
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
  ] as const;
};

export const pointInRect = (
  px: number, py: number, 
  rx: number, ry: number, 
  rw: number, rh: number
) => {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
};
