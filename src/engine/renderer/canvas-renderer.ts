/**
 * Canvas-based grid renderer for pattern visualization.
 *
 * Handles viewport transforms (pan/zoom), HiDPI scaling, coordinate
 * conversion, and efficient rendering of only visible cells.
 *
 * @module renderer
 */

import type { Cell, PatternGrid } from '@/engine/grid/grid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ViewportState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

export interface RenderOptions {
  showGridLines: boolean;
  showCoordinates: boolean;
  showSymbols: boolean;
  coordinateColor: string;
  gridLineColor: string;
  majorGridLineColor: string;
  majorGridInterval: number;
  backgroundColor: string;
  emptyCellColor: string;
}

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface GridPosition {
  row: number;
  col: number;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  showGridLines: true,
  showCoordinates: true,
  showSymbols: true,
  coordinateColor: '#888888',
  gridLineColor: '#cccccc',
  majorGridLineColor: '#999999',
  majorGridInterval: 10,
  backgroundColor: '#ffffff',
  emptyCellColor: '#f5f5f5',
};

const BASE_CELL_SIZE = 20;

// ---------------------------------------------------------------------------
// CanvasRenderer
// ---------------------------------------------------------------------------

/**
 * Renders a `PatternGrid` onto an HTML5 `<canvas>` element.
 *
 * Supports:
 * - Viewport panning and zooming
 * - HiDPI (Retina) display support
 * - Virtual viewport (only visible cells are drawn)
 * - Grid lines with major/minor distinction
 * - Row/column coordinate labels
 * - Selection overlay
 * - Tool cursor preview
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private viewport: ViewportState;
  private cellSize: number;
  private dpr: number;
  private _grid: PatternGrid | null = null;
  private _options: RenderOptions;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('CanvasRenderer: unable to get 2D context');
    this.ctx = ctx;

    this.dpr = window.devicePixelRatio ?? 1;
    this.cellSize = BASE_CELL_SIZE;

    this.viewport = { offsetX: 0, offsetY: 0, zoom: 1 };
    this._options = { ...DEFAULT_RENDER_OPTIONS };

    // Apply HiDPI scaling
    this.applyDPR();
  }

  // ---- Private helpers ----------------------------------------------------

  private applyDPR(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /** The effective pixel size of a cell after zoom. */
  private effectiveCellSize(): number {
    return this.cellSize * this.viewport.zoom;
  }

  // ---- Rendering ----------------------------------------------------------

  /**
   * Render the entire grid to the canvas.
   *
   * Only cells within the visible viewport are drawn for performance.
   */
  render(grid: PatternGrid, options: Partial<RenderOptions> = {}): void {
    this._grid = grid;
    this._options = { ...DEFAULT_RENDER_OPTIONS, ...options };

    const { ctx } = this;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const ecs = this.effectiveCellSize();

    // Clear
    ctx.fillStyle = this._options.backgroundColor;
    ctx.fillRect(0, 0, w, h);

    // Calculate visible cell range
    const startCol = Math.max(0, Math.floor(-this.viewport.offsetX / ecs));
    const startRow = Math.max(0, Math.floor(-this.viewport.offsetY / ecs));
    const endCol = Math.min(grid.width - 1, Math.ceil((w - this.viewport.offsetX) / ecs));
    const endRow = Math.min(grid.height - 1, Math.ceil((h - this.viewport.offsetY) / ecs));

    // Draw empty cells
    ctx.fillStyle = this._options.emptyCellColor;
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = grid.getCell(row, col);
        if (cell === undefined) {
          const x = this.viewport.offsetX + col * ecs;
          const y = this.viewport.offsetY + row * ecs;
          ctx.fillRect(x, y, Math.ceil(ecs), Math.ceil(ecs));
        }
      }
    }

    // Draw populated cells
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = grid.getCell(row, col);
        if (cell !== undefined) {
          this.renderCell(cell);
        }
      }
    }

    // Draw grid lines
    if (this._options.showGridLines) {
      this.renderGridLines();
    }

    // Draw coordinates
    if (this._options.showCoordinates) {
      this.renderCoordinates();
    }
  }

  /** Render a single populated cell. */
  renderCell(cell: Cell): void {
    const { ctx } = this;
    const ecs = this.effectiveCellSize();
    const x = this.viewport.offsetX + cell.col * ecs;
    const y = this.viewport.offsetY + cell.row * ecs;

    // Fill color
    if (cell.color !== null) {
      ctx.fillStyle = cell.color;
      ctx.fillRect(x, y, Math.ceil(ecs), Math.ceil(ecs));
    }

    // Draw symbol
    if (cell.symbol !== null && this._options.showSymbols && ecs >= 10) {
      ctx.fillStyle = this.getContrastColor(cell.color);
      const fontSize = Math.max(8, ecs * 0.6);
      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell.symbol, x + ecs / 2, y + ecs / 2);
    }
  }

  /** Draw minor and major grid lines. */
  renderGridLines(): void {
    if (!this._grid) return;

    const { ctx } = this;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const ecs = this.effectiveCellSize();
    const grid = this._grid;

    const startCol = Math.max(0, Math.floor(-this.viewport.offsetX / ecs));
    const startRow = Math.max(0, Math.floor(-this.viewport.offsetY / ecs));
    const endCol = Math.min(grid.width, Math.ceil((w - this.viewport.offsetX) / ecs));
    const endRow = Math.min(grid.height, Math.ceil((h - this.viewport.offsetY) / ecs));

    // Minor grid lines
    ctx.strokeStyle = this._options.gridLineColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    // Vertical lines
    for (let col = startCol; col <= endCol; col++) {
      if (col % this._options.majorGridInterval === 0) continue; // Draw major separately
      const x = Math.round(this.viewport.offsetX + col * ecs) + 0.5;
      ctx.moveTo(x, Math.max(0, this.viewport.offsetY));
      ctx.lineTo(x, Math.min(h, this.viewport.offsetY + grid.height * ecs));
    }

    // Horizontal lines
    for (let row = startRow; row <= endRow; row++) {
      if (row % this._options.majorGridInterval === 0) continue;
      const y = Math.round(this.viewport.offsetY + row * ecs) + 0.5;
      ctx.moveTo(Math.max(0, this.viewport.offsetX), y);
      ctx.lineTo(Math.min(w, this.viewport.offsetX + grid.width * ecs), y);
    }

    ctx.stroke();

    // Major grid lines
    ctx.strokeStyle = this._options.majorGridLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Vertical major lines
    for (let col = startCol; col <= endCol; col++) {
      if (col % this._options.majorGridInterval !== 0) continue;
      const x = Math.round(this.viewport.offsetX + col * ecs) + 0.5;
      ctx.moveTo(x, Math.max(0, this.viewport.offsetY));
      ctx.lineTo(x, Math.min(h, this.viewport.offsetY + grid.height * ecs));
    }

    // Horizontal major lines
    for (let row = startRow; row <= endRow; row++) {
      if (row % this._options.majorGridInterval !== 0) continue;
      const y = Math.round(this.viewport.offsetY + row * ecs) + 0.5;
      ctx.moveTo(Math.max(0, this.viewport.offsetX), y);
      ctx.lineTo(Math.min(w, this.viewport.offsetX + grid.width * ecs), y);
    }

    ctx.stroke();
  }

  /** Draw row/column coordinate labels. */
  renderCoordinates(): void {
    if (!this._grid) return;

    const { ctx } = this;
    const ecs = this.effectiveCellSize();

    // Only draw coordinates when zoomed in enough
    if (ecs < 14) return;

    ctx.fillStyle = this._options.coordinateColor;
    const fontSize = Math.max(8, Math.min(11, ecs * 0.45));
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = 'top';

    const grid = this._grid;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    const startCol = Math.max(0, Math.floor(-this.viewport.offsetX / ecs));
    const startRow = Math.max(0, Math.floor(-this.viewport.offsetY / ecs));
    const endCol = Math.min(grid.width - 1, Math.ceil((w - this.viewport.offsetX) / ecs));
    const endRow = Math.min(grid.height - 1, Math.ceil((h - this.viewport.offsetY) / ecs));

    // Column labels along the top
    ctx.textAlign = 'center';
    for (let col = startCol; col <= endCol; col++) {
      // Only label every Nth column when zoomed out
      if (ecs < 28 && col % 5 !== 0) continue;
      if (ecs < 20 && col % 10 !== 0) continue;
      const x = this.viewport.offsetX + col * ecs + ecs / 2;
      const y = this.viewport.offsetY - fontSize - 2;
      if (y < -fontSize) continue;
      ctx.fillText(String(col), x, y);
    }

    // Row labels along the left
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let row = startRow; row <= endRow; row++) {
      if (ecs < 28 && row % 5 !== 0) continue;
      if (ecs < 20 && row % 10 !== 0) continue;
      const x = this.viewport.offsetX - 4;
      const y = this.viewport.offsetY + row * ecs + ecs / 2;
      if (x < -30) continue;
      ctx.fillText(String(row), x, y);
    }
  }

  /** Draw a selection rectangle overlay. */
  renderSelection(selection: Selection): void {
    const { ctx } = this;
    const ecs = this.effectiveCellSize();

    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);

    const x = this.viewport.offsetX + minCol * ecs;
    const y = this.viewport.offsetY + minRow * ecs;
    const w = (maxCol - minCol + 1) * ecs;
    const h = (maxRow - minRow + 1) * ecs;

    // Semi-transparent fill
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.fillRect(x, y, w, h);

    // Border
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  /** Draw a cursor preview for the current tool at the given grid position. */
  renderToolCursor(pos: GridPosition, tool: string): void {
    const { ctx } = this;
    const ecs = this.effectiveCellSize();

    const x = this.viewport.offsetX + pos.col * ecs;
    const y = this.viewport.offsetY + pos.row * ecs;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;

    switch (tool) {
      case 'pencil':
      case 'brush': {
        ctx.strokeRect(x + 1, y + 1, ecs - 2, ecs - 2);
        break;
      }
      case 'eraser': {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        void ecs;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + ecs - 4, y + ecs - 4);
        ctx.moveTo(x + ecs - 4, y + 4);
        ctx.lineTo(x + 4, y + ecs - 4);
        ctx.stroke();
        break;
      }
      case 'fill': {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, y, ecs, ecs);
        break;
      }
      case 'selection': {
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x + 1, y + 1, ecs - 2, ecs - 2);
        ctx.setLineDash([]);
        break;
      }
      default: {
        ctx.strokeRect(x + 1, y + 1, ecs - 2, ecs - 2);
      }
    }
  }

  // ---- Viewport -----------------------------------------------------------

  /** Set the zoom level. Clamped to [0.1, 10]. */
  setZoom(zoom: number): void {
    this.viewport.zoom = Math.max(0.1, Math.min(10, zoom));
  }

  /** Set the viewport offset (pan position) in CSS pixels. */
  setOffset(x: number, y: number): void {
    this.viewport.offsetX = x;
    this.viewport.offsetY = y;
  }

  /** Return the current viewport state. */
  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  /**
   * Adjust zoom and offset so the entire grid fits within the canvas.
   *
   * Adds a small margin (2 * cellSize) on each side.
   */
  fitToView(gridWidth: number, gridHeight: number): void {
    const canvasW = this.canvas.clientWidth;
    const canvasH = this.canvas.clientHeight;

    const margin = 40; // pixels of padding
    const availW = canvasW - margin * 2;
    const availH = canvasH - margin * 2;

    const zoomX = availW / (gridWidth * this.cellSize);
    const zoomY = availH / (gridHeight * this.cellSize);
    const zoom = Math.min(zoomX, zoomY, 5); // Cap at 5x

    this.viewport.zoom = Math.max(0.1, zoom);

    const ecs = this.effectiveCellSize();
    const gridPixelW = gridWidth * ecs;
    const gridPixelH = gridHeight * ecs;

    this.viewport.offsetX = (canvasW - gridPixelW) / 2;
    this.viewport.offsetY = (canvasH - gridPixelH) / 2;
  }

  // ---- Coordinate conversion ----------------------------------------------

  /** Convert screen coordinates to grid position. Returns null if outside the grid. */
  screenToGrid(screenX: number, screenY: number): GridPosition | null {
    const ecs = this.effectiveCellSize();
    const col = Math.floor((screenX - this.viewport.offsetX) / ecs);
    const row = Math.floor((screenY - this.viewport.offsetY) / ecs);

    if (row < 0 || col < 0) return null;
    if (this._grid && (row >= this._grid.height || col >= this._grid.width)) return null;

    return { row, col };
  }

  /** Convert grid position to screen coordinates (top-left of the cell). */
  gridToScreen(row: number, col: number): { x: number; y: number } {
    const ecs = this.effectiveCellSize();
    return {
      x: this.viewport.offsetX + col * ecs,
      y: this.viewport.offsetY + row * ecs,
    };
  }

  // ---- Hit testing --------------------------------------------------------

  /** Return the grid cell at the given screen point, or null if no valid cell. */
  getCellAtPoint(screenX: number, screenY: number): GridPosition | null {
    return this.screenToGrid(screenX, screenY);
  }

  // ---- Lifecycle ----------------------------------------------------------

  /** Clean up resources (remove event listeners, etc.). */
  destroy(): void {
    // Currently nothing to clean up, but reserved for future use
    // (e.g., ResizeObserver removal)
  }

  /** Handle canvas resize (e.g., when the container changes size). */
  resize(width: number, height: number): void {
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.applyDPR();
  }

  // ---- Internal -----------------------------------------------------------

  /** Return a contrasting text color (black or white) for the given background. */
  private getContrastColor(bgColor: string | null): string {
    if (bgColor === null) return '#000000';

    // Simple heuristic: parse OKLCH lightness
    const match = bgColor.match(/oklch\(\s*([\d.]+)/);
    if (match) {
      const l = Number.parseFloat(match[1]!);
      return l > 0.6 ? '#000000' : '#ffffff';
    }

    // Fallback: parse hex
    if (bgColor.startsWith('#')) {
      const hex = bgColor.slice(1);
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    return '#000000';
  }
}
