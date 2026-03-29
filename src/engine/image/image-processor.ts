/**
 * Image processing for converting raster images to pattern grids.
 *
 * Handles resizing, color quantization, dithering, and confetti reduction.
 *
 * @module image/image-processor
 */

import { converter, parse, type Oklch } from 'culori';
import { quantizeColors } from '@/engine/color/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageProcessOptions {
  /** Target grid width in stitches/cells */
  width: number;
  /** Target grid height in rows/cells */
  height: number;
  /** Maximum number of colors in the palette (2-250) */
  maxColors: number;
  /** Dithering algorithm to apply */
  dithering: 'none' | 'floyd-steinberg' | 'ordered' | 'atkinson';
  /** Confetti reduction strength (0 = off, 1 = max) */
  confettiReduction: number;
  /** Color space for quantization */
  colorSpace: 'oklch' | 'rgb';
}

export interface ProcessedImage {
  /** Grid width */
  width: number;
  /** Grid height */
  height: number;
  /** Cells with assigned colors */
  cells: Array<{ row: number; col: number; color: string }>;
  /** Palette of OKLCH color strings used */
  palette: string[];
  /** Confetti score 0-100 (lower is better) */
  confettiScore: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const toOklch = converter('oklch');

/**
 * Process an image into a pattern grid.
 *
 * Pipeline:
 * 1. Resize image to target dimensions (area-average downsampling)
 * 2. Convert all pixels to OKLCH
 * 3. Quantize colors using k-means
 * 4. Map each pixel to nearest palette color
 * 5. Apply dithering if selected
 * 6. Apply confetti reduction if enabled
 * 7. Calculate confetti score
 */
export function processImage(imageData: ImageData, options: ImageProcessOptions): ProcessedImage {
  const { width, height, maxColors, dithering, confettiReduction } = options;
  const srcW = imageData.width;
  const srcH = imageData.height;
  const srcData = imageData.data;

  // Step 1: Resize using area-average downsampling
  const resizedPixels: Array<{ r: number; g: number; b: number; a: number }> = [];
  const scaleX = srcW / width;
  const scaleY = srcH / height;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Source rectangle for this cell
      const srcColStart = Math.floor(col * scaleX);
      const srcRowStart = Math.floor(row * scaleY);
      const srcColEnd = Math.min(Math.ceil((col + 1) * scaleX), srcW);
      const srcRowEnd = Math.min(Math.ceil((row + 1) * scaleY), srcH);

      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      let count = 0;

      for (let sy = srcRowStart; sy < srcRowEnd; sy++) {
        for (let sx = srcColStart; sx < srcColEnd; sx++) {
          const idx = (sy * srcW + sx) * 4;
          rSum += srcData[idx]!;
          gSum += srcData[idx + 1]!;
          bSum += srcData[idx + 2]!;
          aSum += srcData[idx + 3]!;
          count++;
        }
      }

      if (count === 0) count = 1;
      resizedPixels.push({
        r: rSum / count,
        g: gSum / count,
        b: bSum / count,
        a: aSum / count,
      });
    }
  }

  // Step 2: Convert to OKLCH strings
  const pixelColors: string[] = [];
  const pixelOklch: Oklch[] = [];

  for (const px of resizedPixels) {
    // Skip fully transparent pixels
    if (px.a < 128) {
      pixelColors.push('none');
      pixelOklch.push({ mode: 'oklch', l: 1, c: 0, h: 0 });
      continue;
    }

    const rgbColor = `rgb(${Math.round(px.r)}, ${Math.round(px.g)}, ${Math.round(px.b)})`;
    const parsed = toOklch(rgbColor) as Oklch;

    if (parsed && parsed.l !== undefined) {
      const oklchStr = formatOklch(parsed);
      pixelColors.push(oklchStr);
      pixelOklch.push(parsed);
    } else {
      pixelColors.push('oklch(0 0 0)');
      pixelOklch.push({ mode: 'oklch', l: 0, c: 0, h: 0 });
    }
  }

  // Step 3: Quantize colors (skip transparent pixels)
  const validPixels = pixelColors.filter((c) => c !== 'none');
  const palette = validPixels.length > 0 ? quantizeColors(validPixels, maxColors) : ['oklch(1 0 0)'];

  // Step 4: Map each pixel to nearest palette color
  const grid = new Float64Array(height * width);
  for (let i = 0; i < pixelColors.length; i++) {
    if (pixelColors[i] === 'none') {
      grid[i] = -1; // Transparent
      continue;
    }
    grid[i] = findNearestIndex(pixelOklch[i]!, palette);
  }

  // Step 5: Apply dithering
  if (dithering !== 'none') {
    applyDithering(grid, palette, pixelOklch, width, height, dithering);
  }

  // Step 6: Apply confetti reduction
  if (confettiReduction > 0) {
    applyConfettiReduction(grid, width, height, confettiReduction, palette.length);
  }

  // Step 7: Build result
  const cells: Array<{ row: number; col: number; color: string }> = [];
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = grid[row * width + col]!;
      if (idx >= 0 && idx < palette.length) {
        cells.push({ row, col, color: palette[idx]! });
      }
    }
  }

  const confettiScore = calculateConfettiScore(cells, width, height);

  return { width, height, cells, palette, confettiScore };
}

