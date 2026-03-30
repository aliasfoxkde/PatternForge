import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Palette,
  Image,
  FileText,
  BarChart3,
  Calculator,
  Download,
  Github,
  Star,
  ArrowRight,
  Sparkles,
  WifiOff,
  UserX,
  Monitor,
} from "lucide-react";

// ---- Data ----

const features = [
  {
    icon: Palette,
    title: "Pattern Editor",
    description:
      "Grid-based editor with drawing tools, color palettes, and stitch markers for any craft type.",
  },
  {
    icon: Image,
    title: "Image to Pattern",
    description:
      "Convert photos into patterns with adjustable color counts, dithering, and size controls.",
  },
  {
    icon: FileText,
    title: "Written Instructions",
    description:
      "Auto-generate row-by-row instructions for knitting, crochet, and cross-stitch.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Mark progress directly on the grid. Track stitch counts, colors used, and completion.",
  },
  {
    icon: Calculator,
    title: "Calculators",
    description:
      "Fabric yardage, thread counts, and time estimators for confident project planning.",
  },
  {
    icon: Download,
    title: "Export & Share",
    description:
      "Export as PDF, PNG, SVG, CSV, or JSON. Share patterns via cloud link.",
  },
];

const crafts = [
  { name: "Cross Stitch", emoji: "\u{1F9F5}" },
  { name: "Knitting", emoji: "\u{1F9F6}" },
  { name: "Crochet", emoji: "\u{1FAA1}" },
  { name: "Diamond Painting", emoji: "\u{1F48E}" },
  { name: "Fuse Beads", emoji: "\u{1F534}" },
  { name: "Pixel Art", emoji: "\u{1F3A8}" },
];

// ---- Fade-in on scroll hook ----

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function FadeIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

// ---- Mini demo canvas ----

function MiniDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 120;
    canvas.width = size;
    canvas.height = size;
    const cellSize = 12;
    const cols = 8;
    const rows = 8;

    // Draw grid background
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize);
      ctx.lineTo(cols * cellSize, r * cellSize);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize, 0);
      ctx.lineTo(c * cellSize, rows * cellSize);
      ctx.stroke();
    }

    // Draw a simple heart pattern
    const heartCells = [
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
      [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6],
      [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6],
      [5, 2], [5, 3], [5, 4], [5, 5],
      [6, 3], [6, 4],
    ];

    const colors = ["#c084fc", "#a855f7", "#9333ea", "#7c3aed", "#d8b4fe", "#e9d5ff"];

    heartCells.forEach(([r, c], i) => {
      ctx.fillStyle = colors[i % colors.length]!;
      ctx.fillRect(c! * cellSize + 1, r! * cellSize + 1, cellSize - 2, cellSize - 2);
    });
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-white/10 shadow-lg"
      style={{ width: 120, height: 120 }}
    />
  );
}

// ---- Main page ----

