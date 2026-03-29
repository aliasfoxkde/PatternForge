/**
 * SVG export utility for PatternForge.
 *
 * Generates SVG markup with rect elements for each populated cell.
 * Optionally includes grid lines and symbols.
 */

import { oklchToHex } from "@/engine/color/colors";
import type { PatternGrid } from "@/engine/grid/grid";

export interface ExportSVGOptions {
	/** Draw grid lines between cells */
	showGridLines?: boolean;
	/** Draw cell symbols */
	showSymbols?: boolean;
}

/**
 * Export a pattern grid as an SVG string.
 *
 * @param grid - The pattern grid to render
 * @param cellSize - Size of each cell in pixels
 * @param options - Optional export settings
 * @returns An SVG string
 */
export function exportToSVG(
	grid: PatternGrid,
	cellSize: number,
	options?: ExportSVGOptions,
): string {
	const { showGridLines = false, showSymbols = false } = options ?? {};

	const width = grid.width * cellSize;
	const height = grid.height * cellSize;

	const rects: string[] = [];
	const symbols: string[] = [];

	// Collect cells
	const allCells = grid.getCellsInArea(0, 0, grid.width, grid.height);

	// Render cells
	for (const cell of allCells) {
		if (cell.color !== null) {
			const hex = oklchToHex(cell.color);
			rects.push(
				`  <rect x="${cell.col * cellSize}" y="${cell.row * cellSize}" width="${cellSize}" height="${cellSize}" fill="${hex}" />`,
			);
		}
	}

	// Symbols
	if (showSymbols) {
		const fontSize = Math.max(8, cellSize * 0.6);
		for (const cell of allCells) {
			if (cell.symbol !== null) {
				const cx = cell.col * cellSize + cellSize / 2;
				const cy = cell.row * cellSize + cellSize / 2;
				symbols.push(
					`  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-family="monospace" fill="rgba(0,0,0,0.7)">${escapeXml(cell.symbol)}</text>`,
				);
			}
		}
	}

	// Grid lines
	let gridLines = "";
	if (showGridLines) {
		const lines: string[] = [];
		for (let row = 0; row <= grid.height; row++) {
			const y = row * cellSize;
			lines.push(
				`  <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="rgba(0,0,0,0.15)" stroke-width="0.5" />`,
			);
		}
		for (let col = 0; col <= grid.width; col++) {
			const x = col * cellSize;
			lines.push(
				`  <line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="rgba(0,0,0,0.15)" stroke-width="0.5" />`,
			);
		}
		gridLines = lines.join("\n");
	}

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
		`  <rect width="${width}" height="${height}" fill="#ffffff" />`,
		...rects,
		gridLines,
		...symbols,
		"</svg>",
	]
		.filter(Boolean)
		.join("\n");
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
