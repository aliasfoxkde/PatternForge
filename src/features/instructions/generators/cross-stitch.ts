/**
 * Cross-stitch instruction generator.
 *
 * Produces a color-usage table and ordered stitch list from a PatternGrid.
 * Cross-stitch does not use row-by-row instructions like knitting or crochet;
 * instead, stitchers work color-by-color, so the output emphasizes color
 * usage and a complete stitch map.
 */

import { PatternGrid } from "@/engine/grid/grid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColorUsage {
  color: string;
  count: number;
  percentage: number;
}

export interface StitchEntry {
  row: number;
  col: number;
  color: string;
  symbol: string | null;
}

export interface CrossStitchInstructions {
  craftType: "cross-stitch";
  totalStitches: number;
  colorCount: number;
  colorList: ColorUsage[];
  stitchList: StitchEntry[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateCrossStitchInstructions(
  grid: PatternGrid,
): CrossStitchInstructions {
  // Collect all populated cells
  const stitchList: StitchEntry[] = [];
  const colorCounts = new Map<string, number>();

  for (let r = 0; r < grid.height; r++) {
    for (let c = 0; c < grid.width; c++) {
      const cell = grid.getCell(r, c);
      if (cell && cell.color !== null) {
        stitchList.push({
          row: r + 1,
          col: c + 1,
          color: cell.color,
          symbol: cell.symbol,
        });

        colorCounts.set(cell.color, (colorCounts.get(cell.color) ?? 0) + 1);
      }
    }
  }

  const totalStitches = stitchList.length;

  // Build color usage list sorted by count descending
  const colorList: ColorUsage[] = Array.from(colorCounts.entries())
    .map(([color, count]) => ({
      color,
      count,
      percentage: totalStitches > 0 ? Math.round((count / totalStitches) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const colorCount = colorList.length;
  const topColor = colorList[0];
  const topPercent = topColor ? topColor.percentage : 0;

  const summary = [
    `This cross-stitch pattern contains ${totalStitches} stitches across ${grid.width} columns and ${grid.height} rows.`,
    `It uses ${colorCount} color${colorCount !== 1 ? "s" : ""}.`,
    topColor ? `The dominant color accounts for ${topPercent}% of the pattern.` : "The grid is empty.",
  ].join(" ");

  return {
    craftType: "cross-stitch",
    totalStitches,
    colorCount,
    colorList,
    stitchList,
    summary,
  };
}

/** Format cross-stitch instructions as plain text. */
export function formatCrossStitchAsText(instructions: CrossStitchInstructions): string {
  const lines: string[] = [instructions.summary, "", "Color Usage:", ""];

  for (const cu of instructions.colorList) {
    lines.push(`  ${cu.color}: ${cu.count} stitches (${cu.percentage}%)`);
  }

  lines.push("");
  lines.push("Stitch List (row, col):", "");

  for (const stitch of instructions.stitchList) {
    const symbol = stitch.symbol ? ` [${stitch.symbol}]` : "";
    lines.push(`  (${stitch.row}, ${stitch.col}) ${stitch.color}${symbol}`);
  }

  return lines.join("\n");
}
