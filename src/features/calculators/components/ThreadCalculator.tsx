/**
 * ThreadCalculator - Interactive thread/yarn usage calculator.
 *
 * Calculates total thread length per color and estimates skeins needed.
 */

import { useState } from "react";
import { Scissors, Plus, X } from "lucide-react";
import { CalculatorLayout } from "./CalculatorLayout";
import {
	calculateThread,
	DEFAULT_STITCH_LENGTH,
	DEFAULT_WASTE_FACTOR,
	type ThreadCalculatorInput,
	type ThreadCalculatorResult,
	type ThreadColorInput,
} from "../thread-calculator";

function ColorRow({
	color,
	index,
	onChange,
	onRemove,
	canRemove,
}: {
	color: ThreadColorInput;
	index: number;
	onChange: (index: number, updated: ThreadColorInput) => void;
	onRemove: (index: number) => void;
	canRemove: boolean;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-tertiary text-xs font-medium text-text-muted">
				{index + 1}
			</span>
			<input
				type="text"
				placeholder="Color name"
				value={color.name}
				onChange={(e) =>
					onChange(index, { ...color, name: e.target.value })
				}
				className="flex-1 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
			/>
			<input
				type="number"
				min={0}
				placeholder="Stitches"
				value={color.stitchCount || ""}
				onChange={(e) =>
					onChange(index, {
						...color,
						stitchCount: Number(e.target.value) || 0,
					})
				}
				className="w-24 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
			/>
			{canRemove && (
				<button
					type="button"
					onClick={() => onRemove(index)}
					className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					aria-label={`Remove color ${color.name || index + 1}`}
				>
					<X className="h-4 w-4" />
				</button>
			)}
		</div>
	);
}

export function ThreadCalculator() {
	const [totalStitches, setTotalStitches] = useState(5000);
	const [colors, setColors] = useState<ThreadColorInput[]>([
		{ name: "DMC 310", stitchCount: 3000 },
		{ name: "DMC 906", stitchCount: 2000 },
	]);
	const [stitchLength, setStitchLength] = useState(DEFAULT_STITCH_LENGTH);
	const [wasteFactor, setWasteFactor] = useState(DEFAULT_WASTE_FACTOR);
	const [result, setResult] = useState<ThreadCalculatorResult | null>(null);

	const handleCalculate = () => {
		const input: ThreadCalculatorInput = {
			totalStitches,
			colors,
			stitchLength,
			wasteFactor,
		};
		setResult(calculateThread(input));
	};

	const addColor = () => {
		setColors([...colors, { name: "", stitchCount: 0 }]);
	};

	const updateColor = (index: number, updated: ThreadColorInput) => {
		const next = [...colors];
		next[index] = updated;
		setColors(next);
	};

	const removeColor = (index: number) => {
		setColors(colors.filter((_, i) => i !== index));
	};

	return (
		<CalculatorLayout
			icon={Scissors}
			title="Thread Calculator"
			description="Calculate total thread usage by color based on stitch count, thread length per stitch, and waste factor."
			iconColor="bg-rose-50 text-rose-600"
		>
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Inputs */}
				<div className="flex flex-col gap-4">
					<div>
						<label className="mb-1 block text-xs font-medium text-text-secondary">
							Total Stitches
						</label>
						<input
							type="number"
							min={1}
							value={totalStitches}
							onChange={(e) => setTotalStitches(Number(e.target.value) || 0)}
							className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
						/>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-text-secondary">
							Colors
						</label>
						<div className="flex flex-col gap-2">
							{colors.map((color, i) => (
								<ColorRow
									key={i}
									color={color}
									index={i}
									onChange={updateColor}
									onRemove={removeColor}
									canRemove={colors.length > 1}
								/>
							))}
						</div>
						<button
							type="button"
							onClick={addColor}
							className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-craft-400 hover:text-craft-600"
						>
							<Plus className="h-3.5 w-3.5" />
							Add Color
						</button>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Stitch Length (in)
							</label>
							<input
								type="number"
								min={0.01}
								step={0.01}
								value={stitchLength}
								onChange={(e) =>
									setStitchLength(Number(e.target.value) || 0.01)
								}
								className="w-full rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Waste Factor: {wasteFactor}%
							</label>
							<input
								type="range"
								min={0}
								max={50}
								value={wasteFactor}
								onChange={(e) =>
									setWasteFactor(Number(e.target.value))
								}
								className="mt-2 w-full accent-craft-600"
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

							<div className="grid grid-cols-3 gap-2">
								<div className="rounded-md bg-surface-secondary px-3 py-2 text-center">
									<div className="text-lg font-semibold text-text-primary">
										{result.totalThreadLengthYards.toFixed(1)}
									</div>
									<div className="text-xs text-text-muted">yards</div>
								</div>
								<div className="rounded-md bg-surface-secondary px-3 py-2 text-center">
									<div className="text-lg font-semibold text-text-primary">
										{result.totalThreadLengthMeters.toFixed(1)}
									</div>
									<div className="text-xs text-text-muted">meters</div>
								</div>
								<div className="rounded-md bg-surface-secondary px-3 py-2 text-center">
									<div className="text-lg font-semibold text-craft-600">
										{result.totalSkeins}
									</div>
									<div className="text-xs text-text-muted">skeins</div>
								</div>
							</div>

							<h4 className="mt-2 text-xs font-medium text-text-secondary">
								Per-Color Breakdown
							</h4>
							<div className="flex flex-col gap-2">
								{result.skeins.map((s) => (
									<div
										key={s.name}
										className="flex items-center gap-3 rounded-md bg-surface-secondary px-3 py-2"
									>
										<div
											className="h-4 w-4 shrink-0 rounded-full border border-border"
											style={{ backgroundColor: s.color }}
										/>
										<div className="flex-1 min-w-0">
											<div className="truncate text-sm font-medium text-text-primary">
												{s.name || "Unnamed"}
											</div>
											<div className="text-xs text-text-muted">
												{s.stitchCount} stitches &middot; {s.lengthYards.toFixed(1)} yd
											</div>
										</div>
										<div className="shrink-0 text-right">
											<div className="text-sm font-semibold text-craft-600">
												{s.skeinsNeeded}
											</div>
											<div className="text-xs text-text-muted">skein{s.skeinsNeeded !== 1 ? "s" : ""}</div>
										</div>
									</div>
								))}
							</div>
						</>
					) : (
						<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-8">
							<p className="text-center text-sm text-text-muted">
								Enter your colors and stitch counts, then click Calculate to see
								thread requirements.
							</p>
						</div>
					)}
				</div>
			</div>
		</CalculatorLayout>
	);
}
