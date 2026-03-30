/**
 * StitchesPage - Visual reference for all stitch types.
 */

import type { StitchType } from '@/engine/grid/grid';

interface StitchInfo {
	type: StitchType;
	name: string;
	symbol: string;
	description: string;
	usage: string;
}

const STITCHES: StitchInfo[] = [
	{
		type: 'full',
		name: 'Full Stitch',
		symbol: '\u25A0',
		description: 'A complete X-shaped stitch covering the entire cell.',
		usage: 'Default stitch for cross-stitch. Used for solid filled areas.',
	},
	{
		type: 'half',
		name: 'Half Stitch',
		symbol: '\u25E2',
		description: 'A single diagonal stroke from bottom-left to top-right.',
		usage: 'Creates shading effects. Often used for outlines or partial fills.',
	},
	{
		type: 'quarter',
		name: 'Quarter Stitch',
		symbol: '\u25E3',
		description: 'A small diagonal stitch covering one quarter of the cell.',
		usage: 'Used for fine details, curves, and rounded edges.',
	},
	{
		type: 'backstitch',
		name: 'Backstitch',
		symbol: '\u2014',
		description: 'A continuous line that runs through the centers of cells.',
		usage: 'Outlines shapes, adds detail lines, and defines borders.',
	},
	{
		type: 'french-knot',
		name: 'French Knot',
		symbol: '\u2022',
		description: 'A small raised knot created by wrapping thread around the needle.',
		usage: 'Adds texture for eyes, dots, flowers, and decorative details.',
	},
	{
		type: 'purl',
		name: 'Purl Stitch',
		symbol: '\u223F',
		description: 'A knit stitch with a horizontal bump on the front of the fabric.',
		usage: 'Standard knitting stitch. Creates a bumpy texture on the front.',
	},
	{
		type: 'knit',
		name: 'Knit Stitch',
		symbol: 'V',
		description: 'A smooth V-shaped stitch on the front of the fabric.',
		usage: 'Most common knitting stitch. Creates a smooth, flat fabric.',
	},
	{
		type: 'yarn-over',
		name: 'Yarn Over',
		symbol: 'O',
		description: 'An intentional hole created by wrapping yarn over the needle.',
		usage: 'Creates decorative eyelets and lace patterns in knitting.',
	},
	{
		type: 'increase',
		name: 'Increase',
		symbol: '+',
		description: 'Two stitches worked into one stitch, adding a stitch.',
		usage: 'Shapes fabric by increasing stitch count. Used for raglan shaping.',
	},
	{
		type: 'decrease',
		name: 'Decrease',
		symbol: '\u2212',
		description: 'Two stitches worked together as one, removing a stitch.',
		usage: 'Shapes fabric by decreasing stitch count. K2tog or SSK in knitting.',
	},
];

export function StitchesPage() {
	return (
		<div className="flex h-full w-full flex-col bg-surface">
			{/* Header */}
			<header className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
				<h1 className="text-lg font-bold text-text-primary sm:text-xl">Stitch Reference</h1>
				<p className="mt-0.5 text-sm text-text-secondary">
					Visual guide to all {STITCHES.length} stitch types
				</p>
			</header>

			{/* Content */}
			<main className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="mx-auto max-w-3xl space-y-3">
					{STITCHES.map((stitch) => (
						<div
							key={stitch.type}
							className="rounded-lg border border-border bg-surface p-4 sm:p-5"
						>
							<div className="flex items-start gap-4">
								{/* Symbol swatch */}
								<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-tertiary text-2xl text-craft-600">
									{stitch.symbol}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-baseline gap-2">
										<h3 className="text-sm font-semibold text-text-primary">{stitch.name}</h3>
										<span className="rounded bg-surface-tertiary px-1.5 py-0.5 font-mono text-xs text-text-muted">
											{stitch.type}
										</span>
									</div>
									<p className="mt-1 text-sm text-text-secondary">{stitch.description}</p>
									<p className="mt-1.5 text-xs text-text-muted">
										<strong>Usage:</strong> {stitch.usage}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
