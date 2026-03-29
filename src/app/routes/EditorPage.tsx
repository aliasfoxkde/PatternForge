import { useParams } from "react-router-dom";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Save,
  Pencil,
  Square,
  Pipette,
  Paintbrush,
  Eraser,
  Type,
} from "lucide-react";

const tools = [
  { icon: Pencil, label: "Draw", shortcut: "D" },
  { icon: Eraser, label: "Eraser", shortcut: "E" },
  { icon: Paintbrush, label: "Brush", shortcut: "B" },
  { icon: Pipette, label: "Eyedropper", shortcut: "I" },
  { icon: Square, label: "Rectangle", shortcut: "R" },
  { icon: Type, label: "Text", shortcut: "T" },
];

export function EditorPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Top Bar */}
      <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-text-primary">
            {id ?? "Untitled Pattern"}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <div className="mx-2 h-5 w-px bg-border" />
          <button
            type="button"
            className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs text-text-secondary">
            100%
          </span>
          <button
            type="button"
            className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-craft-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-craft-700"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools */}
        <aside className="flex w-12 flex-col items-center gap-1 border-r border-border bg-surface-secondary py-2">
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
              title={`${tool.label} (${tool.shortcut})`}
            >
              <tool.icon className="h-4 w-4" />
            </button>
          ))}
        </aside>

        {/* Center - Canvas Area */}
        <main className="flex flex-1 items-center justify-center bg-surface-tertiary">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border-strong text-text-muted">
              <Pencil className="h-7 w-7" />
            </div>
            <div>
              <h2 className="mb-1 text-lg font-semibold text-text-primary">
                Pattern Editor
              </h2>
              <p className="text-sm text-text-secondary">
                Select or create a pattern to begin
              </p>
            </div>
            <a
              href="/editor"
              className="rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
            >
              New Pattern
            </a>
          </div>
        </main>

        {/* Right Sidebar - Properties (placeholder) */}
        <aside className="hidden w-64 border-l border-border bg-surface-secondary p-4 lg:block">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Properties
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Width
              </label>
              <div className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-muted">
                40 stitches
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Height
              </label>
              <div className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-muted">
                40 rows
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Craft Type
              </label>
              <div className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-muted">
                Cross Stitch
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
