import { Link } from "react-router-dom";
import {
  Palette,
  Image,
  FileText,
  BarChart3,
  Calculator,
  Download,
  Github,
  Heart,
  Star,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Pattern Editor",
    description:
      "Intuitive grid-based editor with drawing tools, color palettes, and stitch markers for any craft type.",
  },
  {
    icon: Image,
    title: "Image to Pattern",
    description:
      "Convert photos and artwork into patterns with adjustable color counts, dithering, and size controls.",
  },
  {
    icon: FileText,
    title: "Written Instructions",
    description:
      "Auto-generate row-by-row written instructions from your pattern for knitting, crochet, and more.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Mark your progress directly on the pattern grid. Track stitch counts, colors used, and completion.",
  },
  {
    icon: Calculator,
    title: "Calculators",
    description:
      "Fabric yardage, thread counts, and time estimators. Plan your projects with confidence.",
  },
  {
    icon: Download,
    title: "Export & Share",
    description:
      "Export as PDF, PNG, or SVG. Share patterns via link or export for print-ready charts.",
  },
];

const crafts = [
  { name: "Knitting", emoji: "🧶" },
  { name: "Crochet", emoji: "🪡" },
  { name: "Cross Stitch", emoji: "🧵" },
  { name: "Diamond Painting", emoji: "💎" },
  { name: "Fuse Beads", emoji: "🔴" },
  { name: "Pixel Art", emoji: "🎨" },
];

export function LandingPage() {
  return (
    <div className="flex min-h-full flex-col overflow-y-auto bg-surface text-text-primary">
      {/* Hero Section */}
      <section className="flex flex-col items-center px-6 pb-16 pt-20 text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-craft-200 bg-craft-50 px-4 py-1.5 text-sm text-craft-700">
          <Sparkles className="h-4 w-4" />
          Open-source pattern design for every craft
        </div>

        <h1 className="mb-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Design.{" "}
          <span className="text-craft-600">Simulate.</span> Stitch.
        </h1>

        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-text-secondary">
          PatternForge is a free, browser-based pattern design tool for knitting,
          crochet, cross stitch, diamond painting, fuse beads, and pixel art.
          No sign-up required. Your patterns, your way.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 rounded-lg bg-craft-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-craft-700 hover:shadow-lg"
          >
            Start Creating
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:bg-surface-secondary"
          >
            View Gallery
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-surface-secondary px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-center text-3xl font-bold">
            Everything you need to create
          </h2>
          <p className="mb-12 text-center text-text-secondary">
            Powerful tools wrapped in a simple, intuitive interface.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-craft-300 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-craft-100 text-craft-600 transition-colors group-hover:bg-craft-200">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Crafts Section */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-2 text-3xl font-bold">
            Built for every craft
          </h2>
          <p className="mb-10 text-text-secondary">
            One tool, six craft types. Switch between modes instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {crafts.map((craft) => (
              <div
                key={craft.name}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium transition-all hover:border-craft-300 hover:bg-craft-50"
              >
                <span className="text-lg">{craft.emoji}</span>
                {craft.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="border-t border-border bg-surface-secondary px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-2 text-3xl font-bold">Free & Open Source</h2>
          <p className="mb-8 text-text-secondary">
            PatternForge is MIT-licensed and built in the open. Contribute, fork,
            or customize it to fit your workflow.
          </p>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/aliasfoxkde/PatternForge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-text-primary px-6 py-3 text-sm font-semibold text-surface transition-all hover:opacity-90"
            >
              <Github className="h-5 w-5" />
              View on GitHub
            </a>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-secondary">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              MIT License
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-text-muted">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-rose-500" />
              Community driven
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-amber-500" />
              Self-hosted option
            </div>
            <div className="flex items-center gap-1.5">
              <Github className="h-4 w-4" />
              Open contributions
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-text-muted">
            PatternForge &mdash; Open-source pattern design
          </p>
          <nav className="flex items-center gap-6 text-sm text-text-secondary">
            <Link to="/editor" className="transition-colors hover:text-craft-600">
              Editor
            </Link>
            <Link to="/gallery" className="transition-colors hover:text-craft-600">
              Gallery
            </Link>
            <Link to="/image-converter" className="transition-colors hover:text-craft-600">
              Image Converter
            </Link>
            <Link to="/calculators" className="transition-colors hover:text-craft-600">
              Calculators
            </Link>
            <Link to="/settings" className="transition-colors hover:text-craft-600">
              Settings
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
