/**
 * EditorPage - Fully functional pattern editor page.
 *
 * Layout:
 *   Top bar:    [name] [undo][redo] | zoom: [-][100%][+] | [save]
 *   Left:       ToolPalette (collapsible)
 *   Center:     GridCanvas (fills remaining space)
 *   Right:      ColorPalette (collapsible)
 *   Bottom:     StatusBar
 */

import { deserializePattern, serializePattern } from "@/engine/pattern/types";
import { ColorPalette } from "@/features/editor/components/ColorPalette";
import { CommandPalette } from "@/features/editor/components/CommandPalette";
import type { CommandItem } from "@/features/editor/components/CommandPalette";
import { GridCanvas } from "@/features/editor/components/GridCanvas";
import { KeyboardShortcuts } from "@/features/editor/components/KeyboardShortcuts";
import { Minimap } from "@/features/editor/components/Minimap";
import { NewPatternDialog } from "@/features/editor/components/NewPatternDialog";
import { MobileColorPicker } from "@/features/editor/components/MobileColorPicker";
import { StatusBar } from "@/features/editor/components/StatusBar";
import { ToolPalette } from "@/features/editor/components/ToolPalette";
import { ExportDialog } from "@/features/export/components/ExportDialog";
import { InstructionsPanel } from "@/features/instructions/components/InstructionsPanel";
import { ProgressPanel } from "@/features/progress/components/ProgressPanel";
import { ShareDialog } from "@/features/share/components";
import { useAutoSave } from "@/shared/hooks/use-auto-save";
import { useHistoryManager } from "@/shared/hooks/use-history-manager";
import { useKeyboardShortcuts } from "@/shared/hooks/use-keyboard-shortcuts";
import { useToast } from "@/shared/hooks/use-toast";
import { storage } from "@/shared/storage/storage";
import { useEditorStore } from "@/shared/stores/editor-store";
import { usePatternStore } from "@/shared/stores/pattern-store";
import { useSettingsStore } from "@/shared/stores/settings-store";
import { EditorNav } from "@/shared/ui/EditorNav";
import type { ToolType } from "@/engine/tools/tools";
import {
	Grid3x3,
	Maximize2,
	Paintbrush,
	PaintBucket,
	Pencil,
	Eraser,
	Square,
	Circle,
	Minus,
	Pipette,
	Move,
	MousePointer2,
	FlipHorizontal,
	FlipVertical,
	Type,
	Plus,
	Redo2,
	Save,
	Undo2,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { cn } from "@/shared/utils/cn";

/* ------------------------------------------------------------------ */
/*  Mobile bottom tool strip — horizontal scrollable tool bar          */
/* ------------------------------------------------------------------ */

const MOBILE_TOOLS: { type: ToolType; icon: React.ComponentType<{ className?: string }> }[] = [
	{ type: "pencil", icon: Pencil },
	{ type: "brush", icon: Paintbrush },
	{ type: "eraser", icon: Eraser },
	{ type: "fill", icon: PaintBucket },
	{ type: "line", icon: Minus },
	{ type: "rectangle", icon: Square },
	{ type: "ellipse", icon: Circle },
	{ type: "color-picker", icon: Pipette },
	{ type: "selection", icon: MousePointer2 },
	{ type: "text", icon: Type },
	{ type: "pan", icon: Move },
];

function MobileToolStrip() {
	const activeTool = useEditorStore((s) => s.activeTool);
	const setActiveTool = useEditorStore((s) => s.setActiveTool);
	const mirrorHorizontal = useEditorStore((s) => s.mirrorHorizontal);
	const setMirrorHorizontal = useEditorStore((s) => s.setMirrorHorizontal);
	const mirrorVertical = useEditorStore((s) => s.mirrorVertical);
	const setMirrorVertical = useEditorStore((s) => s.setMirrorVertical);

	return (
		<div className="fixed bottom-0 left-0 right-0 z-30 flex items-center gap-1 overflow-x-auto border-t border-border bg-surface-secondary px-2 py-1.5 md:hidden"
			style={{ overscrollBehavior: "none", paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
		>
			{MOBILE_TOOLS.map(({ type, icon: Icon }) => (
				<button
					key={type}
					type="button"
					onClick={() => setActiveTool(type)}
					className={cn(
						"flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors",
						activeTool === type
							? "bg-craft-200 text-craft-800 dark:bg-craft-800 dark:text-craft-200"
							: "text-text-secondary active:bg-surface-tertiary",
					)}
				>
					<Icon className="h-5 w-5" />
				</button>
			))}

			{/* Dividers + mirror toggles */}
			<div className="mx-1 h-8 w-px shrink-0 bg-border" />
			<button
				type="button"
				onClick={() => setMirrorHorizontal(!mirrorHorizontal)}
				className={cn(
					"flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors",
					mirrorHorizontal
						? "bg-craft-200 text-craft-800 dark:bg-craft-800 dark:text-craft-200"
						: "text-text-secondary active:bg-surface-tertiary",
				)}
			>
				<FlipHorizontal className="h-5 w-5" />
			</button>
			<button
				type="button"
				onClick={() => setMirrorVertical(!mirrorVertical)}
				className={cn(
					"flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors",
					mirrorVertical
						? "bg-craft-200 text-craft-800 dark:bg-craft-800 dark:text-craft-200"
						: "text-text-secondary active:bg-surface-tertiary",
				)}
			>
				<FlipVertical className="h-5 w-5" />
			</button>
		</div>
	);
}

export function EditorPage() {
	const { id } = useParams<{ id: string }>();

	// Dialog state
	const [showNewPattern, setShowNewPattern] = useState(false);
	const [showCommandPalette, setShowCommandPalette] = useState(false);
	const [showExportDialog, setShowExportDialog] = useState(false);
	const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
	const [showProgressPanel, setShowProgressPanel] = useState(false);
	const [showShareDialog, setShowShareDialog] = useState(false);

	const toast = useToast();

	// Store subscriptions
	const pattern = usePatternStore((s) => s.pattern);
	const loadPattern = usePatternStore((s) => s.loadPattern);
	const markSaved = usePatternStore((s) => s.markSaved);
	const updateGrid = usePatternStore((s) => s.updateGrid);
	const zoom = useEditorStore((s) => s.zoom);
	const setZoom = useEditorStore((s) => s.setZoom);
	const setActiveTool = useEditorStore((s) => s.setActiveTool);
	const showToolPanel = useEditorStore((s) => s.showToolPanel);
	const showColorPanel = useEditorStore((s) => s.showColorPanel);
	const showShortcuts = useEditorStore((s) => s.showShortcuts);
	const toggleShortcuts = useEditorStore((s) => s.toggleShortcuts);
	const showGridLines = useSettingsStore((s) => s.showGridLines);
	const setShowGridLines = useSettingsStore((s) => s.setShowGridLines);
	const selectionRect = useEditorStore((s) => s.selectionRect);
	const setSelectionRect = useEditorStore((s) => s.setSelectionRect);

	// History manager
	const { executeCommand, undo, redo } = useHistoryManager();

	// Auto-save
	useAutoSave();

	// Load pattern by ID on mount
	const loadById = useCallback(async () => {
		if (!id) return;
		try {
			const record = await storage.loadPattern(id);
			if (record) {
				const p = deserializePattern(record.data);
				loadPattern(p);
			}
		} catch (error) {
			console.error("[EditorPage] Failed to load pattern:", error);
			toast.error("Failed to load pattern");
		}
	}, [id, loadPattern]);

	// Load pattern when route changes
	if (id && !pattern) {
		loadById();
	}

	// Manual save
	const handleSave = useCallback(async () => {
		if (!pattern) return;
		try {
			const data = serializePattern(pattern);
			await storage.savePattern({
				id: pattern.id,
				name: pattern.metadata.name,
				craftType: pattern.metadata.craftType,
				data,
				thumbnail: "",
				updatedAt: Date.now(),
				createdAt: pattern.metadata.createdAt,
				version: pattern.metadata.version,
			});
			markSaved();
			toast.success("Pattern saved");
		} catch (error) {
			console.error("[EditorPage] Failed to save pattern:", error);
			toast.error("Failed to save pattern");
		}
	}, [pattern, markSaved, toast]);

	// Zoom controls
	const handleZoomIn = useCallback(() => {
		setZoom(zoom * 1.25);
	}, [zoom, setZoom]);

	const handleZoomOut = useCallback(() => {
		setZoom(zoom / 1.25);
	}, [zoom, setZoom]);

	const handleFitToView = useCallback(() => {
		// This is handled by GridCanvas internally via renderer.fitToView
		// We emit a custom event that GridCanvas can listen for
		window.dispatchEvent(new CustomEvent("patternforge:fit-to-view"));
	}, []);

	// Keyboard shortcuts
	const shortcuts = useMemo(
		() => ({
			"mod+z": () => undo(),
			"mod+shift+z": () => redo(),
			"mod+s": () => {
				handleSave();
			},
			p: () => setActiveTool("pencil"),
			b: () => setActiveTool("brush"),
			e: () => setActiveTool("eraser"),
			g: () => setActiveTool("fill"),
			l: () => setActiveTool("line"),
			r: () => setActiveTool("rectangle"),
			o: () => setActiveTool("ellipse"),
			i: () => setActiveTool("color-picker"),
			s: () => setActiveTool("selection"),
			h: () => setActiveTool("pan"),
			"mod+=": () => handleZoomIn(),
			"mod+-": () => handleZoomOut(),
			"mod+0": () => handleFitToView(),
			"mod+k": () => setShowCommandPalette(true),
			"=": () => handleZoomIn(),
			"-": () => handleZoomOut(),
			"?": () => toggleShortcuts(),
			Escape: () => {
				if (selectionRect) {
					setSelectionRect(null);
				}
			},
			Delete: () => {
				if (selectionRect && pattern) {
					const minRow = Math.min(selectionRect.startRow, selectionRect.endRow);
					const maxRow = Math.max(selectionRect.startRow, selectionRect.endRow);
					const minCol = Math.min(selectionRect.startCol, selectionRect.endCol);
					const maxCol = Math.max(selectionRect.startCol, selectionRect.endCol);
					const cells: Array<{ row: number; col: number; data: Partial<import("@/engine/grid/grid").Cell> }> = [];
					for (let r = minRow; r <= maxRow; r++) {
						for (let c = minCol; c <= maxCol; c++) {
							cells.push({ row: r, col: c, data: { color: null, symbol: null, stitchType: "full" as const, completed: false } });
						}
					}
					executeCommand({ cells }, pattern.grid.width, pattern.grid.height);
					for (const cell of cells) {
						pattern.grid.setCell(cell.row, cell.col, cell.data);
					}
					updateGrid(() => {});
					setSelectionRect(null);
				}
			},
		}),
		[
			undo,
			redo,
			handleSave,
			setActiveTool,
			handleZoomIn,
			handleZoomOut,
			handleFitToView,
			toggleShortcuts,
			selectionRect,
			setSelectionRect,
			pattern,
			executeCommand,
			updateGrid,
		],
	);

	useKeyboardShortcuts(shortcuts, !!pattern);

	// Command palette items
	const commandItems = useMemo<CommandItem[]>(
		() => [
			{
				id: "new-pattern",
				label: "New Pattern",
				shortcut: "",
				icon: Plus,
				action: () => setShowNewPattern(true),
			},
			{
				id: "save",
				label: "Save",
				shortcut: "Ctrl+S",
				icon: Save,
				action: handleSave,
			},
			{
				id: "undo",
				label: "Undo",
				shortcut: "Ctrl+Z",
				icon: Undo2,
				action: undo,
			},
			{
				id: "redo",
				label: "Redo",
				shortcut: "Ctrl+Shift+Z",
				icon: Redo2,
				action: redo,
			},
			{
				id: "zoom-in",
				label: "Zoom In",
				shortcut: "+",
				icon: ZoomIn,
				action: handleZoomIn,
			},
			{
				id: "zoom-out",
				label: "Zoom Out",
				shortcut: "-",
				icon: ZoomOut,
				action: handleZoomOut,
			},
			{
				id: "fit-view",
				label: "Fit to View",
				shortcut: "Ctrl+0",
				icon: Maximize2,
				action: handleFitToView,
			},
			{
				id: "toggle-grid",
				label: "Toggle Grid Lines",
				icon: Grid3x3,
				action: () => setShowGridLines(!showGridLines),
			},
			{
				id: "tool-pencil",
				label: "Pencil Tool",
				shortcut: "P",
				icon: Pencil,
				action: () => setActiveTool("pencil"),
			},
			{
				id: "tool-eraser",
				label: "Eraser Tool",
				shortcut: "E",
				action: () => setActiveTool("eraser"),
			},
			{
				id: "tool-fill",
				label: "Fill Tool",
				shortcut: "G",
				action: () => setActiveTool("fill"),
			},
			{
				id: "tool-brush",
				label: "Brush Tool",
				shortcut: "B",
				action: () => setActiveTool("brush"),
			},
			{
				id: "tool-picker",
				label: "Color Picker",
				shortcut: "I",
				action: () => setActiveTool("color-picker"),
			},
			{
				id: "tool-pan",
				label: "Pan Tool",
				shortcut: "H",
				action: () => setActiveTool("pan"),
			},
		],
		[
			handleSave,
			undo,
			redo,
			handleZoomIn,
			handleZoomOut,
			handleFitToView,
			showGridLines,
			setShowGridLines,
			setActiveTool,
		],
	);

	// Empty state - no pattern loaded
	if (!pattern) {
		return (
			<div className="flex h-full w-full flex-col bg-surface">
				<main className="flex flex-1 items-center justify-center bg-surface-tertiary">
					<div className="flex flex-col items-center gap-4 text-center px-6">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border-strong text-text-muted">
							<Pencil className="h-7 w-7" />
						</div>
						<div>
							<h2 className="mb-1 text-lg font-semibold text-text-primary">
								Pattern Editor
							</h2>
							<p className="text-sm text-text-secondary">
								Create a new pattern to get started
							</p>
						</div>
						<button
							type="button"
							className="rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
							onClick={() => setShowNewPattern(true)}
						>
							New Pattern
						</button>
					</div>
				</main>
				<NewPatternDialog
					open={showNewPattern}
					onClose={() => setShowNewPattern(false)}
				/>
			</div>
		);
	}

	// Full editor layout
	return (
		<div className="flex h-full w-full flex-col bg-surface">
			{/* Editor navigation bar */}
			<EditorNav
				onSave={handleSave}
				onShare={() => setShowShareDialog(true)}
				onExport={() => setShowExportDialog(true)}
				onInstructions={() => setShowInstructionsDialog(true)}
				onProgress={() => setShowProgressPanel((v) => !v)}
			/>

			{/* Main content area */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left: Tool palette (hidden on mobile) */}
				{showToolPanel && (
					<div className="hidden md:flex">
						<ToolPalette />
					</div>
				)}

				{/* Center: Canvas */}
				<div className="relative flex-1 overflow-hidden pb-14 md:pb-0"
					style={{ paddingBottom: "max(3.5rem, calc(3.5rem + env(safe-area-inset-bottom)))" }}>
					<GridCanvas executeCommand={executeCommand} />
					<Minimap width={0} height={0} />
				</div>

				{/* Right: Color palette (hidden on mobile) */}
				{showColorPanel && (
					<div className="hidden md:flex">
						<ColorPalette />
					</div>
				)}
			</div>

			{/* Bottom: Status bar (desktop only — mobile has bottom tool strip) */}
			<div className="hidden md:block">
				<StatusBar cursorPos={null} />
			</div>

			{/* Mobile bottom tool strip */}
			<MobileToolStrip />

			{/* Mobile color picker FAB + bottom sheet */}
			<MobileColorPicker />

			{/* Dialogs */}
			<NewPatternDialog
				open={showNewPattern}
				onClose={() => setShowNewPattern(false)}
			/>
			<CommandPalette
				open={showCommandPalette}
				onClose={() => setShowCommandPalette(false)}
				commands={commandItems}
			/>
			{pattern && (
				<ExportDialog
					open={showExportDialog}
					onClose={() => setShowExportDialog(false)}
					pattern={pattern}
				/>
			)}
			{pattern && (
				<InstructionsPanel
					open={showInstructionsDialog}
					onClose={() => setShowInstructionsDialog(false)}
					pattern={pattern}
				/>
			)}
			<ProgressPanel
				open={showProgressPanel}
				onClose={() => setShowProgressPanel(false)}
			/>
			<KeyboardShortcuts
				open={showShortcuts}
				onClose={() => useEditorStore.getState().setShowShortcuts(false)}
			/>
			{pattern && (
				<ShareDialog
					open={showShareDialog}
					onClose={() => setShowShareDialog(false)}
					pattern={pattern}
				/>
			)}
		</div>
	);
}
