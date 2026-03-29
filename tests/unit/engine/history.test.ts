import { describe, it, expect } from "vitest";
import { HistoryManager, ApplyCellsCommand } from "@/engine/history/history";
import { PatternGrid } from "@/engine/grid/grid";

describe("HistoryManager", () => {
  it("starts with empty stacks", () => {
    const history = new HistoryManager();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("executes and tracks commands", () => {
    const grid = new PatternGrid(10, 10);
    const history = new HistoryManager();
    const cmd = new ApplyCellsCommand("paint", [
      { row: 0, col: 0, before: null, after: { color: "#ff0000" } },
    ]);
    history.execute(cmd, grid);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it("undoes and redoes commands", () => {
    const grid = new PatternGrid(10, 10);
    const history = new HistoryManager();
    const cmd = new ApplyCellsCommand("paint", [
      { row: 0, col: 0, before: null, after: { color: "#ff0000" } },
    ]);

    history.execute(cmd, grid);
    expect(grid.getCell(0, 0)?.color).toBe("#ff0000");

    history.undo(grid);
    expect(grid.getCell(0, 0)).toBeUndefined();
    expect(history.canRedo()).toBe(true);

    history.redo(grid);
    expect(grid.getCell(0, 0)?.color).toBe("#ff0000");
  });

  it("respects max size", () => {
    const grid = new PatternGrid(10, 10);
    const history = new HistoryManager(3);

    for (let i = 0; i < 5; i++) {
      const cmd = new ApplyCellsCommand(`paint ${i}`, [
        { row: i, col: 0, before: null, after: { color: `#${i}` } },
      ]);
      history.execute(cmd, grid);
    }

    // Can only undo 3 (max size)
    for (let i = 0; i < 3; i++) {
      expect(history.undo(grid)).toBeDefined();
    }
    expect(history.canUndo()).toBe(false);
  });

  it("clears redo stack on new command", () => {
    const grid = new PatternGrid(10, 10);
    const history = new HistoryManager();

    const cmd1 = new ApplyCellsCommand("paint 1", [
      { row: 0, col: 0, before: null, after: { color: "#ff0000" } },
    ]);
    const cmd2 = new ApplyCellsCommand("paint 2", [
      { row: 1, col: 0, before: null, after: { color: "#00ff00" } },
    ]);

    history.execute(cmd1, grid);
    history.execute(cmd2, grid);
    history.undo(grid);
    expect(history.canRedo()).toBe(true);

    // New command clears redo stack
    const cmd3 = new ApplyCellsCommand("paint 3", [
      { row: 2, col: 0, before: null, after: { color: "#0000ff" } },
    ]);
    history.execute(cmd3, grid);
    expect(history.canRedo()).toBe(false);
  });

  it("clears all history", () => {
    const history = new HistoryManager();
    history.execute(new ApplyCellsCommand("paint", []));
    history.execute(new ApplyCellsCommand("paint", []));
    expect(history.canUndo()).toBe(true);
    history.clear();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });
});

describe("ApplyCellsCommand", () => {
  it("executes cell changes", () => {
    const grid = new PatternGrid(10, 10);
    const cmd = new ApplyCellsCommand("paint", [
      { row: 0, col: 0, before: null, after: { color: "#ff0000", symbol: "X" } },
    ]);
    cmd.execute(grid);
    expect(grid.getCell(0, 0)?.color).toBe("#ff0000");
    expect(grid.getCell(0, 0)?.symbol).toBe("X");
  });

  it("undoes cell changes", () => {
    const grid = new PatternGrid(10, 10);
    const cmd = new ApplyCellsCommand("paint", [
      { row: 0, col: 0, before: null, after: { color: "#ff0000" } },
      { row: 1, col: 0, before: { color: "#00ff00" }, after: { color: "#0000ff" } },
    ]);

    // Set up initial state for second cell
    grid.setCell(1, 0, { color: "#00ff00" });

    cmd.execute(grid);
    expect(grid.getCell(0, 0)?.color).toBe("#ff0000");
    expect(grid.getCell(1, 0)?.color).toBe("#0000ff");

    cmd.undo(grid);
    expect(grid.getCell(0, 0)).toBeUndefined(); // was null before
    expect(grid.getCell(1, 0)?.color).toBe("#00ff00"); // restored
  });
});
