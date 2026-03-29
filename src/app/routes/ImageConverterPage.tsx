import { Image, Settings2, Palette, Maximize2, Waves } from "lucide-react";

export function ImageConverterPage() {
  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary">
          Image to Pattern
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Convert photos and artwork into craft patterns
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content - Drop Zone */}
        <main className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border-strong bg-surface-secondary p-12 text-center transition-colors hover:border-craft-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-craft-100 text-craft-600">
                <Image className="h-8 w-8" />
              </div>
              <div>
                <h2 className="mb-1 text-base font-semibold text-text-primary">
                  Drop your image here
                </h2>
                <p className="text-sm text-text-secondary">
                  or click to browse. Supports PNG, JPG, GIF, and SVG.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-craft-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-craft-700"
              >
                Choose File
              </button>
              <p className="text-xs text-text-muted">
                Maximum file size: 10 MB
              </p>
            </div>
          </div>
        </main>

        {/* Settings Sidebar */}
        <aside className="w-72 border-l border-border bg-surface-secondary p-4">
          <div className="mb-6 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">
              Conversion Settings
            </h2>
          </div>

          <div className="space-y-5">
            {/* Craft Type */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                <Palette className="h-3.5 w-3.5" />
                Craft Type
              </label>
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted">
                Cross Stitch
              </div>
            </div>

            {/* Color Count */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                <Palette className="h-3.5 w-3.5" />
                Color Count
              </label>
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted">
                24 colors
              </div>
            </div>

            {/* Pattern Size */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                <Maximize2 className="h-3.5 w-3.5" />
                Pattern Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-border bg-surface px-3 py-2 text-center text-sm text-text-muted">
                  100 W
                </div>
                <div className="rounded-md border border-border bg-surface px-3 py-2 text-center text-sm text-text-muted">
                  100 H
                </div>
              </div>
            </div>

            {/* Dithering */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                <Waves className="h-3.5 w-3.5" />
                Dithering
              </label>
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted">
                Floyd-Steinberg
              </div>
            </div>

            {/* Convert Button */}
            <button
              type="button"
              className="w-full rounded-lg bg-craft-600 py-2.5 text-sm font-medium text-white opacity-50 transition-colors"
              disabled
            >
              Upload an image to convert
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
