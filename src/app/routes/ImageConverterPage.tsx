/**
 * ImageConverterPage - Convert images to craft patterns.
 *
 * Layout: two-column on desktop (settings left, preview right),
 * stacked on mobile (drop zone + settings top, preview bottom).
 *
 * Conversion flow:
 * 1. User uploads image -> show preview
 * 2. User adjusts settings -> re-process on change (debounced 300ms)
 * 3. User clicks "Open in Editor" -> create pattern, navigate to /editor
 * 4. User can also download as PNG
 */

import { processImage } from "@/engine/image/image-processor";
import type { ProcessedImage } from "@/engine/image/image-processor";
import {
	ConverterSettings,
	type ConverterSettingsState,
} from "@/features/image-converter/components/ConverterSettings";
import { ImageDropZone } from "@/features/image-converter/components/ImageDropZone";
import { PatternPreview } from "@/features/image-converter/components/PatternPreview";
import { usePatternStore } from "@/shared/stores/pattern-store";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const DEFAULT_SETTINGS: ConverterSettingsState = {
	craftType: "cross-stitch",
	gridWidth: 50,
	gridHeight: 50,
	lockAspectRatio: true,
	maxColors: 30,
	dithering: "floyd-steinberg",
	confettiReduction: 50,
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

export function ImageConverterPage() {
	const navigate = useNavigate();
	const createPattern = usePatternStore((s) => s.createPattern);
	const updateGrid = usePatternStore((s) => s.updateGrid);
	const setPalette = usePatternStore((s) => s.setPalette);

	const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
	const [settings, setSettings] =
		useState<ConverterSettingsState>(DEFAULT_SETTINGS);
	const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(
		null,
	);
	const [isProcessing, setIsProcessing] = useState(false);

	// Debounce timer ref
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Cleanup debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	// Process image whenever data URL or settings change (debounced)
	useEffect(() => {
		if (!imageDataUrl) {
			setProcessedImage(null);
			return;
		}

		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		debounceTimerRef.current = setTimeout(async () => {
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
				setProcessedImage(result);
			} catch (error) {
				console.error("[ImageConverter] Processing failed:", error);
				setProcessedImage(null);
			} finally {
				setIsProcessing(false);
			}
		}, 300);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [
		imageDataUrl,
		settings.gridWidth,
		settings.gridHeight,
		settings.maxColors,
		settings.dithering,
		settings.confettiReduction,
	]);

	// Handle image upload
	const handleImageSelected = useCallback((dataUrl: string) => {
		setImageDataUrl(dataUrl);
	}, []);

	// Handle image clear
	const handleImageCleared = useCallback(() => {
		setImageDataUrl(null);
		setProcessedImage(null);
	}, []);

	// Open converted pattern in the editor
	const handleOpenInEditor = useCallback(() => {
		if (!processedImage) return;

		const { cells, width, height, palette } = processedImage;

		// Create a new empty pattern
		const id = crypto.randomUUID();
		createPattern("Converted Pattern", width, height, settings.craftType);

		// Get the pattern from the store and populate cells
		const storeState = usePatternStore.getState();
		const pattern = storeState.pattern;
		if (!pattern) return;

		// Populate grid with converted cells
		updateGrid((grid) => {
			for (const cell of cells) {
				grid.setCell(cell.row, cell.col, { color: cell.color });
			}
		});

		// Build palette from converted colors
		const paletteColors = palette.map((_color, index) => ({
			id: `color-${index}`,
			name: `Color ${index + 1}`,
			hex: "", // Will be resolved by the palette system
			oklch: { mode: "oklch" as const, l: 0, c: 0, h: 0 },
			brand: null,
			threadNumber: null,
			symbol: null,
		}));

		setPalette({
			id: `palette-${id}`,
			name: "Converted Palette",
			colors: paletteColors,
		});

		// Navigate to editor
		navigate("/editor");
	}, [
		processedImage,
		settings.craftType,
		createPattern,
		updateGrid,
		setPalette,
		navigate,
	]);

	const hasImage = imageDataUrl !== null;

	return (
		<div className="flex h-full flex-col bg-surface">
			{/* Header */}
			<header className="flex items-center justify-between border-b border-border px-6 py-4">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => navigate("/")}
						className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
						title="Back to home"
					>
						<ArrowLeft className="h-4 w-4" />
					</button>
					<div>
						<h1 className="text-xl font-bold text-text-primary">
							Image to Pattern
						</h1>
						<p className="mt-0.5 text-sm text-text-secondary">
							Convert photos and artwork into craft patterns
						</p>
					</div>
				</div>
			</header>

			{/* Main content: two-column on desktop, stacked on mobile */}
			<div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
				{/* Left column: Drop zone + Settings */}
				<div className="flex flex-col overflow-y-auto border-r border-border lg:w-80 xl:w-96">
					<div className="p-4">
						<ImageDropZone
							onImageSelected={handleImageSelected}
							onImageCleared={handleImageCleared}
							previewUrl={imageDataUrl}
						/>
					</div>

					{hasImage && (
						<div className="border-t border-border p-4">
							<ConverterSettings
								settings={settings}
								onSettingsChange={setSettings}
								disabled={!hasImage}
							/>
						</div>
					)}
				</div>

				{/* Right column: Preview */}
				<div className="flex flex-1 items-center justify-center overflow-auto p-6">
					<div className="flex w-full max-w-3xl flex-col gap-4">
						<PatternPreview
							processedImage={processedImage}
							isProcessing={isProcessing}
							onOpenInEditor={handleOpenInEditor}
							originalImageUrl={imageDataUrl}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
