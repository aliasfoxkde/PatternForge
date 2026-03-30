import { Moon, Sun, Monitor, Grid3X3, Info } from "lucide-react";

const craftTypes = [
  "Cross Stitch",
  "Knitting",
  "Crochet",
  "Diamond Painting",
  "Fuse Beads",
  "Pixel Art",
];

export function SettingsPage() {
  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-lg font-bold text-text-primary sm:text-xl">Settings</h1>
        <p className="mt-0.5 text-sm text-text-secondary">
          Customize your PatternForge experience
        </p>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Theme */}
          <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
              Appearance
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">Theme</h3>
                  <p className="text-xs text-text-secondary">
                    Choose your preferred color scheme
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-secondary p-1">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
                  >
                    <Sun className="h-3.5 w-3.5" />
                    Light
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md bg-craft-600 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    <Moon className="h-3.5 w-3.5" />
                    Dark
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    System
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Default Craft Type */}
          <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
              Defaults
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Default Craft Type
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Pre-select your primary craft when creating new patterns
                  </p>
                </div>
                <select className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-craft-500 focus:outline-none">
                  {craftTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Grid Preferences */}
          <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
              Grid Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Show Grid Lines
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Display grid lines on the pattern canvas
                  </p>
                </div>
                <div className="h-6 w-11 rounded-full bg-craft-600 p-0.5 transition-colors">
                  <div className="h-5 w-5 translate-x-5 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-200" />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">
                    Highlight Every 10
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Bold grid lines every 10 cells for easy counting
                  </p>
                </div>
                <div className="h-6 w-11 rounded-full bg-craft-600 p-0.5 transition-colors">
                  <div className="h-5 w-5 translate-x-5 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-200" />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                    <Grid3X3 className="h-3.5 w-3.5" />
                    Default Grid Size
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Default width and height for new patterns
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border bg-surface px-3 py-1.5 text-center text-sm text-text-primary">
                    40
                  </div>
                  <div className="rounded-md border border-border bg-surface px-3 py-1.5 text-center text-sm text-text-primary">
                    40
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
              About
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Info className="h-4 w-4" />
                  Version
                </div>
                <span className="font-mono text-text-primary">0.1.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">License</span>
                <span className="text-text-primary">MIT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Storage</span>
                <span className="text-text-primary">IndexedDB (local)</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
