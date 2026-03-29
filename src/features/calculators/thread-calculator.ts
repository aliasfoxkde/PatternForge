/**
 * Thread/yarn usage calculator for fiber arts patterns.
 *
 * Calculates total thread length per color, converts to yards/meters,
 * and estimates the number of skeins needed based on standard skein sizes.
 */

/** Default length of one stitch in inches (typical for cross stitch). */
export const DEFAULT_STITCH_LENGTH = 0.1;

/** Default waste factor as a percentage. */
export const DEFAULT_WASTE_FACTOR = 15;

/** Standard DMC embroidery floss skein length in inches (8.7 yards). */
const DMC_SKEIN_LENGTH_INCHES = 337.5;

/** Inches per yard. */
const INCHES_PER_YARD = 36;

/** Inches per meter. */
const INCHES_PER_METER = 39.3701;

export interface ThreadColorInput {
  /** Human-readable color name (e.g. "DMC 310"). */
  name: string;
  /** Number of stitches using this color. */
  stitchCount: number;
}

export interface ThreadCalculatorInput {
  /** Total stitch count across all colors. */
  totalStitches: number;
  /** Per-color stitch breakdown. */
  colors: ThreadColorInput[];
  /** Length of one stitch in inches. */
  stitchLength: number;
  /** Waste factor as a percentage (0-50). */
  wasteFactor: number;
}

export interface ThreadSkeinInfo {
  /** Color name from input. */
  name: string;
  /** Hex color swatch (generated from name hash). */
  color: string;
  /** Number of stitches in this color. */
  stitchCount: number;
  /** Total thread length in inches for this color. */
  lengthInches: number;
  /** Total thread length in yards for this color. */
  lengthYards: number;
  /** Number of skeins needed (rounded up). */
  skeinsNeeded: number;
  /** Standard skein length used for calculation (inches). */
  skeinLength: number;
}

export interface ThreadCalculatorResult {
  /** Total thread length in inches across all colors. */
  totalThreadLength: number;
  /** Total thread length in yards across all colors. */
  totalThreadLengthYards: number;
  /** Total thread length in meters across all colors. */
  totalThreadLengthMeters: number;
  /** Per-color breakdown including skein estimates. */
  skeins: ThreadSkeinInfo[];
  /** Total skeins across all colors (sum of per-color needs). */
  totalSkeins: number;
}

/**
 * Generate a deterministic color swatch from a color name.
 * Uses a simple hash to produce a hex color for display purposes.
 */
function nameToSwatch(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  // Convert HSL to hex with fixed saturation/lightness for readability
  return `hsl(${h}, 65%, 45%)`;
}

/**
 * Calculate thread requirements from stitch counts and color breakdown.
 *
 * @param input - The thread calculator parameters
 * @returns Thread usage breakdown per color and totals
 */
export function calculateThread(
  input: ThreadCalculatorInput,
): ThreadCalculatorResult {
  const { colors, stitchLength, wasteFactor } = input;

  const wasteMultiplier = 1 + wasteFactor / 100;

  const skeins: ThreadSkeinInfo[] = colors.map((c) => {
    const rawLength = c.stitchCount * stitchLength;
    const lengthInches = rawLength * wasteMultiplier;
    const lengthYards = lengthInches / INCHES_PER_YARD;
    const skeinsNeeded = Math.ceil(lengthInches / DMC_SKEIN_LENGTH_INCHES);

    return {
      name: c.name,
      color: nameToSwatch(c.name),
      stitchCount: c.stitchCount,
      lengthInches: Math.round(lengthInches * 100) / 100,
      lengthYards: Math.round(lengthYards * 100) / 100,
      skeinsNeeded,
      skeinLength: DMC_SKEIN_LENGTH_INCHES,
    };
  });

  const totalThreadLength = skeins.reduce(
    (sum, s) => sum + s.lengthInches,
    0,
  );
  const totalThreadLengthYards = totalThreadLength / INCHES_PER_YARD;
  const totalThreadLengthMeters = totalThreadLength / INCHES_PER_METER;
  const totalSkeins = skeins.reduce((sum, s) => sum + s.skeinsNeeded, 0);

  return {
    totalThreadLength: Math.round(totalThreadLength * 100) / 100,
    totalThreadLengthYards: Math.round(totalThreadLengthYards * 100) / 100,
    totalThreadLengthMeters: Math.round(totalThreadLengthMeters * 100) / 100,
    skeins,
    totalSkeins,
  };
}
