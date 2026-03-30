/**
 * ImageDropZone - Drag-and-drop image upload component.
 *
 * Supports drag-and-drop, click-to-browse, and paste-from-clipboard.
 * Validates file type and size before accepting.
 */

import { ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const ACCEPTED_TYPES = [
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"image/bmp",
];
const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg,.gif,.webp,.bmp";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export interface ImageDropZoneProps {
	/** Called with the image data URL when a valid image is uploaded */
	onImageSelected: (dataUrl: string, file: File) => void;
	/** Called when the user clears the current image */
	onImageCleared?: () => void;
	/** Currently uploaded image preview data URL, if any */
	previewUrl?: string | null;
	/** Additional class names */
	className?: string;
}

export function ImageDropZone({
	onImageSelected,
	onImageCleared,
	previewUrl,
	className = "",
}: ImageDropZoneProps) {
	const [isDragOver, setIsDragOver] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const validateFile = useCallback((file: File): string | null => {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			return "Unsupported file type. Accepted: PNG, JPG, GIF, WebP, BMP";
		}
		if (file.size > MAX_FILE_SIZE) {
			return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 20 MB.`;
		}
		return null;
	}, []);

	const processFile = useCallback(
		(file: File) => {
			setError(null);
			const validationError = validateFile(file);
			if (validationError) {
				setError(validationError);
				return;
			}

			const reader = new FileReader();
			reader.onload = () => {
				const dataUrl = reader.result as string;
				onImageSelected(dataUrl, file);
			};
			reader.onerror = () => {
				setError("Failed to read the image file.");
			};
			reader.readAsDataURL(file);
		},
		[validateFile, onImageSelected],
	);

	// Drag handlers
	const handleDragOver = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(true);
		},
		[],
	);

	const handleDragLeave = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);
		},
		[],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				const file = files[0];
				if (file) processFile(file);
			}
		},
		[processFile],
	);

	// Click handler
	const handleClick = useCallback(() => {
		inputRef.current?.click();
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				const file = files[0];
				if (file) processFile(file);
			}
			// Reset so the same file can be re-selected
			e.target.value = "";
		},
		[processFile],
	);

	// Paste handler
	const handlePaste = useCallback(
		(e: React.ClipboardEvent<HTMLButtonElement>) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item?.type.startsWith("image/")) {
					e.preventDefault();
					const file = item.getAsFile();
					if (file) {
						processFile(file);
					}
					return;
				}
			}
		},
		[processFile],
	);

	const handleClear = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onImageCleared?.();
			setError(null);
		},
		[onImageCleared],
	);

	// Preview state
	if (previewUrl) {
		return (
			<div
				className={`relative flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-surface-secondary p-6 ${className}`}
			>
				<div className="relative max-h-64 max-w-full overflow-hidden rounded-lg">
					<img
						src={previewUrl}
						alt="Uploaded preview"
						className="max-h-64 max-w-full object-contain"
					/>
					<button
						type="button"
						onClick={handleClear}
						className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface/80 text-text-secondary shadow-sm transition-colors hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600"
						title="Remove image"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="flex items-center gap-2 text-sm text-text-secondary">
					<ImageIcon className="h-4 w-4" />
					<span>Image loaded. Adjust settings and convert.</span>
				</div>
			</div>
		);
	}

	// Drop zone state
	return (
		<button
			type="button"
			className={`flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed p-12 text-center transition-colors ${isDragOver ? "border-craft-500 bg-craft-50" : "border-border-strong bg-surface-secondary hover:border-craft-400"} ${className}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onPaste={handlePaste}
			onClick={handleClick}
		>
			<div
				className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${isDragOver ? "bg-craft-100 text-craft-600" : "bg-craft-50 text-craft-500"}`}
			>
				<Upload className="h-8 w-8" />
			</div>
			<div>
				<h2 className="mb-1 text-base font-semibold text-text-primary">
					{isDragOver
						? "Drop your image here"
						: "Drop an image here or click to browse"}
				</h2>
				<p className="text-sm text-text-secondary">
					Supports PNG, JPG, GIF, WebP, BMP. You can also paste from clipboard.
				</p>
			</div>
			<button
				type="button"
				className="rounded-lg bg-craft-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-craft-700"
				onClick={(e) => {
					e.stopPropagation();
					handleClick();
				}}
			>
				Choose File
			</button>
			<p className="text-xs text-text-muted">Maximum file size: 20 MB</p>

			{error && (
				<p className="mt-1 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
					{error}
				</p>
			)}

			<input
				ref={inputRef}
				type="file"
				accept={ACCEPTED_EXTENSIONS}
				onChange={handleInputChange}
				className="hidden"
				aria-label="Upload image"
			/>
		</button>
	);
}
