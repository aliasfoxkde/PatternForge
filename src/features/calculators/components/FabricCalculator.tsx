/**
 * FabricCalculator - Interactive fabric yardage calculator.
 *
 * Estimates fabric dimensions from pattern size, stitch/row gauge,
 * and user-specified margins. Suggests standard fabric widths.
 */

import { useState } from "react";
import { Ruler } from "lucide-react";
import { CalculatorLayout } from "./CalculatorLayout";
import {
	calculateFabric,
	type FabricCalculatorInput,
	type FabricCalculatorResult,
} from "../fabric-calculator";

const DEFAULTS: FabricCalculatorInput = {
	patternWidth: 100,
	patternHeight: 100,
	stitchGauge: 14,
	rowGauge: 14,
	unit: "in",
	horizontalMargin: 3,
	verticalMargin: 3,
};

function ResultRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between rounded-md bg-surface-secondary px-3 py-2">
			<span className="text-sm text-text-secondary">{label}</span>
			<span className="text-sm font-medium text-text-primary">{value}</span>
		</div>
	);
}

export function FabricCalculator() {
	const [input, setInput] = useState<FabricCalculatorInput>(DEFAULTS);
	const [result, setResult] = useState<FabricCalculatorResult | null>(null);

	const handleCalculate = () => {
		setResult(calculateFabric(input));
	};

	const unitLabel = input.unit === "in" ? "in" : "cm";

	return (
		<CalculatorLayout
			icon={Ruler}
			title="Fabric Calculator"
			description="Estimate fabric yardage based on pattern dimensions, stitch gauge, and desired margins."
			iconColor="bg-craft-100 text-craft-600"
		>
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Inputs */}
				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Pattern Width (stitches)
							</label>
							<input
								type="number"
								min={1}
								value={input.patternWidth}
								onChange={(e) =>
									setInput({ ...input, patternWidth: Number(e.target.value) || 0 })
								}
								className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Pattern Height (rows)
							</label>
							<input
								type="number"
								min={1}
								value={input.patternHeight}
								onChange={(e) =>
									setInput({ ...input, patternHeight: Number(e.target.value) || 0 })
								}
								className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Stitch Gauge (per {unitLabel})
							</label>
							<input
								type="number"
								min={0.1}
								step={0.1}
								value={input.stitchGauge}
								onChange={(e) =>
									setInput({ ...input, stitchGauge: Number(e.target.value) || 1 })
								}
								className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Row Gauge (per {unitLabel})
							</label>
							<input
								type="number"
								min={0.1}
								step={0.1}
								value={input.rowGauge}
								onChange={(e) =>
									setInput({ ...input, rowGauge: Number(e.target.value) || 1 })
								}
								className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
							/>
						</div>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-text-secondary">
							Unit
						</label>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setInput({ ...input, unit: "in" })}
								className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
									input.unit === "in"
										? "bg-craft-600 text-white"
										: "border border-border bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
								}`}
							>
								Inches
							</button>
							<button
								type="button"
								onClick={() => setInput({ ...input, unit: "cm" })}
								className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
									input.unit === "cm"
										? "bg-craft-600 text-white"
										: "border border-border bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
								}`}
							>
								centimeters
							</button>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Side Margin ({unitLabel})
							</label>
							<input
								type="number"
								min={0}
								step={0.5}
								value={input.horizontalMargin}
								onChange={(e) =>
									setInput({
										...input,
										horizontalMargin: Number(e.target.value) || 0,
									})
								}
								className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Top/Bottom Margin ({unitLabel})
							</label>
							<input
								type="number"
								min={0}
								step={0.5}
								value={input.verticalMargin}
								onChange={(e) =>
									setInput({
										...input,
										verticalMargin: Number(e.target.value) || 0,
									})
								}
								className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
							/>
						</div>
					</div>

					<button
						type="button"
						onClick={handleCalculate}
						className="rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white hover:bg-craft-700"
					>
						Calculate
					</button>
				</div>

				{/* Results */}
				<div className="flex flex-col gap-3">
					{result ? (
						<>
							<h3 className="text-sm font-semibold text-text-primary">Results</h3>
							<ResultRow
								label={`Fabric Width (${unitLabel})`}
								value={`${result.fabricWidth} ${unitLabel}`}
							/>
							<ResultRow
								label={`Fabric Height (${unitLabel})`}
								value={`${result.fabricHeight} ${unitLabel}`}
							/>
							<ResultRow
								label="Pattern Size (in)"
								value={`${result.patternWidthInches}" x ${result.patternHeightInches}"`}
							/>
							<ResultRow
								label="Area"
								value={`${result.areaSquareInches} sq in / ${result.areaSquareCm} sq cm`}
							/>
							{result.suggestedFabricWidths.length > 0 ? (
								<div className="rounded-md bg-surface-secondary px-3 py-2">
									<span className="text-xs font-medium text-text-secondary">
										Suggested Fabric Widths
									</span>
									<div className="mt-1 flex flex-wrap gap-2">
										{result.suggestedFabricWidths.map((w) => (
											<span
												key={w}
												className="rounded bg-craft-100 px-2 py-0.5 text-xs font-medium text-craft-700"
											>
												{w}"
											</span>
										))}
									</div>
								</div>
							) : (
								<div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
									<p className="text-xs text-amber-700">
										No standard fabric width is wide enough. You may need extra-wide
										fabric or to split the pattern.
									</p>
								</div>
							)}
						</>
					) : (
						<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-8">
							<p className="text-center text-sm text-text-muted">
								Enter your pattern details and click Calculate to see fabric
								requirements.
							</p>
						</div>
					)}
				</div>
			</div>
		</CalculatorLayout>
	);
}