/**
 * Calculate a "confetti score" measuring how scattered the colors are.
 *
 * A low score means the pattern has large contiguous regions (good).
 * A high score means colors are randomly scattered (bad).
 *
 * Score is 0-100 where 0 = no confetti and 100 = maximum randomness.
 */
export function calculateConfettiScore(
  cells: Array<{ row: number; col: number; color: string }>,
  width: number,
  height: number,
): number {
  if (cells.length === 0) return 0;

  // Build a lookup map: "row,col" -> color
  const cellMap = new Map<string, string>();
  for (const cell of cells) {
    cellMap.set(`${cell.row},${cell.col}`, cell.color);
  }

  // Count color transitions between adjacent cells
  let transitions = 0;
  let totalEdges = 0;

  for (const cell of cells) {
    // Check right neighbor
    if (cell.col < width - 1) {
      totalEdges++;
      const neighbor = cellMap.get(`${cell.row},${cell.col + 1}`);
      if (neighbor && neighbor !== cell.color) transitions++;
    }

    // Check bottom neighbor
    if (cell.row < height - 1) {
      totalEdges++;
      const neighbor = cellMap.get(`${cell.row + 1},${cell.col}`);
      if (neighbor && neighbor !== cell.color) transitions++;
    }
  }

  if (totalEdges === 0) return 0;

  // Score as percentage of edges that are color transitions
  return Math.round((transitions / totalEdges) * 100);
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

function parseOklchToObj(str: string): Oklch {
  const p = parse(str);
  if (!p) return { mode: 'oklch', l: 0, c: 0, h: 0 };
  return toOklch(p) as Oklch;
}

function findNearestIndex(target: Oklch, palette: string[]): number {
  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const obj = parseOklchToObj(palette[i]!);
    const dist = oklchDist(target, obj);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return bestIdx;
}

// ---------------------------------------------------------------------------
// Dithering
// ---------------------------------------------------------------------------

function applyDithering(
  grid: Float64Array,
  palette: string[],
  pixels: Oklch[],
  width: number,
  height: number,
  algorithm: 'floyd-steinberg' | 'ordered' | 'atkinson',
): void {
  if (algorithm === 'floyd-steinberg') {
    ditherFloydSteinberg(grid, palette, pixels, width, height);
  } else if (algorithm === 'ordered') {
    ditherOrdered(grid, palette, pixels, width, height);
  } else if (algorithm === 'atkinson') {
    ditherAtkinson(grid, palette, pixels, width, height);
  }
}

function ditherFloydSteinberg(
  grid: Float64Array,
  palette: string[],
  pixels: Oklch[],
  width: number,
  height: number,
): void {
  // Work with error in L channel for simplicity
  const errors = new Float64Array(height * width);
  const paletteObjs = palette.map(parseOklchToObj);

  for (let i = 0; i < pixels.length; i++) {
    errors[i] = 0;
  }

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = row * width + col;
      const pixel = pixels[idx]!;
      if (!pixel || pixel.l === undefined) continue;

      // Adjusted lightness
      const adjustedL = Math.max(0, Math.min(1, (pixel.l ?? 0) + errors[idx]!));

      // Find nearest color using adjusted value
      const adjusted: Oklch = { ...pixel, l: adjustedL };
      grid[idx] = findNearestIndex(adjusted, palette);

      // Compute error in L channel
      const nearest = paletteObjs[grid[idx]!]!;
      const error = adjustedL - (nearest.l ?? 0);

      // Distribute error (Floyd-Steinberg kernel)
      if (col + 1 < width) errors[idx + 1] = (errors[idx + 1] ?? 0) + error * 7 / 16;
      if (row + 1 < height) {
        if (col - 1 >= 0) errors[(row + 1) * width + (col - 1)] = (errors[(row + 1) * width + (col - 1)] ?? 0) + error * 3 / 16;
        errors[(row + 1) * width + col] = (errors[(row + 1) * width + col] ?? 0) + error * 5 / 16;
        if (col + 1 < width) errors[(row + 1) * width + (col + 1)] = (errors[(row + 1) * width + (col + 1)] ?? 0) + error * 1 / 16;
      }
    }
  }
}

