/**
 * Color utility functions using the culori library.
 *
 * All internal color operations use OKLCH for perceptual uniformity.
 *
 * @module color/colors
 */

import { converter, parse, type Oklch, type Rgb } from 'culori';

// ---------------------------------------------------------------------------
// Converters
// ---------------------------------------------------------------------------

const toOklch = converter('oklch');
const toRgb = converter('rgb');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a hex color string (e.g., `#ff0000`) to an OKLCH string.
 *
 * Returns a string in the format `oklch(L C H)` with 4 decimal places.
 * Returns `null` if the input cannot be parsed.
 */
export function hexToOklch(hex: string): string {
  const rgb = parse(hex);
  if (!rgb) return 'oklch(0 0 0)';
  const result = toOklch(rgb) as Oklch;
  return formatOklch(result);
}

/**
 * Convert an OKLCH string or object to a hex color string.
 *
 * Returns a string in the format `#rrggbb`.
 * Returns `#000000` if the input cannot be parsed.
 */
export function oklchToHex(oklchInput: string): string {
  const parsed = parse(oklchInput);
  if (!parsed) return '#000000';
  const rgb = toRgb(parsed) as Rgb | undefined;
  if (!rgb || typeof rgb === 'string') return '#000000';
  const r = Math.round((rgb.r ?? 0) * 255);
  const g = Math.round((rgb.g ?? 0) * 255);
  const b = Math.round((rgb.b ?? 0) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Compute the perceptual color distance between two colors.
 *
 * Uses culori's built-in `oklch` distance in deltaEOK.
 * Both inputs can be any parseable color string (hex, oklch, rgb, etc.).
 */
export function colorDistance(color1: string, color2: string): number {
  const c1 = parse(color1);
  const c2 = parse(color2);
  if (!c1 || !c2) return Infinity;

  // Convert to OKLCH for perceptual distance
  const ok1 = toOklch(c1) as Oklch;
  const ok2 = toOklch(c2) as Oklch;

  // Euclidean distance in OKLCH space
  const dl = (ok1.l ?? 0) - (ok2.l ?? 0);
  const dc = (ok1.c ?? 0) - (ok2.c ?? 0);

  let dh = (ok1.h ?? 0) - (ok2.h ?? 0);
  // Wrap hue difference to [-180, 180]
  while (dh > 180) dh -= 360;
  while (dh < -180) dh += 360;

  // Weight hue less since it's circular
  return Math.sqrt(dl * dl + dc * dc + (dh / 100) * (dh / 100));
}

/**
 * Find the nearest color in a palette to a target color.
 *
 * @param target - Any parseable color string
 * @param palette - Array of OKLCH color strings to search
 * @returns The palette entry closest to `target`
 */
export function nearestColor(target: string, palette: string[]): string {
  if (palette.length === 0) return 'oklch(0 0 0)';
  if (palette.length === 1) return palette[0]!;

  let bestColor = palette[0]!;
  let bestDist = Infinity;

  for (const color of palette) {
    const dist = colorDistance(target, color);
    if (dist < bestDist) {
      bestDist = dist;
      bestColor = color;
    }
  }

  return bestColor;
}

/**
 * Quantize a set of pixel colors into a reduced palette using simple k-means.
 *
 * @param pixels - Array of any parseable color strings
 * @param maxColors - Maximum number of colors in the output palette (2-256)
 * @returns Array of OKLCH color strings representing the palette
 */
export function quantizeColors(pixels: string[], maxColors: number): string[] {
  const k = Math.max(2, Math.min(256, maxColors));
  if (pixels.length === 0) return [];

  // Parse all pixels to OKLCH
  const oklchPixels: Oklch[] = [];
  for (const pixel of pixels) {
    const parsed = parse(pixel);
    if (parsed) {
      const o = toOklch(parsed) as Oklch;
      if (o.l !== undefined && o.c !== undefined && o.h !== undefined) {
        oklchPixels.push(o);
      }
    }
  }

  if (oklchPixels.length === 0) return [];

  // Initialize centroids using k-means++ initialization
  const centroids: Oklch[] = [oklchPixels[Math.floor(Math.random() * oklchPixels.length)]!];

  for (let i = 1; i < k; i++) {
    // Find the pixel furthest from any existing centroid
    let maxDist = -1;
    let bestPixel: Oklch = oklchPixels[0]!;

    for (const pixel of oklchPixels) {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = oklchDist(pixel, centroid);
        if (dist < minDist) minDist = dist;
      }
      if (minDist > maxDist) {
        maxDist = minDist;
        bestPixel = pixel;
      }
    }

    centroids.push(bestPixel);
  }

  // Run k-means iterations
  const maxIterations = 20;
  const assignments = new Int32Array(oklchPixels.length);

  for (let iter = 0; iter < maxIterations; iter++) {
    let converged = true;

    // Assignment step
    for (let i = 0; i < oklchPixels.length; i++) {
      const pixel = oklchPixels[i]!;
      let bestCluster = 0;
      let bestDist = Infinity;

      for (let j = 0; j < k; j++) {
        const dist = oklchDist(pixel, centroids[j]!);
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = j;
        }
      }

      if (assignments[i] !== bestCluster) {
        converged = false;
        assignments[i] = bestCluster;
      }
    }

    if (converged) break;

    // Update step
    const sums: Array<{ l: number; c: number; h: number; count: number }> = Array.from({ length: k }, () => ({
      l: 0,
      c: 0,
      h: 0,
      count: 0,
    }));

    for (let i = 0; i < oklchPixels.length; i++) {
      const cluster = assignments[i]!;
      const pixel = oklchPixels[i]!;
      sums[cluster]!.l += pixel.l ?? 0;
      sums[cluster]!.c += pixel.c ?? 0;
      sums[cluster]!.h += pixel.h ?? 0;
      sums[cluster]!.count += 1;
    }

    for (let j = 0; j < k; j++) {
      const s = sums[j]!;
      if (s.count > 0) {
        // Handle hue circular mean
        const avgH = circularMean(oklchPixels.filter((_, i) => assignments[i] === j).map((p) => p.h ?? 0));
        centroids[j] = { mode: 'oklch', l: s.l / s.count, c: s.c / s.count, h: avgH };
      }
    }
  }

  return centroids.map(formatOklch);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatOklch(color: Oklch): string {
  return `oklch(${(color.l ?? 0).toFixed(4)} ${(color.c ?? 0).toFixed(4)} ${(color.h ?? 0).toFixed(4)})`;
}

function oklchDist(a: Oklch, b: Oklch): number {
  const dl = (a.l ?? 0) - (b.l ?? 0);
  const dc = (a.c ?? 0) - (b.c ?? 0);
  let dh = (a.h ?? 0) - (b.h ?? 0);
  while (dh > 180) dh -= 360;
  while (dh < -180) dh += 360;
  return Math.sqrt(dl * dl + dc * dc + (dh / 100) * (dh / 100));
}

/** Compute circular mean of hue angles. */
function circularMean(angles: number[]): number {
  if (angles.length === 0) return 0;

  // Convert to radians and compute circular mean
  let sinSum = 0;
  let cosSum = 0;

  for (const angle of angles) {
    const rad = (angle * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }

  let mean = (Math.atan2(sinSum / angles.length, cosSum / angles.length) * 180) / Math.PI;
  if (mean < 0) mean += 360;

  return mean;
}
