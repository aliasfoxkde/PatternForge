import { Link } from "react-router-dom";
import { Plus, FolderOpen, Grid3X3 } from "lucide-react";

export function GalleryPage() {
  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary">My Patterns</h1>
        <Link
          to="/editor"
          className="inline-flex items-center gap-2 rounded-lg bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
        >
          <Plus className="h-4 w-4" />
          New Pattern
        </Link>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
            <FolderOpen className="h-10 w-10" />
          </div>
          <div>
            <h2 className="mb-2 text-lg font-semibold text-text-primary">
              No patterns yet
            </h2>
            <p className="max-w-sm text-sm text-text-secondary">
              Create your first pattern to get started. You can draw from
              scratch, import an image, or start from a template.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-lg bg-craft-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-craft-700"
            >
              <Plus className="h-4 w-4" />
              New Pattern
            </Link>
            <Link
              to="/image-converter"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              Import Image
            </Link>
          </div>
        </div>
      </main>

      {/* Empty Grid Layout (hidden until patterns exist) */}
      <div className="hidden px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-text-muted"
            >
              <Grid3X3 className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
