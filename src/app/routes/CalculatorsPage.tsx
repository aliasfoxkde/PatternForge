import { Ruler, Scissors, Clock, Lock } from "lucide-react";

const calculators = [
  {
    icon: Ruler,
    title: "Fabric Calculator",
    description:
      "Estimate fabric yardage based on pattern dimensions, stitch gauge, and desired margins.",
    color: "bg-craft-100 text-craft-600",
  },
  {
    icon: Scissors,
    title: "Thread Calculator",
    description:
      "Calculate total thread usage by color based on stitch count, thread length per stitch, and waste factor.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Clock,
    title: "Time Estimator",
    description:
      "Estimate project completion time from pattern size, stitch type, and your personal stitching speed.",
    color: "bg-teal-50 text-teal-600",
  },
];

export function CalculatorsPage() {
  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-text-primary">Calculators</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Plan your projects with precision
        </p>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {calculators.map((calc) => (
            <div
              key={calc.title}
              className="group relative flex flex-col rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-craft-300 hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${calc.color}`}
              >
                <calc.icon className="h-5 w-5" />
              </div>

              <h3 className="mb-2 text-base font-semibold text-text-primary">
                {calc.title}
              </h3>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-text-secondary">
                {calc.description}
              </p>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-surface-secondary px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-tertiary"
                disabled
              >
                <Lock className="h-3.5 w-3.5" />
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
