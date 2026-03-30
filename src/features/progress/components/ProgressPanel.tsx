/**
 * ProgressPanel - Slide-out panel showing progress details.
 *
 * Includes row counter, completion stats, per-row completion bars,
 * and actions to mark rows complete or reset progress.
 */

import { ProgressStats } from "./ProgressStats";
import { RowCounter } from "./RowCounter";
import { usePatternStore } from "@/shared/stores/pattern-store";
import { useProgressStore } from "@/features/progress/progress-store";
import { CheckCircle, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FocusTrap } from "@/shared/ui";

export interface ProgressPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ProgressPanel({ open, onClose }: ProgressPanelProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const pattern = usePatternStore((s) => s.pattern);
  const currentRow = useProgressStore((s) => s.currentRow);
  const setCurrentRow = useProgressStore((s) => s.setCurrentRow);
  const getCompletedStitches = useProgressStore((s) => s.getCompletedStitches);
  const getRowCompletion = useProgressStore((s) => s.getRowCompletion);
  const getCompletedRowCount = useProgressStore((s) => s.getCompletedRowCount);
  const markRowCompleted = useProgressStore((s) => s.markRowCompleted);
  const resetProgress = useProgressStore((s) => s.resetProgress);
  const loadProgress = useProgressStore((s) => s.loadProgress);

  const gridWidth = pattern?.grid.width ?? 0;
  const gridHeight = pattern?.grid.height ?? 0;
  const totalStitches = gridWidth * gridHeight;

  // Load progress when pattern changes
  useEffect(() => {
    if (pattern) {
      loadProgress(pattern.id, totalStitches);
    }
  }, [pattern?.id, totalStitches, loadProgress]);

  // Reset confirmation timeout
  useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  const completedStitches = getCompletedStitches();
  const completedRows = getCompletedRowCount(gridHeight, gridWidth);

  const handleMarkCurrentRow = useCallback(() => {
    // currentRow is 1-indexed; grid rows are 0-indexed
    markRowCompleted(currentRow - 1, gridWidth);
  }, [currentRow, gridWidth, markRowCompleted]);

  const handleReset = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetProgress();
    setConfirmReset(false);
  }, [confirmReset, resetProgress]);

  // Per-row completion data (memoized)
  const rowCompletions = useMemo(() => {
    const rows: Array<{ row: number; pct: number }> = [];
    for (let r = 0; r < gridHeight; r++) {
      rows.push({
        row: r + 1,
        pct: getRowCompletion(r, gridWidth),
      });
    }
    return rows;
  }, [gridHeight, gridWidth, getRowCompletion]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="presentation"
      />

      {/* Panel */}
      <FocusTrap active={open} onEscape={onClose}>
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col border-l border-border bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="progress-panel-title" className="text-sm font-semibold text-text-primary">Progress</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
            aria-label="Close progress panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {pattern ? (
            <div className="space-y-5">
              {/* Row counter */}
              <div>
                <span className="mb-2 block text-xs font-medium text-text-secondary">
                  Current Row
                </span>
                <RowCounter
                  totalRows={gridHeight}
                  currentRow={currentRow}
                  onRowChange={setCurrentRow}
                />
              </div>

              {/* Stats */}
              <ProgressStats
                totalStitches={totalStitches}
                completedStitches={completedStitches}
                totalRows={gridHeight}
                completedRows={completedRows}
              />

              {/* Per-row completion */}
              <div>
                <span className="mb-2 block text-xs font-medium text-text-secondary">
                  Row Completion
                </span>
                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                  {rowCompletions.map(({ row, pct }) => (
                    <div
                      key={row}
                      className={`flex items-center gap-2 rounded px-1 py-0.5 text-[10px] tabular-nums ${
                        row === currentRow
                          ? "bg-craft-100 text-craft-700"
                          : "text-text-muted"
                      }`}
                    >
                      <span className="w-6 text-right">{row}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className={`h-full rounded-full transition-all duration-150 ${
                            pct >= 100
                              ? "bg-craft-500"
                              : pct > 0
                                ? "bg-craft-300"
                                : "bg-transparent"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right">
                        {pct >= 100 ? "Done" : `${Math.round(pct)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">No pattern loaded.</p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={handleMarkCurrentRow}
            disabled={!pattern}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-craft-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-craft-700 disabled:opacity-50"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Mark Row Complete
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!pattern}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
              confirmReset
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-border text-text-secondary hover:bg-surface-tertiary hover:text-text-primary"
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {confirmReset ? "Confirm?" : "Reset"}
          </button>
        </div>
      </aside>
      </FocusTrap>
    </>
  );
}
