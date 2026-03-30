/**
 * Minimap - Small overview canvas showing the entire pattern with a
 * viewport rectangle indicating what is currently visible in the main canvas.
 *
 * Renders at a very zoomed-out scale (1-2px per cell). Clicking the minimap
 * dispatches a `patternforge:minimap-navigate` custom event with `{row, col}`
 * so the main canvas can center on that position.
 */

import { memo, useRef, useEffect, useCallback } from 'react';
import { usePatternStore } from '@/shared/stores/pattern-store';
import { useEditorStore } from '@/shared/stores/editor-store';

const MINIMAP_SIZE = 150;
const BASE_CELL_SIZE = 20;

export interface MinimapProps {
	width: number;
	height: number;
}

interface ViewportEventDetail {
	offsetX: number;
	offsetY: number;
	zoom: number;
}

function MinimapInner({ width: containerWidth, height: containerHeight }: MinimapProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const viewportRef = useRef<ViewportEventDetail>({ offsetX: 0, offsetY: 0, zoom: 1 });

	const pattern = usePatternStore((s) => s.pattern);
	const zoom = useEditorStore((s) => s.zoom);
	const showMinimap = useEditorStore((s) => s.showMinimap);

	// Listen for viewport changes from the main canvas renderer
	useEffect(() => {
		const handler = (e: Event) => {
			const detail = (e as CustomEvent<ViewportEventDetail>).detail;
			if (detail) {
				viewportRef.current = {
					offsetX: detail.offsetX,
					offsetY: detail.offsetY,
					zoom: detail.zoom,
				};
			}
		};
		window.addEventListener('patternforge:viewport-changed', handler);
		return () => window.removeEventListener('patternforge:viewport-changed', handler);
	}, []);

	// Draw the minimap whenever the pattern or viewport changes
	useEffect(() => {
		const canvas = canvasRef.current;
		const grid = pattern?.grid;
		if (!canvas || !grid) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Determine cell size in minimap (capped at 2px)
		const cellSizeMinimap = Math.min(MINIMAP_SIZE / Math.max(grid.width, grid.height), 2);
		const minimapW = Math.ceil(grid.width * cellSizeMinimap);
		const minimapH = Math.ceil(grid.height * cellSizeMinimap);

		// Size the canvas to fit the grid
		const dpr = window.devicePixelRatio ?? 1;
		canvas.width = minimapW * dpr;
		canvas.height = minimapH * dpr;
		canvas.style.width = `${minimapW}px`;
		canvas.style.height = `${minimapH}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		// Clear with background
		ctx.fillStyle = '#f5f5f5';
		ctx.fillRect(0, 0, minimapW, minimapH);

		// Draw populated cells
		grid.forEach((cell) => {
			if (cell.color !== null) {
				ctx.fillStyle = cell.color;
				ctx.fillRect(cell.col * cellSizeMinimap, cell.row * cellSizeMinimap, cellSizeMinimap, cellSizeMinimap);
			}
		});

		// Draw viewport rectangle
		const vp = viewportRef.current;
		const vpX = (vp.offsetX / BASE_CELL_SIZE) * cellSizeMinimap;
		const vpY = (vp.offsetY / BASE_CELL_SIZE) * cellSizeMinimap;
		const vpW = (containerWidth / (BASE_CELL_SIZE * vp.zoom)) * cellSizeMinimap;
		const vpH = (containerHeight / (BASE_CELL_SIZE * vp.zoom)) * cellSizeMinimap;

		ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
		ctx.lineWidth = 1.5;
		ctx.strokeRect(vpX, vpY, vpW, vpH);
		ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
		ctx.fillRect(vpX, vpY, vpW, vpH);
	}, [pattern?.grid, zoom, containerWidth, containerHeight]);

	// Click to navigate
	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			const canvas = canvasRef.current;
			const grid = pattern?.grid;
			if (!canvas || !grid) return;

			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			const cellSizeMinimap = Math.min(MINIMAP_SIZE / Math.max(grid.width, grid.height), 2);
			const col = Math.floor(x / cellSizeMinimap);
			const row = Math.floor(y / cellSizeMinimap);

			window.dispatchEvent(
				new CustomEvent('patternforge:minimap-navigate', {
					detail: { row, col },
				}),
			);
		},
		[pattern?.grid],
	);

	if (!showMinimap || !pattern) return null;

	return (
		<div className="pointer-events-auto absolute bottom-8 left-2 z-10 rounded-md border border-border bg-surface-secondary/90 p-1.5 shadow-md backdrop-blur-sm">
			<canvas
				ref={canvasRef}
				className="cursor-pointer"
				onClick={handleClick}
				style={{
					maxWidth: `${MINIMAP_SIZE}px`,
					maxHeight: `${MINIMAP_SIZE}px`,
				}}
			/>
		</div>
	);
}

export const Minimap = memo(MinimapInner);
