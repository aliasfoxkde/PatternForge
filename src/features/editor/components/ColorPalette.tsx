/**
 * ColorPalette - Color palette panel for the editor.
 *
 * Provides three tabs: Palette (default colors), DMC (thread library),
 * and Recent (recently used). Includes a custom color picker with
 * "Match to DMC" functionality.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useEditorStore } from '@/shared/stores/editor-store';
import { DMC_COLORS } from '@/data/dmc-colors';
import { findNearestDmcColor } from '@/data/color-matching';
import { cn } from '@/shared/utils/cn';

/** Default color palette used across craft types. */
const DEFAULT_COLORS: string[] = [
	'#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
	'#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
	'#ff0080', '#00ff80', '#0080ff', '#80ff00', '#800000',
	'#008000', '#000080', '#808000', '#800080', '#008080',
	'#c0c0c0', '#808080', '#404040', '#ffc0cb', '#deb887',
	'#f5deb3', '#d2691e', '#8b4513', '#a0522d', '#cd853f',
	'#ffd700', '#ffa500', '#ff6347', '#dc143c', '#b22222',
	'#228b22', '#006400', '#2e8b57', '#3cb371', '#90ee90',
	'#4682b4', '#1e90ff', '#0000cd', '#4169e1', '#6495ed',
	'#9370db', '#8a2be2', '#4b0082', '#da70d6', '#ff69b4',
	'#f0e68c', '#e6e6fa', '#ffe4e1', '#f0fff0', '#f5f5dc',
];

const MAX_RECENT = 10;

type Tab = 'palette' | 'dmc' | 'recent';

