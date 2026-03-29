/**
 * PDF export utility for PatternForge.
 *
 * Uses jsPDF to create a multi-page PDF with the pattern grid,
 * title, and optional color legend.
 */

import { oklchToHex } from "@/engine/color/colors";
import type { PatternGrid } from "@/engine/grid/grid";
import { jsPDF } from "jspdf";

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
	} = options ?? {};

	const page = PAGE_SIZES[pageSize];
	const printableWidth = page.width - MARGIN * 2;
	const printableHeight = page.height - MARGIN * 2 - 10; // 10mm for header

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

			const yOffset = MARGIN + 10; // Below header

			// Render cells
			for (let row = startRow; row < endRow; row++) {
				for (let col = startCol; col < endCol; col++) {
					const color = colorMap.get(`${row},${col}`);
					if (color) {
						const hex = oklchToHex(color);
						doc.setFillColor(hex);
						doc.rect(
							MARGIN + (col - startCol) * cellSize,
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
					doc.line(MARGIN, y, MARGIN + (endCol - startCol) * cellSize, y);
				}
				for (let c = startCol; c <= endCol; c++) {
					const x = MARGIN + (c - startCol) * cellSize;
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
							const x = MARGIN + (col - startCol) * cellSize + cellSize / 2;
							const y = yOffset + (row - startRow) * cellSize + cellSize / 2;
							doc.text(symbol, x, y, { align: "center", baseline: "middle" });
						}
					}
				}
			}

			pageNum++;
		}
	}

	// Legend page
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

		const legendStartY = MARGIN + 15;
		const swatchSize = 8;
		const rowHeight = 10;
		const columns = 5;
		const colWidth = printableWidth / columns;

		let colorIdx = 0;
		for (const [color, count] of uniqueColors) {
			const colIdx = colorIdx % columns;
			const rowIdx = Math.floor(colorIdx / columns);

			const x = MARGIN + colIdx * colWidth;
			const y = legendStartY + rowIdx * rowHeight;

			if (y > page.height - MARGIN) {
				// Legend overflows - stop rendering
				break;
			}

			// Swatch
			const hex = oklchToHex(color);
			doc.setFillColor(hex);
			doc.rect(x, y, swatchSize, swatchSize, "F");
			doc.setDrawColor(180, 180, 180);
			doc.rect(x, y, swatchSize, swatchSize, "S");

			// Label
			doc.setFontSize(7);
			doc.setFont("helvetica", "normal");
			doc.text(`${hex} (${count})`, x + swatchSize + 2, y + swatchSize / 2, {
				baseline: "middle",
			});

			colorIdx++;
		}
	}

	return doc.output("blob");
}
