/**
 * CSV export utility for PatternForge patterns.
 *
 * Serializes the pattern grid to a CSV string with one row per
 * populated cell, suitable for spreadsheet analysis.
 */

import { oklchToHex } from "@/engine/color/colors";
import { PatternGrid } from "@/engine/grid/grid";

/**
 * Escape a CSV field value.
 *
 * Wraps in double-quotes if the value contains a comma, double-quote,
 * or newline.
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export a pattern grid as a CSV string.
 *
 * Produces a header row followed by one row per populated cell.
 * Empty cells are omitted.
 *
 * @param grid - The pattern grid to export
 * @returns A CSV-formatted string
 */
export function exportToCSV(grid: PatternGrid): string {
  const rows: string[] = [];

  // Header
  rows.push("Row,Col,Color,Symbol,StitchType,Completed");

  // Data rows
  grid.forEach((cell) => {
    const color = cell.color !== null ? oklchToHex(cell.color) : "";
    const symbol = cell.symbol ?? "";
    const completed = cell.completed ? "true" : "false";

    rows.push(
      [
        escapeCSV(String(cell.row)),
        escapeCSV(String(cell.col)),
        escapeCSV(color),
        escapeCSV(symbol),
        escapeCSV(cell.stitchType),
        escapeCSV(completed),
      ].join(","),
    );
  });

  return rows.join("\n");
}

/**
 * Download a pattern grid as a .csv file.
 *
 * @param grid - The pattern grid to download
 * @param filename - File name (without extension)
 */
export function downloadPatternCSV(grid: PatternGrid, filename?: string): void {
  const csv = exportToCSV(grid);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename ?? "pattern"}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
