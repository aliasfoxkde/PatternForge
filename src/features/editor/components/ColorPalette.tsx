/**
 * ColorPalette - Color palette panel for the editor.
 *
 * Provides a grid of color swatches, a custom color picker,
 * and recent color history.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useEditorStore } from '@/shared/stores/editor-store';
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

export function ColorPalette() {
	const activeColor = useEditorStore((s) => s.activeColor);
	const setActiveColor = useEditorStore((s) => s.setActiveColor);

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
		// Use a special sentinel; editor treats this as null color
		setActiveColor('');
	}, [setActiveColor]);

	return (
		<aside className="flex w-48 flex-col border-l border-border bg-surface-secondary">
			<div className="border-b border-border px-3 py-2">
				<h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
					Colors
				</h3>
			</div>

			{/* Current color preview */}
			<div className="flex items-center gap-2 border-b border-border px-3 py-2">
				<div
					className="h-8 w-8 rounded border border-border"
					style={{
						backgroundColor: activeColor || 'transparent',
						backgroundImage: activeColor ? undefined : 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)',
						backgroundSize: activeColor ? undefined : '8px 8px',
						backgroundPosition: activeColor ? undefined : '0 0, 4px 4px',
					}}
				/>
				<div className="flex flex-col">
					<span className="text-xs font-medium text-text-primary">{activeColor || 'None'}</span>
					<span className="text-[10px] text-text-muted">Active Color</span>
				</div>
			</div>

			{/* Color grid */}
			<div className="flex-1 overflow-y-auto p-2">
				<div className="grid grid-cols-5 gap-1">
					{DEFAULT_COLORS.map((color) => (
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
			</div>

			{/* Recent colors */}
			{recentColors.length > 0 && (
				<div className="border-t border-border px-3 py-2">
					<span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
						Recent
					</span>
					<div className="flex flex-wrap gap-1">
						{recentColors.map((color) => (
							<button
								key={color}
								type="button"
								title={color}
								className={cn(
									'h-5 w-5 rounded-sm border transition-transform hover:scale-110',
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

			{/* Custom color picker + transparent */}
			<div className="flex items-center gap-2 border-t border-border px-3 py-2">
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
		</aside>
	);
}
