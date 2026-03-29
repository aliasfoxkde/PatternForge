import { useParams } from "react-router-dom";
import { Download, Share2, Eye } from "lucide-react";

export function SharedPatternPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary">Shared Pattern</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-craft-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
            <Eye className="h-10 w-10" />
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              Shared Pattern View
            </h2>
            <p className="text-sm text-text-secondary">
              This pattern was shared with you.
            </p>
          </div>

          {id && (
            <div className="rounded-lg border border-border bg-surface-secondary px-4 py-2 font-mono text-sm text-text-secondary">
              ID: {id}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              <Eye className="h-4 w-4" />
              View Pattern
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-craft-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-craft-700"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
