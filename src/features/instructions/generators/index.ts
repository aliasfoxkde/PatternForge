/**
 * Instruction generators barrel export.
 *
 * Provides a unified `generateInstructions` entry point that routes to the
 * correct generator based on the pattern's craft type.
 */

import { PatternGrid } from "@/engine/grid/grid";
import type { CraftType } from "@/engine/pattern/types";
import { generateCrossStitchInstructions, formatCrossStitchAsText } from "./cross-stitch";
import type { CrossStitchInstructions } from "./cross-stitch";
import { generateCrochetInstructions, formatCrochetAsText } from "./crochet";
import type { CrochetInstructions } from "./crochet";
import { generateKnittingInstructions, formatKnittingAsText } from "./knitting";
import type { KnittingInstructions } from "./knitting";

export type {
  CrossStitchInstructions,
  ColorUsage,
  StitchEntry,
} from "./cross-stitch";

export type {
  CrochetInstructions,
} from "./crochet";

export type {
  InstructionRow,
  InstructionStitch,
  KnittingInstructions,
} from "./knitting";

export {
  generateKnittingInstructions,
  formatKnittingAsText,
} from "./knitting";

export {
  generateCrochetInstructions,
  formatCrochetStitchGroup,
  formatCrochetAsText,
} from "./crochet";

export {
  generateCrossStitchInstructions,
  formatCrossStitchAsText,
} from "./cross-stitch";

/** Union of all instruction result types. */
export type InstructionsResult =
  | import("./knitting").KnittingInstructions
  | import("./crochet").CrochetInstructions
  | import("./cross-stitch").CrossStitchInstructions;

/**
 * Generate written instructions for a pattern grid based on craft type.
 *
 * Supports:
 * - knitting-flat, knitting-round
 * - crochet-standard, crochet-c2c
 * - cross-stitch
 *
 * Returns null for craft types that do not have an instruction generator
 * (diamond-painting, fuse-beads, pixel-art).
 */
export function generateInstructions(
  grid: PatternGrid,
  craftType: CraftType,
): InstructionsResult | null {
  switch (craftType) {
    case "knitting-flat":
    case "knitting-round":
      return generateKnittingInstructions(grid, craftType);

    case "crochet-standard":
    case "crochet-c2c":
      return generateCrochetInstructions(grid, craftType);

    case "cross-stitch":
      return generateCrossStitchInstructions(grid);

    default:
      return null;
  }
}

/**
 * Format any instruction result as a plain-text string.
 *
 * Useful for clipboard copy functionality.
 */
export function formatInstructionsAsText(
  result: InstructionsResult,
): string {
  if ("rows" in result && "colorChanges" in result && "totalRows" in result) {
    // Knitting or Crochet
    if (result.craftType === "knitting-flat" || result.craftType === "knitting-round") {
      return formatKnittingAsText(result as KnittingInstructions);
    }
    return formatCrochetAsText(result as CrochetInstructions);
  }
  if ("stitchList" in result) {
    return formatCrossStitchAsText(result as CrossStitchInstructions);
  }
  return "";
}
