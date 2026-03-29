/**
 * Crochet instruction generator.
 *
 * Produces row-by-row written instructions from a PatternGrid for standard
 * crochet and corner-to-corner (C2C) crochet.
 */

import { PatternGrid } from "@/engine/grid/grid";
import type { CraftType } from "@/engine/pattern/types";

// ---------------------------------------------------------------------------
// Types (re-export shared row type from knitting for consistency)
// ---------------------------------------------------------------------------

export type {
  InstructionRow,
  InstructionStitch,
} from "./knitting";

export interface CrochetInstructions {
  craftType: CraftType;
  totalRows: number;
  totalStitches: number;
  colorChanges: number;
  rows: import("./knitting").InstructionRow[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine crochet stitch abbreviation based on cell stitchType. */
function toCrochetStitchType(cellStitchType: string): string {
  switch (cellStitchType) {
    case "half":
      return "hdc";
    case "quarter":
      return "sc";
    case "backstitch":
      return "sl st";
    case "french-knot":
      return "popcorn";
    case "increase":
      return "inc";
    case "decrease":
      return "dec";
    default:
      return "dc";
  }
}

/** Group consecutive cells that share the same color and stitchType. */
function groupConsecutive(
  cells: Array<{
    col: number;
    color: string | null;
    symbol: string | null;
    stitchType: string;
  }>,
): import("./knitting").InstructionStitch[] {
  if (cells.length === 0) return [];

  const first = cells[0]!;
  const groups: import("./knitting").InstructionStitch[] = [];
  let current = { ...first, count: 1 };

  for (let i = 1; i < cells.length; i++) {
    const next = cells[i]!;
    if (
      next.color === current.color &&
      next.stitchType === current.stitchType
    ) {
      current.count++;
    } else {
      groups.push({
        col: current.col,
        color: current.color,
        symbol: current.symbol,
        stitchType: current.stitchType,
        count: current.count,
      });
      current = { ...next, count: 1 };
    }
  }

  groups.push({
    col: current.col,
    color: current.color,
    symbol: current.symbol,
    stitchType: current.stitchType,
    count: current.count,
  });

  return groups;
}

/** Count total color changes across all rows. */
function countColorChanges(rows: import("./knitting").InstructionRow[]): number {
  let changes = 0;
  for (const row of rows) {
    for (let i = 1; i < row.stitches.length; i++) {
      if (row.stitches[i]!.color !== row.stitches[i - 1]!.color) {
        changes++;
      }
    }
  }
  return changes;
}

// ---------------------------------------------------------------------------
// Standard Crochet
// ---------------------------------------------------------------------------

function generateStandardCrochet(grid: PatternGrid): CrochetInstructions {
  const rows: import("./knitting").InstructionRow[] = [];
  let totalStitches = 0;

  for (let r = 0; r < grid.height; r++) {
    // Standard crochet alternates direction like flat knitting
    const direction: "right-to-left" | "left-to-right" =
      r % 2 === 0 ? "right-to-left" : "left-to-right";

    const startCol = direction === "right-to-left" ? 0 : grid.width - 1;
    const endCol = direction === "right-to-left" ? grid.width : -1;
    const step = direction === "right-to-left" ? 1 : -1;

    const rowCells: Array<{
      col: number;
      color: string | null;
      symbol: string | null;
      stitchType: string;
    }> = [];

    for (let c = startCol; c !== endCol; c += step) {
      const cell = grid.getCell(r, c);
      rowCells.push({
        col: c,
        color: cell?.color ?? null,
        symbol: cell?.symbol ?? null,
        stitchType: cell ? toCrochetStitchType(cell.stitchType) : "dc",
      });
      totalStitches++;
    }

    const stitches = groupConsecutive(rowCells);

    const stitchCount = rowCells.filter((c) => c.color !== null).length;
    const emptyCount = rowCells.length - stitchCount;
    let notes = `Row ${r + 1}. ${stitchCount} colored stitch${stitchCount !== 1 ? "es" : ""}`;
    if (emptyCount > 0) {
      notes += `, ${emptyCount} background`;
    }

    rows.push({
      rowNumber: r + 1,
      direction,
      stitches,
      notes,
    });
  }

  const colorChanges = countColorChanges(rows);
  const colorCount = grid.getUsedColors().size;

  const summary = [
    `This crochet pattern has ${grid.width} stitches and ${grid.height} rows.`,
    `It is worked in standard rows (alternating direction).`,
    `There ${colorCount === 1 ? "is" : "are"} ${colorCount} color${colorCount !== 1 ? "s" : ""} with ${colorChanges} color change${colorChanges !== 1 ? "s" : ""}.`,
    `Total stitches: ${totalStitches}.`,
  ].join(" ");

  return {
    craftType: "crochet-standard",
    totalRows: grid.height,
    totalStitches,
    colorChanges,
    rows,
    summary,
  };
}

// ---------------------------------------------------------------------------
// C2C Crochet
// ---------------------------------------------------------------------------

function generateC2CCrochet(grid: PatternGrid): CrochetInstructions {
  const rows: import("./knitting").InstructionRow[] = [];
  let totalStitches = 0;
  const midPoint = Math.ceil(grid.height / 2);

  for (let r = 0; r < grid.height; r++) {
    const isIncrease = r < midPoint;

    // In C2C, each "row" works one tile per column.
    // During increase, tiles grow from left.
    // During decrease, tiles shrink from left.
    const effectiveWidth = isIncrease
      ? r + 1
      : grid.height - r;

    const rowCells: Array<{
      col: number;
      color: string | null;
      symbol: string | null;
      stitchType: string;
    }> = [];

    for (let c = 0; c < effectiveWidth && c < grid.width; c++) {
      const cell = grid.getCell(r, c);
      rowCells.push({
        col: c,
        color: cell?.color ?? null,
        symbol: cell?.symbol ?? null,
        stitchType: cell ? toCrochetStitchType(cell.stitchType) : "dc",
      });
      totalStitches++;
    }

    const stitches = groupConsecutive(rowCells);

    const phase = isIncrease ? "increase" : "decrease";
    const stitchCount = rowCells.filter((c) => c.color !== null).length;
    const notes = `Row ${r + 1}: ${phase}, ${stitchCount} tile${stitchCount !== 1 ? "s" : ""} (${effectiveWidth} DC block${effectiveWidth !== 1 ? "s" : ""})`;

    rows.push({
      rowNumber: r + 1,
      direction: "right-to-left",
      stitches,
      notes,
    });
  }

  const colorChanges = countColorChanges(rows);
  const colorCount = grid.getUsedColors().size;

  const summary = [
    `This corner-to-corner crochet pattern produces a ${grid.width} x ${grid.height} grid.`,
    `The first ${midPoint} rows are the increase section; the remaining ${grid.height - midPoint} rows are the decrease section.`,
    `There ${colorCount === 1 ? "is" : "are"} ${colorCount} color${colorCount !== 1 ? "s" : ""} with ${colorChanges} color change${colorChanges !== 1 ? "s" : ""}.`,
    `Total tiles: ${totalStitches}.`,
  ].join(" ");

  return {
    craftType: "crochet-c2c",
    totalRows: grid.height,
    totalStitches,
    colorChanges,
    rows,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateCrochetInstructions(
  grid: PatternGrid,
  craftType: "crochet-standard" | "crochet-c2c",
): CrochetInstructions {
  if (craftType === "crochet-c2c") {
    return generateC2CCrochet(grid);
  }
  return generateStandardCrochet(grid);
}

/** Format a single crochet stitch group as text. */
export function formatCrochetStitchGroup(s: import("./knitting").InstructionStitch): string {
  const abbrev = s.stitchType;
  const colorLabel = s.color ?? "background";
  return s.count > 1 ? `${abbrev} ${s.count} ${colorLabel}` : `${abbrev} ${colorLabel}`;
}

/** Format the full crochet instructions as plain text. */
export function formatCrochetAsText(instructions: CrochetInstructions): string {
  const lines: string[] = [instructions.summary, ""];

  for (const row of instructions.rows) {
    const stitchText = row.stitches.map(formatCrochetStitchGroup).join(", ");
    lines.push(`Row ${row.rowNumber}: ${stitchText}`);
    lines.push(`  ${row.notes}`);
    lines.push("");
  }

  return lines.join("\n");
}
