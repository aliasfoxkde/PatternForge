/**
 * PatternPreview - Live preview of the converted pattern.
 *
 * Renders the processed image data onto a canvas, displays confetti score
 * and color count, and provides actions for opening in the editor or
 * downloading as PNG.
 */

import { oklchToHex } from "@/engine/color/colors";
import type { ProcessedImage } from "@/engine/image/image-processor";
import { Download, ExternalLink, Palette, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

export interface PatternPreviewProps {
	/** Processed image data to render, or null if not yet processed */
	processedImage: ProcessedImage | null;
	/** Whether processing is in progress */
	isProcessing: boolean;
	/** Callback to open the converted pattern in the editor */
	onOpenInEditor: () => void;
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
	className = "",
}: PatternPreviewProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

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

	// Quality info
	const qualityInfo = useMemo(
		() =>
			processedImage ? getQualityInfo(processedImage.confettiScore) : null,
		[processedImage],
	);

	const uniqueColors = processedImage?.palette.length ?? 0;

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
			{/* Canvas */}
			<div className="flex flex-1 items-center justify-center overflow-auto rounded-xl border border-border bg-surface-secondary p-4">
				{isProcessing ? (
					<div className="flex flex-col items-center gap-3">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-craft-200 border-t-craft-600" />
						<p className="text-sm text-text-secondary">Processing image...</p>
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

					{/* Size badge */}
					<span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1 text-xs font-medium text-text-secondary">
						{processedImage.width} x {processedImage.height}
					</span>
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
