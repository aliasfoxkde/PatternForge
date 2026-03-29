/**
 * Knitting instruction generator.
 *
 * Produces row-by-row written instructions from a PatternGrid for both
 * flat knitting (RS/WS alternating direction) and knitting in the round
 * (all rows right-to-left).
 */

import { PatternGrid } from "@/engine/grid/grid";
import type { CraftType } from "@/engine/pattern/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InstructionRow {
  rowNumber: number;
  direction: "right-to-left" | "left-to-right";
  stitches: InstructionStitch[];
  notes: string;
}

export interface InstructionStitch {
  col: number;
  color: string | null;
  symbol: string | null;
  stitchType: string;
  count: number;
}

export interface KnittingInstructions {
  craftType: CraftType;
  totalRows: number;
  totalStitches: number;
  colorChanges: number;
  rows: InstructionRow[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine the default stitch type from the grid cell's stitchType. */
function toStitchType(cellStitchType: string): string {
  switch (cellStitchType) {
    case "purl":
      return "purl";
    case "yarn-over":
      return "yarn-over";
    case "increase":
      return "increase";
    case "decrease":
      return "decrease";
    default:
      return "knit";
  }
}

/** Build the col-range for a single row, respecting direction. */
function colRange(width: number, direction: "right-to-left" | "left-to-right"): number[] {
  const cols: number[] = [];
  for (let i = 0; i < width; i++) {
    cols.push(direction === "right-to-left" ? i : width - 1 - i);
  }
  return cols;
}

/** Group consecutive cells that share the same color and stitchType. */
function groupConsecutive(
  cells: Array<{
    col: number;
    color: string | null;
    symbol: string | null;
    stitchType: string;
  }>,
): InstructionStitch[] {
  if (cells.length === 0) return [];

  const first = cells[0]!;
  const groups: InstructionStitch[] = [];
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
function countColorChanges(rows: InstructionRow[]): number {
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

/** Format a single stitch group as human-readable text. */
function formatStitchGroup(s: InstructionStitch): string {
  const abbrev = s.stitchType === "knit" ? "K" : s.stitchType === "purl" ? "P" : s.stitchType;
  const colorLabel = s.color ?? "background";
  return s.count > 1 ? `${abbrev} ${s.count} ${colorLabel}` : `${abbrev} ${colorLabel}`;
}

/** Format an entire row as a text string. */
function formatRowText(row: InstructionRow): string {
  const side = row.direction === "right-to-left" ? "RS" : "WS";
  const stitchText = row.stitches.map(formatStitchGroup).join(", ");
  return `Row ${row.rowNumber} (${side}): ${stitchText}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateKnittingInstructions(
  grid: PatternGrid,
  craftType: "knitting-flat" | "knitting-round",
): KnittingInstructions {
  const rows: InstructionRow[] = [];
  let totalStitches = 0;

  for (let r = 0; r < grid.height; r++) {
    // Flat: odd rows R->L (RS), even rows L->R (WS)
    // Round: all rows R->L
    const direction: "right-to-left" | "left-to-right" =
      craftType === "knitting-round"
        ? "right-to-left"
        : r % 2 === 0
          ? "right-to-left"
          : "left-to-right";

    const cols = colRange(grid.width, direction);

    // Collect cells for this row
    const rowCells: Array<{
      col: number;
      color: string | null;
      symbol: string | null;
      stitchType: string;
    }> = [];

    for (const c of cols) {
      const cell = grid.getCell(r, c);
      rowCells.push({
        col: c,
        color: cell?.color ?? null,
        symbol: cell?.symbol ?? null,
        stitchType: cell ? toStitchType(cell.stitchType) : "knit",
      });
      totalStitches++;
    }

    const stitches = groupConsecutive(rowCells);

    // Build notes
    const side = direction === "right-to-left" ? "right side" : "wrong side";
    const stitchCount = rowCells.filter((c) => c.color !== null).length;
    const emptyCount = rowCells.length - stitchCount;
    let notes = `Work ${side}. ${stitchCount} colored stitch${stitchCount !== 1 ? "es" : ""}`;
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
    `This pattern has ${grid.width} stitches and ${grid.height} rows.`,
    craftType === "knitting-flat"
      ? "It is worked flat with right-side and wrong-side rows."
      : "It is worked in the round.",
    `There ${colorCount === 1 ? "is" : "are"} ${colorCount} color${colorCount !== 1 ? "s" : ""} with ${colorChanges} color change${colorChanges !== 1 ? "s" : ""} throughout.`,
    `Total stitches: ${totalStitches}.`,
  ].join(" ");

  return {
    craftType,
    totalRows: grid.height,
    totalStitches,
    colorChanges,
    rows,
    summary,
  };
}

/** Format the full instructions as a plain-text string suitable for clipboard. */
export function formatKnittingAsText(instructions: KnittingInstructions): string {
  const lines: string[] = [instructions.summary, ""];

  for (const row of instructions.rows) {
    lines.push(formatRowText(row));
    lines.push(`  ${row.notes}`);
    lines.push("");
  }

  return lines.join("\n");
}
