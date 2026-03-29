import { describe, it, expect } from "vitest";

describe("Fabric Calculator", () => {
  it("calculates fabric dimensions from stitch gauge", async () => {
    const { calculateFabric } = await import(
      "@/features/calculators/fabric-calculator"
    );
    const result = calculateFabric({
      patternWidth: 100,
      patternHeight: 150,
      stitchGauge: 10,
      rowGauge: 14,
      unit: "in",
      horizontalMargin: 2,
      verticalMargin: 3,
    });
    expect(result.patternWidthInches).toBe(10);
    expect(result.patternHeightInches).toBeCloseTo(10.71, 1);
    expect(result.fabricWidth).toBe(14); // 10 + 2*2
    expect(result.fabricHeight).toBeCloseTo(16.71, 1);
  });

  it("converts cm to inches correctly", async () => {
    const { calculateFabric } = await import(
      "@/features/calculators/fabric-calculator"
    );
    const result = calculateFabric({
      patternWidth: 50,
      patternHeight: 70,
      stitchGauge: 4,
      rowGauge: 5.5,
      unit: "cm",
      horizontalMargin: 5,
      verticalMargin: 5,
    });
    expect(result.patternWidthInches).toBeCloseTo(4.92, 1); // 12.5 cm ≈ 4.92 inches
    expect(result.fabricWidth).toBeCloseTo(22.5, 1); // 12.5 cm + 5*2 cm margin
  });

  it("suggests standard fabric widths", async () => {
    const { calculateFabric } = await import(
      "@/features/calculators/fabric-calculator"
    );
    const result = calculateFabric({
      patternWidth: 200,
      patternHeight: 300,
      stitchGauge: 14,
      rowGauge: 18,
      unit: "in",
      horizontalMargin: 3,
      verticalMargin: 3,
    });
    expect(result.suggestedFabricWidths.length).toBeGreaterThan(0);
  });

  it("calculates area correctly", async () => {
    const { calculateFabric } = await import(
      "@/features/calculators/fabric-calculator"
    );
    const result = calculateFabric({
      patternWidth: 50,
      patternHeight: 50,
      stitchGauge: 10,
      rowGauge: 10,
      unit: "in",
      horizontalMargin: 0,
      verticalMargin: 0,
    });
    expect(result.areaSquareInches).toBe(25);
  });
});

describe("Thread Calculator", () => {
  it("calculates total thread length", async () => {
    const { calculateThread } = await import(
      "@/features/calculators/thread-calculator"
    );
    const result = calculateThread({
      totalStitches: 100,
      colors: [
        { name: "Red", stitchCount: 60 },
        { name: "Blue", stitchCount: 40 },
      ],
      stitchLength: 0.1,
      wasteFactor: 15,
    });
    expect(result.totalThreadLength).toBeCloseTo(11.5, 1); // 100 * 0.1 * 1.15
  });

  it("calculates skeins per color", async () => {
    const { calculateThread } = await import(
      "@/features/calculators/thread-calculator"
    );
    const result = calculateThread({
      totalStitches: 1000,
      colors: [
        { name: "Red", stitchCount: 500 },
        { name: "Blue", stitchCount: 500 },
      ],
      stitchLength: 0.1,
      wasteFactor: 10,
    });
    // 500 * 0.1 * 1.1 = 55 inches per color
    // 55 / 337.5 = 0.163 skeins per color
    expect(result.skeins).toHaveLength(2);
    expect(result.skeins[0]!.skeinsNeeded).toBeGreaterThanOrEqual(0);
  });

  it("handles single color", async () => {
    const { calculateThread } = await import(
      "@/features/calculators/thread-calculator"
    );
    const result = calculateThread({
      totalStitches: 500,
      colors: [{ name: "Black", stitchCount: 500 }],
      stitchLength: 0.1,
      wasteFactor: 0,
    });
    expect(result.totalThreadLength).toBe(50); // 500 * 0.1
    expect(result.totalThreadLengthYards).toBeCloseTo(1.39, 1); // 50 / 36
  });
});

describe("Time Calculator", () => {
  it("calculates total time", async () => {
    const { calculateTime } = await import(
      "@/features/calculators/time-calculator"
    );
    const result = calculateTime({
      totalStitches: 1000,
      stitchesPerMinute: 20,
      hoursPerDay: 2,
      daysPerWeek: 5,
    });
    expect(result.totalMinutes).toBe(50);
    expect(result.totalHours).toBeCloseTo(0.83, 1);
  });

  it("calculates calendar days accounting for work schedule", async () => {
    const { calculateTime } = await import(
      "@/features/calculators/time-calculator"
    );
    const result = calculateTime({
      totalStitches: 10000,
      stitchesPerMinute: 20,
      hoursPerDay: 2,
      daysPerWeek: 5,
    });
    // 10000 / 20 = 500 minutes = 8.33 hours
    // At 2 hours/day, 5 days/week: 8.33 / 2 = 4.17 days
    expect(result.calendarDays).toBeGreaterThanOrEqual(4);
  });

  it("generates milestones", async () => {
    const { calculateTime } = await import(
      "@/features/calculators/time-calculator"
    );
    const result = calculateTime({
      totalStitches: 1000,
      stitchesPerMinute: 10,
      hoursPerDay: 1,
      daysPerWeek: 7,
    });
    expect(result.milestones.length).toBe(4); // 25%, 50%, 75%, 100%
    expect(result.milestones[3]!.label).toBe("100%");
  });

  it("handles full-time stitching", async () => {
    const { calculateTime } = await import(
      "@/features/calculators/time-calculator"
    );
    const result = calculateTime({
      totalStitches: 50000,
      stitchesPerMinute: 25,
      hoursPerDay: 8,
      daysPerWeek: 7,
    });
    // 50000 / 25 = 2000 minutes = 33.33 hours
    expect(result.totalHours).toBeCloseTo(33.33, 1);
    expect(result.calendarDays).toBeGreaterThanOrEqual(4);
  });
});
