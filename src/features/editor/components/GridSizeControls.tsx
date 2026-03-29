/**
 * GridSizeControls - Compact inputs for resizing the grid dimensions.
 *
 * Two small number inputs (width x height) with a lock/unlock aspect
 * ratio toggle. Press Enter to apply resize via `usePatternStore.resizeGrid`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePatternStore } from '@/shared/stores/pattern-store';
import { Link2, Link2Off } from 'lucide-react';

export interface GridSizeControlsProps {
	width: number;
	height: number;
}

export function GridSizeControls({ width, height }: GridSizeControlsProps) {
	const resizeGrid = usePatternStore((s) => s.resizeGrid);

	const [editWidth, setEditWidth] = useState(width);
	const [editHeight, setEditHeight] = useState(height);
	const [locked, setLocked] = useState(true);
	const aspectRef = useRef(width / height);

	// Sync from props when dimensions change externally
	useEffect(() => {
		setEditWidth(width);
		setEditHeight(height);
		aspectRef.current = width / height;
	}, [width, height]);

	const handleWidthChange = useCallback(
		(val: number) => {
			setEditWidth(val);
			if (locked) {
				const newHeight = Math.max(1, Math.min(2000, Math.round(val / aspectRef.current)));
				setEditHeight(newHeight);
			}
		},
		[locked],
	);

	const handleHeightChange = useCallback(
		(val: number) => {
			setEditHeight(val);
			if (locked) {
				const newWidth = Math.max(1, Math.min(2000, Math.round(val * aspectRef.current)));
				setEditWidth(newWidth);
			}
		},
		[locked],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter') {
				const w = Math.max(1, Math.min(2000, editWidth));
				const h = Math.max(1, Math.min(2000, editHeight));
				resizeGrid(w, h);
				(e.target as HTMLInputElement).blur();
			} else if (e.key === 'Escape') {
				// Revert to current dimensions
				setEditWidth(width);
				setEditHeight(height);
				(e.target as HTMLInputElement).blur();
			}
		},
		[editWidth, editHeight, resizeGrid, width, height],
	);

	return (
		<span className="inline-flex items-center gap-0.5 text-[11px] text-text-muted">
			<input
				type="number"
				value={editWidth}
				onChange={(e) => handleWidthChange(Math.max(1, Math.min(2000, Number.parseInt(e.target.value) || 1)))}
				onKeyDown={handleKeyDown}
				min={1}
				max={2000}
				className="w-10 rounded border border-border bg-surface-tertiary px-1 py-0 text-center font-mono text-[11px] text-text-secondary focus:border-craft-500 focus:outline-none"
				title="Grid width (Enter to apply)"
			/>
			<span className="mx-0.5">x</span>
			<input
				type="number"
				value={editHeight}
				onChange={(e) => handleHeightChange(Math.max(1, Math.min(2000, Number.parseInt(e.target.value) || 1)))}
				onKeyDown={handleKeyDown}
				min={1}
				max={2000}
				className="w-10 rounded border border-border bg-surface-tertiary px-1 py-0 text-center font-mono text-[11px] text-text-secondary focus:border-craft-500 focus:outline-none"
				title="Grid height (Enter to apply)"
			/>
			<button
				type="button"
				className="ml-0.5 rounded p-px text-text-muted transition-colors hover:text-text-primary"
				onClick={() => setLocked(!locked)}
				title={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
			>
				{locked ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
			</button>
		</span>
	);
}
