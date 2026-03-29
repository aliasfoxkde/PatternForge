/**
 * JSON export/import utilities for PatternForge patterns.
 *
 * Wraps the engine's serializePattern/deserializePattern with
 * convenience functions for file download and upload.
 */

import type { Pattern } from "@/engine/pattern/types";
import { deserializePattern, serializePattern } from "@/engine/pattern/types";

/**
 * Serialize a pattern to a JSON string.
 *
 * @param pattern - The pattern to export
 * @returns A JSON string
 */
export function exportToJSON(pattern: Pattern): string {
	return serializePattern(pattern);
}

/**
 * Deserialize a pattern from a JSON string.
 *
 * @param json - A JSON string produced by exportToJSON
 * @returns The deserialized Pattern object
 * @throws Error if the JSON is invalid or cannot be parsed
 */
export function importFromJSON(json: string): Pattern {
	try {
		return deserializePattern(json);
	} catch (error) {
		throw new Error(
			`Failed to import pattern: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Download a pattern as a .json file.
 *
 * @param pattern - The pattern to download
 * @param filename - File name (without extension)
 */
export function downloadPatternJSON(pattern: Pattern, filename?: string): void {
	const json = exportToJSON(pattern);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = `${filename ?? pattern.metadata.name ?? "pattern"}.patternforge.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Read a pattern JSON file from a File input.
 *
 * @param file - A File object to read
 * @returns A Promise that resolves to the Pattern object
 */
export function readPatternFile(file: File): Promise<Pattern> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const json = reader.result as string;
				const pattern = importFromJSON(json);
				resolve(pattern);
			} catch (error) {
				reject(error);
			}
		};
		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsText(file);
	});
}
