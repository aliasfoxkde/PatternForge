/**
 * Additional grid types for the PatternForge engine.
 * The core Cell and StitchType types are defined in grid.ts.
 */

/** Row in the pattern grid (col -> cell data) */
export type GridRow = Map<number, import("./grid").Cell>;

/** Sparse grid data structure.
 *  Outer map: row index -> row data.
 *  Inner map: column index -> cell.
 *  Unmapped cells are treated as empty (null color).
 */
export type SparseGrid = Map<number, GridRow>;

/** Grid dimensions */
export interface GridDimensions {
	width: number;
	height: number;
}

/** A rectangular region of the grid */
export interface GridRegion {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Viewport state for rendering */
export interface Viewport {
	/** Center X in grid coordinates */
	centerX: number;
	/** Center Y in grid coordinates */
	centerY: number;
	/** Zoom level (1.0 = 100%) */
	zoom: number;
}
