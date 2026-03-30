/**
 * TilePreviewDialog - Shows how a selected region tiles/repeats.
 *
 * Renders the selected cells as a repeating pattern across
 * a larger preview area, and optionally applies the tile
 * to the entire grid.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Grid3X3, X } from "lucide-react";
import { usePatternStore } from "@/shared/stores/pattern-store";
import type { Cell } from "@/engine/grid/grid";

interface TilePreviewDialogProps {
	open: boolean;
	onClose: () => void;
	/** Selected region bounds */
	selectionRect: {
		startRow: number;
		startCol: number;
		endRow: number;
		endCol: number;
	};
	/** How many times to repeat (e.g. 3 = 3x3) */
	tileCount?: number;
	/** Optional history-aware apply callback. Receives tile cells and grid dims. */
	onApplyTile?: (cells: Array<{ row: number; col: number; data: Partial<Cell> }>, tileW: number, tileH: number) => void;
}

export function TilePreviewDialog({
	open,
	onClose,
	selectionRect,
	tileCount = 3,
	onApplyTile,
}: TilePreviewDialogProps) {
	const pattern = usePatternStore((s) => s.pattern);
	const updateGrid = usePatternStore((s) => s.updateGrid);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [repeatCount, setRepeatCount] = useState(tileCount);

	const minRow = Math.min(selectionRect.startRow, selectionRect.endRow);
	const maxRow = Math.max(selectionRect.startRow, selectionRect.endRow);
	const minCol = Math.min(selectionRect.startCol, selectionRect.endCol);
	const maxCol = Math.max(selectionRect.startCol, selectionRect.endCol);
	const tileW = maxCol - minCol + 1;
	const tileH = maxRow - minRow + 1;

	// Extract tile cell data
	const tileData = useCallback(() => {
		if (!pattern) return [];
		const cells: Array<{ row: number; col: number; data: Partial<Cell> }> = [];
		for (let r = minRow; r <= maxRow; r++) {
			for (let c = minCol; c <= maxCol; c++) {
				const cell = pattern.grid.getCell(r, c);
				if (cell && (cell.color || cell.symbol || cell.stitchType !== "full")) {
					cells.push({
						row: r - minRow,
						col: c - minCol,
						data: { color: cell.color, symbol: cell.symbol, stitchType: cell.stitchType },
					});
				}
			}
		}
		return cells;
	}, [pattern, minRow, maxRow, minCol, maxCol]);

	// Render tile preview on canvas
	useEffect(() => {
		if (!open || !canvasRef.current || !pattern) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const cellSize = Math.max(2, Math.min(20, Math.floor(800 / (tileW * repeatCount))));
		canvas.width = tileW * repeatCount * cellSize;
		canvas.height = tileH * repeatCount * cellSize;
		canvas.style.width = `${tileW * repeatCount * cellSize}px`;
		canvas.style.height = `${tileH * repeatCount * cellSize}px`;

		// Re-extract tile data on every render so it stays live
		const cells: Array<{ row: number; col: number; data: Partial<Cell> }> = [];
		for (let r = minRow; r <= maxRow; r++) {
			for (let c = minCol; c <= maxCol; c++) {
				const cell = pattern.grid.getCell(r, c);
				if (cell && (cell.color || cell.symbol || cell.stitchType !== "full")) {
					cells.push({
						row: r - minRow,
						col: c - minCol,
						data: { color: cell.color, symbol: cell.symbol, stitchType: cell.stitchType },
					});
				}
			}
		}

		// White background
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Render tiled cells
		for (let repY = 0; repY < repeatCount; repY++) {
			for (let repX = 0; repX < repeatCount; repX++) {
				for (const cell of cells) {
					if (cell.data.color) {
						ctx.fillStyle = cell.data.color;
						ctx.fillRect(
							(repX * tileW + cell.col) * cellSize,
							(repY * tileH + cell.row) * cellSize,
							cellSize,
							cellSize,
						);
					}
				}
			}
		}

		// Grid lines for tile boundaries
		ctx.strokeStyle = "rgba(0,0,0,0.15)";
		ctx.lineWidth = 1;
		for (let repX = 0; repX <= repeatCount; repX++) {
			const x = repX * tileW * cellSize;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvas.height);
			ctx.stroke();
		}
		for (let repY = 0; repY <= repeatCount; repY++) {
			const y = repY * tileH * cellSize;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(canvas.width, y);
			ctx.stroke();
		}
	}, [open, pattern, repeatCount, tileW, tileH, minRow, maxRow, minCol, maxCol]);

	// Apply tiled pattern to the grid
	const handleApply = useCallback(() => {
		if (!pattern) return;
		const cells = tileData();
		if (cells.length === 0) return;

		if (onApplyTile) {
			onApplyTile(cells, tileW, tileH);
			onClose();
			return;
		}

		updateGrid((grid) => {
			// Clear the grid first
			grid.clearAll();

			// Tile across the entire grid
			const gridH = pattern.grid.height;
			const gridW = pattern.grid.width;

			for (let repY = 0; repY * tileH < gridH; repY++) {
				for (let repX = 0; repX * tileW < gridW; repX++) {
					for (const cell of cells) {
						const targetRow = repY * tileH + cell.row;
						const targetCol = repX * tileW + cell.col;
						if (targetRow < gridH && targetCol < gridW) {
							grid.setCell(targetRow, targetCol, { ...cell.data });
						}
					}
				}
			}
		});

		onClose();
	}, [pattern, tileData, tileW, tileH, updateGrid, onClose, onApplyTile]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			role="dialog"
			aria-modal="true"
			aria-label="Tile preview"
		>
			<div className="flex w-full max-w-4xl flex-col gap-4 rounded-xl bg-surface p-5 shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h2 className="text-base font-semibold text-text-primary">
						Tile Preview
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1.5 text-text-secondary hover:bg-surface-tertiary"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Info */}
				<p className="text-sm text-text-secondary">
					Preview of {tileW} x {tileH} cell region tiled {repeatCount}x{repeatCount}
				</p>

				{/* Repeat count controls */}
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium text-text-secondary">Repeat:</span>
					<button
						type="button"
						onClick={() => setRepeatCount((n) => Math.max(1, n - 1))}
						className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-surface-tertiary"
					>
						-
					</button>
					<span className="min-w-[2rem] text-center text-sm font-medium tabular-nums text-text-primary">
						{repeatCount}x{repeatCount}
					</span>
					<button
						type="button"
						onClick={() => setRepeatCount((n) => Math.min(10, n + 1))}
						className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-text-secondary hover:bg-surface-tertiary"
					>
						+
					</button>
				</div>

				{/* Canvas preview */}
				<div className="flex items-center justify-center overflow-auto rounded-lg border border-border bg-white p-2">
					<canvas ref={canvasRef} className="rounded" />
				</div>

				{/* Actions */}
				<div className="flex items-center justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleApply}
						className="inline-flex items-center gap-2 rounded-lg bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
					>
						<Grid3X3 className="h-4 w-4" />
						Apply Tile to Grid
					</button>
				</div>
			</div>
		</div>
	);
}
