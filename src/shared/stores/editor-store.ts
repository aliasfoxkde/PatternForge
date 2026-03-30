/**
 * Editor store - manages editor UI state (tools, viewport, panels).
 *
 * This store does NOT persist. It resets on every page load.
 */

import type { ToolType } from "@/engine/tools/tools";
import type { Cell, StitchType } from "@/engine/grid/grid";
import { create } from "zustand";

export interface SelectionRect {
	startRow: number;
	startCol: number;
	endRow: number;
	endCol: number;
}

interface EditorState {
	// -- Active tool --

	activeTool: ToolType;
	setActiveTool: (tool: ToolType) => void;

	// -- Tool options --

	brushSize: number;
	setBrushSize: (size: number) => void;
	fillTolerance: number;
	setFillTolerance: (tolerance: number) => void;
	shapeFilled: boolean;
	setShapeFilled: (filled: boolean) => void;
	mirrorHorizontal: boolean;
	setMirrorHorizontal: (mirror: boolean) => void;
	mirrorVertical: boolean;
	setMirrorVertical: (mirror: boolean) => void;

	// -- Color / symbol --

	activeColor: string;
	setActiveColor: (color: string) => void;
	secondaryColor: string;
	setSecondaryColor: (color: string) => void;
	activeSymbol: string | null;
	setActiveSymbol: (symbol: string | null) => void;
	activeStitchType: StitchType;
	setActiveStitchType: (type: StitchType) => void;

	// -- Selection --

	selectionRect: SelectionRect | null;
	setSelectionRect: (rect: SelectionRect | null) => void;

	// -- Clipboard --

	clipboard: Cell[] | null;
	setClipboard: (cells: Cell[] | null) => void;

	// -- Viewport --

	zoom: number;
	setZoom: (zoom: number) => void;

	// -- Panel visibility --

	showToolPanel: boolean;
	setShowToolPanel: (show: boolean) => void;
	showColorPanel: boolean;
	setShowColorPanel: (show: boolean) => void;
	showInfoPanel: boolean;
	setShowInfoPanel: (show: boolean) => void;
	showMinimap: boolean;
	setShowMinimap: (show: boolean) => void;

	// -- Keyboard shortcut overlay --

	showShortcuts: boolean;
	setShowShortcuts: (show: boolean) => void;
	toggleShortcuts: () => void;

	// -- Text tool --

	textEditing: boolean;
	setTextEditing: (editing: boolean) => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;
const DEFAULT_BRUSH_SIZE = 1;
const DEFAULT_FILL_TOLERANCE = 0;

export const useEditorStore = create<EditorState>()((set) => ({
	// Tool
	activeTool: "pencil",
	setActiveTool: (tool) => set({ activeTool: tool }),

	// Tool options
	brushSize: DEFAULT_BRUSH_SIZE,
	setBrushSize: (size) =>
		set({ brushSize: Math.max(1, Math.min(20, Math.round(size))) }),
	fillTolerance: DEFAULT_FILL_TOLERANCE,
	setFillTolerance: (tolerance) =>
		set({ fillTolerance: Math.max(0, Math.min(1, tolerance)) }),
	shapeFilled: false,
	setShapeFilled: (filled) => set({ shapeFilled: filled }),
	mirrorHorizontal: false,
	setMirrorHorizontal: (mirror) => set({ mirrorHorizontal: mirror }),
	mirrorVertical: false,
	setMirrorVertical: (mirror) => set({ mirrorVertical: mirror }),

	// Color / symbol
	activeColor: "#000000",
	setActiveColor: (color) => set({ activeColor: color }),
	secondaryColor: "#ffffff",
	setSecondaryColor: (color) => set({ secondaryColor: color }),
	activeSymbol: null,
	setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
	activeStitchType: "full" as StitchType,
	setActiveStitchType: (type) => set({ activeStitchType: type }),

	// Selection
	selectionRect: null,
	setSelectionRect: (rect) => set({ selectionRect: rect }),

	// Clipboard
	clipboard: null,
	setClipboard: (cells) => set({ clipboard: cells }),

	// Viewport
	zoom: 1,
	setZoom: (zoom) =>
		set({ zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) }),

	// Panels
	showToolPanel: true,
	setShowToolPanel: (show) => set({ showToolPanel: show }),
	showColorPanel: true,
	setShowColorPanel: (show) => set({ showColorPanel: show }),
	showInfoPanel: true,
	setShowInfoPanel: (show) => set({ showInfoPanel: show }),
	showMinimap: true,
	setShowMinimap: (show) => set({ showMinimap: show }),

	// Shortcuts overlay
	showShortcuts: false,
	setShowShortcuts: (show) => set({ showShortcuts: show }),
	toggleShortcuts: () =>
		set((state) => ({ showShortcuts: !state.showShortcuts })),

	// Text tool
	textEditing: false,
	setTextEditing: (editing) => set({ textEditing: editing }),
}));
