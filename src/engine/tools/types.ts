/**
 * Tool types re-exported from the tools module.
 * The canonical definitions live in tools.ts alongside the implementations.
 */
export type { ToolType, ToolOptions, ToolResult, GridPosition } from "./tools";

import type { ToolType } from "./tools";

/** Human-readable tool labels */
export const TOOL_LABELS: Record<ToolType, string> = {
	pencil: "Pencil",
	brush: "Brush",
	eraser: "Eraser",
	fill: "Fill Bucket",
	line: "Line",
	rectangle: "Rectangle",
	ellipse: "Ellipse",
	"color-picker": "Color Picker",
	text: "Text",
	selection: "Selection",
	pan: "Pan",
};

/** Tool categories for UI grouping */
export const TOOL_CATEGORIES = {
	drawing: ["pencil", "brush", "eraser", "fill"] as ToolType[],
	shapes: ["line", "rectangle", "ellipse"] as ToolType[],
	utility: ["color-picker", "text", "selection", "pan"] as ToolType[],
} as const;