export function LandingPage() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/aliasfoxkde/PatternForge")
      .then((r) => r.json())
      .then((data) => setStars(data.stargazers_count ?? 0))
      .catch(() => setStars(null));
  }, []);

  return (
    <div className="flex min-h-full w-full flex-col overflow-y-auto bg-surface text-text-primary">
      {/* ---- Hero Section ---- */}
      <section className="relative flex flex-col items-center overflow-hidden px-6 pb-16 pt-12 text-center sm:pb-20 sm:pt-20">
        {/* Animated gradient background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 20%, var(--color-craft-200), transparent), radial-gradient(ellipse 60% 50% at 20% 80%, var(--color-craft-100), transparent), radial-gradient(ellipse 60% 50% at 80% 60%, var(--color-craft-300), transparent)",
            animation: "heroPulse 8s ease-in-out infinite alternate",
          }}
        />

        <div className="relative z-10">
          {/* Social proof badges */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-craft-200 bg-craft-50 px-3 py-1 text-xs font-medium text-craft-700 dark:border-craft-800 dark:bg-craft-950/50 dark:text-craft-300">
              <Sparkles className="h-3 w-3" />
              Open Source
            </span>
            {stars !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                <Star className="h-3 w-3" />
                {stars.toLocaleString()} stars
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <UserX className="h-3 w-3" />
              No sign-up
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
              <WifiOff className="h-3 w-3" />
              Works offline
            </span>
          </div>

          <h1 className="mb-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:mb-6 sm:text-5xl lg:text-6xl">
            Design.{" "}
            <span className="bg-gradient-to-r from-craft-600 to-craft-400 bg-clip-text text-transparent dark:from-craft-400 dark:to-craft-300">
              Simulate.
            </span>{" "}
            Stitch.
          </h1>

          <p className="mb-8 max-w-2xl text-base leading-relaxed text-text-secondary sm:mb-10 sm:text-lg">
            Free, browser-based pattern design for cross stitch, knitting, crochet,
            diamond painting, fuse beads, and pixel art. Your patterns, your way.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-lg bg-craft-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-craft-700 hover:shadow-lg"
            >
              Create Your First Pattern
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:bg-surface-tertiary"
            >
              Browse Community Patterns
            </Link>
          </div>

          {/* Mini demo */}
          <div className="mt-10 flex justify-center sm:mt-12">
            <MiniDemo />
          </div>
        </div>

        {/* Hero gradient animation keyframes */}
        <style>{`
          @keyframes heroPulse {
            0% { opacity: 0.3; }
            100% { opacity: 0.5; }
          }
        `}</style>
      </section>

      {/* ---- Features Section ---- */}
      <section className="border-t border-border bg-surface-secondary px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
              Everything you need to create
            </h2>
            <p className="mb-12 text-center text-text-secondary">
              Powerful tools wrapped in a simple, intuitive interface.
            </p>
          </FadeIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} className={i > 0 ? "" : ""}>
                <div className="group rounded-xl border border-border bg-surface p-6 shadow-sm transition-all hover:border-craft-300 hover:shadow-md">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-craft-100 text-craft-600 transition-colors group-hover:bg-craft-200 dark:bg-craft-900/50 dark:text-craft-400 dark:group-hover:bg-craft-800/50">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Supported Crafts Section ---- */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <h2 className="mb-2 text-2xl font-bold sm:text-3xl">
              Built for every craft
            </h2>
            <p className="mb-10 text-text-secondary">
              One tool, six craft types. Switch between modes instantly.
            </p>
          </FadeIn>

          <FadeIn>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {crafts.map((craft) => (
                <div
                  key={craft.name}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium transition-all hover:border-craft-300 hover:bg-craft-50 dark:hover:bg-craft-950/50"
                >
                  <span className="text-lg">{craft.emoji}</span>
                  {craft.name}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ---- Open Source Section ---- */}
      <section className="border-t border-border bg-surface-secondary px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <h2 className="mb-2 text-2xl font-bold sm:text-3xl">Free & Open Source</h2>
            <p className="mb-8 text-text-secondary">
              MIT-licensed and built in the open. Contribute, fork, or customize it
              to fit your workflow.
            </p>
          </FadeIn>

          <FadeIn>
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
          </FadeIn>

          <FadeIn>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted">
              <div className="flex items-center gap-1.5">
                <Monitor className="h-4 w-4" />
                Runs in the browser
              </div>
              <div className="flex items-center gap-1.5">
                <WifiOff className="h-4 w-4" />
                Works offline
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500" />
                {stars !== null ? `${stars.toLocaleString()} GitHub stars` : "Star on GitHub"}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="px-6 py-16">
        <FadeIn>
          <div className="mx-auto max-w-lg text-center">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
              Ready to start stitching?
            </h2>
            <p className="mb-6 text-text-secondary">
              No account needed. Open the editor and create your first pattern in seconds.
            </p>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-lg bg-craft-600 px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-craft-700 hover:shadow-lg"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border bg-surface px-6 py-6">
        <div className="mx-auto flex flex-col items-center justify-between gap-2 text-sm text-text-muted sm:flex-row">
          <p>PatternForge &mdash; Open-source pattern design</p>
          <div className="flex items-center gap-4">
            <Link to="/help" className="transition-colors hover:text-text-primary">
              Help
            </Link>
            <Link to="/about" className="transition-colors hover:text-text-primary">
              About
            </Link>
            <a
              href="https://github.com/aliasfoxkde/PatternForge"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-text-primary"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
