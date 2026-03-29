/**
 * Color types for the PatternForge engine.
 * Uses OKLCH color space internally for perceptual uniformity.
 */

/** OKLCH color representation */
export interface OKLCHColor {
	mode: "oklch";
	l: number; // lightness 0-1
	c: number; // chroma 0-0.4
	h: number; // hue 0-360
}

/** Hex color string (e.g. "#ff0000") */
export type HexColor = string & { readonly __brand: "HexColor" };

/** A color entry in a pattern palette */
export interface PaletteColor {
	/** Unique identifier */
	id: string;
	/** Display name (e.g. "DMC 310 Black") */
	name: string;
	/** Hex color value */
	hex: string;
	/** OKLCH representation for perceptual operations */
	oklch: OKLCHColor;
	/** Thread brand identifier (e.g. "dmc", "anchor") or null */
	brand: string | null;
	/** Thread number within the brand (e.g. "310") or null */
	threadNumber: string | null;
	/** Symbol assigned to this color in the pattern */
	symbol: string | null;
}

/** A collection of colors available for a pattern */
export interface ColorPalette {
	/** Unique identifier */
	id: string;
	/** Display name */
	name: string;
	/** Colors in this palette */
	colors: PaletteColor[];
}
