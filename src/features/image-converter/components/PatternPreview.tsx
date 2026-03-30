/**
 * PatternPreview - Live preview of the converted pattern.
 *
 * Renders the processed image data onto a canvas, displays confetti score
 * and color count, and provides actions for opening in the editor or
 * downloading as PNG. Supports a before/after comparison mode that
 * shows the original image alongside the converted pattern with a
 * draggable divider.
 */

import { oklchToHex } from "@/engine/color/colors";
import type { ProcessedImage } from "@/engine/image/image-processor";
import { findNearestDmcColor } from "@/data/color-matching";
import type { DmcColor } from "@/data/dmc-colors";
import { Columns2, Download, ExternalLink, Palette, Star } from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
} from "react";

export interface PatternPreviewProps {
	/** Processed image data to render, or null if not yet processed */
	processedImage: ProcessedImage | null;
	/** Whether processing is in progress */
	isProcessing: boolean;
	/** Callback to open the converted pattern in the editor */
	onOpenInEditor: () => void;
	/** Original uploaded image URL for before/after comparison */
	originalImageUrl?: string | null;
	/** Whether DMC floss matching is active */
	isDmcMatched?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * Get a quality label and color based on confetti score.
 * Lower confetti score = higher quality.
 */
function getQualityInfo(score: number): { label: string; colorClass: string } {
	if (score <= 20)
		return { label: "Excellent", colorClass: "text-green-600 bg-green-50" };
	if (score <= 40)
		return { label: "Good", colorClass: "text-blue-600 bg-blue-50" };
	if (score <= 60)
		return { label: "Fair", colorClass: "text-yellow-600 bg-yellow-50" };
	if (score <= 80)
		return { label: "Moderate", colorClass: "text-orange-600 bg-orange-50" };
	return { label: "High Scatter", colorClass: "text-red-600 bg-red-50" };
}

export function PatternPreview({
	processedImage,
	isProcessing,
	onOpenInEditor,
	originalImageUrl = null,
	isDmcMatched = false,
	className = "",
}: PatternPreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [compareMode, setCompareMode] = useState(false);
	const [splitPosition, setSplitPosition] = useState(50);
	const isDragging = useRef(false);

	// Render the processed image onto canvas
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !processedImage) return;

		const { width, height, cells } = processedImage;

		// Calculate cell size to fit within a reasonable canvas area
		const maxCanvasSize = 600;
		const cellSize = Math.max(
			1,
			Math.min(Math.floor(maxCanvasSize / Math.max(width, height)), 20),
		);

		const dpr = window.devicePixelRatio || 1;
		const canvasWidth = width * cellSize;
		const canvasHeight = height * cellSize;

		canvas.width = canvasWidth * dpr;
		canvas.height = canvasHeight * dpr;
		canvas.style.width = `${canvasWidth}px`;
		canvas.style.height = `${canvasHeight}px`;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.scale(dpr, dpr);

		// White background
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		// Build lookup map
		const lookup = new Map<string, string>();
		for (const cell of cells) {
			lookup.set(`${cell.row},${cell.col}`, cell.color);
		}

