/**
 * Fabric yardage calculator for fiber arts patterns.
 *
 * Calculates fabric dimensions from stitch/row gauge and pattern size,
 * adds user-specified margins, and suggests standard fabric widths.
 */

/** Standard fabric widths commonly available (in inches). */
const STANDARD_FABRIC_WIDTHS_INCHES = [36, 42, 44, 45, 54, 60];

/** Conversion factor: 1 inch = 2.54 cm. */
const INCHES_PER_CM = 1 / 2.54;

export interface FabricCalculatorInput {
  /** Pattern width in stitches. */
  patternWidth: number;
  /** Pattern height in rows. */
  patternHeight: number;
  /** Stitches per unit (inch or cm depending on `unit`). */
  stitchGauge: number;
  /** Rows per unit (inch or cm depending on `unit`). */
  rowGauge: number;
  /** Whether gauge values are in inches or cm. */
  unit: "in" | "cm";
  /** Margin on each horizontal side (in the same unit as `unit`). */
  horizontalMargin: number;
  /** Margin on top and bottom (in the same unit as `unit`). */
  verticalMargin: number;
}

export interface FabricCalculatorResult {
  /** Total fabric width needed (in the same unit as input). */
  fabricWidth: number;
  /** Total fabric height needed (in the same unit as input). */
  fabricHeight: number;
  /** Pattern width in inches (always inches regardless of input unit). */
  patternWidthInches: number;
  /** Pattern height in inches (always inches regardless of input unit). */
  patternHeightInches: number;
  /** Fabric area in square inches. */
  areaSquareInches: number;
  /** Fabric area in square cm. */
  areaSquareCm: number;
  /** Standard fabric widths (in inches) that are wide enough. */
  suggestedFabricWidths: number[];
}

/**
 * Calculate fabric requirements from pattern dimensions and gauge.
 *
 * @param input - The fabric calculator parameters
 * @returns Calculated fabric requirements
 */
export function calculateFabric(
  input: FabricCalculatorInput,
): FabricCalculatorResult {
  const {
    patternWidth,
    patternHeight,
    stitchGauge,
    rowGauge,
    unit,
    horizontalMargin,
    verticalMargin,
  } = input;

  // Pattern dimensions in the user's chosen unit
  const patternWidthUnit = patternWidth / stitchGauge;
  const patternHeightUnit = patternHeight / rowGauge;

  // Add margins
  const fabricWidth = patternWidthUnit + horizontalMargin * 2;
  const fabricHeight = patternHeightUnit + verticalMargin * 2;

  // Convert to inches for area calculations
  const toInches = unit === "cm" ? INCHES_PER_CM : 1;
  const patternWidthInches = patternWidthUnit * toInches;
  const patternHeightInches = patternHeightUnit * toInches;

  const fabricWidthInches = fabricWidth * toInches;
  const fabricHeightInches = fabricHeight * toInches;

  const areaSquareInches = fabricWidthInches * fabricHeightInches;
  const areaSquareCm = areaSquareInches * 2.54 * 2.54;

  // Suggest standard fabric widths that are at least as wide as needed
  const suggestedFabricWidths = STANDARD_FABRIC_WIDTHS_INCHES.filter(
    (w) => w >= fabricWidthInches,
  );

  return {
    fabricWidth: Math.round(fabricWidth * 100) / 100,
    fabricHeight: Math.round(fabricHeight * 100) / 100,
    patternWidthInches: Math.round(patternWidthInches * 100) / 100,
    patternHeightInches: Math.round(patternHeightInches * 100) / 100,
    areaSquareInches: Math.round(areaSquareInches * 100) / 100,
    areaSquareCm: Math.round(areaSquareCm * 100) / 100,
    suggestedFabricWidths,
  };
}
