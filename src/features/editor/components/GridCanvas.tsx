/**
 * GridCanvas - Core canvas component for the pattern editor.
 *
 * Wraps CanvasRenderer and handles all mouse/touch interaction including
 * drawing, panning, zooming, and selection.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { CanvasRenderer, type GridPosition } from '@/engine/renderer/canvas-renderer';
import { DrawingTools, type ToolResult } from '@/engine/tools/tools';
import { useEditorStore } from '@/shared/stores/editor-store';
import { usePatternStore } from '@/shared/stores/pattern-store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import type { Cell } from '@/engine/grid/grid';

export interface GridCanvasProps {
	executeCommand: (result: ToolResult, gridWidth: number, gridHeight: number) => void;
}

export function GridCanvas({ executeCommand }: GridCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rendererRef = useRef<CanvasRenderer | null>(null);
	const animFrameRef = useRef<number>(0);
	const containerRef = useRef<HTMLDivElement>(null);

	const [cursorPos, setCursorPos] = useState<GridPosition | null>(null);

	// Drawing state
	const isDrawingRef = useRef(false);
	const isPanningRef = useRef(false);
	const lastGridPosRef = useRef<GridPosition | null>(null);
	const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
	const shapeStartRef = useRef<GridPosition | null>(null);
	const pendingChangesRef = useRef<Array<{ row: number; col: number; data: Partial<Cell> }>>([]);
	const touchStartRef = useRef<{ x: number; y: number; dist: number } | null>(null);

	// Store subscriptions
	const pattern = usePatternStore((s) => s.pattern);
	const activeTool = useEditorStore((s) => s.activeTool);
	const activeColor = useEditorStore((s) => s.activeColor);
	const activeSymbol = useEditorStore((s) => s.activeSymbol);
	const brushSize = useEditorStore((s) => s.brushSize);
	const mirrorHorizontal = useEditorStore((s) => s.mirrorHorizontal);
	const mirrorVertical = useEditorStore((s) => s.mirrorVertical);
	const fillTolerance = useEditorStore((s) => s.fillTolerance);
	const setActiveColor = useEditorStore((s) => s.setActiveColor);
	const setZoom = useEditorStore((s) => s.setZoom);
	const showGridLines = useSettingsStore((s) => s.showGridLines);
	const showCoordinates = useSettingsStore((s) => s.showCoordinates);
	const majorGridInterval = useSettingsStore((s) => s.majorGridInterval);

	// Render the grid
	const render = useCallback(() => {
		const renderer = rendererRef.current;
		const grid = pattern?.grid;
		if (!renderer || !grid) return;

		renderer.render(grid, {
			showGridLines,
			showCoordinates,
			majorGridInterval,
		});

		// Render cursor preview
		if (cursorPos && !isPanningRef.current) {
			renderer.renderToolCursor(cursorPos, activeTool);
		}
	}, [pattern?.grid, showGridLines, showCoordinates, majorGridInterval, cursorPos, activeTool]);

	// Animation loop
	useEffect(() => {
		let running = true;

		const loop = () => {
			if (!running) return;
			render();
			animFrameRef.current = requestAnimationFrame(loop);
		};

		animFrameRef.current = requestAnimationFrame(loop);

		return () => {
			running = false;
			cancelAnimationFrame(animFrameRef.current);
		};
	}, [render]);

	// Initialize renderer on mount
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const renderer = new CanvasRenderer(canvas);
		rendererRef.current = renderer;

		// Fit to view once pattern is available
		if (pattern?.grid) {
			renderer.fitToView(pattern.grid.width, pattern.grid.height);
		}

		return () => {
			renderer.destroy();
			rendererRef.current = null;
		};
		// Only run on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Fit to view when pattern changes
	useEffect(() => {
		const renderer = rendererRef.current;
		const grid = pattern?.grid;
		if (!renderer || !grid) return;

		// Small delay to ensure canvas has been sized
		const timer = setTimeout(() => {
			renderer.fitToView(grid.width, grid.height);
			const viewport = renderer.getViewport();
			setZoom(viewport.zoom);
		}, 50);

		return () => clearTimeout(timer);
	}, [pattern?.id, setZoom]);

	// ResizeObserver for container
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const { width, height } = entry.contentRect;
			rendererRef.current?.resize(width, height);
		});

		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	// Apply a single tool action at a grid position
	const applyToolAt = useCallback(
		(pos: GridPosition, isStart: boolean) => {
			const grid = pattern?.grid;
			if (!grid) return;

			let result: ToolResult;

			switch (activeTool) {
				case 'pencil': {
					result = DrawingTools.pencil(grid, pos, activeColor, activeSymbol);
					break;
				}
				case 'brush': {
					result = DrawingTools.brush(grid, pos, activeColor, activeSymbol, brushSize, 'round');
					break;
				}
				case 'eraser': {
					result = DrawingTools.eraser(grid, pos, brushSize);
					break;
				}
				case 'fill': {
					if (!isStart) return; // Only fill on initial click
					result = DrawingTools.fill(grid, pos, activeColor, activeSymbol, fillTolerance);
					break;
				}
				case 'color-picker': {
					if (!isStart) return;
					const cell = grid.getCell(pos.row, pos.col);
					if (cell?.color) {
						setActiveColor(cell.color);
					}
					return;
				}
				default:
					return;
			}

			// Apply mirror if enabled
			if (mirrorHorizontal || mirrorVertical) {
				result = DrawingTools.mirror(
					result,
					grid.width,
					grid.height,
					mirrorHorizontal,
					mirrorVertical,
				);
			}

			// For continuous drawing (pencil, brush, eraser), apply immediately
			if (isStart) {
				pendingChangesRef.current = [...result.cells];
			} else {
				pendingChangesRef.current.push(...result.cells);
			}

			// Apply changes directly to grid for visual feedback
			for (const entry of result.cells) {
				if (entry.data.color === null && entry.data.symbol === null) {
					grid.clearCell(entry.row, entry.col);
				} else {
					grid.setCell(entry.row, entry.col, entry.data);
				}
			}

			// Notify store of mutation (without creating a history entry for continuous strokes)
			usePatternStore.getState().updateGrid(() => {});
		},
		[pattern?.grid, activeTool, activeColor, activeSymbol, brushSize, fillTolerance, mirrorHorizontal, mirrorVertical, setActiveColor],
	);

	// Commit a drawing stroke to history
	const commitStroke = useCallback(() => {
		if (pendingChangesRef.current.length === 0) return;

		const grid = pattern?.grid;
		if (!grid) return;

		executeCommand(
			{ cells: pendingChangesRef.current },
			grid.width,
			grid.height,
		);
		pendingChangesRef.current = [];
	}, [pattern?.grid, executeCommand]);

	// Get mouse position relative to canvas
	const getCanvasPos = useCallback((e: React.MouseEvent): { x: number; y: number } => {
		const canvas = canvasRef.current;
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	}, []);

	// Mouse event handlers
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			const renderer = rendererRef.current;
			if (!renderer) return;

			const { x, y } = getCanvasPos(e);

			// Middle mouse button → pan
			if (e.button === 1) {
				e.preventDefault();
				isPanningRef.current = true;
				const viewport = renderer.getViewport();
				panStartRef.current = { x, y, offsetX: viewport.offsetX, offsetY: viewport.offsetY };
				return;
			}

			if (e.button !== 0) return;

			// Pan tool
			if (activeTool === 'pan') {
				isPanningRef.current = true;
				const viewport = renderer.getViewport();
				panStartRef.current = { x, y, offsetX: viewport.offsetX, offsetY: viewport.offsetY };
				return;
			}

			const gridPos = renderer.screenToGrid(x, y);
			if (!gridPos) return;

			// Selection tool
			if (activeTool === 'selection') {
				shapeStartRef.current = gridPos;
				return;
			}

			// Start drawing
			isDrawingRef.current = true;
			lastGridPosRef.current = gridPos;
			applyToolAt(gridPos, true);
		},
		[activeTool, getCanvasPos, applyToolAt],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const renderer = rendererRef.current;
			if (!renderer) return;

			const { x, y } = getCanvasPos(e);
			const gridPos = renderer.screenToGrid(x, y);
			setCursorPos(gridPos);

			// Panning
			if (isPanningRef.current && panStartRef.current) {
				const dx = x - panStartRef.current.x;
				const dy = y - panStartRef.current.y;
				renderer.setOffset(
					panStartRef.current.offsetX + dx,
					panStartRef.current.offsetY + dy,
				);
				return;
			}

			// Drawing
			if (isDrawingRef.current && gridPos) {
				// Use Bresenham interpolation for smooth strokes
				if (lastGridPosRef.current) {
					const lineResult = DrawingTools.line(lastGridPosRef.current, gridPos, activeColor, activeSymbol);
					for (const entry of lineResult.cells) {
						const grid = pattern?.grid;
						if (!grid) break;
						if (activeTool === 'eraser') {
							grid.clearCell(entry.row, entry.col);
						} else {
							grid.setCell(entry.row, entry.col, { color: activeColor, symbol: activeSymbol });
						}
						pendingChangesRef.current.push(entry);
					}
					usePatternStore.getState().updateGrid(() => {});
				}
				lastGridPosRef.current = gridPos;
			}
		},
		[getCanvasPos, activeTool, activeColor, activeSymbol, pattern?.grid],
	);

	const handleMouseUp = useCallback(() => {
		if (isDrawingRef.current) {
			commitStroke();
		}
		isDrawingRef.current = false;
		isPanningRef.current = false;
		lastGridPosRef.current = null;
		panStartRef.current = null;
	}, [commitStroke]);

	// Wheel zoom
	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			const renderer = rendererRef.current;
			if (!renderer) return;

			e.preventDefault();
			const { x, y } = getCanvasPos(e);

			const viewport = renderer.getViewport();
			const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
			const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * zoomFactor));

			// Zoom centered on mouse position
			const offsetX = x - (x - viewport.offsetX) * (newZoom / viewport.zoom);
			const offsetY = y - (y - viewport.offsetY) * (newZoom / viewport.zoom);

			renderer.setZoom(newZoom);
			renderer.setOffset(offsetX, offsetY);
			setZoom(newZoom);
		},
		[getCanvasPos, setZoom],
	);

	// Touch event handlers
	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			const renderer = rendererRef.current;
			if (!renderer) return;

			if (e.touches.length === 2) {
				// Two-finger: start pinch/pan
				isPanningRef.current = true;
				const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
				const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const cx = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2;
				const cy = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2;

				const rect = canvasRef.current?.getBoundingClientRect();
				if (rect) {
					const viewport = renderer.getViewport();
					touchStartRef.current = {
						x: cx - rect.left,
						y: cy - rect.top,
						dist,
					};
					panStartRef.current = {
						x: cx - rect.left,
						y: cy - rect.top,
						offsetX: viewport.offsetX,
						offsetY: viewport.offsetY,
					};
				}
				return;
			}

			if (e.touches.length === 1) {
				const touch = e.touches[0]!;
				const rect = canvasRef.current?.getBoundingClientRect();
				if (!rect) return;

				const x = touch.clientX - rect.left;
				const y = touch.clientY - rect.top;
				const gridPos = renderer.screenToGrid(x, y);
				if (!gridPos) return;

				isDrawingRef.current = true;
				lastGridPosRef.current = gridPos;
				applyToolAt(gridPos, true);
			}
		},
		[applyToolAt],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			const renderer = rendererRef.current;
			if (!renderer) return;

			if (e.touches.length === 2 && touchStartRef.current && panStartRef.current) {
				e.preventDefault();

				const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
				const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const cx = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2;
				const cy = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2;

				const rect = canvasRef.current?.getBoundingClientRect();
				if (!rect) return;

				const x = cx - rect.left;
				const y = cy - rect.top;

				// Pinch zoom
				const scale = dist / touchStartRef.current.dist;
				const viewport = renderer.getViewport();
				const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * scale));

				const offsetX = x - (panStartRef.current.x - panStartRef.current.offsetX) * (newZoom / viewport.zoom);
				const offsetY = y - (panStartRef.current.y - panStartRef.current.offsetY) * (newZoom / viewport.zoom);

				renderer.setZoom(newZoom);
				renderer.setOffset(offsetX, offsetY);
				setZoom(newZoom);

				// Update start for continuous pan
				touchStartRef.current = { x, y, dist };
				panStartRef.current = { x, y, offsetX, offsetY };
				return;
			}

			if (e.touches.length === 1 && isDrawingRef.current) {
				e.preventDefault();
				const touch = e.touches[0]!;
				const rect = canvasRef.current?.getBoundingClientRect();
				if (!rect) return;

				const x = touch.clientX - rect.left;
				const y = touch.clientY - rect.top;
				const gridPos = renderer.screenToGrid(x, y);

				if (gridPos && lastGridPosRef.current) {
					const lineResult = DrawingTools.line(lastGridPosRef.current, gridPos, activeColor, activeSymbol);
					for (const entry of lineResult.cells) {
						const grid = pattern?.grid;
						if (!grid) break;
						if (activeTool === 'eraser') {
							grid.clearCell(entry.row, entry.col);
						} else {
							grid.setCell(entry.row, entry.col, { color: activeColor, symbol: activeSymbol });
						}
						pendingChangesRef.current.push(entry);
					}
					usePatternStore.getState().updateGrid(() => {});
					lastGridPosRef.current = gridPos;
				}
			}
		},
		[activeColor, activeSymbol, activeTool, pattern?.grid, setZoom],
	);

	const handleTouchEnd = useCallback(() => {
		if (isDrawingRef.current) {
			commitStroke();
		}
		isDrawingRef.current = false;
		isPanningRef.current = false;
		lastGridPosRef.current = null;
		panStartRef.current = null;
		touchStartRef.current = null;
	}, [commitStroke]);

	// Context menu prevention
	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
	}, []);

	const canvasCursor = activeTool === 'pan' ? 'grab' : 'crosshair';

	return (
		<div ref={containerRef} className="relative h-full w-full overflow-hidden bg-surface-tertiary">
			<canvas
				ref={canvasRef}
				className="h-full w-full"
				style={{ cursor: canvasCursor }}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onWheel={handleWheel}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				onContextMenu={handleContextMenu}
			/>
			{cursorPos && (
				<div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
					R: {cursorPos.row}, C: {cursorPos.col}
				</div>
			)}
		</div>
	);
}
