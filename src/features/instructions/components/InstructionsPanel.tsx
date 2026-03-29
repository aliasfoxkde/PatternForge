/**
 * InstructionsPanel - Displays generated written instructions for a pattern.
 *
 * Supports knitting (flat & round), crochet (standard & C2C), and
 * cross-stitch. Shows a summary at top, then row-by-row details (or
 * color-usage table + stitch list for cross-stitch).
 */

import type { Pattern } from "@/engine/pattern/types";
import { CRAFT_TYPE_LABELS } from "@/engine/pattern/types";
import {
  generateInstructions,
  formatInstructionsAsText,
} from "@/features/instructions/generators";
import type {
  KnittingInstructions,
  CrochetInstructions,
  CrossStitchInstructions,
  InstructionRow,
} from "@/features/instructions/generators";
import { Clipboard, FileText, X } from "lucide-react";
import { useCallback, useState } from "react";

export interface InstructionsPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** The pattern to generate instructions for */
  pattern: Pattern;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummarySection({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-tertiary px-4 py-3 text-sm leading-relaxed text-text-primary">
      {text}
    </div>
  );
}

function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = getText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getText]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
    >
      <Clipboard className="h-3.5 w-3.5" />
      {copied ? "Copied!" : "Copy to Clipboard"}
    </button>
  );
}

function StitchBadge({ stitch }: { stitch: import("@/features/instructions/generators").InstructionStitch }) {
  const colorStyle = stitch.color
    ? { backgroundColor: stitch.color, color: "#fff" }
    : undefined;

  const label =
    stitch.count > 1
      ? `${stitch.stitchType} ${stitch.count}`
      : stitch.stitchType;

  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
      style={colorStyle}
    >
      {label}
    </span>
  );
}

function RowDetailView({ row }: { row: InstructionRow }) {
  const side = row.direction === "right-to-left" ? "RS" : "WS";

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-text-primary">
          Row {row.rowNumber}
        </span>
        <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
          {side} &middot; {row.direction}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {row.stitches.map((s, i) => (
          <StitchBadge key={`${row.rowNumber}-${i}`} stitch={s} />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-text-muted">{row.notes}</p>
    </div>
  );
}

function ColorUsageTable({
  colorList,
}: {
  colorList: import("@/features/instructions/generators").ColorUsage[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-tertiary">
            <th className="px-3 py-2 text-xs font-semibold text-text-secondary">Color</th>
            <th className="px-3 py-2 text-xs font-semibold text-text-secondary">Swatch</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">Stitches</th>
            <th className="px-3 py-2 text-right text-xs font-semibold text-text-secondary">%</th>
          </tr>
        </thead>
        <tbody>
          {colorList.map((cu) => (
            <tr key={cu.color} className="border-b border-border last:border-b-0">
              <td className="px-3 py-2 font-mono text-xs text-text-primary">{cu.color}</td>
              <td className="px-3 py-2">
                <span
                  className="inline-block h-4 w-4 rounded border border-border"
                  style={{ backgroundColor: cu.color }}
                />
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-text-primary">{cu.count}</td>
              <td className="px-3 py-2 text-right tabular-nums text-text-muted">{cu.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StitchListView({
  stitchList,
}: {
  stitchList: import("@/features/instructions/generators").StitchEntry[];
}) {
  return (
    <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-0.5 overflow-y-auto font-mono text-[11px] leading-relaxed text-text-secondary">
      {stitchList.map((s, i) => (
        <span key={`${s.row}-${s.col}-${i}`}>
          ({s.row},{s.col})
          {s.symbol ? ` ${s.symbol}` : ""}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Craft-specific instruction views
// ---------------------------------------------------------------------------

function KnittingView({ instructions }: { instructions: KnittingInstructions }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>{instructions.totalRows} rows</span>
        <span>&middot;</span>
        <span>{instructions.totalStitches} stitches</span>
        <span>&middot;</span>
        <span>{instructions.colorChanges} color changes</span>
      </div>
      {instructions.rows.map((row) => (
        <RowDetailView key={row.rowNumber} row={row} />
      ))}
    </div>
  );
}

function CrochetView({ instructions }: { instructions: CrochetInstructions }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>{instructions.totalRows} rows</span>
        <span>&middot;</span>
        <span>{instructions.totalStitches} stitches</span>
        <span>&middot;</span>
        <span>{instructions.colorChanges} color changes</span>
      </div>
      {instructions.rows.map((row) => (
        <RowDetailView key={row.rowNumber} row={row} />
      ))}
    </div>
  );
}

function CrossStitchView({ instructions }: { instructions: CrossStitchInstructions }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span>{instructions.totalStitches} stitches</span>
        <span>&middot;</span>
        <span>{instructions.colorCount} colors</span>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold text-text-secondary">Color Usage</h3>
        <ColorUsageTable colorList={instructions.colorList} />
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold text-text-secondary">
          Stitch List ({instructions.stitchList.length} total)
        </h3>
        <StitchListView stitchList={instructions.stitchList} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function InstructionsPanel({ open, onClose, pattern }: InstructionsPanelProps) {
  const [instructions, setInstructions] = useState<
    | KnittingInstructions
    | CrochetInstructions
    | CrossStitchInstructions
    | null
  >(null);

  const craftType = pattern.metadata.craftType;
  const craftLabel = CRAFT_TYPE_LABELS[craftType];

  const handleGenerate = useCallback(() => {
    const result = generateInstructions(pattern.grid, craftType);
    setInstructions(result);
  }, [pattern.grid, craftType]);

  const handleGetText = useCallback((): string => {
    if (!instructions) return "";
    return formatInstructionsAsText(instructions);
  }, [instructions]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="presentation"
      />

      {/* Dialog */}
      <div className="relative z-10 mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-craft-600" />
            <h2 className="text-base font-semibold text-text-primary">
              Written Instructions
            </h2>
            <span className="rounded bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-text-muted">
              {craftLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!instructions ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-border-strong text-text-muted">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">
                  Generate row-by-row written instructions for your pattern.
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {pattern.grid.width} x {pattern.grid.height} grid &middot; {craftLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
              >
                <FileText className="h-4 w-4" />
                Generate Instructions
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <SummarySection text={instructions.summary} />

              {/* Craft-specific content */}
              {instructions.craftType === "knitting-flat" ||
              instructions.craftType === "knitting-round" ? (
                <KnittingView instructions={instructions as KnittingInstructions} />
              ) : instructions.craftType === "crochet-standard" ||
                instructions.craftType === "crochet-c2c" ? (
                <CrochetView instructions={instructions as CrochetInstructions} />
              ) : instructions.craftType === "cross-stitch" ? (
                <CrossStitchView instructions={instructions as CrossStitchInstructions} />
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          {instructions && <CopyButton getText={handleGetText} />}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