		// Render cells
		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				const color = lookup.get(`${row},${col}`);
				if (color) {
					ctx.fillStyle = oklchToHex(color);
					ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
				}
			}
		}

		// Draw grid lines if cells are large enough
		if (cellSize >= 4) {
			ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
			ctx.lineWidth = 0.5;
			for (let row = 0; row <= height; row++) {
				ctx.beginPath();
				ctx.moveTo(0, row * cellSize);
				ctx.lineTo(canvasWidth, row * cellSize);
				ctx.stroke();
			}
			for (let col = 0; col <= width; col++) {
				ctx.beginPath();
				ctx.moveTo(col * cellSize, 0);
				ctx.lineTo(col * cellSize, canvasHeight);
				ctx.stroke();
			}
		}
	}, [processedImage]);

	// Download as PNG
	const handleDownload = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const link = document.createElement("a");
		link.download = "pattern-preview.png";
		link.href = canvas.toDataURL("image/png");
		link.click();
	}, []);

	// Divider drag handlers
	const handlePointerDown = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			e.preventDefault();
			isDragging.current = true;
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		},
		[],
	);

	const handlePointerMove = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			if (!isDragging.current || !containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
			setSplitPosition(percent);
		},
		[],
	);

	const handlePointerUp = useCallback(() => {
		isDragging.current = false;
	}, []);

	// Quality info
	const qualityInfo = useMemo(
		() =>
			processedImage ? getQualityInfo(processedImage.confettiScore) : null,
		[processedImage],
	);

	const uniqueColors = processedImage?.palette.length ?? 0;
	const canCompare = originalImageUrl !== null && processedImage !== null;

	// Build DMC color info when floss matching is active
	const dmcColors = useMemo((): Array<DmcColor | null> => {
		if (!isDmcMatched || !processedImage) return [];
		return processedImage.palette.map((color) => {
			const hex = color.startsWith("#") ? color : oklchToHex(color);
			return findNearestDmcColor(hex);
		});
	}, [isDmcMatched, processedImage]);

	if (!processedImage && !isProcessing) {
		return (
			<div
				className={`flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-surface-secondary p-8 text-center ${className}`}
			>
				<div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border-strong text-text-muted">
					<Star className="h-7 w-7" />
				</div>
				<div>
					<h2 className="mb-1 text-base font-semibold text-text-primary">
						Pattern Preview
					</h2>
					<p className="text-sm text-text-secondary">
						Upload an image and adjust settings to see a live preview
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`flex flex-col gap-4 ${className}`}>
			{/* Canvas / Compare view */}
			<div
				ref={containerRef}
				className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-secondary p-4"
			>
				{isProcessing ? (
					<div className="flex flex-col items-center gap-3">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-craft-200 border-t-craft-600" />
						<p className="text-sm text-text-secondary">Processing image...</p>
					</div>
				) : compareMode && canCompare ? (
					/* Before / After comparison */
					<div className="relative flex w-full max-w-2xl items-center justify-center overflow-hidden rounded-md shadow-sm">
						{/* Original image (left) */}
						<div
							className="absolute inset-0 overflow-hidden"
							style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
						>
							<img
								src={originalImageUrl!}
								alt="Original"
								className="h-full w-full object-contain"
								draggable={false}
							/>
							<span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
								Original
							</span>
						</div>

						{/* Pattern canvas (right) */}
						<div
							className="absolute inset-0 flex items-center justify-center bg-surface"
							style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
						>
							<canvas ref={canvasRef} className="rounded-md" />
							<span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
								Pattern
							</span>
						</div>

						{/* Draggable divider */}
						<div
							className="absolute inset-y-0 z-10 w-5 -translate-x-1/2 cursor-col-resize"
							style={{ left: `${splitPosition}%` }}
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={handlePointerUp}
							onPointerCancel={handlePointerUp}
							role="slider"
							aria-label="Comparison slider"
							aria-valuenow={Math.round(splitPosition)}
							aria-valuemin={5}
							aria-valuemax={95}
							tabIndex={0}
							onKeyDown={(e) => {
								const step = e.shiftKey ? 5 : 1;
								if (e.key === "ArrowLeft")
									setSplitPosition((p) => Math.max(5, p - step));
								if (e.key === "ArrowRight")
									setSplitPosition((p) => Math.min(95, p + step));
							}}
						>
							<div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-sm" />
							<div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-craft-600 shadow-lg">
								<Columns2 className="h-3.5 w-3.5 text-white" />
							</div>
						</div>
					</div>
				) : (
					<canvas ref={canvasRef} className="rounded-md shadow-sm" />
				)}
			</div>

			{/* Stats and actions */}
			{processedImage && (
				<div className="flex flex-wrap items-center gap-3">
					{/* Confetti score badge */}
					{qualityInfo && (
						<span
							className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${qualityInfo.colorClass}`}
						>
							<Star className="h-3.5 w-3.5" />
							Quality: {100 - processedImage.confettiScore}/100 (
							{qualityInfo.label})
						</span>
					)}

					{/* Color count badge */}
					<span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary">
						<Palette className="h-3.5 w-3.5" />
						{uniqueColors} color{uniqueColors !== 1 ? "s" : ""}
					</span>

					{/* DMC badge */}
					{isDmcMatched && (
						<span className="inline-flex items-center gap-1.5 rounded-full bg-craft-50 px-3 py-1 text-xs font-medium text-craft-700 dark:bg-craft-900/30 dark:text-craft-300">
							<Palette className="h-3.5 w-3.5" />
							DMC Floss
						</span>
					)}

					{/* Size badge */}
					<span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary">
						{processedImage.width} x {processedImage.height}
					</span>
				</div>
			)}

			{/* DMC color legend */}
			{isDmcMatched && dmcColors.length > 0 && (
				<div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface-secondary p-2">
					{dmcColors.map((dmc, i) =>
						dmc ? (
							<span
								key={`${dmc.id}-${i}`}
								className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
								title={`${dmc.name} (${dmc.hex})`}
							>
								<span
									className="inline-block h-2.5 w-2.5 rounded-sm border border-black/10"
									style={{ backgroundColor: dmc.hex }}
								/>
								{dmc.id}
							</span>
						) : null,
					)}
				</div>
			)}

			{/* Action buttons */}
			{processedImage && (
				<div className="flex gap-3">
					<button
						type="button"
						onClick={onOpenInEditor}
						className="inline-flex items-center gap-2 rounded-lg bg-craft-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-craft-700"
					>
						<ExternalLink className="h-4 w-4" />
						Open in Editor
					</button>
					{canCompare && (
						<button
							type="button"
							onClick={() => setCompareMode((v) => !v)}
							className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
								compareMode
									? "border-craft-500 bg-craft-50 text-craft-700"
									: "border-border bg-surface text-text-primary hover:bg-surface-tertiary"
							}`}
						>
							<Columns2 className="h-4 w-4" />
							{compareMode ? "Hide Compare" : "Compare"}
						</button>
					)}
					<button
						type="button"
						onClick={handleDownload}
						className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary"
					>
						<Download className="h-4 w-4" />
						Download PNG
					</button>
				</div>
			)}
		</div>
	);
}
