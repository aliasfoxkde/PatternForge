/**
 * StatusBar - Bottom status bar for the editor.
 *
 * Shows cursor position, grid dimensions, zoom level, and row counter.
 */

import { RowCounter } from '@/features/progress/components/RowCounter';
import { useProgressStore } from '@/features/progress/progress-store';
import { usePatternStore } from '@/shared/stores/pattern-store';
import { useEditorStore } from '@/shared/stores/editor-store';

export interface StatusBarProps {
	cursorPos: { row: number; col: number } | null;
}

export function StatusBar({ cursorPos }: StatusBarProps) {
	const pattern = usePatternStore((s) => s.pattern);
	const zoom = useEditorStore((s) => s.zoom);
	const currentRow = useProgressStore((s) => s.currentRow);
	const setCurrentRow = useProgressStore((s) => s.setCurrentRow);

	const gridWidth = pattern?.grid.width ?? 0;
	const gridHeight = pattern?.grid.height ?? 0;

	return (
		<div className="flex h-6 items-center justify-between border-t border-border bg-surface-secondary px-3 text-[11px] text-text-muted">
			<span>
				{cursorPos
					? `Row: ${cursorPos.row}, Col: ${cursorPos.col}`
					: 'No selection'}
			</span>
			<span>{gridWidth} x {gridHeight}</span>
			<span>{Math.round(zoom * 100)}%</span>
			{pattern && (
				<RowCounter
					totalRows={gridHeight}
					currentRow={currentRow}
					onRowChange={setCurrentRow}
				/>
			)}
		</div>
	);
}
