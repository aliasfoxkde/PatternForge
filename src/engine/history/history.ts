/**
 * Undo/redo system using the Command pattern.
 *
 * Commands are stored in an undo stack and, when undone, moved to a redo stack.
 * The `HistoryManager` is generic over any `Command` implementation.
 *
 * @module history
 */

import type { Cell, PatternGrid } from '@/engine/grid/grid';
import type { PatternPalette } from '@/engine/pattern/types';

// ---------------------------------------------------------------------------
// Command interface
// ---------------------------------------------------------------------------

/** A reversible operation that can be applied to a `PatternGrid`. */
export interface Command {
  readonly id: string;
  readonly description: string;
  execute(grid: PatternGrid): void;
  undo(grid: PatternGrid): void;
}

// ---------------------------------------------------------------------------
// Built-in commands
// ---------------------------------------------------------------------------

/**
 * Command that records before/after snapshots of individual cells.
 *
 * On `execute`, the "after" state is applied. On `undo`, the "before" state
 * is restored. Cells that did not exist before are removed on undo.
 */
export class ApplyCellsCommand implements Command {
  readonly id: string;
  readonly description: string;
  private readonly changes: Array<{
    row: number;
    col: number;
    before: Partial<Cell> | null; // null means cell did not exist
    after: Partial<Cell> | null; // null means cell should be removed
  }>;

  constructor(
    description: string,
    cells: Array<{ row: number; col: number; before: Partial<Cell> | null; after: Partial<Cell> | null }>,
  ) {
    this.id = crypto.randomUUID();
    this.description = description;
    this.changes = cells;
  }

  execute(grid: PatternGrid): void {
    for (const change of this.changes) {
      if (change.after === null) {
        grid.clearCell(change.row, change.col);
      } else {
        grid.setCell(change.row, change.col, change.after);
      }
    }
  }

  undo(grid: PatternGrid): void {
    for (const change of this.changes) {
      if (change.before === null) {
        grid.clearCell(change.row, change.col);
      } else {
        grid.setCell(change.row, change.col, change.before);
      }
    }
  }
}

/**
 * Command that resizes the grid, preserving all cells that still fit within
 * the new dimensions.
 */
export class ResizeGridCommand implements Command {
  readonly id: string;
  readonly description: string;
  private readonly oldWidth: number;
  private readonly oldHeight: number;
  private readonly newWidth: number;
  private readonly newHeight: number;
  private readonly savedCells: Array<{ row: number; col: number; data: Partial<Cell> }>;

  constructor(
    oldWidth: number,
    oldHeight: number,
    newWidth: number,
    newHeight: number,
    savedCells: Array<{ row: number; col: number; data: Partial<Cell> }>,
  ) {
    this.id = crypto.randomUUID();
    this.description = `Resize grid from ${oldWidth}x${oldHeight} to ${newWidth}x${newHeight}`;
    this.oldWidth = oldWidth;
    this.oldHeight = oldHeight;
    this.newWidth = newWidth;
    this.newHeight = newHeight;
    this.savedCells = savedCells;
  }

  execute(grid: PatternGrid): void {
    grid.resize(this.newWidth, this.newHeight);
    // Re-apply saved cells that still fit
    for (const entry of this.savedCells) {
      if (entry.row < this.newHeight && entry.col < this.newWidth) {
        grid.setCell(entry.row, entry.col, entry.data);
      }
    }
  }

  undo(grid: PatternGrid): void {
    grid.resize(this.oldWidth, this.oldHeight);
    // Re-apply saved cells that fit in the old dimensions
    for (const entry of this.savedCells) {
      if (entry.row < this.oldHeight && entry.col < this.oldWidth) {
        grid.setCell(entry.row, entry.col, entry.data);
      }
    }
  }
}

/**
 * Command that clears all cells from the grid.
 *
 * On `execute`, all cells are saved and cleared. On `undo`, the saved cells
 * are restored.
 */
export class ClearGridCommand implements Command {
  readonly id: string;
  readonly description: string;
  private readonly savedCells: Array<{ row: number; col: number; data: Partial<Cell> }>;

