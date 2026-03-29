/**
 * Sparse grid data structure for pattern cells.
 *
 * Uses a Map with "row,col" string keys for memory-efficient storage.
 * Only populated cells occupy memory; empty cells are implicit.
 *
 * @module grid
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The kind of stitch a cell represents. */
export type StitchType =
  | 'full'
  | 'half'
  | 'quarter'
  | 'backstitch'
  | 'french-knot'
  | 'purl'
  | 'knit'
  | 'yarn-over'
  | 'increase'
  | 'decrease';

/** A single cell in the pattern grid. */
export interface Cell {
  row: number;
  col: number;
  color: string | null; // OKLCH color string or null (empty)
  symbol: string | null; // Unicode symbol or null
  stitchType: StitchType;
  completed: boolean; // For progress tracking
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

function parseKey(key: string): { row: number; col: number } {
  const idx = key.indexOf(',');
  return { row: Number.parseInt(key.slice(0, idx), 10), col: Number.parseInt(key.slice(idx + 1), 10) };
}

function makeCell(row: number, col: number, data: Partial<Cell> = {}): Cell {
  return {
    row,
    col,
    color: data.color ?? null,
    symbol: data.symbol ?? null,
    stitchType: data.stitchType ?? 'full',
    completed: data.completed ?? false,
  };
}

// ---------------------------------------------------------------------------
// PatternGrid
// ---------------------------------------------------------------------------

/**
 * Sparse grid that stores only populated cells in a `Map<string, Cell>`.
 *
 * Empty cells (no color, no symbol) are not stored and are implicitly
 * represented by `undefined` when accessed via `getCell`.
 */
export class PatternGrid {
  private cells: Map<string, Cell>;
  private _width: number;
  private _height: number;

  constructor(width: number, height: number) {
    this._width = Math.max(1, Math.floor(width));
    this._height = Math.max(1, Math.floor(height));
    this.cells = new Map();
  }

  // ---- Properties ---------------------------------------------------------

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  // ---- Cell access --------------------------------------------------------

  /** Return the cell at `(row, col)` or `undefined` when empty. */
  getCell(row: number, col: number): Cell | undefined {
    return this.cells.get(cellKey(row, col));
  }

  /**
   * Update the cell at `(row, col)`.
   *
   * If the resulting cell has no color **and** no symbol it is considered
   * empty and is removed from the map to keep the sparse representation.
   */
  setCell(row: number, col: number, data: Partial<Cell>): void {
    const key = cellKey(row, col);
    const existing = this.cells.get(key);
    const updated = makeCell(row, col, { ...existing, ...data });

    // Remove cells that are effectively empty
    if (updated.color === null && updated.symbol === null) {
      this.cells.delete(key);
      return;
    }

    this.cells.set(key, updated);
  }

  /** Remove the cell at `(row, col)`. No-op if cell does not exist. */
  clearCell(row: number, col: number): void {
    this.cells.delete(cellKey(row, col));
  }

  /** Check whether a populated cell exists at `(row, col)`. */
  hasCell(row: number, col: number): boolean {
    return this.cells.has(cellKey(row, col));
  }

  // ---- Bulk operations ----------------------------------------------------

  /** Remove all cells from the grid. Dimensions are unchanged. */
  clearAll(): void {
    this.cells.clear();
  }

  /** Remove every cell inside the given rectangular area (inclusive). */
  clearArea(row: number, col: number, width: number, height: number): void {
    const endRow = Math.min(row + height - 1, this._height - 1);
    const endCol = Math.min(col + width - 1, this._width - 1);

    for (let r = Math.max(0, row); r <= endRow; r++) {
      for (let c = Math.max(0, col); c <= endCol; c++) {
        this.cells.delete(cellKey(r, c));
      }
    }
  }

  /** Set data for every cell in the given rectangular area (inclusive). */
  fillArea(row: number, col: number, width: number, height: number, data: Partial<Cell>): void {
    const endRow = Math.min(row + height - 1, this._height - 1);
    const endCol = Math.min(col + width - 1, this._width - 1);

    for (let r = Math.max(0, row); r <= endRow; r++) {
      for (let c = Math.max(0, col); c <= endCol; c++) {
        this.setCell(r, c, data);
      }
    }
  }

  // ---- Selection ----------------------------------------------------------

  /** Return an array of populated cells inside the given area (inclusive). */
  getCellsInArea(row: number, col: number, width: number, height: number): Cell[] {
    const result: Cell[] = [];
    const endRow = Math.min(row + height - 1, this._height - 1);
    const endCol = Math.min(col + width - 1, this._width - 1);

    for (let r = Math.max(0, row); r <= endRow; r++) {
      for (let c = Math.max(0, col); c <= endCol; c++) {
        const cell = this.cells.get(cellKey(r, c));
        if (cell) result.push(cell);
      }
    }

    return result;
  }

  // ---- Grid operations ----------------------------------------------------

  /**
   * Resize the grid.
   *
   * Cells that fall outside the new dimensions are removed.
   * Cells that remain keep their data.
   */
  resize(newWidth: number, newHeight: number): void {
    this._width = Math.max(1, Math.floor(newWidth));
    this._height = Math.max(1, Math.floor(newHeight));

    // Remove out-of-bounds cells
    for (const key of this.cells.keys()) {
      const { row, col } = parseKey(key);
      if (row >= this._height || col >= this._width) {
        this.cells.delete(key);
      }
    }
  }

  /** Mirror the grid horizontally (left-right) in-place. */
  mirrorHorizontal(): void {
    const snapshot = new Map(this.cells);

    this.cells.clear();

    for (const cell of snapshot.values()) {
      const newCol = this._width - 1 - cell.col;
      this.cells.set(cellKey(cell.row, newCol), {
        ...cell,
        col: newCol,
      });
    }
  }

  /** Mirror the grid vertically (top-bottom) in-place. */
  mirrorVertical(): void {
    const snapshot = new Map(this.cells);

    this.cells.clear();

    for (const cell of snapshot.values()) {
      const newRow = this._height - 1 - cell.row;
      this.cells.set(cellKey(newRow, cell.col), {
        ...cell,
        row: newRow,
      });
    }
  }

  // ---- Iteration ----------------------------------------------------------

  /** Iterate over every populated cell. */
  forEach(callback: (cell: Cell) => void): void {
    for (const cell of this.cells.values()) {
      callback(cell);
    }
  }

  /** Return a `Set` of unique OKLCH color strings used in the grid. */
  getUsedColors(): Set<string> {
    const colors = new Set<string>();
    for (const cell of this.cells.values()) {
      if (cell.color !== null) {
        colors.add(cell.color);
      }
    }
    return colors;
  }

  /** Return the number of populated cells. */
  getCellCount(): number {
    return this.cells.size;
  }

  // ---- Serialization ------------------------------------------------------

  /** Serialize to a plain JSON-compatible object. */
  toJSON(): object {
    const cellsArray: Array<Partial<Cell>> = [];
    for (const cell of this.cells.values()) {
      cellsArray.push({ ...cell });
    }

    return {
      width: this._width,
      height: this._height,
      cells: cellsArray,
    };
  }

  /** Deserialize from a plain object produced by `toJSON`. */
  static fromJSON(data: object): PatternGrid {
    const d = data as { width: number; height: number; cells?: Array<Partial<Cell>> };
    const grid = new PatternGrid(d.width ?? 1, d.height ?? 1);

    if (Array.isArray(d.cells)) {
      for (const raw of d.cells) {
        if (raw.row !== undefined && raw.col !== undefined) {
          grid.setCell(raw.row, raw.col, raw);
        }
      }
    }

    return grid;
  }
}
