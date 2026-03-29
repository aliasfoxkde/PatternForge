/**
 * RowCounter - Compact row counter component.
 *
 * Shows current row / total rows with up/down buttons
 * and a small progress bar below.
 */

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback } from "react";

export interface RowCounterProps {
  totalRows: number;
  currentRow: number;
  onRowChange: (row: number) => void;
}

export function RowCounter({ totalRows, currentRow, onRowChange }: RowCounterProps) {
  const handleUp = useCallback(() => {
    onRowChange(Math.min(totalRows, currentRow + 1));
  }, [currentRow, totalRows, onRowChange]);

  const handleDown = useCallback(() => {
    onRowChange(Math.max(1, currentRow - 1));
  }, [currentRow, onRowChange]);

  const pct = totalRows > 0 ? ((currentRow / totalRows) * 100) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDown}
          disabled={currentRow <= 1}
          className="rounded p-0.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-30"
          title="Previous row"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
        <span className="min-w-[5.5rem] text-center text-[11px] tabular-nums text-text-primary">
          Row {currentRow} / {totalRows}
        </span>
        <button
          type="button"
          onClick={handleUp}
          disabled={currentRow >= totalRows}
          className="rounded p-0.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:opacity-30"
          title="Next row"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
      </div>
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-craft-500 transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
