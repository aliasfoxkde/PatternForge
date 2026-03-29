import { describe, it, expect } from "vitest";
import { PatternGrid } from "@/engine/grid/grid";

describe("PatternGrid", () => {
  describe("constructor", () => {
    it("creates a grid with given dimensions", () => {
      const grid = new PatternGrid(10, 20);
      expect(grid.width).toBe(10);
      expect(grid.height).toBe(20);
      expect(grid.getCellCount()).toBe(0);
    });
  });

  describe("setCell / getCell", () => {
    it("sets and retrieves a cell", () => {
      const grid = new PatternGrid(10, 10);
      grid.setCell(5, 3, { color: "#ff0000", symbol: "X" });
      const cell = grid.getCell(5, 3);
      expect(cell).toBeDefined();
      expect(cell?.color).toBe("#ff0000");
      expect(cell?.symbol).toBe("X");
    });

    it("returns undefined for empty cell", () => {
      const grid = new PatternGrid(10, 10);
      expect(grid.getCell(0, 0)).toBeUndefined();
    });

    it("hasCell returns true for set cells", () => {
      const grid = new PatternGrid(10, 10);
      expect(grid.hasCell(0, 0)).toBe(false);
      grid.setCell(0, 0, { color: "#000" });
      expect(grid.hasCell(0, 0)).toBe(true);
    });
  });

  describe("clearCell", () => {
    it("removes a cell", () => {
      const grid = new PatternGrid(10, 10);
      grid.setCell(0, 0, { color: "#000" });
      expect(grid.hasCell(0, 0)).toBe(true);
      grid.clearCell(0, 0);
      expect(grid.hasCell(0, 0)).toBe(false);
    });
  });

  describe("clearAll", () => {
    it("removes all cells", () => {
      const grid = new PatternGrid(10, 10);
      grid.setCell(0, 0, { color: "#000" });
      grid.setCell(5, 5, { color: "#fff" });
      grid.setCell(9, 9, { color: "#f00" });
      expect(grid.getCellCount()).toBe(3);
      grid.clearAll();
      expect(grid.getCellCount()).toBe(0);
    });
  });

  describe("fillArea", () => {
    it("fills a rectangular area", () => {
      const grid = new PatternGrid(10, 10);
      grid.fillArea(2, 2, 3, 3, { color: "#ff0000" });
      expect(grid.getCellCount()).toBe(9); // 3x3
      expect(grid.getCell(2, 2)?.color).toBe("#ff0000");
      expect(grid.getCell(4, 4)?.color).toBe("#ff0000");
      expect(grid.getCell(1, 1)).toBeUndefined();
    });
  });

  describe("clearArea", () => {
    it("clears a rectangular area", () => {
      const grid = new PatternGrid(10, 10);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          grid.setCell(r, c, { color: "#000" });
        }
      }
      expect(grid.getCellCount()).toBe(25);
      grid.clearArea(1, 1, 3, 3);
      expect(grid.getCellCount()).toBe(16); // 25 - 9
    });
  });

  describe("getCellsInArea", () => {
    it("returns cells in a rectangular region", () => {
      const grid = new PatternGrid(10, 10);
      grid.setCell(0, 0, { color: "#000" });
      grid.setCell(1, 1, { color: "#111" });
      grid.setCell(5, 5, { color: "#222" });
      const cells = grid.getCellsInArea(0, 0, 3, 3);
      expect(cells).toHaveLength(2); // only (0,0) and (1,1)
    });
  });

  describe("resize", () => {
    it("expands grid dimensions", () => {
      const grid = new PatternGrid(5, 5);
      grid.setCell(4, 4, { color: "#000" });
      grid.resize(10, 10);
      expect(grid.width).toBe(10);
      expect(grid.height).toBe(10);
      expect(grid.getCell(4, 4)?.color).toBe("#000"); // preserved
    });

    it("shrinks grid and removes out-of-bounds cells", () => {
      const grid = new PatternGrid(10, 10);
      grid.setCell(9, 9, { color: "#000" });
      grid.setCell(4, 4, { color: "#111" });
      grid.resize(5, 5);
      expect(grid.width).toBe(5);
      expect(grid.height).toBe(5);
      expect(grid.getCell(4, 4)?.color).toBe("#111"); // preserved
      expect(grid.getCell(9, 9)).toBeUndefined(); // removed
    });
  });

  describe("mirrorHorizontal", () => {
    it("mirrors cells horizontally", () => {
      const grid = new PatternGrid(10, 10);
      grid.setCell(0, 0, { color: "#ff0000" });
      grid.mirrorHorizontal();
      // Mirror replaces: (0,0) → (0,9)
      expect(grid.hasCell(0, 0)).toBe(false); // original moved
      expect(grid.hasCell(0, 9)).toBe(true); // mirrored position
      expect(grid.getCell(0, 9)?.color).toBe("#ff0000");
    });
  });

  describe("mirrorVertical", () => {
    it("mirrors cells vertically", () => {
      const grid = new PatternGrid(10, 10);
      grid.setCell(0, 0, { color: "#ff0000" });
      grid.mirrorVertical();
      // Mirror replaces: (0,0) → (9,0)
      expect(grid.hasCell(0, 0)).toBe(false); // original moved
      expect(grid.hasCell(9, 0)).toBe(true); // mirrored position
      expect(grid.getCell(9, 0)?.color).toBe("#ff0000");
    });
  });

  describe("forEach", () => {
    it("iterates over all cells", () => {
      const grid = new PatternGrid(10, 10);
      grid.setCell(0, 0, { color: "#000" });
      grid.setCell(5, 5, { color: "#111" });
      const visited: string[] = [];
      grid.forEach((cell) => visited.push(`${cell.row},${cell.col}`));
      expect(visited).toHaveLength(2);
      expect(visited).toContain("0,0");
      expect(visited).toContain("5,5");
    });
  });

  describe("getUsedColors", () => {
    it("returns unique colors", () => {
      const grid = new PatternGrid(10, 10);
      grid.setCell(0, 0, { color: "#ff0000" });
      grid.setCell(1, 1, { color: "#ff0000" });
      grid.setCell(2, 2, { color: "#00ff00" });
      const colors = grid.getUsedColors();
      expect(colors.size).toBe(2);
      expect(colors.has("#ff0000")).toBe(true);
      expect(colors.has("#00ff00")).toBe(true);
    });
  });

  describe("serialization", () => {
    it("round-trips through JSON", () => {
      const grid = new PatternGrid(5, 5);
      grid.setCell(0, 0, { color: "#ff0000", symbol: "X" });
      grid.setCell(2, 2, { color: "#00ff00", symbol: "O" });
      const json = grid.toJSON();
      const restored = PatternGrid.fromJSON(json);
      expect(restored.width).toBe(5);
      expect(restored.height).toBe(5);
      expect(restored.getCellCount()).toBe(2);
      expect(restored.getCell(0, 0)?.color).toBe("#ff0000");
      expect(restored.getCell(0, 0)?.symbol).toBe("X");
      expect(restored.getCell(2, 2)?.color).toBe("#00ff00");
    });
  });
});
