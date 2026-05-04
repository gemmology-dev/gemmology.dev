let cached: boolean | null = null;

export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  if (cached !== null) return cached;

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    cached = !!gl && gl instanceof WebGLRenderingContext === false
      ? gl !== null
      : !!gl;
    return cached;
  } catch {
    cached = false;
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
