/**
 * ExportDialog - Modal dialog for exporting patterns.
 *
 * Supports PNG, SVG, PDF, and JSON export formats with
 * configurable options like cell size, grid lines, and page size.
 */

import type { Pattern } from "@/engine/pattern/types";
import { downloadPatternJSON } from "@/features/export/export-json";
import { exportToPDF } from "@/features/export/export-pdf";
import { exportToPNG } from "@/features/export/export-png";
import { exportToSVG } from "@/features/export/export-svg";
import {
	Check,
	Download,
	FileCode,
	FileImage,
	FileJson,
	FileText,
	Loader2,
	X,
} from "lucide-react";
import { useCallback, useState } from "react";

export type ExportFormat = "png" | "svg" | "pdf" | "json";

export interface ExportDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** Close handler */
	onClose: () => void;
	/** The pattern to export */
	pattern: Pattern;
}

const FORMAT_OPTIONS: Array<{
	value: ExportFormat;
	label: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
}> = [
	{ value: "png", label: "PNG", description: "Raster image", icon: FileImage },
	{ value: "svg", label: "SVG", description: "Vector image", icon: FileCode },
	{
		value: "pdf",
		label: "PDF",
		description: "Print-ready document",
		icon: FileText,
	},
	{
		value: "json",
		label: "JSON",
		description: "PatternForge file",
		icon: FileJson,
	},
];

