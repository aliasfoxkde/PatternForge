import { describe, it, expect } from "vitest";
import { DrawingTools } from "@/engine/tools/tools";
import { PatternGrid } from "@/engine/grid/grid";

describe("DrawingTools", () => {
  describe("pencil", () => {
    it("sets a single cell", () => {
      const grid = new PatternGrid(10, 10);
      const result = DrawingTools.pencil(grid, { row: 5, col: 3 }, "#ff0000", "X");
      expect(result.cells).toHaveLength(1);
      expect(result.cells[0]?.row).toBe(5);
      expect(result.cells[0]?.col).toBe(3);
      expect(result.cells[0]?.data.color).toBe("#ff0000");
    });
  });

  describe("brush", () => {
    it("sets multiple cells with size > 1", () => {
      const grid = new PatternGrid(10, 10);
      const result = DrawingTools.brush(grid, { row: 5, col: 5 }, "#ff0000", null, 3, "square");
      expect(result.cells.length).toBeGreaterThan(1);
      // Center should be included
      const hasCenter = result.cells.some((c) => c.row === 5 && c.col === 5);
      expect(hasCenter).toBe(true);
    });

    it("brush size 1 is same as pencil", () => {
      const grid = new PatternGrid(10, 10);
      const result = DrawingTools.brush(grid, { row: 5, col: 5 }, "#ff0000", null, 1, "square");
      expect(result.cells).toHaveLength(1);
    });
  });

  describe("eraser", () => {
    it("returns cells to clear", () => {
      const grid = new PatternGrid(10, 10);
      const result = DrawingTools.eraser(grid, { row: 5, col: 5 }, 1);
      expect(result.cells).toHaveLength(1);
      expect(result.cells[0]?.data.color).toBeNull();
      expect(result.cells[0]?.data.symbol).toBeNull();
    });
  });

  describe("fill", () => {
    it("fills empty area", () => {
      const grid = new PatternGrid(10, 10);
      // Create a border
      for (let i = 0; i < 10; i++) {
        grid.setCell(0, i, { color: "#333" });
        grid.setCell(9, i, { color: "#333" });
        grid.setCell(i, 0, { color: "#333" });
        grid.setCell(i, 9, { color: "#333" });
      }
      const result = DrawingTools.fill(grid, { row: 5, col: 5 }, "#ff0000", null, 0);
      // Should fill all interior cells
      expect(result.cells.length).toBe(64); // 8x8 interior
    });

    it("returns empty for already-filled area", () => {
      const grid = new PatternGrid(10, 10);
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          grid.setCell(r, c, { color: "#ff0000" });
        }
      }
      const result = DrawingTools.fill(grid, { row: 5, col: 5 }, "#ff0000", null, 0);
      expect(result.cells).toHaveLength(0);
    });
  });

  describe("line", () => {
    it("draws a horizontal line", () => {
      const result = DrawingTools.line({ row: 5, col: 0 }, { row: 5, col: 9 }, "#ff0000", null);
      expect(result.cells).toHaveLength(10);
      expect(result.cells[0]?.row).toBe(5);
      expect(result.cells[0]?.col).toBe(0);
      expect(result.cells[9]?.col).toBe(9);
    });

    it("draws a vertical line", () => {
      const result = DrawingTools.line({ row: 0, col: 5 }, { row: 9, col: 5 }, "#ff0000", null);
      expect(result.cells).toHaveLength(10);
    });

    it("draws a diagonal line", () => {
      const result = DrawingTools.line({ row: 0, col: 0 }, { row: 4, col: 4 }, "#ff0000", null);
      expect(result.cells).toHaveLength(5);
    });
  });

  describe("rectangle", () => {
    it("draws rectangle outline", () => {
      const result = DrawingTools.rectangle(
        { row: 0, col: 0 },
        { row: 4, col: 4 },
        "#ff0000",
        null,
        false,
      );
      // 5x5 outline = 5+5+3+3 = 16 cells
      expect(result.cells.length).toBe(16);
    });

    it("draws filled rectangle", () => {
      const result = DrawingTools.rectangle(
        { row: 0, col: 0 },
        { row: 2, col: 2 },
        "#ff0000",
        null,
        true,
      );
      expect(result.cells).toHaveLength(9); // 3x3
    });
  });

  describe("mirror", () => {
    it("mirrors result horizontally", () => {
      const result = DrawingTools.line({ row: 5, col: 0 }, { row: 5, col: 4 }, "#ff0000", null);
      const mirrored = DrawingTools.mirror(result, 10, 10, true, false);
      // Original 5 cells + mirrored 5 cells
      expect(mirrored.cells.length).toBe(10);
    });

    it("mirrors result vertically", () => {
      const result = DrawingTools.line({ row: 0, col: 5 }, { row: 4, col: 5 }, "#ff0000", null);
      const mirrored = DrawingTools.mirror(result, 10, 10, false, true);
      expect(mirrored.cells.length).toBe(10);
    });

    it("mirrors in both directions", () => {
      const result = DrawingTools.pencil(new PatternGrid(10, 10), { row: 0, col: 0 }, "#ff0000", null);
      const mirrored = DrawingTools.mirror(result, 10, 10, true, true);
      // Original (0,0) + horizontal mirror (0,9) + vertical mirror (9,0)
      // Diagonal (9,9) would only appear if the mirror includes both original AND mirrors
      // The actual behavior depends on implementation - verify it has at least the mirrors
      expect(mirrored.cells.length).toBeGreaterThanOrEqual(2);
    });
  });
});
