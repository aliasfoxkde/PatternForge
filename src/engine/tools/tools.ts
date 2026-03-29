/**
 * Drawing tools for the pattern editor.
 *
 * Each tool is a pure function that computes which cells to change.
 * The caller is responsible for applying the result to the grid.
 *
 * @module tools
 */

import type { Cell, PatternGrid } from '@/engine/grid/grid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolType =
  | 'pencil'
  | 'brush'
  | 'eraser'
  | 'fill'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'color-picker'
  | 'text'
  | 'selection'
  | 'pan';

export interface ToolOptions {
  brushSize: number;
  brushShape: 'round' | 'square';
  fillTolerance: number;
  shapeFilled: boolean;
  mirrorHorizontal: boolean;
  mirrorVertical: boolean;
}

export interface ToolResult {
  cells: Array<{ row: number; col: number; data: Partial<Cell> }>;
  selection?: { startRow: number; startCol: number; endRow: number; endCol: number };
}

export interface GridPosition {
  row: number;
  col: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Bresenham's line algorithm – yields every cell along the line from start to end. */
function bresenhamLine(start: GridPosition, end: GridPosition): GridPosition[] {
  const points: GridPosition[] = [];

  let x0 = start.col;
  let y0 = start.row;
  const x1 = end.col;
  const y1 = end.row;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    points.push({ row: y0, col: x0 });

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return points;
}

/** Midpoint ellipse algorithm – yields every cell on the ellipse boundary (or filled). */
function midpointEllipse(start: GridPosition, end: GridPosition, filled: boolean): GridPosition[] {
  const cx = Math.round((start.col + end.col) / 2);
  const cy = Math.round((start.row + end.row) / 2);
  const rx = Math.abs(end.col - start.col) / 2;
  const ry = Math.abs(end.row - start.row) / 2;

  if (rx < 1 || ry < 1) {
    // Degenerate case – just a point
    return [{ row: cy, col: cx }];
  }

  const rxi = Math.round(rx);
  const ryi = Math.round(ry);

  if (filled) {
    // For filled ellipse, iterate bounding box and test point-in-ellipse
    const points: GridPosition[] = [];
    for (let row = cy - ryi; row <= cy + ryi; row++) {
      for (let col = cx - rxi; col <= cx + rxi; col++) {
        const nx = (col - cx) / rxi;
        const ny = (row - cy) / ryi;
        if (nx * nx + ny * ny <= 1.0) {
          points.push({ row, col });
        }
      }
    }
    return points;
  }

  // Outline only – plot symmetric points using the midpoint algorithm
  const pointsSet = new Set<string>();

  function addPoint(row: number, col: number) {
    pointsSet.add(`${row},${col}`);
  }

  let x = 0;
  let y = ryi;
  let d1 = ryi * ryi - rxi * rxi * ryi + 0.25 * rxi * rxi;

  // Region 1
  while (2 * ryi * ryi * x <= 2 * rxi * rxi * y) {
    addPoint(cy + y, cx + x);
    addPoint(cy - y, cx + x);
    addPoint(cy + y, cx - x);
    addPoint(cy - y, cx - x);
    x++;

    if (d1 < 0) {
      d1 += 2 * ryi * ryi * x + ryi * ryi;
    } else {
      y--;
      d1 += 2 * ryi * ryi * x - 2 * rxi * rxi * y + ryi * ryi;
    }
  }

  // Region 2
  let d2 = ryi * ryi * (x + 0.5) * (x + 0.5) + rxi * rxi * (y - 1) * (y - 1) - rxi * rxi * ryi * ryi;

  while (y >= 0) {
    addPoint(cy + y, cx + x);
    addPoint(cy - y, cx + x);
    addPoint(cy + y, cx - x);
    addPoint(cy - y, cx - x);
    y--;

    if (d2 > 0) {
      d2 += rxi * rxi - 2 * rxi * rxi * y;
    } else {
      x++;
      d2 += 2 * ryi * ryi * x - 2 * rxi * rxi * y + rxi * rxi;
    }
  }

  return Array.from(pointsSet).map((key) => {
    const idx = key.indexOf(',');
    return { row: Number.parseInt(key.slice(0, idx), 10), col: Number.parseInt(key.slice(idx + 1), 10) };
  });
}

/** Return all cells within `size` of `(row, col)` using the given brush shape. */
function brushCells(row: number, col: number, size: number, shape: 'round' | 'square'): GridPosition[] {
  const cells: GridPosition[] = [];
  const half = Math.floor(size / 2);

  for (let dr = -half; dr <= half; dr++) {
    for (let dc = -half; dc <= half; dc++) {
      if (shape === 'round') {
        const dist = Math.sqrt(dr * dr + dc * dc);
        if (dist > half + 0.5) continue;
      }
      cells.push({ row: row + dr, col: col + dc });
    }
  }

  return cells;
}

// ---------------------------------------------------------------------------
// DrawingTools
// ---------------------------------------------------------------------------

/**
 * Static collection of drawing tool implementations.
 *
 * Every method is a pure function that returns a `ToolResult` describing which
 * cells to modify.  The caller is responsible for applying changes to the grid
 * (and to the undo/redo history).
 */
export class DrawingTools {
  // -----------------------------------------------------------------------
  // Pencil – set a single cell
  // -----------------------------------------------------------------------

