/**
 * HelpPage - Keyboard shortcuts, getting started guide, and FAQ.
 */

import { Keyboard, BookOpen, HelpCircle, ExternalLink } from 'lucide-react';

const SHORTCUTS = [
	{ keys: ['P'], action: 'Pencil tool' },
	{ keys: ['B'], action: 'Brush tool' },
	{ keys: ['E'], action: 'Eraser tool' },
	{ keys: ['G'], action: 'Fill (flood fill) tool' },
	{ keys: ['L'], action: 'Line tool' },
	{ keys: ['R'], action: 'Rectangle tool' },
	{ keys: ['O'], action: 'Ellipse tool' },
	{ keys: ['I'], action: 'Color picker (eyedropper)' },
	{ keys: ['T'], action: 'Text tool' },
	{ keys: ['S'], action: 'Selection tool' },
	{ keys: ['H'], action: 'Pan / hand tool' },
	{ keys: ['Ctrl', 'Z'], action: 'Undo' },
	{ keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
	{ keys: ['Ctrl', 'C'], action: 'Copy selection' },
	{ keys: ['Ctrl', 'X'], action: 'Cut selection' },
	{ keys: ['Ctrl', 'V'], action: 'Paste clipboard' },
	{ keys: ['Ctrl', 'S'], action: 'Save pattern' },
	{ keys: ['Delete'], action: 'Delete selection' },
	{ keys: ['Escape'], action: 'Deselect / cancel' },
	{ keys: ['Ctrl', '/'], action: 'Command palette' },
	{ keys: ['+'], action: 'Zoom in' },
	{ keys: ['-'], action: 'Zoom out' },
	{ keys: ['0'], action: 'Fit to view' },
];

const FAQ = [
	{
		q: 'How do I create a new pattern?',
		a: 'Click "New Pattern" in the editor or use the command palette (Ctrl+/). Choose your craft type, set dimensions, and give it a name.',
	},
	{
		q: 'Can I import an image into a pattern?',
		a: 'Yes! Use the Image Converter tool. Upload a photo, adjust the color count and size, then convert it into a stitch pattern.',
	},
	{
		q: 'How do I match colors to DMC floss?',
		a: 'When exporting, PatternForge automatically matches your colors to the nearest DMC floss. You can also browse all DMC colors on the Thread Colors page.',
	},
	{
		q: 'Does PatternForge work offline?',
		a: 'Yes. Once loaded, PatternForge works entirely offline. Your patterns are saved in your browser\'s local storage.',
	},
	{
		q: 'How do I share a pattern?',
		a: 'Click the Share button in the editor to upload your pattern to the cloud. You\'ll get a link that anyone can view.',
	},
	{
		q: 'What file formats can I export?',
		a: 'PDF (for printing), PNG, SVG (for editing in other software), CSV, and JSON (for backup).',
	},
];

export function HelpPage() {
	return (
		<div className="flex h-full w-full flex-col bg-surface">
			{/* Header */}
			<header className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
				<h1 className="text-lg font-bold text-text-primary sm:text-xl">Help</h1>
				<p className="mt-0.5 text-sm text-text-secondary">
					Keyboard shortcuts, guides, and frequently asked questions
				</p>
			</header>

			{/* Content */}
			<main className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="mx-auto max-w-3xl space-y-8">
					{/* Getting Started */}
					<section>
						<div className="mb-3 flex items-center gap-2">
							<BookOpen className="h-4 w-4 text-craft-600" />
							<h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
								Getting Started
							</h2>
						</div>
						<ol className="ml-4 list-decimal space-y-2 text-sm text-text-secondary">
							<li>
								<strong>Create a pattern</strong> — Click "New Pattern" and follow the wizard to set your craft type, size, and name.
							</li>
							<li>
								<strong>Choose your colors</strong> — Pick colors from the palette on the right side of the editor.
							</li>
							<li>
								<strong>Start drawing</strong> — Use the pencil (P), brush (B), or fill (G) tools to place stitches on the grid.
							</li>
							<li>
								<strong>Use shapes</strong> — The line (L), rectangle (R), and ellipse (O) tools help you draw geometric shapes.
							</li>
							<li>
								<strong>Export</strong> — When finished, export as PDF for printing, or PNG/SVG for digital use.
							</li>
						</ol>
					</section>

					{/* Keyboard Shortcuts */}
					<section>
						<div className="mb-3 flex items-center gap-2">
							<Keyboard className="h-4 w-4 text-craft-600" />
							<h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
								Keyboard Shortcuts
							</h2>
						</div>
						<div className="overflow-hidden rounded-lg border border-border">
							<div className="grid grid-cols-[1fr_auto] gap-x-4 bg-surface-tertiary px-3 py-2 text-xs font-medium uppercase tracking-wider text-text-muted">
								<span>Action</span>
								<span>Keys</span>
							</div>
							{SHORTCUTS.map((s) => (
								<div
									key={s.action}
									className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-border px-3 py-2 text-sm"
								>
									<span className="text-text-secondary">{s.action}</span>
									<span className="flex items-center gap-0.5">
										{s.keys.map((k) => (
											<kbd
												key={k}
												className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-text-muted"
											>
												{k}
											</kbd>
										))}
									</span>
								</div>
							))}
						</div>
					</section>

					{/* FAQ */}
					<section>
						<div className="mb-3 flex items-center gap-2">
							<HelpCircle className="h-4 w-4 text-craft-600" />
							<h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
								Frequently Asked Questions
							</h2>
						</div>
						<div className="space-y-3">
							{FAQ.map((item) => (
								<div key={item.q} className="rounded-lg border border-border bg-surface p-4">
									<h3 className="text-sm font-medium text-text-primary">{item.q}</h3>
									<p className="mt-1.5 text-sm text-text-secondary">{item.a}</p>
								</div>
							))}
						</div>
					</section>

					{/* GitHub Link */}
					<section className="text-center">
						<a
							href="https://github.com/aliasfoxkde/PatternForge/issues"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-sm text-craft-600 transition-colors hover:text-craft-700"
						>
							<ExternalLink className="h-3.5 w-3.5" />
							Report a bug or request a feature on GitHub
						</a>
					</section>
				</div>
			</main>
		</div>
	);
}
