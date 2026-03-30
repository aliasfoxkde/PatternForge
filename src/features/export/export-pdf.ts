/**
 * PDF export utility for PatternForge.
 *
 * Uses jsPDF to create a multi-page PDF with the pattern grid,
 * title, and optional color legend.
 */

import { oklchToHex } from "@/engine/color/colors";
import type { PatternGrid } from "@/engine/grid/grid";
import { findNearestDmcColor } from "@/data/color-matching";

export interface ExportPDFOptions {
	/** Draw grid lines between cells */
	showGridLines?: boolean;
	/** Draw cell symbols */
	showSymbols?: boolean;
	/** Cell size in points (mm) */
	cellSize?: number;
	/** Include a color legend page */
	includeLegend?: boolean;
	/** Page size */
	pageSize?: "a4" | "letter";
	/** Show row numbers on left side */
	showRowNumbers?: boolean;
	/** Show column numbers on top */
	showColumnNumbers?: boolean;
	/** Interval for row/column numbers (default: 10) */
	numberInterval?: number;
}

/** Page dimensions in mm */
const PAGE_SIZES = {
	a4: { width: 210, height: 297 },
	letter: { width: 215.9, height: 279.4 },
};

const MARGIN = 15; // mm

/**
 * Export a pattern grid as a PDF Blob.
 *
 * The grid is rendered across multiple pages if it exceeds the
 * printable area of a single page. Includes a title header and
 * optional color legend.
 *
 * @param grid - The pattern grid to render
 * @param patternName - Name displayed in the PDF header
 * @param options - Optional export settings
 * @returns A Blob for download
 */
