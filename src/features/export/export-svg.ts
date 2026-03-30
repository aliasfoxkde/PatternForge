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
	/** Show row numbers on left side */
	showRowNumbers?: boolean;
	/** Show column numbers on top */
	showColumnNumbers?: boolean;
	/** Interval for row/column numbers (default: 10) */
	numberInterval?: number;
	/** Width of row number margin in pixels */
	rowNumMargin?: number;
	/** Height of column number margin in pixels */
	colNumMargin?: number;
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
	const {
		showGridLines = false,
		showSymbols = false,
		showRowNumbers = false,
		showColumnNumbers = false,
		numberInterval = 10,
		rowNumMargin = 24,
		colNumMargin = 16,
	} = options ?? {};

	const mx = showRowNumbers ? rowNumMargin : 0;
	const my = showColumnNumbers ? colNumMargin : 0;
	const width = grid.width * cellSize + mx;
	const height = grid.height * cellSize + my;

	const rects: string[] = [];
	const symbols: string[] = [];
	const rowLabels: string[] = [];
	const colLabels: string[] = [];

	// Collect cells
	const allCells = grid.getCellsInArea(0, 0, grid.width, grid.height);

	// Render cells
	for (const cell of allCells) {
		if (cell.color !== null) {
			const hex = oklchToHex(cell.color);
			rects.push(
				`  <rect x="${mx + cell.col * cellSize}" y="${my + cell.row * cellSize}" width="${cellSize}" height="${cellSize}" fill="${hex}" />`,
			);
		}
	}

	// Symbols
	if (showSymbols) {
		const fontSize = Math.max(8, cellSize * 0.6);
		for (const cell of allCells) {
			if (cell.symbol !== null) {
				const cx = mx + cell.col * cellSize + cellSize / 2;
				const cy = my + cell.row * cellSize + cellSize / 2;
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
			const y = my + row * cellSize;
			lines.push(
				`  <line x1="${mx}" y1="${y}" x2="${mx + grid.width * cellSize}" y2="${y}" stroke="rgba(0,0,0,0.15)" stroke-width="0.5" />`,
			);
		}
		for (let col = 0; col <= grid.width; col++) {
			const x = mx + col * cellSize;
			lines.push(
				`  <line x1="${x}" y1="${my}" x2="${x}" y2="${my + grid.height * cellSize}" stroke="rgba(0,0,0,0.15)" stroke-width="0.5" />`,
			);
		}
		gridLines = lines.join("\n");
	}

	// Row numbers
	if (showRowNumbers) {
		const fontSize = Math.max(8, cellSize * 0.6);
		for (let row = 0; row < grid.height; row++) {
			if (row > 0 && row % numberInterval === 0) {
				rowLabels.push(
					`  <text x="${mx - 4}" y="${my + row * cellSize + cellSize / 2}" text-anchor="end" dominant-baseline="central" font-size="${fontSize}" font-family="sans-serif" fill="rgba(0,0,0,0.5)">${row}</text>`,
				);
			}
		}
	}

	// Column numbers
	if (showColumnNumbers) {
		const fontSize = Math.max(8, cellSize * 0.6);
		for (let col = 0; col < grid.width; col++) {
			if (col > 0 && col % numberInterval === 0) {
				colLabels.push(
					`  <text x="${mx + col * cellSize + cellSize / 2}" y="${my - 2}" text-anchor="middle" dominant-baseline="auto" font-size="${fontSize}" font-family="sans-serif" fill="rgba(0,0,0,0.5)">${col}</text>`,
				);
			}
		}
	}

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
		`  <rect width="${width}" height="${height}" fill="#ffffff" />`,
		...colLabels,
		...rowLabels,
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
