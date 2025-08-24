export function getDevicePixelRatio(): number {
  return Math.max(1, Math.floor(window.devicePixelRatio || 1));
}

export function setupCanvasDPR(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = getDevicePixelRatio();
  const rect = canvas.parentElement!.getBoundingClientRect();
  
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(240, Math.floor(rect.height));
  
  // Set CSS size
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  
  // Set actual canvas size with DPR scaling
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  
  // Scale the drawing context
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
  return { width, height, dpr };
}
