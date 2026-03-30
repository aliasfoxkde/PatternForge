/**
 * Color Matching Utilities
 *
 * Functions for finding the nearest DMC floss color to any given hex color,
 * using Euclidean RGB distance for perceptually reasonable results.
 */

import type { DmcColor } from "./dmc-colors";
import { DMC_COLORS } from "./dmc-colors";

/**
 * Parse a hex color string into its RGB components.
 *
 * Accepts 3-character (#RGB) and 6-character (#RRGGBB) hex strings,
 * with or without the leading '#'.
 */
function parseHex(hexColor: string): { red: number; green: number; blue: number } | null {
  let hex = hexColor.trim();
  if (hex.startsWith("#")) {
    hex = hex.slice(1);
  }

  if (hex.length === 3) {
    const a = hex[0];
    const b = hex[1];
    const c = hex[2];
    if (!a || !b || !c) return null;
    hex = a + a + b + b + c + c;
  }

  if (hex.length !== 6) {
    return null;
  }

  const num = parseInt(hex, 16);
  if (Number.isNaN(num)) {
    return null;
  }

  return {
    red: (num >> 16) & 0xff,
    green: (num >> 8) & 0xff,
    blue: num & 0xff,
  };
}

/**
 * Calculate the Euclidean distance between two RGB colors.
 *
 * While not perfectly perceptually uniform, this is fast and gives
 * good enough results for embroidery floss matching where the palette
 * is already quantized to ~500 colors.
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Weight green slightly higher (human eye is more sensitive to green)
  return dr * dr + 2 * dg * dg + db * db;
}

/**
 * Find the single nearest DMC color to the given hex color.
 *
 * @param hexColor - A hex color string (e.g. "#FF5733" or "FF5733")
 * @returns The closest DMC color, or null if the input is invalid
 */
export function findNearestDmcColor(hexColor: string): DmcColor | null {
  const parsed = parseHex(hexColor);
  if (!parsed) {
    return null;
  }

  let nearest: DmcColor | null = null;
  let minDist = Infinity;

  for (const color of DMC_COLORS) {
    const dist = colorDistance(
      parsed.red,
      parsed.green,
      parsed.blue,
      color.red,
      color.green,
      color.blue,
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = color;
    }
  }

  return nearest;
}

/**
 * Find the N nearest DMC colors to the given hex color.
 *
 * Returns colors sorted by distance (closest first).
 *
 * @param hexColor - A hex color string (e.g. "#FF5733" or "FF5733")
 * @param count - Number of matches to return (default: 5)
 * @returns Array of DMC colors sorted by proximity, or empty array if input is invalid
 */
export function findNearestDmcColors(hexColor: string, count: number = 5): DmcColor[] {
  const parsed = parseHex(hexColor);
  if (!parsed || count <= 0) {
    return [];
  }

  const distances: Array<{ color: DmcColor; distance: number }> = [];

  for (const color of DMC_COLORS) {
    const dist = colorDistance(
      parsed.red,
      parsed.green,
      parsed.blue,
      color.red,
      color.green,
      color.blue,
    );
    distances.push({ color, distance: dist });
  }

  distances.sort((a, b) => a.distance - b.distance);

  return distances.slice(0, count).map((d) => d.color);
}