  /** Set the cell at `pos` to the given color and symbol. */
  static pencil(_grid: PatternGrid, pos: GridPosition, color: string, symbol: string | null): ToolResult {
    return {
      cells: [{ row: pos.row, col: pos.col, data: { color, symbol } }],
    };
  }

  // -----------------------------------------------------------------------
  // Brush – set a block of cells around pos
  // -----------------------------------------------------------------------

  /** Set cells around `pos` according to brush `size` and `shape`. */
  static brush(
    _grid: PatternGrid,
    pos: GridPosition,
    color: string,
    symbol: string | null,
    size: number,
    shape: 'round' | 'square',
  ): ToolResult {
    const positions = brushCells(pos.row, pos.col, size, shape);
    return {
      cells: positions.map((p) => ({ row: p.row, col: p.col, data: { color, symbol } })),
    };
  }

  // -----------------------------------------------------------------------
  // Eraser – clear cells
  // -----------------------------------------------------------------------

  /** Clear cells around `pos` within the given `size`. */
  static eraser(_grid: PatternGrid, pos: GridPosition, size: number): ToolResult {
    const positions = brushCells(pos.row, pos.col, size, 'square');
    return {
      cells: positions.map((p) => ({
        row: p.row,
        col: p.col,
        data: { color: null, symbol: null, stitchType: 'full' as const, completed: false },
      })),
    };
  }

  // -----------------------------------------------------------------------
  // Fill – flood fill (BFS)
  // -----------------------------------------------------------------------

