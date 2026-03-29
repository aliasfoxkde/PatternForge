import { describe, it, expect } from "vitest";
import { PatternGrid } from "@/engine/grid/grid";

describe("CSV Export", () => {
  it("exports empty grid as header only", async () => {
    const { exportToCSV } = await import("@/features/export/export-csv");
    const grid = new PatternGrid(5, 5);
    const csv = exportToCSV(grid);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("Row,Col,Color,Symbol,StitchType,Completed");
    expect(lines).toHaveLength(1);
  });

  it("exports populated cells correctly", async () => {
    const { exportToCSV } = await import("@/features/export/export-csv");
    const grid = new PatternGrid(3, 3);
    grid.setCell(0, 0, { color: "#ff0000", symbol: "X" });
    grid.setCell(1, 2, { color: "#00ff00" });
    grid.setCell(2, 1, { color: "#0000ff", symbol: "Y", stitchType: "purl", completed: true });
    const csv = exportToCSV(grid);
    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(4); // header + 3 cells
    expect(lines[0]).toContain("Row");
    expect(lines[1]).toContain("0");
    expect(lines[1]).toContain("#ff0000");
    expect(lines[1]).toContain("X");
    expect(lines[2]).toContain("#00ff00");
    expect(lines[3]).toContain("#0000ff");
    expect(lines[3]).toContain("true");
  });

  it("produces valid CSV with no trailing commas", async () => {
    const { exportToCSV } = await import("@/features/export/export-csv");
    const grid = new PatternGrid(2, 2);
    grid.setCell(0, 0, { color: "#ff0000" });
    const csv = exportToCSV(grid);
    // Parse CSV manually to verify format
    const lines = csv.trim().split("\n");
    for (const line of lines) {
      const fields = line.split(",");
      expect(fields).toHaveLength(6); // Row,Col,Color,Symbol,StitchType,Completed
    }
  });
});

describe("Print Export", () => {
  it("export function exists and is callable", async () => {
    const { printPattern } = await import("@/features/export/export-print");
    expect(typeof printPattern).toBe("function");
  });
});
