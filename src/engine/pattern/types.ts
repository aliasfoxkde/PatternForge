/**
 * Core pattern types for the PatternForge engine.
 */

import type { ColorPalette } from "@/engine/color/types";
import { PatternGrid } from "@/engine/grid/grid";

/** Supported craft types */
export type CraftType =
	| "knitting-flat"
	| "knitting-round"
	| "crochet-standard"
	| "crochet-c2c"
	| "cross-stitch"
	| "diamond-painting"
	| "fuse-beads"
	| "pixel-art";

/** Human-readable craft type labels */
export const CRAFT_TYPE_LABELS: Record<CraftType, string> = {
	"knitting-flat": "Knitting (Flat)",
	"knitting-round": "Knitting (In the Round)",
	"crochet-standard": "Crochet",
	"crochet-c2c": "Crochet (C2C)",
	"cross-stitch": "Cross Stitch",
	"diamond-painting": "Diamond Painting",
	"fuse-beads": "Fuse Beads",
	"pixel-art": "Pixel Art",
};

/** Pattern metadata */
export interface PatternMetadata {
	/** Pattern name */
	name: string;
	/** Pattern description */
	description: string;
	/** Author name */
	author: string;
	/** Craft type */
	craftType: CraftType;
	/** Tags for search/filter */
	tags: string[];
	/** Creation timestamp (epoch ms) */
	createdAt: number;
	/** Last modification timestamp (epoch ms) */
	updatedAt: number;
	/** Pattern version (incremented on each save) */
	version: number;
	/** Grid cell size in pixels for export */
	cellSize: number;
	/** Notes about the pattern */
	notes: string;
	/** Gauge information for knitting/crochet */
	gauge?: {
		stitches: number;
		rows: number;
		unit: "in" | "cm";
	};
}

/** The main pattern model */
export interface Pattern {
	/** Unique identifier (UUID) */
	id: string;
	/** Pattern metadata */
	metadata: PatternMetadata;
	/** Pattern grid (sparse, class-based) */
	grid: PatternGrid;
	/** Color palette */
	palette: ColorPalette;
}

/** Palette type alias for store convenience */
export type PatternPalette = ColorPalette;

/** Default metadata values */
export function createDefaultMetadata(
	name: string,
	craftType: CraftType,
): PatternMetadata {
	const now = Date.now();
	return {
		name,
		description: "",
		author: "",
		craftType,
		tags: [],
		createdAt: now,
		updatedAt: now,
		version: 1,
		cellSize: 20,
		notes: "",
	};
}

/** Create an empty pattern */
export function createEmptyPattern(
	id: string,
	name: string,
	width: number,
	height: number,
	craftType: CraftType,
): Pattern {
	return {
		id,
		metadata: createDefaultMetadata(name, craftType),
		grid: new PatternGrid(width, height),
		palette: { id: "", name: "Default", colors: [] },
	};
}

/** Serialize a pattern to JSON-compatible data.
 *  PatternGrid.toJSON() handles grid serialization.
 */
export function serializePattern(pattern: Pattern): string {
	return JSON.stringify({
		id: pattern.id,
		metadata: pattern.metadata,
		grid: pattern.grid.toJSON(),
		palette: pattern.palette,
	});
}

/** Deserialize a pattern from JSON string */
export function deserializePattern(json: string): Pattern {
	const data = JSON.parse(json) as {
		id: string;
		metadata: PatternMetadata;
		grid: ReturnType<PatternGrid["toJSON"]>;
		palette: ColorPalette;
	};
	return {
		id: data.id,
		metadata: data.metadata,
		grid: PatternGrid.fromJSON(data.grid),
		palette: data.palette,
	};
}

/** Generate a UUID v4 string. */
export function generateId(): string {
	return crypto.randomUUID();
}
