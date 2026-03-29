/**
 * ProgressStats - Shows completion statistics.
 *
 * Displays stitch count, row count, percentage, and remaining estimate.
 */

export interface ProgressStatsProps {
  totalStitches: number;
  completedStitches: number;
  totalRows: number;
  completedRows: number;
}

export function ProgressStats({
  totalStitches,
  completedStitches,
  totalRows,
  completedRows,
}: ProgressStatsProps) {
  const stitchPct =
    totalStitches > 0
      ? Math.min(100, (completedStitches / totalStitches) * 100)
      : 0;
  const rowPct =
    totalRows > 0 ? Math.min(100, (completedRows / totalRows) * 100) : 0;
  const remaining = Math.max(0, totalStitches - completedStitches);

  return (
    <div className="space-y-4">
      {/* Stitch progress */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs font-medium text-text-secondary">
            Stitches
          </span>
          <span className="text-xs tabular-nums text-text-primary">
            {completedStitches.toLocaleString()} / {totalStitches.toLocaleString()}
            <span className="ml-1 text-text-muted">({stitchPct.toFixed(1)}%)</span>
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-craft-500 transition-all duration-300"
            style={{ width: `${stitchPct}%` }}
          />
        </div>
        {remaining > 0 && (
          <p className="mt-0.5 text-[10px] text-text-muted">
            {remaining.toLocaleString()} remaining
          </p>
        )}
      </div>

      {/* Row progress */}
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-xs font-medium text-text-secondary">
            Rows
          </span>
          <span className="text-xs tabular-nums text-text-primary">
            {completedRows} / {totalRows}
            <span className="ml-1 text-text-muted">({rowPct.toFixed(1)}%)</span>
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-craft-400 transition-all duration-300"
            style={{ width: `${rowPct}%` }}
          />
        </div>
      </div>

      {/* Summary ring */}
      <div className="flex items-center justify-center pt-2">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-border"
            />
            {/* Progress arc */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - stitchPct / 100)}`}
              className="text-craft-500 transition-all duration-300"
            />
          </svg>
          <span className="absolute text-sm font-semibold tabular-nums text-text-primary">
            {stitchPct.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