  constructor(savedCells: Array<{ row: number; col: number; data: Partial<Cell> }>) {
    this.id = crypto.randomUUID();
    this.description = `Clear grid (${savedCells.length} cells)`;
    this.savedCells = savedCells;
  }

  execute(grid: PatternGrid): void {
    grid.clearAll();
  }

  undo(grid: PatternGrid): void {
    for (const entry of this.savedCells) {
      grid.setCell(entry.row, entry.col, entry.data);
    }
  }
}

/**
 * Command that replaces the entire color palette.
 *
 * On `execute`, the new palette is stored on the PatternGrid's parent pattern.
 * On `undo`, the old palette is restored.
 *
 * Note: This command operates on the palette reference, not the grid itself.
 * The `execute` and `undo` methods are no-ops on the grid — the actual
 * palette swap is handled by the history manager's caller.
 */
export class SetPaletteCommand implements Command {
  readonly id: string;
  readonly description: string;
  readonly oldPalette: PatternPalette;
  readonly newPalette: PatternPalette;

  constructor(oldPalette: PatternPalette, newPalette: PatternPalette) {
    this.id = crypto.randomUUID();
    this.description = `Set palette (${newPalette.colors.length} colors)`;
    this.oldPalette = oldPalette;
    this.newPalette = newPalette;
  }

  execute(_grid: PatternGrid): void {
    // Palette is applied via store callback, not grid mutation
  }

  undo(_grid: PatternGrid): void {
    // Palette is restored via store callback, not grid mutation
  }
}

// ---------------------------------------------------------------------------
// HistoryManager
// ---------------------------------------------------------------------------

/**
 * Manages an undo/redo stack of `Command` objects.
 *
 * When a command is executed via `execute()`, it is pushed onto the undo stack
 * and the redo stack is cleared. `undo()` pops from the undo stack, calls
 * `command.undo()`, and pushes onto the redo stack. `redo()` does the inverse.
 */
export class HistoryManager {
  private undoStack: Command[];
  private redoStack: Command[];
  private maxSize: number;

  constructor(maxSize = 200) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = Math.max(1, maxSize);
  }

  /**
   * Execute a command and push it onto the undo stack.
   *
   * The command's `execute` method is called on the provided grid.
   * The redo stack is cleared.
   */
  execute(command: Command, grid: PatternGrid): void {
    command.execute(grid);
    this.undoStack.push(command);
    this.redoStack = [];

    // Trim oldest commands if we exceed maxSize
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.splice(0, this.undoStack.length - this.maxSize);
    }
  }

  /**
   * Undo the most recent command.
   *
   * Returns the undone command, or `undefined` if nothing to undo.
   */
  undo(grid: PatternGrid): Command | undefined {
    const command = this.undoStack.pop();
    if (!command) return undefined;
    command.undo(grid);
    this.redoStack.push(command);
    return command;
  }

  /**
   * Redo the most recently undone command.
   *
   * Returns the redone command, or `undefined` if nothing to redo.
   */
  redo(grid: PatternGrid): Command | undefined {
    const command = this.redoStack.pop();
    if (!command) return undefined;
    command.execute(grid);
    this.undoStack.push(command);
    return command;
  }

  /** Whether there are commands on the undo stack. */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** Whether there are commands on the redo stack. */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Clear both undo and redo stacks. */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  // ---- Serialization ------------------------------------------------------

  /** Serialize the history to a JSON-compatible object. */
  toJSON(): object {
    return {
      maxSize: this.maxSize,
      undoStack: this.undoStack.map((cmd) => ({
        id: cmd.id,
        description: cmd.description,
      })),
      redoStack: this.redoStack.map((cmd) => ({
        id: cmd.id,
        description: cmd.description,
      })),
    };
  }

  /**
   * Deserialize history metadata.
   *
   * Note: Full command deserialization is not possible because command
   * closures cannot be serialized. This method creates an empty
   * `HistoryManager` with the recorded metadata for display purposes.
   */
  static fromJSON(_data: object): HistoryManager {
    // Commands store closures that cannot be serialized.
    // This method exists for API compatibility but returns an empty manager.
    const d = _data as { maxSize?: number };
    return new HistoryManager(d.maxSize);
  }

}
