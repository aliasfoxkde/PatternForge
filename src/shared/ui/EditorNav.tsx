import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Undo2,
	Redo2,
	ZoomIn,
	ZoomOut,
	Save,
	MoreHorizontal,
	Share2,
	Download,
	FileText,
	BarChart3,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useEditorStore } from "@/shared/stores/editor-store";
import { usePatternStore } from "@/shared/stores/pattern-store";
import { useHistoryManager } from "@/shared/hooks/use-history-manager";

interface EditorNavProps {
	onSave: () => Promise<void>;
	onShare: () => void;
	onExport: () => void;
	onInstructions: () => void;
	onProgress: () => void;
}

export function EditorNav({
	onSave,
	onShare,
	onExport,
	onInstructions,
	onProgress,
}: EditorNavProps) {
	const navigate = useNavigate();

	const pattern = usePatternStore((s) => s.pattern);
	const isDirty = usePatternStore((s) => s.isDirty);
	const zoom = useEditorStore((s) => s.zoom);
	const setZoom = useEditorStore((s) => s.setZoom);

	const { undo, redo, canUndo, canRedo } = useHistoryManager();

	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const handleZoomIn = useCallback(
		() => setZoom(zoom * 1.25),
		[zoom, setZoom],
	);
	const handleZoomOut = useCallback(
		() => setZoom(zoom / 1.25),
		[zoom, setZoom],
	);

	const handleFit = useCallback(() => {
		window.dispatchEvent(new CustomEvent("patternforge:fit-to-view"));
	}, []);

	// Close dropdown on outside click
	const handleBackdrop = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) setMenuOpen(false);
		},
		[],
	);

	const patternName = pattern ? pattern.metadata.name : "Editor";

	return (
		<header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-surface-secondary px-2 sm:px-3">
			{/* Left: back + name */}
			<div className="flex items-center gap-2 min-w-0">
				<button
					type="button"
					onClick={() => navigate("/")}
					className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					title="Home"
				>
					<ArrowLeft className="h-4 w-4" />
				</button>
				<span className="truncate text-xs font-semibold text-text-primary sm:text-sm">
					{patternName}
					{pattern && isDirty && <span className="text-craft-500">*</span>}
				</span>
			</div>

			{/* Center: undo/redo + zoom (desktop only) */}
			<div className="hidden items-center gap-0.5 sm:flex">
				<button
					type="button"
					disabled={!canUndo}
					onClick={undo}
					className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-30"
					title="Undo"
				>
					<Undo2 className="h-3.5 w-3.5" />
				</button>
				<button
					type="button"
					disabled={!canRedo}
					onClick={redo}
					className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-30"
					title="Redo"
				>
					<Redo2 className="h-3.5 w-3.5" />
				</button>

				<div className="mx-1 h-4 w-px bg-border" />

				<button
					type="button"
					onClick={handleZoomOut}
					className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					title="Zoom Out"
				>
					<ZoomOut className="h-3.5 w-3.5" />
				</button>
				<button
					type="button"
					onClick={handleFit}
					className="min-w-[2.5rem] rounded px-1.5 py-0.5 text-center text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					title="Fit to View"
				>
					{Math.round(zoom * 100)}%
				</button>
				<button
					type="button"
					onClick={handleZoomIn}
					className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					title="Zoom In"
				>
					<ZoomIn className="h-3.5 w-3.5" />
				</button>
			</div>

			{/* Right: save + more */}
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onSave}
					disabled={!pattern || !isDirty}
					className={cn(
						"hidden items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors sm:inline-flex",
						pattern && isDirty
							? "bg-craft-600 text-white hover:bg-craft-700"
							: "text-text-muted",
					)}
				>
					<Save className="h-3.5 w-3.5" />
					Save
				</button>

				{/* More menu (desktop) */}
				<div className="relative hidden sm:block">
					<button
						type="button"
						onClick={() => setMenuOpen((v) => !v)}
						className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
						title="More actions"
					>
						<MoreHorizontal className="h-4 w-4" />
					</button>
					{menuOpen && (
						<>
							<div
								className="fixed inset-0 z-40"
								onClick={handleBackdrop}
								onKeyDown={(e) =>
									e.key === "Escape" && setMenuOpen(false)
								}
								role="presentation"
							/>
							<div
								ref={menuRef}
								className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-surface py-1 shadow-lg"
							>
								<MenuAction icon={Share2} label="Share" onClick={() => { setMenuOpen(false); onShare(); }} />
								<MenuAction icon={Download} label="Export" onClick={() => { setMenuOpen(false); onExport(); }} />
								<MenuAction icon={FileText} label="Instructions" onClick={() => { setMenuOpen(false); onInstructions(); }} />
								<MenuAction icon={BarChart3} label="Progress" onClick={() => { setMenuOpen(false); onProgress(); }} />
							</div>
						</>
					)}
				</div>
			</div>
		</header>
	);
}

function MenuAction({
	icon: Icon,
	label,
	onClick,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
		>
			<Icon className="h-4 w-4" />
			{label}
		</button>
	);
}