export async function exportToPDF(
	grid: PatternGrid,
	patternName: string,
	options?: ExportPDFOptions,
): Promise<Blob> {
	const {
		showGridLines = false,
		showSymbols = false,
		cellSize = 5,
		includeLegend = true,
		pageSize = "a4",
		showRowNumbers = true,
		showColumnNumbers = true,
		numberInterval = 10,
	} = options ?? {};

	const { jsPDF } = await import("jspdf");

	const page = PAGE_SIZES[pageSize];
	const rowNumWidth = showRowNumbers ? 8 : 0; // mm for row numbers column
	const colNumHeight = showColumnNumbers ? 5 : 0; // mm for column numbers row
	const printableWidth = page.width - MARGIN * 2 - rowNumWidth;
	const printableHeight = page.height - MARGIN * 2 - 10 - colNumHeight;

	const cellsPerRow = Math.floor(printableWidth / cellSize);
	const cellsPerCol = Math.floor(printableHeight / cellSize);

	const doc = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: pageSize === "a4" ? "a4" : "letter",
	});

	// Collect all cells into lookups
	const colorMap = new Map<string, string>();
	const symbolMap = new Map<string, string>();
	const uniqueColors = new Map<string, number>();

	const allCells = grid.getCellsInArea(0, 0, grid.width, grid.height);

	for (const cell of allCells) {
		if (cell.color !== null) {
			colorMap.set(`${cell.row},${cell.col}`, cell.color);
			uniqueColors.set(cell.color, (uniqueColors.get(cell.color) ?? 0) + 1);
		}
		if (cell.symbol !== null) {
			symbolMap.set(`${cell.row},${cell.col}`, cell.symbol);
		}
	}

	const totalRowTiles = Math.ceil(grid.width / cellsPerRow);
	const totalColTiles = Math.ceil(grid.height / cellsPerCol);
	let pageNum = 0;

	// Render grid tiles across pages
	for (let tileRow = 0; tileRow < totalColTiles; tileRow++) {
		for (let tileCol = 0; tileCol < totalRowTiles; tileCol++) {
			if (pageNum > 0) {
				doc.addPage(pageSize === "a4" ? "a4" : "letter", "portrait");
			}

			// Header
			doc.setFontSize(14);
			doc.setFont("helvetica", "bold");
			doc.text(patternName, MARGIN, MARGIN);

			doc.setFontSize(8);
			doc.setFont("helvetica", "normal");
			doc.setTextColor(128, 128, 128);
			doc.text(
				`Page ${pageNum + 1} of ${totalRowTiles * totalColTiles + (includeLegend ? 1 : 0)}`,
				page.width - MARGIN,
				MARGIN,
				{ align: "right" },
			);
			doc.setTextColor(0, 0, 0);

			const startRow = tileRow * cellsPerCol;
			const startCol = tileCol * cellsPerRow;
			const endRow = Math.min(startRow + cellsPerCol, grid.height);
			const endCol = Math.min(startCol + cellsPerRow, grid.width);

			const xOffset = MARGIN + rowNumWidth;
			const yOffset = MARGIN + 10 + colNumHeight;

			// Column numbers
			if (showColumnNumbers) {
				doc.setFontSize(Math.max(4, cellSize * 1.5));
				doc.setFont("helvetica", "normal");
				doc.setTextColor(100, 100, 100);
				for (let col = startCol; col < endCol; col++) {
					if (col > 0 && col % numberInterval === 0) {
						const x = xOffset + (col - startCol) * cellSize + cellSize / 2;
						doc.text(String(col), x, MARGIN + 10 + colNumHeight - 1, {
							align: "center",
							baseline: "bottom",
						});
					}
				}
				doc.setTextColor(0, 0, 0);
			}

			// Row numbers
			if (showRowNumbers) {
				doc.setFontSize(Math.max(4, cellSize * 1.5));
				doc.setFont("helvetica", "normal");
				doc.setTextColor(100, 100, 100);
				for (let row = startRow; row < endRow; row++) {
					if (row > 0 && row % numberInterval === 0) {
						const y = yOffset + (row - startRow) * cellSize + cellSize / 2;
						doc.text(String(row), MARGIN, y, {
							align: "right",
							baseline: "middle",
						});
					}
				}
				doc.setTextColor(0, 0, 0);
			}

			// Render cells
			for (let row = startRow; row < endRow; row++) {
				for (let col = startCol; col < endCol; col++) {
					const color = colorMap.get(`${row},${col}`);
					if (color) {
						const hex = oklchToHex(color);
						doc.setFillColor(hex);
						doc.rect(
							xOffset + (col - startCol) * cellSize,
							yOffset + (row - startRow) * cellSize,
							cellSize,
							cellSize,
							"F",
						);
					}
				}
			}

			// Grid lines
			if (showGridLines) {
				doc.setDrawColor(200, 200, 200);
				doc.setLineWidth(0.1);

				for (let r = startRow; r <= endRow; r++) {
					const y = yOffset + (r - startRow) * cellSize;
					doc.line(xOffset, y, xOffset + (endCol - startCol) * cellSize, y);
				}
				for (let c = startCol; c <= endCol; c++) {
					const x = xOffset + (c - startCol) * cellSize;
					doc.line(x, yOffset, x, yOffset + (endRow - startRow) * cellSize);
				}
			}

			// Symbols
			if (showSymbols) {
				const fontSize = Math.max(4, cellSize * 2);
				doc.setFontSize(fontSize);
				doc.setFont("helvetica", "normal");

				for (let row = startRow; row < endRow; row++) {
					for (let col = startCol; col < endCol; col++) {
						const symbol = symbolMap.get(`${row},${col}`);
						if (symbol) {
							const x = xOffset + (col - startCol) * cellSize + cellSize / 2;
							const y = yOffset + (row - startRow) * cellSize + cellSize / 2;
							doc.text(symbol, x, y, { align: "center", baseline: "middle" });
						}
					}
				}
			}

			pageNum++;
		}
	}

	// Legend page with DMC floss matching
	if (includeLegend && uniqueColors.size > 0) {
		doc.addPage(pageSize === "a4" ? "a4" : "letter", "portrait");

		doc.setFontSize(14);
		doc.setFont("helvetica", "bold");
		doc.text(`${patternName} - Color Legend`, MARGIN, MARGIN);

		doc.setFontSize(8);
		doc.setFont("helvetica", "normal");
		doc.setTextColor(128, 128, 128);
		doc.text(
			`${grid.width} x ${grid.height} cells | ${uniqueColors.size} colors`,
			MARGIN,
			MARGIN + 5,
		);
		doc.setTextColor(0, 0, 0);

		// Sort colors by usage count (most used first)
		const sortedColors = [...uniqueColors.entries()].sort((a, b) => b[1] - a[1]);

		const legendStartY = MARGIN + 15;
		const swatchSize = 8;
		const rowHeight = 12;
		const columns = 3;
		const colWidth = (page.width - MARGIN * 2) / columns;

		let colorIdx = 0;
		for (const [color, count] of sortedColors) {
			const colIdx = colorIdx % columns;
			const rowIdx = Math.floor(colorIdx / columns);

			const x = MARGIN + colIdx * colWidth;
			const y = legendStartY + rowIdx * rowHeight;

			if (y > page.height - MARGIN) {
				break;
			}

			// Swatch
			const hex = oklchToHex(color);
			doc.setFillColor(hex);
			doc.rect(x, y, swatchSize, swatchSize, "F");
			doc.setDrawColor(180, 180, 180);
			doc.rect(x, y, swatchSize, swatchSize, "S");

			// DMC match
			const dmc = findNearestDmcColor(hex);
			const label = dmc
				? `${dmc.id} ${dmc.name} (${count})`
				: `${hex} (${count})`;

			doc.setFontSize(7);
			doc.setFont("helvetica", "normal");
			doc.text(label, x + swatchSize + 2, y + swatchSize / 2, {
				baseline: "middle",
			});

			colorIdx++;
		}

		// Total stitch count
		const totalStitches = [...uniqueColors.values()].reduce((sum, c) => sum + c, 0);
		const totalY = legendStartY + Math.ceil(sortedColors.length / columns) * rowHeight + 10;
		if (totalY < page.height - MARGIN) {
			doc.setFontSize(9);
			doc.setFont("helvetica", "bold");
			doc.text(`Total stitches: ${totalStitches}`, MARGIN, totalY);
		}
	}

	return doc.output("blob");
}
