/**
 * AboutPage - Project info, tech stack, and links.
 */

import { ExternalLink, Github, Globe } from 'lucide-react';

const TECH_STACK = [
	{ name: 'React 19', category: 'UI' },
	{ name: 'TypeScript 5.8', category: 'Language' },
	{ name: 'Vite 6', category: 'Build' },
	{ name: 'Tailwind CSS v4', category: 'Styling' },
	{ name: 'Zustand 5', category: 'State' },
	{ name: 'React Router 7', category: 'Routing' },
	{ name: 'jsPDF', category: 'PDF Export' },
	{ name: 'Cloudflare Pages', category: 'Hosting' },
	{ name: 'Cloudflare D1 + R2', category: 'Cloud Backend' },
];

export function AboutPage() {
	return (
		<div className="flex h-full flex-col bg-surface">
			{/* Header */}
			<header className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
				<h1 className="text-lg font-bold text-text-primary sm:text-xl">About PatternForge</h1>
				<p className="mt-0.5 text-sm text-text-secondary">
					Open-source pattern design tool for fiber arts
				</p>
			</header>

			{/* Content */}
			<main className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="mx-auto max-w-2xl space-y-6">
					{/* About */}
					<section className="rounded-xl border border-border bg-surface p-5">
						<p className="text-sm leading-relaxed text-text-secondary">
							PatternForge is a free, open-source pattern design tool for cross-stitch,
							knitting, crochet, diamond painting, fuse beads, and pixel art. Design patterns
							in the browser with a full-featured grid editor, then export them as PDF, PNG,
							or SVG for printing or sharing.
						</p>
						<p className="mt-3 text-sm leading-relaxed text-text-secondary">
							No account required. No downloads needed. Everything runs in your browser
							and works offline.
						</p>
					</section>

					{/* Version */}
					<section className="rounded-xl border border-border bg-surface p-5">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
							Version
						</h2>
						<div className="space-y-1 text-sm">
							<p className="text-text-primary">
								<strong>PatternForge</strong> v0.1.0
							</p>
							<p className="text-text-muted">License: MIT</p>
						</div>
					</section>

					{/* Tech Stack */}
					<section className="rounded-xl border border-border bg-surface p-5">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
							Tech Stack
						</h2>
						<div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
							{TECH_STACK.map((t) => (
								<div key={t.name} className="py-1">
									<p className="text-sm font-medium text-text-primary">{t.name}</p>
									<p className="text-xs text-text-muted">{t.category}</p>
								</div>
							))}
						</div>
					</section>

					{/* Links */}
					<section className="rounded-xl border border-border bg-surface p-5">
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
							Links
						</h2>
						<div className="space-y-2">
							<a
								href="https://github.com/aliasfoxkde/PatternForge"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-sm text-craft-600 transition-colors hover:text-craft-700"
							>
								<Github className="h-4 w-4" />
								Source Code on GitHub
								<ExternalLink className="h-3 w-3" />
							</a>
							<a
								href="https://patternforge-er4.pages.dev"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-sm text-craft-600 transition-colors hover:text-craft-700"
							>
								<Globe className="h-4 w-4" />
								Live Site
								<ExternalLink className="h-3 w-3" />
							</a>
							<a
								href="https://github.com/aliasfoxkde/PatternForge/issues"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-sm text-craft-600 transition-colors hover:text-craft-700"
							>
								<ExternalLink className="h-4 w-4" />
								Report Issues
							</a>
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}
