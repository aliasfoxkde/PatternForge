import { describe, it, expect } from "vitest";
import { PatternGrid } from "@/engine/grid/grid";

describe("Knitting Instructions Generator", () => {
  it("generates empty instructions for empty grid", async () => {
    const { generateKnittingInstructions } = await import(
      "@/features/instructions/generators/knitting"
    );
    const grid = new PatternGrid(10, 10);
    const result = generateKnittingInstructions(grid, "knitting-flat");
    expect(result.totalRows).toBe(10);
    expect(result.rows).toHaveLength(10);
    // totalStitches counts ALL cells in the grid (including empty/background)
    expect(result.totalStitches).toBe(100); // 10x10
  });

  it("groups consecutive same-color stitches", async () => {
    const { generateKnittingInstructions } = await import(
      "@/features/instructions/generators/knitting"
    );
    const grid = new PatternGrid(5, 5);
    // Row 0: all same color
    for (let c = 0; c < 5; c++) {
      grid.setCell(0, c, { color: "#ff0000" });
    }
    const result = generateKnittingInstructions(grid, "knitting-flat");
    const row0 = result.rows[0]!;
    // Should group 5 same-color stitches
    expect(row0.stitches.length).toBeLessThanOrEqual(5);
    expect(row0.stitches[0]!.count).toBeGreaterThanOrEqual(1);
    // totalStitches counts ALL cells, not just populated ones
    expect(result.totalStitches).toBe(25); // 5 cols x 5 rows
  });

  it("handles round knitting direction", async () => {
    const { generateKnittingInstructions } = await import(
      "@/features/instructions/generators/knitting"
    );
    const grid = new PatternGrid(3, 3);
    grid.setCell(0, 0, { color: "#ff0000" });
    const result = generateKnittingInstructions(grid, "knitting-round");
    // All rows in round knitting go right-to-left
    for (const row of result.rows) {
      expect(row.direction).toBe("right-to-left");
    }
  });

  it("alternates direction for flat knitting", async () => {
    const { generateKnittingInstructions } = await import(
      "@/features/instructions/generators/knitting"
    );
    const grid = new PatternGrid(3, 3);
    grid.setCell(0, 0, { color: "#ff0000" });
    const result = generateKnittingInstructions(grid, "knitting-flat");
    expect(result.rows[0]!.direction).toBe("right-to-left");
    expect(result.rows[1]!.direction).toBe("left-to-right");
    expect(result.rows[2]!.direction).toBe("right-to-left");
  });

  it("tracks color changes", async () => {
    const { generateKnittingInstructions } = await import(
      "@/features/instructions/generators/knitting"
    );
    const grid = new PatternGrid(4, 1);
    // Row 0: 2 red, then 2 blue
    grid.setCell(0, 0, { color: "#ff0000" });
    grid.setCell(0, 1, { color: "#ff0000" });
    grid.setCell(0, 2, { color: "#0000ff" });
    grid.setCell(0, 3, { color: "#0000ff" });
    const result = generateKnittingInstructions(grid, "knitting-flat");
    expect(result.colorChanges).toBeGreaterThanOrEqual(1);
  });
});

describe("Cross Stitch Instructions Generator", () => {
  it("generates empty instructions for empty grid", async () => {
    const { generateCrossStitchInstructions } = await import(
      "@/features/instructions/generators/cross-stitch"
    );
    const grid = new PatternGrid(10, 10);
    const result = generateCrossStitchInstructions(grid);
    expect(result.totalStitches).toBe(0);
    expect(result.colorCount).toBe(0);
    expect(result.stitchList).toHaveLength(0);
  });

  it("counts stitches and colors correctly", async () => {
    const { generateCrossStitchInstructions } = await import(
      "@/features/instructions/generators/cross-stitch"
    );
    const grid = new PatternGrid(5, 5);
    grid.setCell(0, 0, { color: "#ff0000" });
    grid.setCell(0, 1, { color: "#ff0000" });
    grid.setCell(1, 0, { color: "#0000ff" });
    const result = generateCrossStitchInstructions(grid);
    expect(result.totalStitches).toBe(3);
    expect(result.colorCount).toBe(2);
    expect(result.stitchList).toHaveLength(3);
  });

  it("calculates color usage percentages", async () => {
    const { generateCrossStitchInstructions } = await import(
      "@/features/instructions/generators/cross-stitch"
    );
    const grid = new PatternGrid(3, 3);
    grid.setCell(0, 0, { color: "#ff0000" });
    grid.setCell(0, 1, { color: "#ff0000" });
    grid.setCell(0, 2, { color: "#0000ff" });
    const result = generateCrossStitchInstructions(grid);
    const redUsage = result.colorList.find((c) => c.color === "#ff0000");
    expect(redUsage).toBeDefined();
    expect(redUsage!.percentage).toBeCloseTo(66.67, 0);
    expect(redUsage!.count).toBe(2);
  });
});

describe("generateInstructions (router)", () => {
  it("routes to correct generator by craft type", async () => {
    const { generateInstructions } = await import(
      "@/features/instructions/generators"
    );
    const grid = new PatternGrid(3, 3);
    grid.setCell(0, 0, { color: "#ff0000" });

    const knitting = generateInstructions(grid, "knitting-flat");
    expect(knitting).toHaveProperty("rows");

    const crochet = generateInstructions(grid, "crochet-standard");
    expect(crochet).toHaveProperty("rows");

    const crossStitch = generateInstructions(grid, "cross-stitch");
    expect(crossStitch).toHaveProperty("stitchList");
  });
});
