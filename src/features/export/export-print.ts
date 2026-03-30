/**
 * Print export utility for PatternForge patterns.
 *
 * Renders the pattern into a hidden iframe and triggers the browser's
 * native print dialog, using print-friendly CSS.
 */

import { oklchToHex } from "@/engine/color/colors";
import type { Pattern } from "@/engine/pattern/types";

export interface PrintOptions {
  /** Size of each cell in pixels */
  cellSize?: number;
  /** Draw grid lines between cells */
  showGridLines?: boolean;
  /** Render cell symbols */
  showSymbols?: boolean;
  /** Show row numbers on left side */
  showRowNumbers?: boolean;
  /** Show column numbers on top */
  showColumnNumbers?: boolean;
  /** Interval for row/column numbers (default: 10) */
  numberInterval?: number;
}

/**
 * Print the current pattern using a hidden iframe.
 *
 * Creates a temporary iframe, renders the pattern as an HTML table,
 * and opens the browser's print dialog. The iframe is cleaned up
 * automatically after printing.
 *
 * @param pattern - The pattern to print
 * @param options - Optional print settings
 */
export function printPattern(
  pattern: Pattern,
  options?: PrintOptions,
): void {
  const {
    cellSize = 16,
    showGridLines = true,
    showSymbols = false,
    showRowNumbers = true,
    showColumnNumbers = true,
    numberInterval = 10,
  } = options ?? {};

  const { grid } = pattern;
  const { width, height } = grid;

  // Build cell lookup for efficient access
  const cellMap = new Map<string, { color: string | null; symbol: string | null }>();
  grid.forEach((cell) => {
    cellMap.set(`${cell.row},${cell.col}`, {
      color: cell.color,
      symbol: cell.symbol,
    });
  });

  // Generate table rows
  let tableRows = "";

  // Column number header row
  if (showColumnNumbers) {
    let colHeaderCells = '<th style="border:none;"></th>';
    for (let col = 0; col < width; col++) {
      if (col > 0 && col % numberInterval === 0) {
        colHeaderCells += `<th style="width:${cellSize}px;font-size:9px;color:#888;font-weight:normal;border:none;padding:0;">${col}</th>`;
      } else {
        colHeaderCells += `<th style="width:${cellSize}px;border:none;padding:0;"></th>`;
      }
    }
    tableRows += `<tr>${colHeaderCells}</tr>`;
  }

  for (let row = 0; row < height; row++) {
    let cells = "";

    // Row number cell
    if (showRowNumbers && row > 0 && row % numberInterval === 0) {
      cells += `<td style="font-size:9px;color:#888;text-align:right;padding-right:4px;border:none;white-space:nowrap;">${row}</td>`;
    } else if (showRowNumbers) {
      cells += `<td style="border:none;padding:0;"></td>`;
    }

    for (let col = 0; col < width; col++) {
      const cellData = cellMap.get(`${row},${col}`);
      const bg = cellData?.color
        ? oklchToHex(cellData.color)
        : "#ffffff";
      const symbolText =
        showSymbols && cellData?.symbol
          ? `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:${Math.max(8, cellSize * 0.6)}px;font-family:monospace;color:rgba(0,0,0,0.7);pointer-events:none">${cellData.symbol}</span>`
          : "";

      const borderStyle = showGridLines
        ? "border:1px solid #ccc;"
        : "";

      cells += `<td style="width:${cellSize}px;height:${cellSize}px;background:${bg};${borderStyle}position:relative;padding:0;overflow:hidden">${symbolText}</td>`;
    }
    tableRows += `<tr>${cells}</tr>`;
  }

  const patternName = pattern.metadata.name ?? "Pattern";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${patternName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    h1 { font-size: 18px; margin-bottom: 8px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
    table { border-collapse: collapse; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${patternName}</h1>
  <div class="meta">${width} x ${height} cells &middot; ${grid.getCellCount()} populated</div>
  <table>${tableRows}</table>
</body>
</html>`;

  // Create hidden iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to render, then print
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      // Clean up after a short delay to allow the print dialog to open
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  };
}
