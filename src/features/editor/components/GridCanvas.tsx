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
import { SelectionToolbar } from './SelectionToolbar';
import { TextInput } from './TextInput';
import type { Cell } from '@/engine/grid/grid';

export interface GridCanvasProps {
	executeCommand: (result: ToolResult, gridWidth: number, gridHeight: number) => void;
	/** Callback when tile preview is requested */
	onTilePreview?: () => void;
}

export function GridCanvas({ executeCommand, onTilePreview }: GridCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rendererRef = useRef<CanvasRenderer | null>(null);
	const animFrameRef = useRef<number>(0);
	const containerRef = useRef<HTMLDivElement>(null);

	const [cursorPos, setCursorPos] = useState<GridPosition | null>(null);

	// Text tool state
	const [textInputPos, setTextInputPos] = useState<{ x: number; y: number; row: number; col: number } | null>(null);

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
	const clipboard = useEditorStore((s) => s.clipboard);
	const setClipboard = useEditorStore((s) => s.setClipboard);
	const setActiveColor = useEditorStore((s) => s.setActiveColor);
	const setZoom = useEditorStore((s) => s.setZoom);
	const updateGrid = usePatternStore((s) => s.updateGrid);
	const textEditing = useEditorStore((s) => s.textEditing);
	const setTextEditing = useEditorStore((s) => s.setTextEditing);
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

			// Text tool — show text input at clicked cell
			if (activeTool === 'text') {
				const screenPos = renderer.gridToScreen(gridPos.row, gridPos.col);
				setTextInputPos({ x: screenPos.x, y: screenPos.y, row: gridPos.row, col: gridPos.col });
				setTextEditing(true);
				return;
			}

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

	// ---- Selection actions --------------------------------------------------

	/** Get normalized selection bounds (min/max rows/cols). */
	const getNormalizedSelection = useCallback(() => {
		if (!selectionRect) return null;
		return {
			minRow: Math.min(selectionRect.startRow, selectionRect.endRow),
			maxRow: Math.max(selectionRect.startRow, selectionRect.endRow),
			minCol: Math.min(selectionRect.startCol, selectionRect.endCol),
			maxCol: Math.max(selectionRect.startCol, selectionRect.endCol),
		};
	}, [selectionRect]);

	const handleCopySelection = useCallback(() => {
		const grid = pattern?.grid;
		const sel = getNormalizedSelection();
		if (!grid || !sel) return;
		const cells = grid.getCellsInArea(sel.minCol, sel.minRow, sel.maxCol - sel.minCol + 1, sel.maxRow - sel.minRow + 1);
		setClipboard(cells);
	}, [pattern?.grid, getNormalizedSelection, setClipboard]);

	const handleCutSelection = useCallback(() => {
		const grid = pattern?.grid;
		const sel = getNormalizedSelection();
		if (!grid || !sel) return;
		const cells = grid.getCellsInArea(sel.minCol, sel.minRow, sel.maxCol - sel.minCol + 1, sel.maxRow - sel.minRow + 1);
		setClipboard(cells);
		grid.clearArea(sel.minCol, sel.minRow, sel.maxCol - sel.minCol + 1, sel.maxRow - sel.minRow + 1);
		updateGrid(() => {});
		executeCommand({ cells: cells.map((c) => ({ row: c.row, col: c.col, data: { color: null, symbol: null } })) }, grid.width, grid.height);
		setSelectionRect(null);
	}, [pattern?.grid, getNormalizedSelection, setClipboard, updateGrid, executeCommand, setSelectionRect]);

	const handleDeleteSelection = useCallback(() => {
		const grid = pattern?.grid;
		const sel = getNormalizedSelection();
		if (!grid || !sel) return;
		const prevCells = grid.getCellsInArea(sel.minCol, sel.minRow, sel.maxCol - sel.minCol + 1, sel.maxRow - sel.minRow + 1);
		grid.clearArea(sel.minCol, sel.minRow, sel.maxCol - sel.minCol + 1, sel.maxRow - sel.minRow + 1);
		updateGrid(() => {});
		executeCommand({ cells: prevCells.map((c) => ({ row: c.row, col: c.col, data: { color: null, symbol: null } })) }, grid.width, grid.height);
		setSelectionRect(null);
	}, [pattern?.grid, getNormalizedSelection, updateGrid, executeCommand, setSelectionRect]);

	const handleFillSelection = useCallback(() => {
		const grid = pattern?.grid;
		const sel = getNormalizedSelection();
		if (!grid || !sel) return;
		const prevCells: Array<{ row: number; col: number; data: Partial<Cell> }> = [];
		for (let r = sel.minRow; r <= sel.maxRow; r++) {
			for (let c = sel.minCol; c <= sel.maxCol; c++) {
				const existing = grid.getCell(r, c);
				prevCells.push({ row: r, col: c, data: { color: existing?.color ?? null } });
				grid.setCell(r, c, { color: activeColor, stitchType: activeStitchType });
			}
		}
		updateGrid(() => {});
		executeCommand({ cells: prevCells }, grid.width, grid.height);
	}, [pattern?.grid, getNormalizedSelection, activeColor, activeStitchType, updateGrid, executeCommand]);

	const handlePasteClipboard = useCallback(() => {
		const grid = pattern?.grid;
		if (!grid || !clipboard || clipboard.length === 0) return;
		// Paste at row 0, col 0 (or at current cursor if available)
		const pasteRow = cursorPos?.row ?? 0;
		const pasteCol = cursorPos?.col ?? 0;
		const origin = clipboard[0];
		if (!origin) return;
		const prevCells: Array<{ row: number; col: number; data: Partial<Cell> }> = [];
		for (const cell of clipboard) {
			const targetRow = pasteRow + (cell.row - origin.row);
			const targetCol = pasteCol + (cell.col - origin.col);
			if (targetRow < 0 || targetRow >= grid.height || targetCol < 0 || targetCol >= grid.width) continue;
			const existing = grid.getCell(targetRow, targetCol);
			prevCells.push({ row: targetRow, col: targetCol, data: { color: existing?.color ?? null } });
			grid.setCell(targetRow, targetCol, { color: cell.color, symbol: cell.symbol, stitchType: cell.stitchType });
		}
		updateGrid(() => {});
		executeCommand({ cells: prevCells }, grid.width, grid.height);
	}, [pattern?.grid, clipboard, cursorPos, updateGrid, executeCommand]);

	// ---- Keyboard shortcuts for selection -----------------------------------

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't intercept when text editing
			if (textEditing) return;

			// Only handle when canvas area is focused
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

			if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectionRect) {
				e.preventDefault();
				handleCopySelection();
			} else if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectionRect) {
				e.preventDefault();
				handleCutSelection();
			} else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
				e.preventDefault();
				handlePasteClipboard();
			} else if ((e.key === 'Delete' || e.key === 'Backspace') && selectionRect) {
				e.preventDefault();
				handleDeleteSelection();
			} else if (e.key === 'Escape' && selectionRect) {
				setSelectionRect(null);
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [textEditing, selectionRect, clipboard, handleCopySelection, handleCutSelection, handlePasteClipboard, handleDeleteSelection, setSelectionRect]);

	// ---- Text tool commit/cancel --------------------------------------------

	const handleTextCommit = useCallback(
		(lines: string[]) => {
			const grid = pattern?.grid;
			if (!grid || !textInputPos) return;

			const prevCells: Array<{ row: number; col: number; data: Partial<Cell> }> = [];
			const newCells: Array<{ row: number; col: number; data: Partial<Cell> }> = [];

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i]!;
				for (let j = 0; j < line.length; j++) {
					const r = textInputPos.row + i;
					const c = textInputPos.col + j;
					if (r < 0 || r >= grid.height || c < 0 || c >= grid.width) continue;
					const existing = grid.getCell(r, c);
					prevCells.push({ row: r, col: c, data: { color: existing?.color ?? null, symbol: existing?.symbol ?? null } });
					newCells.push({ row: r, col: c, data: { color: activeColor, symbol: line[j], stitchType: activeStitchType } });
				}
			}

			// Apply new cells to grid
			for (const cell of newCells) {
				grid.setCell(cell.row, cell.col, cell.data);
			}
			updateGrid(() => {});
			executeCommand({ cells: prevCells }, grid.width, grid.height);

			setTextInputPos(null);
			setTextEditing(false);
		},
		[pattern?.grid, textInputPos, activeColor, activeStitchType, updateGrid, executeCommand, setTextEditing],
	);

	const handleTextCancel = useCallback(() => {
		setTextInputPos(null);
		setTextEditing(false);
	}, [setTextEditing]);

	// ---- Selection toolbar position -----------------------------------------

	const selectionToolbarPos = (() => {
		if (!selectionRect || !rendererRef.current) return null;
		const sel = getNormalizedSelection();
		if (!sel) return null;
		const topLeft = rendererRef.current.gridToScreen(sel.minRow, sel.minCol);
		const nextCol = rendererRef.current.gridToScreen(sel.minRow, sel.minCol + 1);
		const ecs = nextCol.x - topLeft.x;
		const toolbarWidth = 140;
		const toolbarHeight = 32;
		return {
			left: Math.max(4, topLeft.x + (sel.maxCol - sel.minCol + 1) * ecs / 2 - toolbarWidth / 2),
			top: Math.max(4, topLeft.y - toolbarHeight - 4),
		};
	})();

	// ---- Determine cursor style ---------------------------------------------

	const canvasCursor = activeTool === 'pan'
		? isPanningRef.current ? 'grabbing' : 'grab'
		: activeTool === 'selection'
			? 'default'
			: activeTool === 'text'
				? 'text'
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
			{selectionToolbarPos && selectionRect && (
				<div
					className="absolute z-50"
					style={{ left: selectionToolbarPos.left, top: selectionToolbarPos.top }}
				>
					<SelectionToolbar
						onCopy={handleCopySelection}
						onCut={handleCutSelection}
						onDelete={handleDeleteSelection}
						onFill={handleFillSelection}
						onTile={onTilePreview}
					/>
				</div>
			)}
			{textInputPos && (
				<TextInput
					x={textInputPos.x}
					y={textInputPos.y}
					onCommit={handleTextCommit}
					onCancel={handleTextCancel}
				/>
			)}
		</div>
	);
}
