/**
 * TimeCalculator - Interactive project time estimator.
 *
 * Estimates project completion time from stitch count and personal
 * stitching speed, with progress milestones.
 */

import { useState } from "react";
import { Clock } from "lucide-react";
import { CalculatorLayout } from "./CalculatorLayout";
import {
	calculateTime,
	DEFAULT_STITCHES_PER_MINUTE,
	DEFAULT_HOURS_PER_DAY,
	DEFAULT_DAYS_PER_WEEK,
	type TimeCalculatorInput,
	type TimeCalculatorResult,
} from "../time-calculator";

export function TimeCalculator() {
	const [totalStitches, setTotalStitches] = useState(10000);
	const [stitchesPerMinute, setStitchesPerMinute] = useState(
		DEFAULT_STITCHES_PER_MINUTE,
	);
	const [hoursPerDay, setHoursPerDay] = useState(DEFAULT_HOURS_PER_DAY);
	const [daysPerWeek, setDaysPerWeek] = useState(DEFAULT_DAYS_PER_WEEK);
	const [result, setResult] = useState<TimeCalculatorResult | null>(null);

	const handleCalculate = () => {
		const input: TimeCalculatorInput = {
			totalStitches,
			stitchesPerMinute,
			hoursPerDay,
			daysPerWeek,
		};
		setResult(calculateTime(input));
	};

	return (
		<CalculatorLayout
			icon={Clock}
			title="Time Estimator"
			description="Estimate project completion time from pattern size, stitch type, and your personal stitching speed."
			iconColor="bg-teal-50 text-teal-600"
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
							Stitches per Minute: {stitchesPerMinute}
						</label>
						<input
							type="range"
							min={1}
							max={100}
							value={stitchesPerMinute}
							onChange={(e) =>
								setStitchesPerMinute(Number(e.target.value))
							}
							className="w-full accent-craft-600"
						/>
						<div className="mt-1 flex justify-between text-xs text-text-muted">
							<span>1 (slow)</span>
							<span>100 (fast)</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Hours per Day: {hoursPerDay}
							</label>
							<input
								type="range"
								min={0.5}
								max={12}
								step={0.5}
								value={hoursPerDay}
								onChange={(e) =>
									setHoursPerDay(Number(e.target.value))
								}
								className="mt-2 w-full accent-craft-600"
							/>
						</div>
						<div>
							<label className="mb-1 block text-xs font-medium text-text-secondary">
								Days per Week: {daysPerWeek}
							</label>
							<input
								type="range"
								min={1}
								max={7}
								value={daysPerWeek}
								onChange={(e) =>
									setDaysPerWeek(Number(e.target.value))
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

							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-md bg-surface-secondary px-3 py-2 text-center">
									<div className="text-lg font-semibold text-text-primary">
										{result.totalHours}
									</div>
									<div className="text-xs text-text-muted">total hours</div>
								</div>
								<div className="rounded-md bg-surface-secondary px-3 py-2 text-center">
									<div className="text-lg font-semibold text-text-primary">
										{result.totalDays}
									</div>
									<div className="text-xs text-text-muted">
										8h work days
									</div>
								</div>
								<div className="rounded-md bg-surface-secondary px-3 py-2 text-center">
									<div className="text-lg font-semibold text-text-primary">
										{result.calendarDays}
									</div>
									<div className="text-xs text-text-muted">calendar days</div>
								</div>
								<div className="rounded-md bg-surface-secondary px-3 py-2 text-center">
									<div className="text-lg font-semibold text-craft-600">
										~{result.totalWeeks}
									</div>
									<div className="text-xs text-text-muted">weeks</div>
								</div>
							</div>

							<h4 className="mt-2 text-xs font-medium text-text-secondary">
								Milestones
							</h4>
							<div className="flex flex-col gap-2">
								{result.milestones.map((m) => {
									return (
										<div
											key={m.label}
											className="flex items-center gap-3 rounded-md bg-surface-secondary px-3 py-2"
										>
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
												{m.label}
											</div>
											<div className="flex-1 min-w-0">
												<div className="text-sm font-medium text-text-primary">
													{m.stitches.toLocaleString()} stitches
												</div>
											</div>
											<div className="shrink-0 text-sm font-medium text-text-secondary">
												{m.time}
											</div>
										</div>
									);
								})}
							</div>
						</>
					) : (
						<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border p-8">
							<p className="text-center text-sm text-text-muted">
								Enter your project details and click Calculate to see estimated
								completion time.
							</p>
						</div>
					)}
				</div>
			</div>
		</CalculatorLayout>
	);
}