export function ColorPalette() {
	const activeColor = useEditorStore((s) => s.activeColor);
	const setActiveColor = useEditorStore((s) => s.setActiveColor);

	const [tab, setTab] = useState<Tab>('palette');
	const [dmcSearch, setDmcSearch] = useState('');
	const [dmcMatch, setDmcMatch] = useState<{
		id: string;
		name: string;
		hex: string;
	} | null>(null);

	const [recentColors, setRecentColors] = useState<string[]>(() => {
		try {
			const stored = localStorage.getItem('patternforge-recent-colors');
			if (stored) return JSON.parse(stored) as string[];
		} catch {
			// Ignore parse errors
		}
		return [];
	});

	const prevColorRef = useRef(activeColor);

	// Track color changes for recent history
	useEffect(() => {
		if (activeColor !== prevColorRef.current) {
			prevColorRef.current = activeColor;
			if (!activeColor) return;

			setRecentColors((prev) => {
				const filtered = prev.filter((c) => c !== activeColor);
				const next = [activeColor, ...filtered].slice(0, MAX_RECENT);
				try {
					localStorage.setItem('patternforge-recent-colors', JSON.stringify(next));
				} catch {
					// Ignore storage errors
				}
				return next;
			});
		}
	}, [activeColor]);

	// Clear DMC match when color changes
	useEffect(() => {
		setDmcMatch(null);
	}, [activeColor]);

	const handleCustomColor = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setActiveColor(e.target.value);
		},
		[setActiveColor],
	);

	const handleSelectColor = useCallback(
		(color: string) => {
			setActiveColor(color);
		},
		[setActiveColor],
	);

	const handleTransparent = useCallback(() => {
		setActiveColor('');
	}, [setActiveColor]);

	const handleMatchDmc = useCallback(() => {
		if (!activeColor) return;
		const match = findNearestDmcColor(activeColor);
		if (match) {
			setDmcMatch({ id: match.id, name: match.name, hex: match.hex });
		}
	}, [activeColor]);

	const handleUseDmcMatch = useCallback(() => {
		if (dmcMatch) {
			setActiveColor(dmcMatch.hex);
		}
	}, [dmcMatch, setActiveColor]);

	// Filter DMC colors by search
	const filteredDmc = useMemo(() => {
		if (!dmcSearch.trim()) return DMC_COLORS;
		const q = dmcSearch.toLowerCase().trim();
		return DMC_COLORS.filter(
			(c) =>
				c.id.toLowerCase().includes(q) ||
				c.name.toLowerCase().includes(q),
		);
	}, [dmcSearch]);

	return (
		<aside className="flex w-56 flex-col border-l border-border bg-surface-secondary">
			<div className="border-b border-border px-3 py-2">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
					Colors
				</h3>
			</div>

			{/* Current color preview */}
			<div className="flex items-center gap-2 border-b border-border px-3 py-2">
				<div
					className="h-8 w-8 shrink-0 rounded border border-border"
					style={{
						backgroundColor: activeColor || 'transparent',
						backgroundImage: activeColor ? undefined : 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)',
						backgroundSize: activeColor ? undefined : '8px 8px',
						backgroundPosition: activeColor ? undefined : '0 0, 4px 4px',
					}}
				/>
				<div className="flex min-w-0 flex-1 flex-col">
					<span className="truncate text-xs font-medium text-text-primary">{activeColor || 'None'}</span>
					<span className="text-[10px] text-text-muted">
						{dmcMatch ? `DMC ${dmcMatch.id} ${dmcMatch.name}` : 'Active Color'}
					</span>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex border-b border-border">
				{(['palette', 'dmc', 'recent'] as const).map((t) => (
					<button
						key={t}
						type="button"
						className={cn(
							'flex-1 px-2 py-1.5 text-xs font-medium capitalize transition-colors',
							tab === t
								? 'border-b-2 border-craft-500 text-text-primary'
								: 'text-text-muted hover:text-text-secondary',
						)}
						onClick={() => setTab(t)}
					>
						{t}
					</button>
				))}
			</div>

			{/* Tab content */}
			<div className="flex-1 overflow-y-auto">
				{tab === 'palette' && (
					<div className="p-2">
						<div className="grid grid-cols-5 gap-1">
							{DEFAULT_COLORS.map((color) => (
								<button
									key={color}
									type="button"
									title={color}
									aria-label={color}
									className={cn(
										'h-6 w-6 rounded-sm border transition-transform hover:scale-110',
										activeColor === color
											? 'border-craft-500 ring-1 ring-craft-300'
											: 'border-border',
									)}
									style={{ backgroundColor: color }}
									onClick={() => handleSelectColor(color)}
								/>
							))}
						</div>
					</div>
				)}

				{tab === 'dmc' && (
					<div className="flex flex-col">
						{/* Search */}
						<div className="border-b border-border px-2 py-1.5">
							<input
								type="text"
								value={dmcSearch}
								onChange={(e) => setDmcSearch(e.target.value)}
								placeholder="Search ID or name..."
								className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:border-craft-400 focus:outline-none"
							/>
						</div>
						{/* DMC color list */}
						<div className="flex-1 overflow-y-auto p-1">
							{filteredDmc.map((color) => (
								<button
									key={color.id}
									type="button"
									title={`${color.id} - ${color.name}`}
									className={cn(
										'flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-surface-tertiary',
										activeColor === color.hex
											? 'bg-craft-100'
											: '',
									)}
									onClick={() => handleSelectColor(color.hex)}
								>
									<span
										className="h-4 w-4 shrink-0 rounded-sm border border-border"
										style={{ backgroundColor: color.hex }}
									/>
									<span className="min-w-0 flex-1 truncate text-[10px] font-mono text-text-secondary">
										{color.id}
									</span>
									<span className="min-w-0 flex-1 truncate text-[10px] text-text-muted">
										{color.name}
									</span>
								</button>
							))}
						</div>
					</div>
				)}

				{tab === 'recent' && (
					<div className="p-2">
						{recentColors.length === 0 ? (
							<p className="text-center text-[10px] text-text-muted py-4">
								No recent colors yet
							</p>
						) : (
							<div className="flex flex-wrap gap-1">
								{recentColors.map((color) => (
									<button
										key={color}
										type="button"
										title={color}
										className={cn(
											'h-6 w-6 rounded-sm border transition-transform hover:scale-110',
											activeColor === color
												? 'border-craft-500 ring-1 ring-craft-300'
												: 'border-border',
										)}
										style={{ backgroundColor: color }}
										onClick={() => handleSelectColor(color)}
									/>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Match to DMC + custom picker + transparent */}
			<div className="flex items-center gap-1.5 border-t border-border px-3 py-2">
				<label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-border hover:bg-surface-tertiary">
					<span className="text-xs text-text-muted">+</span>
					<input
						type="color"
						value={activeColor || '#000000'}
						onChange={handleCustomColor}
						className="sr-only"
					/>
				</label>
				<button
					type="button"
					title="No color (transparent)"
					className={cn(
						'flex h-8 w-8 items-center justify-center rounded border transition-colors',
						!activeColor
							? 'border-craft-500 bg-craft-50'
							: 'border-border hover:bg-surface-tertiary',
					)}
					style={{
						backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)',
						backgroundSize: '6px 6px',
						backgroundPosition: '0 0, 3px 3px',
					}}
					onClick={handleTransparent}
				>
					<span className="text-[10px] font-bold text-text-muted">X</span>
				</button>
				<span className="flex-1 text-right font-mono text-[10px] text-text-muted">
					{activeColor?.toUpperCase() ?? '--'}
				</span>
			</div>

			{/* Match to DMC button */}
			{activeColor && (
				<div className="border-t border-border px-3 py-2">
					{dmcMatch ? (
						<div className="flex items-center gap-2">
							<span
								className="h-5 w-5 shrink-0 rounded-sm border border-border"
								style={{ backgroundColor: dmcMatch.hex }}
							/>
							<span className="min-w-0 flex-1 text-[10px] text-text-secondary">
								<span className="font-medium">{dmcMatch.id}</span> {dmcMatch.name}
							</span>
							<button
								type="button"
								className="shrink-0 rounded bg-craft-600 px-2 py-0.5 text-[10px] font-medium text-white transition-colors hover:bg-craft-700"
								onClick={handleUseDmcMatch}
							>
								Use
							</button>
						</div>
					) : (
						<button
							type="button"
							className="w-full rounded border border-border px-2 py-1.5 text-[10px] font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
							onClick={handleMatchDmc}
						>
							Match to DMC
						</button>
					)}
				</div>
			)}
		</aside>
	);
}
