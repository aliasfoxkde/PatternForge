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
import { NewPatternDialog } from "@/features/editor/components/NewPatternDialog";
import { StatusBar } from "@/features/editor/components/StatusBar";
import { ToolPalette } from "@/features/editor/components/ToolPalette";
import { ExportDialog } from "@/features/export/components/ExportDialog";
import { InstructionsPanel } from "@/features/instructions/components/InstructionsPanel";
import { ProgressPanel } from "@/features/progress/components/ProgressPanel";
import { useAutoSave } from "@/shared/hooks/use-auto-save";
import { useHistoryManager } from "@/shared/hooks/use-history-manager";
import { useKeyboardShortcuts } from "@/shared/hooks/use-keyboard-shortcuts";
import { storage } from "@/shared/storage/storage";
import { useEditorStore } from "@/shared/stores/editor-store";
import { usePatternStore } from "@/shared/stores/pattern-store";
import { useSettingsStore } from "@/shared/stores/settings-store";
import {
	BarChart3,
	Download,
	FileText,
	Grid3x3,
	Maximize2,
	Pencil,
	Plus,
	Redo2,
	Save,
	Undo2,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

export function EditorPage() {
	const { id } = useParams<{ id: string }>();

	// Dialog state
	const [showNewPattern, setShowNewPattern] = useState(false);
	const [showCommandPalette, setShowCommandPalette] = useState(false);
	const [showExportDialog, setShowExportDialog] = useState(false);
	const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
	const [showProgressPanel, setShowProgressPanel] = useState(false);
	const [isEditingName, setIsEditingName] = useState(false);
	const [editName, setEditName] = useState("");
	const nameInputRef = useRef<HTMLInputElement>(null);

	// Store subscriptions
	const pattern = usePatternStore((s) => s.pattern);
	const isDirty = usePatternStore((s) => s.isDirty);
	const loadPattern = usePatternStore((s) => s.loadPattern);
	const updatePatternMetadata = usePatternStore((s) => s.updatePatternMetadata);
	const markSaved = usePatternStore((s) => s.markSaved);
	const zoom = useEditorStore((s) => s.zoom);
	const setZoom = useEditorStore((s) => s.setZoom);
	const setActiveTool = useEditorStore((s) => s.setActiveTool);
	const showToolPanel = useEditorStore((s) => s.showToolPanel);
	const showColorPanel = useEditorStore((s) => s.showColorPanel);
	const showGridLines = useSettingsStore((s) => s.showGridLines);
	const setShowGridLines = useSettingsStore((s) => s.setShowGridLines);

	// History manager
	const { executeCommand, undo, redo, canUndo, canRedo } = useHistoryManager();

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
		} catch (error) {
			console.error("[EditorPage] Failed to save pattern:", error);
		}
	}, [pattern, markSaved]);

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

	// Name editing
	const handleNameClick = useCallback(() => {
		if (!pattern) return;
		setEditName(pattern.metadata.name);
		setIsEditingName(true);
		setTimeout(() => nameInputRef.current?.focus(), 50);
	}, [pattern]);

	const handleNameSubmit = useCallback(() => {
		const trimmed = editName.trim();
		if (trimmed && pattern) {
			updatePatternMetadata({ name: trimmed });
		}
		setIsEditingName(false);
	}, [editName, pattern, updatePatternMetadata]);

	const handleNameKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				handleNameSubmit();
			} else if (e.key === "Escape") {
				setIsEditingName(false);
			}
		},
		[handleNameSubmit],
	);

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
		}),
		[
			undo,
			redo,
			handleSave,
			setActiveTool,
			handleZoomIn,
			handleZoomOut,
			handleFitToView,
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
			<div className="flex h-full flex-col bg-surface">
				<header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
					<h1 className="text-sm font-semibold text-text-primary">
						Pattern Editor
					</h1>
					<button
						type="button"
						className="inline-flex items-center gap-1.5 rounded-md bg-craft-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-craft-700"
						onClick={() => setShowNewPattern(true)}
					>
						<Plus className="h-3.5 w-3.5" />
						New Pattern
					</button>
				</header>
				<main className="flex flex-1 items-center justify-center bg-surface-tertiary">
					<div className="flex flex-col items-center gap-4 text-center">
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
		<div className="flex h-full flex-col bg-surface">
			{/* Top Bar */}
			<header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
				{/* Left: Pattern name */}
				<div className="flex items-center gap-3">
					{isEditingName ? (
						<input
							ref={nameInputRef}
							type="text"
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
							onBlur={handleNameSubmit}
							onKeyDown={handleNameKeyDown}
							className="w-48 rounded border border-craft-500 bg-surface-tertiary px-2 py-1 text-sm font-semibold text-text-primary focus:outline-none"
						/>
					) : (
						<h1
							className="cursor-pointer text-sm font-semibold text-text-primary hover:text-craft-600"
							onClick={handleNameClick}
							title="Click to rename"
						>
							{pattern.metadata.name}
							{isDirty && <span className="ml-1 text-craft-500">*</span>}
						</h1>
					)}
				</div>

				{/* Center: Undo/Redo + Zoom */}
				<div className="flex items-center gap-1">
					<button
						type="button"
						className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-30"
						title="Undo (Ctrl+Z)"
						onClick={undo}
						disabled={!canUndo}
					>
						<Undo2 className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-30"
						title="Redo (Ctrl+Shift+Z)"
						onClick={redo}
						disabled={!canRedo}
					>
						<Redo2 className="h-4 w-4" />
					</button>

					<div className="mx-2 h-5 w-px bg-border" />

					<button
						type="button"
						className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
						title="Zoom Out (-)"
						onClick={handleZoomOut}
					>
						<ZoomOut className="h-4 w-4" />
					</button>
					<button
						type="button"
						className="min-w-[3.5rem] rounded px-2 py-1 text-center text-xs font-medium text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
						title="Fit to View (Ctrl+0)"
						onClick={handleFitToView}
					>
						{Math.round(zoom * 100)}%
					</button>
					<button
						type="button"
						className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
						title="Zoom In (+)"
						onClick={handleZoomIn}
					>
						<ZoomIn className="h-4 w-4" />
					</button>
				</div>

				{/* Right: Export + Progress + Save */}
				<button
					type="button"
					className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					onClick={() => setShowExportDialog(true)}
					disabled={!pattern}
				>
					<Download className="h-3.5 w-3.5" />
					Export
				</button>
				<button
					type="button"
					className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					onClick={() => setShowInstructionsDialog(true)}
					disabled={!pattern}
				>
					<FileText className="h-3.5 w-3.5" />
					Instructions
				</button>
				<button
					type="button"
					className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
						showProgressPanel
							? "bg-craft-600 text-white"
							: "border border-border text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
					}`}
					onClick={() => setShowProgressPanel((v) => !v)}
					disabled={!pattern}
				>
					<BarChart3 className="h-3.5 w-3.5" />
					Progress
				</button>
				<button
					type="button"
					className="inline-flex items-center gap-1.5 rounded-md bg-craft-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-craft-700"
					onClick={handleSave}
					disabled={!isDirty}
				>
					<Save className="h-3.5 w-3.5" />
					Save
				</button>
			</header>

			{/* Main content area */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left: Tool palette */}
				{showToolPanel && <ToolPalette />}

				{/* Center: Canvas */}
				<div className="relative flex-1 overflow-hidden">
					<GridCanvas executeCommand={executeCommand} />
				</div>

				{/* Right: Color palette */}
				{showColorPanel && <ColorPalette />}
			</div>

			{/* Bottom: Status bar */}
			<StatusBar cursorPos={null} />

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
		</div>
	);
}
