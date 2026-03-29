/**
 * PNG export utility for PatternForge.
 *
 * Renders the pattern grid to an offscreen canvas and returns
 * a PNG data URL. Supports HiDPI via devicePixelRatio.
 */

import { oklchToHex } from "@/engine/color/colors";
import type { PatternGrid } from "@/engine/grid/grid";

export interface ExportPNGOptions {
	/** Draw grid lines between cells */
	showGridLines?: boolean;
	/** Draw cell symbols */
	showSymbols?: boolean;
	/** Background color behind the grid */
	backgroundColor?: string;
}

/**
 * Export a pattern grid as a PNG data URL.
 *
 * @param grid - The pattern grid to render
 * @param cellSize - Size of each cell in pixels (logical)
 * @param options - Optional export settings
 * @returns A data URL string (image/png)
 */
export function exportToPNG(
	grid: PatternGrid,
	cellSize: number,
	options?: ExportPNGOptions,
): string {
	const {
		showGridLines = false,
		showSymbols = false,
		backgroundColor = "#ffffff",
	} = options ?? {};

	const dpr = window.devicePixelRatio || 1;
	const canvasWidth = grid.width * cellSize;
	const canvasHeight = grid.height * cellSize;

	const canvas = document.createElement("canvas");
	canvas.width = canvasWidth * dpr;
	canvas.height = canvasHeight * dpr;

	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Failed to create canvas 2D context");

	ctx.scale(dpr, dpr);

	// Background
	ctx.fillStyle = backgroundColor;
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);

	// Render cells
	const cells = grid.getCellsInArea(0, 0, grid.width, grid.height);

	for (const cell of cells) {
		if (cell.color === null) continue;

		const hex = oklchToHex(cell.color);
		ctx.fillStyle = hex;
		ctx.fillRect(cell.col * cellSize, cell.row * cellSize, cellSize, cellSize);
	}

	// Grid lines
	if (showGridLines) {
		ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
		ctx.lineWidth = 0.5;

		for (let row = 0; row <= grid.height; row++) {
			ctx.beginPath();
			ctx.moveTo(0, row * cellSize);
			ctx.lineTo(canvasWidth, row * cellSize);
			ctx.stroke();
		}
		for (let col = 0; col <= grid.width; col++) {
			ctx.beginPath();
			ctx.moveTo(col * cellSize, 0);
			ctx.lineTo(col * cellSize, canvasHeight);
			ctx.stroke();
		}
	}

	// Symbols
	if (showSymbols) {
		const fontSize = Math.max(8, cellSize * 0.6);
		ctx.font = `${fontSize}px monospace`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		for (const cell of cells) {
			if (cell.symbol === null) continue;

			// Use contrasting color for the symbol
			ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
			ctx.fillText(
				cell.symbol,
				cell.col * cellSize + cellSize / 2,
				cell.row * cellSize + cellSize / 2,
			);
		}
	}

	return canvas.toDataURL("image/png");
}