  /**
   * Flood fill from `pos` using BFS.
   *
   * Cells are filled when their color matches the color of the starting cell
   * (within the given OKLCH `tolerance`).
   */
  static fill(
    grid: PatternGrid,
    pos: GridPosition,
    color: string,
    symbol: string | null,
    tolerance: number,
  ): ToolResult {
    const startCell = grid.getCell(pos.row, pos.col);
    const targetColor = startCell?.color ?? null;

    // If target color is the same as fill color, nothing to do
    if (targetColor === color) return { cells: [] };

    const visited = new Set<string>();
    const queue: GridPosition[] = [pos];
    visited.add(`${pos.row},${pos.col}`);

    const result: Array<{ row: number; col: number; data: Partial<Cell> }> = [];

    while (queue.length > 0) {
      const current = queue.shift()!;

      result.push({ row: current.row, col: current.col, data: { color, symbol } });

      // Explore 4-connected neighbors
      const neighbors: GridPosition[] = [
        { row: current.row - 1, col: current.col },
        { row: current.row + 1, col: current.col },
        { row: current.row, col: current.col - 1 },
        { row: current.row, col: current.col + 1 },
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.row},${neighbor.col}`;

        // Bounds check
        if (neighbor.row < 0 || neighbor.row >= grid.height || neighbor.col < 0 || neighbor.col >= grid.width) {
          continue;
        }

        if (visited.has(key)) continue;

        visited.add(key);

        // Check if neighbor color matches target
        const neighborCell = grid.getCell(neighbor.row, neighbor.col);
        const neighborColor = neighborCell?.color ?? null;

        // Null matches null
        if (targetColor === null && neighborColor === null) {
          queue.push(neighbor);
          continue;
        }

        // Both non-null – compare directly (simplified; tolerance ignored for null)
        if (targetColor !== null && neighborColor !== null && neighborColor === targetColor) {
          queue.push(neighbor);
          continue;
        }

        // Tolerance-based matching for non-null colors
        if (targetColor !== null && neighborColor !== null && tolerance > 0) {
          const dist = simpleOklchDistance(targetColor, neighborColor);
          if (dist <= tolerance) {
            queue.push(neighbor);
          }
        }
      }
    }

    return { cells: result };
  }

  // -----------------------------------------------------------------------
  // Line – Bresenham's
  // -----------------------------------------------------------------------

  /** Return cells along a line from `start` to `end` using Bresenham's algorithm. */
  static line(start: GridPosition, end: GridPosition, color: string, symbol: string | null): ToolResult {
    const points = bresenhamLine(start, end);
    return {
      cells: points.map((p) => ({ row: p.row, col: p.col, data: { color, symbol } })),
    };
  }

  // -----------------------------------------------------------------------
  // Rectangle
  // -----------------------------------------------------------------------

  /** Return cells forming a rectangle from `start` to `end`. Optionally filled. */
  static rectangle(
    start: GridPosition,
    end: GridPosition,
    color: string,
    symbol: string | null,
    filled: boolean,
  ): ToolResult {
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);

    if (filled) {
      const cells: Array<{ row: number; col: number; data: Partial<Cell> }> = [];
      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          cells.push({ row, col, data: { color, symbol } });
        }
      }
      return { cells };
    }

    // Outline only
    const cells: Array<{ row: number; col: number; data: Partial<Cell> }> = [];

    // Top and bottom edges
    for (let col = minCol; col <= maxCol; col++) {
      cells.push({ row: minRow, col, data: { color, symbol } });
      cells.push({ row: maxRow, col, data: { color, symbol } });
    }

    // Left and right edges (excluding corners already added)
    for (let row = minRow + 1; row < maxRow; row++) {
      cells.push({ row, col: minCol, data: { color, symbol } });
      cells.push({ row, col: maxCol, data: { color, symbol } });
    }

    return { cells };
  }

  // -----------------------------------------------------------------------
  // Ellipse – midpoint algorithm
  // -----------------------------------------------------------------------

  /** Return cells forming an ellipse from `start` to `end`. Optionally filled. */
  static ellipse(
    start: GridPosition,
    end: GridPosition,
    color: string,
    symbol: string | null,
    filled: boolean,
  ): ToolResult {
    const points = midpointEllipse(start, end, filled);
    return {
      cells: points.map((p) => ({ row: p.row, col: p.col, data: { color, symbol } })),
    };
  }

  // -----------------------------------------------------------------------
  // Mirror – reflect a tool result
  // -----------------------------------------------------------------------

  /**
   * Reflect a `ToolResult` across the horizontal and/or vertical center axis.
   *
   * `gridWidth` and `gridHeight` define the grid dimensions used to compute
   * the mirror positions.
   */
  static mirror(
    result: ToolResult,
    gridWidth: number,
    gridHeight: number,
    horizontal: boolean,
    vertical: boolean,
  ): ToolResult {
    if (!horizontal && !vertical) return result;

    const mirrored: typeof result.cells = [];

    for (const entry of result.cells) {
      let row = entry.row;
      let col = entry.col;

      if (horizontal) {
        col = gridWidth - 1 - col;
      }
      if (vertical) {
        row = gridHeight - 1 - row;
      }

      // Skip if mirrored position overlaps original (center cells)
      if (col === entry.col && row === entry.row) continue;

      mirrored.push({ row, col, data: { ...entry.data } });
    }

    return { ...result, cells: [...result.cells, ...mirrored] };
  }
}

// ---------------------------------------------------------------------------
// Simple OKLCH distance (Euclidean in L, C, h space)
// ---------------------------------------------------------------------------

/**
 * Parse an OKLCH string like `oklch(0.7 0.15 250)` and return `[L, C, h]`.
 */
function parseOklch(str: string): [number, number, number] {
  const match = str.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) return [0, 0, 0];
  return [Number.parseFloat(match[1]!), Number.parseFloat(match[2]!), Number.parseFloat(match[3]!)];
}

/**
 * Simple Euclidean distance between two OKLCH colors.
 *
 * Note: This is an approximation. A full CIEDE2000 implementation would be
 * more accurate but is not necessary for flood-fill tolerance comparison.
 */
function simpleOklchDistance(a: string, b: string): number {
  const [l1, c1, h1] = parseOklch(a);
  const [l2, c2, h2] = parseOklch(b);

  const dl = l1 - l2;
  const dc = c1 - c2;

  // Handle hue wraparound
  let dh = h1 - h2;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  return Math.sqrt(dl * dl + dc * dc + (dh / 360) * (dh / 360));
}
