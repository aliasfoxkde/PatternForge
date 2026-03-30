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
		showRowNumbers = false,
		showColumnNumbers = false,
		numberInterval = 10,
		rowNumMargin = 24,
		colNumMargin = 16,
	} = options ?? {};

	const dpr = window.devicePixelRatio || 1;
	const marginX = showRowNumbers ? rowNumMargin : 0;
	const marginY = showColumnNumbers ? colNumMargin : 0;
	const canvasWidth = grid.width * cellSize + marginX;
	const canvasHeight = grid.height * cellSize + marginY;

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
		ctx.fillRect(marginX + cell.col * cellSize, marginY + cell.row * cellSize, cellSize, cellSize);
	}

	// Grid lines
	if (showGridLines) {
		ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
		ctx.lineWidth = 0.5;

		for (let row = 0; row <= grid.height; row++) {
			const y = marginY + row * cellSize;
			ctx.beginPath();
			ctx.moveTo(marginX, y);
			ctx.lineTo(marginX + grid.width * cellSize, y);
			ctx.stroke();
		}
		for (let col = 0; col <= grid.width; col++) {
			const x = marginX + col * cellSize;
			ctx.beginPath();
			ctx.moveTo(x, marginY);
			ctx.lineTo(x, marginY + grid.height * cellSize);
			ctx.stroke();
		}
	}

	// Row numbers
	if (showRowNumbers) {
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.font = `${Math.max(8, cellSize * 0.6)}px sans-serif`;
		ctx.textAlign = "right";
		ctx.textBaseline = "middle";
		for (let row = 0; row < grid.height; row++) {
			if (row > 0 && row % numberInterval === 0) {
				ctx.fillText(String(row), marginX - 4, marginY + row * cellSize + cellSize / 2);
			}
		}
	}

	// Column numbers
	if (showColumnNumbers) {
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.font = `${Math.max(8, cellSize * 0.6)}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "bottom";
		for (let col = 0; col < grid.width; col++) {
			if (col > 0 && col % numberInterval === 0) {
				ctx.fillText(String(col), marginX + col * cellSize + cellSize / 2, marginY - 2);
			}
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
				marginX + cell.col * cellSize + cellSize / 2,
				marginY + cell.row * cellSize + cellSize / 2,
			);
		}
	}

	return canvas.toDataURL("image/png");
}
