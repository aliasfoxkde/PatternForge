/**
 * ImportImageDialog - Import an image directly into the editor.
 *
 * Reuses the image-converter pipeline (ImageDropZone, ConverterSettings,
 * PatternPreview) but applies the result to the current pattern instead of
 * creating a new one.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { processImage } from "@/engine/image/image-processor";
import type { ProcessedImage } from "@/engine/image/image-processor";
import { oklchToHex } from "@/engine/color/colors";
import { findNearestDmcColor } from "@/data/color-matching";
import { ImageDropZone } from "@/features/image-converter/components/ImageDropZone";
import {
	ConverterSettings,
	type ConverterSettingsState,
} from "@/features/image-converter/components/ConverterSettings";
import { PatternPreview } from "@/features/image-converter/components/PatternPreview";
import { usePatternStore } from "@/shared/stores/pattern-store";
import { useToast } from "@/shared/hooks/use-toast";
import { X } from "lucide-react";

const DEFAULT_SETTINGS: ConverterSettingsState = {
	craftType: "cross-stitch",
	gridWidth: 50,
	gridHeight: 50,
	lockAspectRatio: true,
	maxColors: 30,
	dithering: "floyd-steinberg",
	confettiReduction: 50,
	matchToDmc: true,
};

function extractImageData(dataUrl: string): Promise<ImageData> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				reject(new Error("Failed to get canvas 2D context"));
				return;
			}
			ctx.drawImage(img, 0, 0);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			resolve(imageData);
		};
		img.onerror = () => reject(new Error("Failed to load image"));
		img.src = dataUrl;
	});
}

interface ImportImageDialogProps {
	open: boolean;
	onClose: () => void;
}

export function ImportImageDialog({ open, onClose }: ImportImageDialogProps) {
	const toast = useToast();
	const updateGrid = usePatternStore((s) => s.updateGrid);
	const setPalette = usePatternStore((s) => s.setPalette);
	const pattern = usePatternStore((s) => s.pattern);

	const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
	const [settings, setSettings] = useState<ConverterSettingsState>(DEFAULT_SETTINGS);
	const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Reset on open
	useEffect(() => {
		if (open) {
			setImageDataUrl(null);
			setProcessedImage(null);
		}
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [open]);

	// Process image (debounced)
	useEffect(() => {
		if (!open || !imageDataUrl) return;
		if (debounceRef.current) clearTimeout(debounceRef.current);

		debounceRef.current = setTimeout(async () => {
			setIsProcessing(true);
			try {
				const imageData = await extractImageData(imageDataUrl);
				const result = processImage(imageData, {
					width: settings.gridWidth,
					height: settings.gridHeight,
					maxColors: settings.maxColors,
					dithering: settings.dithering,
					confettiReduction: settings.confettiReduction / 100,
					colorSpace: "oklch",
				});

				if (settings.matchToDmc) {
					const dmcMapping = new Map<string, string>();
					const dmcPalette: string[] = [];
					for (const oklchColor of result.palette) {
						let mapped: string;
						if (dmcMapping.has(oklchColor)) {
							mapped = dmcMapping.get(oklchColor)!;
						} else {
							const hex = oklchToHex(oklchColor);
							const dmc = findNearestDmcColor(hex);
							mapped = dmc ? dmc.hex : hex;
							dmcMapping.set(oklchColor, mapped);
						}
						if (!dmcPalette.includes(mapped)) dmcPalette.push(mapped);
					}
					const dmcCells = result.cells.map((cell) => ({
						...cell,
						color: dmcMapping.get(cell.color) ?? cell.color,
					}));
					setProcessedImage({ ...result, cells: dmcCells, palette: dmcPalette });
				} else {
					setProcessedImage(result);
				}
			} catch (error) {
				console.error("[ImportImageDialog] Processing failed:", error);
				toast.error("Image processing failed");
				setProcessedImage(null);
			} finally {
				setIsProcessing(false);
			}
		}, 300);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [open, imageDataUrl, settings, toast]);

	// Apply to current pattern
	const handleApply = useCallback(() => {
		if (!processedImage || !pattern) return;

		updateGrid((grid) => {
			// Resize grid to match processed image dimensions
			grid.resize(processedImage.width, processedImage.height);
			// Clear existing cells
			grid.clearAll();
			// Populate with converted cells
			for (const cell of processedImage.cells) {
				grid.setCell(cell.row, cell.col, { color: cell.color });
			}
		});

		// Build palette from converted colors
		const paletteColors = processedImage.palette.map((color, index) => ({
			id: `color-${index}`,
			name: `Color ${index + 1}`,
			hex: color,
			oklch: { mode: "oklch" as const, l: 0, c: 0, h: 0 },
			brand: settings.matchToDmc ? "DMC" : null,
			threadNumber: null,
			symbol: null,
		}));

		setPalette({
			id: `palette-import-${Date.now()}`,
			name: settings.matchToDmc ? "DMC Floss Palette" : "Imported Palette",
			colors: paletteColors,
		});

		toast.success(`Imported ${processedImage.width}x${processedImage.height} pattern`);
		onClose();
	}, [processedImage, pattern, settings, updateGrid, setPalette, toast, onClose]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			role="dialog"
			aria-modal="true"
			>
			<div className="flex h-[85vh] w-full max-w-5xl flex-col gap-4 rounded-xl bg-surface shadow-xl overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-3 border-b border-border">
					<h2 className="text-base font-semibold text-text-primary">Import Image</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-text-secondary hover:bg-surface-tertiary"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Body */}
				<div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
					{/* Left: Upload + Settings */}
					<div className="flex shrink-0 flex-col overflow-y-auto border-b border-border p-4 lg:w-72 lg:border-b-0 lg:border-r">
						<ImageDropZone
							onImageSelected={setImageDataUrl}
							onImageCleared={() => {
								setImageDataUrl(null);
								setProcessedImage(null);
							}}
							previewUrl={imageDataUrl}
						/>
						{imageDataUrl && (
							<div className="mt-4">
								<ConverterSettings
									settings={settings}
									onSettingsChange={setSettings}
								/>
							</div>
						)}
					</div>

					{/* Right: Preview */}
					<div className="flex flex-1 items-center justify-center overflow-auto p-4">
						<PatternPreview
							processedImage={processedImage}
							isProcessing={isProcessing}
							onOpenInEditor={handleApply}
							originalImageUrl={imageDataUrl}
							isDmcMatched={settings.matchToDmc}
							className="w-full"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
