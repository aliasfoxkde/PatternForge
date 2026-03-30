/**
 * GridCanvas - Core canvas component for the pattern editor.
 *
 * Wraps CanvasRenderer and handles all mouse/touch interaction including
 * drawing, panning, zooming, and selection.
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import { CanvasRenderer, type GridPosition, type Selection } from '@/engine/renderer/canvas-renderer';
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

	// Drawing state refs (not state to avoid re-renders during drawing)
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
	const shapeFilled = useEditorStore((s) => s.shapeFilled);
	const activeStitchType = useEditorStore((s) => s.activeStitchType);
	const selectionRect = useEditorStore((s) => s.selectionRect);
	const setSelectionRect = useEditorStore((s) => s.setSelectionRect);
	const setActiveColor = useEditorStore((s) => s.setActiveColor);
	const setZoom = useEditorStore((s) => s.setZoom);
	const showGridLines = useSettingsStore((s) => s.showGridLines);
	const showCoordinates = useSettingsStore((s) => s.showCoordinates);
	const majorGridInterval = useSettingsStore((s) => s.majorGridInterval);

	// ---- Render the grid ----------------------------------------------------

	const render = useCallback(() => {
		const renderer = rendererRef.current;
		const grid = pattern?.grid;
		if (!renderer || !grid) return;

		renderer.render(grid, {
			showGridLines,
			showCoordinates,
			majorGridInterval,
		});

		// Render selection rectangle
		if (selectionRect) {
			renderer.renderSelection(selectionRect as Selection);
		}

		// Render cursor preview
		if (cursorPos && !isPanningRef.current) {
			renderer.renderToolCursor(cursorPos, activeTool);
		}
	}, [pattern?.grid, showGridLines, showCoordinates, majorGridInterval, cursorPos, activeTool, selectionRect]);

	// ---- Animation loop -----------------------------------------------------

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

	// ---- Initialize renderer on mount --------------------------------------

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const renderer = new CanvasRenderer(canvas);
		rendererRef.current = renderer;

		if (pattern?.grid) {
			renderer.fitToView(pattern.grid.width, pattern.grid.height);
		}

		return () => {
			renderer.destroy();
			rendererRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ---- Fit to view when pattern changes -----------------------------------

	useEffect(() => {
		const renderer = rendererRef.current;
		const grid = pattern?.grid;
		if (!renderer || !grid) return;

		const timer = setTimeout(() => {
			renderer.fitToView(grid.width, grid.height);
			const viewport = renderer.getViewport();
			setZoom(viewport.zoom);
		}, 50);

		return () => clearTimeout(timer);
	}, [pattern?.id, setZoom]);

	// ---- ResizeObserver for container ---------------------------------------

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

	// ---- Apply tool at grid position ----------------------------------------

	/**
	 * Apply the active tool at the given grid position.
	 * Returns the tool result (cells to modify).
	 */
	const applyToolAt = useCallback(
		(pos: GridPosition, isStart: boolean): ToolResult | null => {
			const grid = pattern?.grid;
			if (!grid) return null;

			const color = activeColor;
			const symbol = activeSymbol;
			const stitchType = activeStitchType;

			switch (activeTool) {
				case 'pencil': {
					return DrawingTools.pencil(grid, pos, color, symbol, stitchType);
				}
				case 'brush': {
					return DrawingTools.brush(grid, pos, color, symbol, brushSize, 'round', stitchType);
				}
				case 'eraser': {
					return DrawingTools.eraser(grid, pos, brushSize);
				}
				case 'fill': {
					if (!isStart) return null;
					return DrawingTools.fill(grid, pos, color, symbol, fillTolerance, stitchType);
				}
				case 'color-picker': {
					if (!isStart) return null;
					const cell = grid.getCell(pos.row, pos.col);
					if (cell?.color) {
						setActiveColor(cell.color);
					}
					return null;
				}
				case 'line': {
					if (!shapeStartRef.current) return null;
					return DrawingTools.line(shapeStartRef.current, pos, color, symbol, stitchType);
				}
				case 'rectangle': {
					if (!shapeStartRef.current) return null;
					return DrawingTools.rectangle(shapeStartRef.current, pos, color, symbol, shapeFilled, stitchType);
				}
				case 'ellipse': {
					if (!shapeStartRef.current) return null;
					return DrawingTools.ellipse(shapeStartRef.current, pos, color, symbol, shapeFilled, stitchType);
				}
				default:
					return null;
			}
		},
		[pattern?.grid, activeTool, activeColor, activeSymbol, brushSize, fillTolerance, shapeFilled, activeStitchType, setActiveColor],
	);

	// ---- Commit pending changes to the store --------------------------------

	const commitStroke = useCallback(() => {
		if (pendingChangesRef.current.length === 0) return;

		const grid = pattern?.grid;
		if (!grid) return;

		// Apply changes to the grid
		for (const change of pendingChangesRef.current) {
			if (change.row < 0 || change.row >= grid.height || change.col < 0 || change.col >= grid.width) continue;
			grid.setCell(change.row, change.col, change.data);
		}

		// Create a tool result and execute command for undo/redo
		const result: ToolResult = { cells: [...pendingChangesRef.current] };

		// Apply mirroring if enabled
		const finalResult = DrawingTools.mirror(
			result,
			grid.width,
			grid.height,
			mirrorHorizontal,
			mirrorVertical,
		);

		// Apply mirrored changes too
		for (const change of finalResult.cells) {
			if (change.row < 0 || change.row >= grid.height || change.col < 0 || change.col >= grid.width) continue;
			grid.setCell(change.row, change.col, change.data);
		}

		executeCommand(finalResult, grid.width, grid.height);
		pendingChangesRef.current = [];

		// Trigger re-render by updating the pattern store
		usePatternStore.getState().updateGrid(() => {});
	}, [pattern?.grid, mirrorHorizontal, mirrorVertical, executeCommand]);

	// ---- Get canvas-space coordinates from a mouse event --------------------

	const getCanvasPos = useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const rect = canvas.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	}, []);

	// ---- Mouse event handlers -----------------------------------------------

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			const renderer = rendererRef.current;
			if (!renderer) return;

			const pos = getCanvasPos(e);
			if (!pos) return;

			const gridPos = renderer.screenToGrid(pos.x, pos.y);

			// Middle mouse or space+click = pan
			if (e.button === 1 || (e.button === 0 && activeTool === 'pan')) {
				isPanningRef.current = true;
				panStartRef.current = {
					x: pos.x,
					y: pos.y,
					offsetX: renderer.getViewport().offsetX,
					offsetY: renderer.getViewport().offsetY,
				};
				e.preventDefault();
				return;
			}

			if (e.button !== 0 || !gridPos) return;

			// Start drawing
			isDrawingRef.current = true;
			lastGridPosRef.current = gridPos;

			// Selection tool — start a selection rectangle
			if (activeTool === 'selection') {
				setSelectionRect({
					startRow: gridPos.row,
					startCol: gridPos.col,
					endRow: gridPos.row,
					endCol: gridPos.col,
				});
				shapeStartRef.current = gridPos;
				return;
			}

			// Shape tools store the start position
			if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'ellipse') {
				shapeStartRef.current = gridPos;
				return;
			}

			// Apply tool immediately at start position
			const result = applyToolAt(gridPos, true);
			if (result) {
				pendingChangesRef.current.push(...result.cells);
			}
		},
		[activeTool, applyToolAt, getCanvasPos, setSelectionRect],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const renderer = rendererRef.current;
			if (!renderer) return;

			const pos = getCanvasPos(e);
			if (!pos) return;

			const gridPos = renderer.screenToGrid(pos.x, pos.y);
			setCursorPos(gridPos);

			// Panning
			if (isPanningRef.current && panStartRef.current) {
				const dx = pos.x - panStartRef.current.x;
				const dy = pos.y - panStartRef.current.y;
				renderer.setOffset(
					panStartRef.current.offsetX + dx,
					panStartRef.current.offsetY + dy,
				);
				return;
			}

			// Drawing
			if (isDrawingRef.current && gridPos) {
				// Selection tool — update the selection rectangle
				if (activeTool === 'selection' && shapeStartRef.current) {
					setSelectionRect({
						startRow: shapeStartRef.current.row,
						startCol: shapeStartRef.current.col,
						endRow: gridPos.row,
						endCol: gridPos.col,
					});
					return;
				}

				// For shape tools, we don't accumulate during drag — shape preview is visual only
				if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'ellipse') {
					// Shape preview rendered via cursor overlay — no pending changes until mouse up
					return;
				}

				// For freeform tools (pencil, brush, eraser), draw along the path
				if (lastGridPosRef.current) {
					const lineResult = DrawingTools.line(lastGridPosRef.current, gridPos, activeColor, activeSymbol);
					for (const entry of lineResult.cells) {
						// For eraser, override the data
						if (activeTool === 'eraser') {
							pendingChangesRef.current.push({
								row: entry.row,
								col: entry.col,
								data: { color: null, symbol: null },
							});
						} else {
							pendingChangesRef.current.push({
								row: entry.row,
								col: entry.col,
								data: entry.data,
							});
						}
					}
				}

				// Apply immediately for visual feedback
				const grid = pattern?.grid;
				if (grid) {
					for (const change of pendingChangesRef.current) {
						if (change.row < 0 || change.row >= grid.height || change.col < 0 || change.col >= grid.width) continue;
						grid.setCell(change.row, change.col, change.data);
					}
					usePatternStore.getState().updateGrid(() => {});
				}

				lastGridPosRef.current = gridPos;
			}
		},
		[activeTool, activeColor, activeSymbol, applyToolAt, pattern?.grid, getCanvasPos, setSelectionRect],
	);

	const handleMouseUp = useCallback(
		(e: React.MouseEvent) => {
			const renderer = rendererRef.current;

			// End panning
			if (isPanningRef.current) {
				isPanningRef.current = false;
				panStartRef.current = null;
				return;
			}

			if (!isDrawingRef.current) return;
			isDrawingRef.current = false;

			// Selection tool — finalize the selection rect (no cell changes)
			if (activeTool === 'selection') {
				const pos = getCanvasPos(e);
				if (shapeStartRef.current && pos && renderer) {
					const gridPos = renderer.screenToGrid(pos.x, pos.y);
					if (gridPos) {
						// Clear selection if it's just a click (no drag)
						if (
							gridPos.row === shapeStartRef.current.row &&
							gridPos.col === shapeStartRef.current.col
						) {
							setSelectionRect(null);
						}
						// Otherwise the selection rect is already set from mousemove
					}
				}
				shapeStartRef.current = null;
				return;
			}

			// For shape tools, compute the final shape
			if (shapeStartRef.current && renderer) {
				const pos = getCanvasPos(e);
				if (pos) {
					const gridPos = renderer.screenToGrid(pos.x, pos.y);
					if (gridPos) {
						const result = applyToolAt(gridPos, true);
						if (result) {
							pendingChangesRef.current.push(...result.cells);
						}
					}
				}
				shapeStartRef.current = null;
			}

			// Commit all pending changes
			commitStroke();
			lastGridPosRef.current = null;
		},
		[activeTool, applyToolAt, commitStroke, getCanvasPos, setSelectionRect],
	);

	// ---- Wheel zoom ---------------------------------------------------------

	const handleWheel = useCallback(
		(e: React.WheelEvent) => {
			e.preventDefault();

			const renderer = rendererRef.current;
			if (!renderer) return;

			const canvas = canvasRef.current;
			if (!canvas) return;

			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			const viewport = renderer.getViewport();
			const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
			const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * zoomFactor));

			// Zoom toward mouse position
			const scale = newZoom / viewport.zoom;
			const newOffsetX = mouseX - (mouseX - viewport.offsetX) * scale;
			const newOffsetY = mouseY - (mouseY - viewport.offsetY) * scale;

			renderer.setZoom(newZoom);
			renderer.setOffset(newOffsetX, newOffsetY);
			setZoom(newZoom);
		},
		[setZoom],
	);

	// ---- Touch event handlers -----------------------------------------------

	const handleTouchStart = useCallback(
		(e: React.TouchEvent) => {
			const renderer = rendererRef.current;
			if (!renderer) return;

			const canvas = canvasRef.current;
			if (!canvas) return;

			// Two-finger touch = pan/zoom
			if (e.touches.length === 2) {
				isPanningRef.current = true;
				isDrawingRef.current = false;
				const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
				const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const cx = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2;
				const cy = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2;
				const rect = canvas.getBoundingClientRect();
				touchStartRef.current = {
					x: cx - rect.left,
					y: cy - rect.top,
					dist,
				};
				panStartRef.current = {
					x: cx - rect.left,
					y: cy - rect.top,
					offsetX: renderer.getViewport().offsetX,
					offsetY: renderer.getViewport().offsetY,
				};
				return;
			}

			// Single finger = draw
			if (e.touches.length === 1) {
				const touch = e.touches[0]!;
				const rect = canvas.getBoundingClientRect();
				const x = touch.clientX - rect.left;
				const y = touch.clientY - rect.top;
				const gridPos = renderer.screenToGrid(x, y);

				if (!gridPos) return;

				isDrawingRef.current = true;
				lastGridPosRef.current = gridPos;

				if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'ellipse') {
					shapeStartRef.current = gridPos;
				} else {
					const result = applyToolAt(gridPos, true);
					if (result) {
						pendingChangesRef.current.push(...result.cells);
					}
				}
			}
		},
		[activeTool, applyToolAt],
	);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			const renderer = rendererRef.current;
			if (!renderer) return;

			const canvas = canvasRef.current;
			if (!canvas) return;

			// Two-finger: pan + pinch zoom
			if (e.touches.length === 2 && touchStartRef.current && panStartRef.current) {
				e.preventDefault();
				const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
				const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
				const dist = Math.sqrt(dx * dx + dy * dy);
				const cx = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2;
				const cy = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2;
				const rect = canvas.getBoundingClientRect();
				const x = cx - rect.left;
				const y = cy - rect.top;

				const scale = dist / touchStartRef.current.dist;
				const viewport = renderer.getViewport();
				const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * scale));

				const offsetX = x - (panStartRef.current.x - panStartRef.current.offsetX) * (newZoom / viewport.zoom);
				const offsetY = y - (panStartRef.current.y - panStartRef.current.offsetY) * (newZoom / viewport.zoom);

				renderer.setZoom(newZoom);
				renderer.setOffset(offsetX, offsetY);
				setZoom(newZoom);

				touchStartRef.current = { x, y, dist };
				panStartRef.current = { x, y, offsetX, offsetY };
				return;
			}

			// Single finger: draw
			if (e.touches.length === 1 && isDrawingRef.current) {
				e.preventDefault();
				const touch = e.touches[0]!;
				const rect = canvas.getBoundingClientRect();
				const x = touch.clientX - rect.left;
				const y = touch.clientY - rect.top;
				const gridPos = renderer.screenToGrid(x, y);

				if (!gridPos || !lastGridPosRef.current) return;

				if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'ellipse') {
					// Shape preview only
					return;
				}

				const lineResult = DrawingTools.line(lastGridPosRef.current, gridPos, activeColor, activeSymbol);
				for (const entry of lineResult.cells) {
					if (activeTool === 'eraser') {
						pendingChangesRef.current.push({
							row: entry.row,
							col: entry.col,
							data: { color: null, symbol: null },
						});
					} else {
						pendingChangesRef.current.push({
							row: entry.row,
							col: entry.col,
							data: entry.data,
						});
					}
				}

				// Apply immediately for visual feedback
				const grid = pattern?.grid;
				if (grid) {
					for (const change of pendingChangesRef.current) {
						if (change.row < 0 || change.row >= grid.height || change.col < 0 || change.col >= grid.width) continue;
						grid.setCell(change.row, change.col, change.data);
					}
					usePatternStore.getState().updateGrid(() => {});
				}

				lastGridPosRef.current = gridPos;
			}
		},
		[activeTool, activeColor, activeSymbol, pattern?.grid, setZoom],
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
		shapeStartRef.current = null;
	}, [commitStroke]);

	// ---- Context menu prevention --------------------------------------------

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
	}, []);

	// ---- Determine cursor style ---------------------------------------------

	const canvasCursor = activeTool === 'pan'
		? isPanningRef.current ? 'grabbing' : 'grab'
		: activeTool === 'selection'
			? 'default'
			: 'crosshair';

	// ---- Render JSX ---------------------------------------------------------

	return (
		<div ref={containerRef} className="relative h-full w-full overflow-hidden bg-surface-tertiary">
			<canvas
				ref={canvasRef}
				className="h-full w-full"
				style={{ cursor: canvasCursor }}
				role="application"
				aria-label="Pattern grid editor"
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