function ditherOrdered(
  grid: Float64Array,
  palette: string[],
  pixels: Oklch[],
  width: number,
  height: number,
): void {
  // Bayer 4x4 ordered dithering matrix
  const threshold = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = row * width + col;
      const pixel = pixels[idx]!;
      if (!pixel || pixel.l === undefined) continue;

      // Threshold offset (normalized to 0-1)
      const t = threshold[row % 4]![col % 4]! / 16;
      const offset = (t - 0.5) * 0.1; // Scale factor for subtle effect

      const adjusted: Oklch = { ...pixel, l: Math.max(0, Math.min(1, (pixel.l ?? 0) + offset)) };
      grid[idx] = findNearestIndex(adjusted, palette);
    }
  }
}

function ditherAtkinson(
  grid: Float64Array,
  palette: string[],
  pixels: Oklch[],
  width: number,
  height: number,
): void {
  const errors = new Float64Array(height * width);
  const paletteObjs = palette.map(parseOklchToObj);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = row * width + col;
      const pixel = pixels[idx]!;
      if (!pixel || pixel.l === undefined) continue;

      const adjustedL = Math.max(0, Math.min(1, (pixel.l ?? 0) + errors[idx]!));
      const adjusted: Oklch = { ...pixel, l: adjustedL };
      grid[idx] = findNearestIndex(adjusted, palette);

      const nearest = paletteObjs[grid[idx]!]!;
      const error = adjustedL - (nearest.l ?? 0);

      // Atkinson kernel: distributes 6/8 of error, keeps 2/8
      const diffusion = error * 1 / 8;
      if (col + 1 < width) errors[idx + 1] = (errors[idx + 1] ?? 0) + diffusion;
      if (col + 2 < width) errors[idx + 2] = (errors[idx + 2] ?? 0) + diffusion;
      if (row + 1 < height) {
        if (col - 1 >= 0) errors[(row + 1) * width + (col - 1)] = (errors[(row + 1) * width + (col - 1)] ?? 0) + diffusion;
        errors[(row + 1) * width + col] = (errors[(row + 1) * width + col] ?? 0) + diffusion;
        if (col + 1 < width) errors[(row + 1) * width + (col + 1)] = (errors[(row + 1) * width + (col + 1)] ?? 0) + diffusion;
      }
      if (row + 2 < height) {
        errors[(row + 2) * width + col] = (errors[(row + 2) * width + col] ?? 0) + diffusion;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Confetti reduction
// ---------------------------------------------------------------------------

/**
 * Reduce color scatter by replacing isolated cells with their most common neighbor color.
 *
 * `strength` controls the number of passes (0 = off, 1 = 3 passes).
 * A cell is considered "isolated" if fewer than 2 of its 4-connected neighbors
 * share the same color.
 */
function applyConfettiReduction(
  grid: Float64Array,
  width: number,
  height: number,
  strength: number,
  paletteSize: number,
): void {
  if (strength <= 0 || paletteSize <= 1) return;

  const passes = Math.max(1, Math.round(strength * 3));

  for (let pass = 0; pass < passes; pass++) {
    const newGrid = new Float64Array(grid);

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = row * width + col;
        const currentColor = grid[idx]!;

        if (currentColor < 0) continue;

        // Count neighbor colors
        const neighbors: number[] = [];
        const neighborOffsets = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];

        for (const neighborOffset of neighborOffsets) {
          const dr = neighborOffset[0]!;
          const dc = neighborOffset[1]!;
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
            const nIdx = nr * width + nc;
            const nColor = grid[nIdx]!;
            if (nColor >= 0) {
              neighbors.push(nColor);
            }
          }
        }

        if (neighbors.length === 0) continue;

        // Count how many neighbors match the current color
        const matchingCount = neighbors.filter((n) => n === currentColor).length;

        // If cell is isolated (fewer than 2 matching neighbors), replace with most common neighbor
        if (matchingCount < 2) {
          // Count neighbor color frequencies
          const freq = new Map<number, number>();
          for (const n of neighbors) {
            freq.set(n, (freq.get(n) ?? 0) + 1);
          }

          // Find most common neighbor color
          let bestColor = currentColor;
          let bestCount = 0;
          for (const [color, count] of freq) {
            if (count > bestCount) {
              bestCount = count;
              bestColor = color;
            }
          }

          newGrid[idx] = bestColor;
        }
      }
    }

    // Copy new grid
    grid.set(newGrid);
  }
}
