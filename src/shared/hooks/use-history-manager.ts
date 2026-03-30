/**
 * History manager hook.
 *
 * Creates a HistoryManager instance and exposes execute, undo, redo.
 * Integrates with the pattern store so that undo/redo mutations are
 * reflected in the React state.
 */

import { useRef, useCallback } from 'react';
import {
	HistoryManager,
	ApplyCellsCommand,
	ResizeGridCommand,
	ClearGridCommand,
	SetPaletteCommand,
} from '@/engine/history/history';
import type { Cell } from '@/engine/grid/grid';
import type { PatternPalette } from '@/engine/pattern/types';
import type { ToolResult } from '@/engine/tools/tools';
import { usePatternStore } from '@/shared/stores/pattern-store';

/** Helper: extract all non-empty cells from a grid into serializable form. */
function snapshotGridCells(
	grid: import('@/engine/grid/grid').PatternGrid,
): Array<{ row: number; col: number; data: Partial<Cell> }> {
	const cells: Array<{ row: number; col: number; data: Partial<Cell> }> = [];
	for (let r = 0; r < grid.height; r++) {
		for (let c = 0; c < grid.width; c++) {
			const cell = grid.getCell(r, c);
			if (cell && (cell.color || cell.symbol || cell.stitchType !== 'full' || cell.completed)) {
				cells.push({
					row: r,
					col: c,
					data: { color: cell.color, symbol: cell.symbol, stitchType: cell.stitchType, completed: cell.completed },
				});
			}
		}
	}
	return cells;
}

export function useHistoryManager() {
	const historyRef = useRef<HistoryManager | null>(null);
	const canUndoRef = useRef(false);
	const canRedoRef = useRef(false);

	if (!historyRef.current) {
		historyRef.current = new HistoryManager(200);
	}

	const executeCommand = useCallback(
		(toolResult: ToolResult, _gridWidth: number, _gridHeight: number) => {
			const history = historyRef.current;
			const pattern = usePatternStore.getState().pattern;
			if (!history || !pattern) return;

			// Build before/after snapshots for each affected cell
			const changes = toolResult.cells.map((entry) => {
				const before = pattern.grid.getCell(entry.row, entry.col);
				const beforeData: Partial<Cell> | null = before
					? { color: before.color, symbol: before.symbol, stitchType: before.stitchType, completed: before.completed }
					: null;
				const afterData: Partial<Cell> | null =
					entry.data.color === null && entry.data.symbol === null
						? null
						: { ...entry.data };

				return {
					row: entry.row,
					col: entry.col,
					before: beforeData,
					after: afterData,
				};
			});

			const command = new ApplyCellsCommand('Draw', changes);
			history.execute(command, pattern.grid);

			// Notify the store that the grid was mutated
			usePatternStore.getState().updateGrid(() => {
				// Grid already mutated in-place by command.execute
			});

			canUndoRef.current = history.canUndo();
			canRedoRef.current = history.canRedo();
		},
		[],
	);

	/**
	 * Execute a grid resize through the history system.
	 * Saves all current cells so undo can restore them.
	 */
	const executeResize = useCallback((newWidth: number, newHeight: number) => {
		const history = historyRef.current;
		const pattern = usePatternStore.getState().pattern;
		if (!history || !pattern) return;

		const savedCells = snapshotGridCells(pattern.grid);
		const command = new ResizeGridCommand(
			pattern.grid.width,
			pattern.grid.height,
			newWidth,
			newHeight,
			savedCells,
		);
		history.execute(command, pattern.grid);

		usePatternStore.getState().updateGrid(() => {});

		canUndoRef.current = history.canUndo();
		canRedoRef.current = history.canRedo();
	}, []);

	/**
	 * Execute a grid clear through the history system.
	 * Saves all current cells so undo can restore them.
	 */
	const executeClearGrid = useCallback(() => {
		const history = historyRef.current;
		const pattern = usePatternStore.getState().pattern;
		if (!history || !pattern) return;

		const savedCells = snapshotGridCells(pattern.grid);
		const command = new ClearGridCommand(savedCells);
		history.execute(command, pattern.grid);

		usePatternStore.getState().updateGrid(() => {});

		canUndoRef.current = history.canUndo();
		canRedoRef.current = history.canRedo();
	}, []);

	/**
	 * Execute a palette change through the history system.
	 * Stores old/new palettes for undo/redo.
	 */
	const executeSetPalette = useCallback((newPalette: PatternPalette) => {
		const history = historyRef.current;
		const pattern = usePatternStore.getState().pattern;
		if (!history || !pattern) return;

		const oldPalette = pattern.palette;
		const command = new SetPaletteCommand(oldPalette, newPalette);
		history.execute(command, pattern.grid);

		// Apply the new palette via store
		usePatternStore.getState().setPalette(newPalette);

		canUndoRef.current = history.canUndo();
		canRedoRef.current = history.canRedo();
	}, []);

	/**
	 * Execute a batch cell change through the history system.
	 * Takes before/after snapshots for each affected cell.
	 */
	const executeApplyCells = useCallback(
		(
			description: string,
			changes: Array<{ row: number; col: number; before: Partial<Cell> | null; after: Partial<Cell> | null }>,
		) => {
			const history = historyRef.current;
			const pattern = usePatternStore.getState().pattern;
			if (!history || !pattern) return;

			const command = new ApplyCellsCommand(description, changes);
			history.execute(command, pattern.grid);

			usePatternStore.getState().updateGrid(() => {});

			canUndoRef.current = history.canUndo();
			canRedoRef.current = history.canRedo();
		},
		[],
	);

	const undo = useCallback(() => {
		const history = historyRef.current;
		const pattern = usePatternStore.getState().pattern;
		if (!history || !pattern) return;

		const command = history.undo(pattern.grid);
		if (command) {
			// Handle palette commands specially
			if (command instanceof SetPaletteCommand) {
				usePatternStore.getState().setPalette(command.oldPalette);
			} else {
				usePatternStore.getState().updateGrid(() => {
					// Grid already mutated in-place by command.undo
				});
			}
		}

		canUndoRef.current = history.canUndo();
		canRedoRef.current = history.canRedo();
	}, []);

	const redo = useCallback(() => {
		const history = historyRef.current;
		const pattern = usePatternStore.getState().pattern;
		if (!history || !pattern) return;

		const command = history.redo(pattern.grid);
		if (command) {
			// Handle palette commands specially
			if (command instanceof SetPaletteCommand) {
				usePatternStore.getState().setPalette(command.newPalette);
			} else {
				usePatternStore.getState().updateGrid(() => {
					// Grid already mutated in-place by command.execute
				});
			}
		}

		canUndoRef.current = history.canUndo();
		canRedoRef.current = history.canRedo();
	}, []);

	const canUndo = canUndoRef.current;
	const canRedo = canRedoRef.current;

	const clearHistory = useCallback(() => {
		historyRef.current?.clear();
		canUndoRef.current = false;
		canRedoRef.current = false;
	}, []);

	return {
		executeCommand,
		executeResize,
		executeClearGrid,
		executeSetPalette,
		executeApplyCells,
		undo,
		redo,
		canUndo,
		canRedo,
		clearHistory,
	};
}