function triggerDownload(dataUrl: string, filename: string): void {
	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function ExportDialog({ open, onClose, pattern }: ExportDialogProps) {
	const [format, setFormat] = useState<ExportFormat>("png");
	const [cellSize, setCellSize] = useState(20);
	const [showGridLines, setShowGridLines] = useState(false);
	const [showSymbols, setShowSymbols] = useState(false);
	const [includeLegend, setIncludeLegend] = useState(true);
	const [pageSize, setPageSize] = useState<"a4" | "letter">("a4");
	const [isExporting, setIsExporting] = useState(false);
	const [exportSuccess, setExportSuccess] = useState(false);

	const handleExport = useCallback(async () => {
		setIsExporting(true);
		setExportSuccess(false);

		try {
			const baseName = pattern.metadata.name ?? "pattern";

			switch (format) {
				case "png": {
					const dataUrl = exportToPNG(pattern.grid, cellSize, {
						showGridLines,
						showSymbols,
					});
					triggerDownload(dataUrl, `${baseName}.png`);
					break;
				}
				case "svg": {
					const svgString = exportToSVG(pattern.grid, cellSize, {
						showGridLines,
						showSymbols,
					});
					const blob = new Blob([svgString], { type: "image/svg+xml" });
					triggerBlobDownload(blob, `${baseName}.svg`);
					break;
				}
				case "pdf": {
					const blob = await exportToPDF(pattern.grid, baseName, {
						showGridLines,
						showSymbols,
						cellSize,
						includeLegend,
						pageSize,
					});
					triggerBlobDownload(blob, `${baseName}.pdf`);
					break;
				}
				case "json": {
					downloadPatternJSON(pattern, baseName);
					break;
				}
			}

			setExportSuccess(true);
			setTimeout(() => setExportSuccess(false), 2000);
		} catch (error) {
			console.error("[ExportDialog] Export failed:", error);
		} finally {
			setIsExporting(false);
		}
	}, [
		pattern,
		format,
		cellSize,
		showGridLines,
		showSymbols,
		includeLegend,
		pageSize,
	]);

	if (!open) return null;

	const showCellSize = format === "png" || format === "svg" || format === "pdf";
	const showGridOptions =
		format === "png" || format === "svg" || format === "pdf";
	const showPdfOptions = format === "pdf";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === "Escape") onClose();
				}}
				role="presentation"
			/>

			{/* Dialog */}
			<div className="relative z-10 mx-4 w-full max-w-md rounded-xl border border-border bg-surface shadow-xl">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-border px-5 py-4">
					<h2 className="text-base font-semibold text-text-primary">
						Export Pattern
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Body */}
				<div className="space-y-5 px-5 py-4">
					{/* Format selection */}
					<div>
						<span className="mb-2 block text-xs font-medium text-text-secondary">
							Format
						</span>
						<div className="grid grid-cols-4 gap-2">
							{FORMAT_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => setFormat(opt.value)}
									className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs transition-colors ${
										format === opt.value
											? "border-craft-500 bg-craft-50 text-craft-700"
											: "border-border bg-surface text-text-secondary hover:border-craft-300"
									}`}
								>
									<opt.icon className="h-5 w-5" />
									<span className="font-medium">{opt.label}</span>
								</button>
							))}
						</div>
					</div>

					{/* Cell size */}
					{showCellSize && (
						<div>
							<label
								htmlFor="export-cell-size"
								className="mb-1.5 flex items-center justify-between text-xs font-medium text-text-secondary"
							>
								<span>Cell Size (px)</span>
								<span className="tabular-nums text-text-primary">
									{cellSize}
								</span>
							</label>
							<input
								id="export-cell-size"
								type="range"
								value={cellSize}
								min={2}
								max={50}
								onChange={(e) => setCellSize(Number(e.target.value))}
								className="w-full accent-craft-600"
							/>
							<div className="mt-0.5 flex justify-between text-[10px] text-text-muted">
								<span>2px</span>
								<span>50px</span>
							</div>
						</div>
					)}

					{/* Grid and symbol options */}
					{showGridOptions && (
						<div className="flex gap-4">
							<label className="flex items-center gap-2 text-sm text-text-secondary">
								<input
									type="checkbox"
									checked={showGridLines}
									onChange={(e) => setShowGridLines(e.target.checked)}
									className="rounded border-border accent-craft-600"
								/>
								Grid lines
							</label>
							<label className="flex items-center gap-2 text-sm text-text-secondary">
								<input
									type="checkbox"
									checked={showSymbols}
									onChange={(e) => setShowSymbols(e.target.checked)}
									className="rounded border-border accent-craft-600"
								/>
								Symbols
							</label>
						</div>
					)}

					{/* PDF options */}
					{showPdfOptions && (
						<div className="flex gap-4">
							<label className="flex items-center gap-2 text-sm text-text-secondary">
								<input
									type="checkbox"
									checked={includeLegend}
									onChange={(e) => setIncludeLegend(e.target.checked)}
									className="rounded border-border accent-craft-600"
								/>
								Color legend
							</label>
							<div>
								<label
									htmlFor="export-page-size"
									className="mr-2 text-sm text-text-secondary"
								>
									Page size:
								</label>
								<select
									id="export-page-size"
									value={pageSize}
									onChange={(e) =>
										setPageSize(e.target.value as "a4" | "letter")
									}
									className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
								>
									<option value="a4">A4</option>
									<option value="letter">Letter</option>
								</select>
							</div>
						</div>
					)}

					{/* Info */}
					<div className="rounded-md bg-surface-tertiary px-3 py-2 text-xs text-text-muted">
						{format === "json" &&
							"Exports the full pattern data including grid, palette, and metadata."}
						{format === "png" &&
							`Output: ${pattern.grid.width * cellSize} x ${pattern.grid.height * cellSize} pixels`}
						{format === "svg" &&
							"Scalable vector format. Best for web display and printing at any size."}
						{format === "pdf" &&
							"Multi-page PDF suitable for printing. Includes grid and optional color legend."}
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleExport}
						disabled={isExporting}
						className="inline-flex items-center gap-2 rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700 disabled:opacity-50"
					>
						{isExporting ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Exporting...
							</>
						) : exportSuccess ? (
							<>
								<Check className="h-4 w-4" />
								Done!
							</>
						) : (
							<>
								<Download className="h-4 w-4" />
								Export
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
