/**
 * PatternForge Engine - framework-agnostic core logic.
 *
 * This barrel file re-exports all public API from submodules.
 */

// Grid
export { PatternGrid } from './grid/grid';
export type { Cell, StitchType } from './grid/grid';
export type { GridRow, SparseGrid, GridDimensions, GridRegion, Viewport } from './grid/types';

// Renderer
export { CanvasRenderer } from './renderer/canvas-renderer';
export type { ViewportState, RenderOptions, Selection, GridPosition } from './renderer/canvas-renderer';

// Tools
export { DrawingTools } from './tools/tools';
export type { ToolType, ToolOptions, ToolResult, GridPosition as ToolGridPosition } from './tools/tools';
export { TOOL_LABELS, TOOL_CATEGORIES } from './tools/types';

// History
export { HistoryManager, ApplyCellsCommand, ResizeGridCommand } from './history/history';
export type { Command } from './history/history';

// Pattern
export type { CraftType, PatternMetadata, Pattern, PatternPalette } from './pattern/types';
export {
  CRAFT_TYPE_LABELS,
  createDefaultMetadata,
  createEmptyPattern,
  serializePattern,
  deserializePattern,
  generateId,
} from './pattern/types';

// Color
export { hexToOklch, oklchToHex, colorDistance, nearestColor, quantizeColors } from './color/colors';
export type { OKLCHColor, HexColor, PaletteColor, ColorPalette } from './color/types';

// Image
export { processImage, calculateConfettiScore } from './image/image-processor';
export type { ImageProcessOptions, ProcessedImage } from './image/image-processor';
