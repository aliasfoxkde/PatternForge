/**
 * YarnPage - DMC Thread Color Database browser.
 */

import { useState, useMemo } from 'react';
import { DMC_COLORS } from '@/data/dmc-colors';
import { Search } from 'lucide-react';

// Extract color family names from data comments
const COLOR_FAMILIES = [
	'All',
	'Blacks, Grays, Whites',
	'Reds',
	'Pinks & Roses',
	'Purples & Violets',
	'Blues',
	'Teals, Turquoises & Aquas',
	'Greens',
	'Olives',
	'Yellows & Golds',
	'Oranges',
	'Corals & Salmons',
	'Browns',
] as const;

// Family boundaries based on the data file's section comments
const FAMILY_RANGES: Record<string, [number, number]> = {
	'Blacks, Grays, Whites': [0, 19],
	'Reds': [20, 39],
	'Pinks & Roses': [40, 60],
	'Purples & Violets': [61, 91],
	'Blues': [92, 131],
	'Teals, Turquoises & Aquas': [132, 148],
	'Greens': [149, 196],
	'Olives': [197, 200],
	'Yellows & Golds': [201, 218],
	'Oranges': [219, 241],
	'Corals & Salmons': [242, 251],
	'Browns': [252, 261],
};

export function YarnPage() {
	const [search, setSearch] = useState('');
	const [family, setFamily] = useState('All');

	const filteredColors = useMemo(() => {
		let colors = DMC_COLORS;

		// Filter by family
		if (family !== 'All') {
			const range = FAMILY_RANGES[family];
			if (range) {
				colors = colors.slice(range[0], range[1] + 1);
			}
		}

		// Filter by search
		if (search.trim()) {
			const q = search.toLowerCase().trim();
			colors = colors.filter(
				(c) =>
					c.id.toLowerCase().includes(q) ||
					c.name.toLowerCase().includes(q) ||
					c.hex.toLowerCase().includes(q),
			);
		}

		return colors;
	}, [search, family]);

	return (
		<div className="flex h-full w-full flex-col bg-surface">
			{/* Header */}
			<header className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
				<h1 className="text-lg font-bold text-text-primary sm:text-xl">DMC Thread Colors</h1>
				<p className="mt-0.5 text-sm text-text-secondary">
					{DMC_COLORS.length} floss colors for cross-stitch and embroidery
				</p>
			</header>

			{/* Content */}
			<main className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="mx-auto max-w-5xl space-y-4">
					{/* Search & Filter */}
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by name, ID, or hex..."
								className="w-full rounded-lg border border-border bg-surface-tertiary py-2 pl-9 pr-3 text-sm text-text-primary placeholder-text-muted focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
							/>
						</div>
						<select
							value={family}
							onChange={(e) => setFamily(e.target.value)}
							className="rounded-lg border border-border bg-surface-tertiary px-3 py-2 text-sm text-text-primary focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
						>
							{COLOR_FAMILIES.map((f) => (
								<option key={f} value={f}>
									{f}
								</option>
							))}
						</select>
					</div>

					{/* Results count */}
					<p className="text-xs text-text-muted">
						Showing {filteredColors.length} color{filteredColors.length !== 1 ? 's' : ''}
					</p>

					{/* Color grid */}
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
						{filteredColors.map((color) => (
							<div
								key={color.id}
								className="flex items-start gap-2.5 rounded-lg border border-border bg-surface p-2.5 transition-colors hover:bg-surface-tertiary"
							>
								<div
									className="mt-0.5 h-8 w-8 shrink-0 rounded-md border border-border shadow-sm"
									style={{ backgroundColor: color.hex }}
									title={color.hex}
								/>
								<div className="min-w-0">
									<p className="text-sm font-medium leading-tight text-text-primary">{color.name}</p>
									<p className="mt-0.5 text-xs text-text-muted">
										DMC {color.id}
									</p>
									<p className="text-xs font-mono text-text-muted">{color.hex}</p>
								</div>
							</div>
						))}
					</div>

					{filteredColors.length === 0 && (
						<div className="py-12 text-center">
							<p className="text-text-muted">No colors match your search.</p>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
