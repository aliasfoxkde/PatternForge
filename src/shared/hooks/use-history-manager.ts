/**
 * History manager hook.
 *
 * Creates a HistoryManager instance and exposes execute, undo, redo.
 * Integrates with the pattern store so that undo/redo mutations are
 * reflected in the React state.
 */

import { useRef, useCallback } from 'react';
import { HistoryManager, ApplyCellsCommand } from '@/engine/history/history';
import type { Cell } from '@/engine/grid/grid';
import type { ToolResult } from '@/engine/tools/tools';
import { usePatternStore } from '@/shared/stores/pattern-store';

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

	const undo = useCallback(() => {
		const history = historyRef.current;
		const pattern = usePatternStore.getState().pattern;
		if (!history || !pattern) return;

		const command = history.undo(pattern.grid);
		if (command) {
			usePatternStore.getState().updateGrid(() => {
				// Grid already mutated in-place by command.undo
			});
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
			usePatternStore.getState().updateGrid(() => {
				// Grid already mutated in-place by command.execute
			});
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

	return { executeCommand, undo, redo, canUndo, canRedo, clearHistory };
}
