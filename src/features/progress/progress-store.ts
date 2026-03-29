/**
 * Progress store - tracks completion progress on the current pattern.
 *
 * Uses Zustand v5 with persist middleware to save progress to localStorage.
 * The completedCells Set is serialized as an array and deserialized back.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

interface ProgressState {
  /** Current row being worked on (1-indexed) */
  currentRow: number;
  setCurrentRow: (row: number) => void;

  /** Set of completed cell keys "row,col" */
  completedCells: Set<string>;

  /** Current pattern ID for persistence */
  _patternId: string;

  /** Total stitches in pattern (computed from grid) */
  _totalStitches: number;

  /** Mark a cell as completed */
  markCellCompleted: (row: number, col: number) => void;

  /** Mark a cell as not completed */
  markCellIncomplete: (row: number, col: number) => void;

  /** Toggle a cell's completed state */
  toggleCellCompleted: (row: number, col: number) => void;

  /** Mark entire row as completed */
  markRowCompleted: (row: number, totalCols: number) => void;

  /** Mark entire row as incomplete */
  markRowIncomplete: (row: number, totalCols: number) => void;

  /** Get total completed stitches count */
  getCompletedStitches: () => number;

  /** Get completion percentage (0-100) */
  getCompletionPercentage: () => number;

  /** Get row completion status (0-100) */
  getRowCompletion: (row: number, totalCols: number) => number;

  /** Get count of fully completed rows */
  getCompletedRowCount: (totalRows: number, totalCols: number) => number;

  /** Reset all progress */
  resetProgress: () => void;

  /** Load progress for a pattern */
  loadProgress: (patternId: string, totalStitches: number) => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      currentRow: 1,
      completedCells: new Set<string>(),
      _patternId: "",
      _totalStitches: 0,

      setCurrentRow: (row: number) => set({ currentRow: Math.max(1, row) }),

      markCellCompleted: (row: number, col: number) => {
        const { completedCells } = get();
        const next = new Set(completedCells);
        next.add(cellKey(row, col));
        set({ completedCells: next });
      },

      markCellIncomplete: (row: number, col: number) => {
        const { completedCells } = get();
        const next = new Set(completedCells);
        next.delete(cellKey(row, col));
        set({ completedCells: next });
      },

      toggleCellCompleted: (row: number, col: number) => {
        const { completedCells } = get();
        const key = cellKey(row, col);
        const next = new Set(completedCells);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        set({ completedCells: next });
      },

      markRowCompleted: (row: number, totalCols: number) => {
        const { completedCells } = get();
        const next = new Set(completedCells);
        for (let c = 0; c < totalCols; c++) {
          next.add(cellKey(row, c));
        }
        set({ completedCells: next });
      },

      markRowIncomplete: (row: number, totalCols: number) => {
        const { completedCells } = get();
        const next = new Set(completedCells);
        for (let c = 0; c < totalCols; c++) {
          next.delete(cellKey(row, c));
        }
        set({ completedCells: next });
      },

      getCompletedStitches: () => {
        return get().completedCells.size;
      },

      getCompletionPercentage: () => {
        const { completedCells, _totalStitches } = get();
        if (_totalStitches <= 0) return 0;
        return Math.min(100, (completedCells.size / _totalStitches) * 100);
      },

      getRowCompletion: (row: number, totalCols: number) => {
        if (totalCols <= 0) return 0;
        const { completedCells } = get();
        let count = 0;
        for (let c = 0; c < totalCols; c++) {
          if (completedCells.has(cellKey(row, c))) count++;
        }
        return (count / totalCols) * 100;
      },

      getCompletedRowCount: (totalRows: number, totalCols: number) => {
        const { completedCells } = get();
        let completed = 0;
        for (let r = 0; r < totalRows; r++) {
          let rowComplete = true;
          for (let c = 0; c < totalCols; c++) {
            if (!completedCells.has(cellKey(r, c))) {
              rowComplete = false;
              break;
            }
          }
          if (rowComplete) completed++;
        }
        return completed;
      },

      resetProgress: () => {
        set({
          currentRow: 1,
          completedCells: new Set<string>(),
        });
      },

      loadProgress: (patternId: string, totalStitches: number) => {
        const { _patternId } = get();
        // If switching to a different pattern, clear progress
        if (_patternId !== patternId) {
          set({
            _patternId: patternId,
            _totalStitches: totalStitches,
            currentRow: 1,
            completedCells: new Set<string>(),
          });
        } else {
          set({
            _patternId: patternId,
            _totalStitches: totalStitches,
          });
        }
      },
    }),
    {
      name: "patternforge-progress",
      // Only persist these fields; reconstruct Set from array on load
      partialize: (state) => ({
        _patternId: state._patternId,
        currentRow: state.currentRow,
        completedCells: Array.from(state.completedCells),
      }),
      // Merge persisted data back, reconstructing the Set
      merge: (persisted, current) => {
        const p = persisted as {
          _patternId?: string;
          currentRow?: number;
          completedCells?: string[];
        };
        return {
          ...current,
          _patternId: p._patternId ?? current._patternId,
          currentRow: p.currentRow ?? current.currentRow,
          completedCells: Array.isArray(p.completedCells)
            ? new Set(p.completedCells)
            : new Set<string>(),
        };
      },
    },
  ),
);
