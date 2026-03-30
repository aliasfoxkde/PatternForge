/**
 * MobileColorPicker - Bottom sheet color picker for mobile devices.
 *
 * Shows as a floating button (FAB) above the tool strip. Tapping opens
 * a bottom sheet with recent colors, custom color picker, and current
 * color preview.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '@/shared/stores/editor-store';
import { Palette, X } from 'lucide-react';

const MAX_RECENT = 12;

export function MobileColorPicker() {
	const [open, setOpen] = useState(false);
	const sheetRef = useRef<HTMLDivElement>(null);

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

	// Sync recent colors with ColorPalette's localStorage key
	const prevColorRef = useRef(activeColor);
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
					// Ignore
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

	// Close on backdrop click
	const handleBackdrop = useCallback((e: React.MouseEvent) => {
		if (e.target === e.currentTarget) setOpen(false);
	}, []);

	// Close on Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		if (open) document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	}, [open]);

	return (
		<>
			{/* FAB button */}
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="fixed left-3 z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-surface shadow-lg transition-colors md:hidden"
				style={{ bottom: "max(4rem, calc(4rem + env(safe-area-inset-bottom)))" }}
				aria-label="Open color picker"
			>
				<div
					className="h-6 w-6 rounded-md border border-border"
					style={{
						backgroundColor: activeColor || 'transparent',
						backgroundImage: activeColor
							? undefined
							: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)',
						backgroundSize: activeColor ? undefined : '6px 6px',
						backgroundPosition: activeColor ? undefined : '0 0, 3px 3px',
					}}
				/>
			</button>

			{/* Backdrop */}
			{open && (
				<div
					className="fixed inset-0 z-40 bg-black/50 transition-opacity"
					onClick={handleBackdrop}
					role="presentation"
				/>
			)}

			{/* Bottom sheet */}
			{open && (
				<div
					ref={sheetRef}
					className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-2xl border-t border-border bg-surface shadow-xl transition-transform duration-200 ease-out animate-slide-up"
					style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
					role="dialog"
					aria-modal="true"
					aria-label="Color picker"
				>
					{/* Handle bar */}
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<div className="flex items-center gap-2">
							<Palette className="h-4 w-4 text-craft-600" />
							<span className="text-sm font-medium text-text-primary">Pick a Color</span>
						</div>
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-tertiary"
							aria-label="Close"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					{/* Content */}
					<div className="overflow-y-auto p-4">
						{/* Current color */}
						<div className="mb-4 flex items-center gap-3">
							<div
								className="h-10 w-10 rounded-lg border border-border"
								style={{
									backgroundColor: activeColor || 'transparent',
									backgroundImage: activeColor
										? undefined
										: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)',
									backgroundSize: activeColor ? undefined : '8px 8px',
									backgroundPosition: activeColor ? undefined : '0 0, 4px 4px',
								}}
							/>
							<div className="flex-1">
								<p className="text-sm font-medium text-text-primary">{activeColor || 'None'}</p>
								<p className="text-xs text-text-muted">Current active color</p>
							</div>
						</div>

						{/* Custom picker */}
						<div className="mb-4">
							<label
								htmlFor="mobile-color-input"
								className="mb-1.5 block text-xs font-medium text-text-secondary"
							>
								Custom Color
							</label>
							<input
								id="mobile-color-input"
								type="color"
								value={activeColor || '#000000'}
								onChange={handleCustomColor}
								className="h-10 w-full cursor-pointer rounded-lg border border-border bg-transparent"
							/>
						</div>

						{/* Recent colors */}
						{recentColors.length > 0 && (
							<div>
								<p className="mb-2 text-xs font-medium text-text-secondary">Recent</p>
								<div className="flex flex-wrap gap-2">
									{recentColors.map((color) => (
										<button
											key={color}
											type="button"
											onClick={() => {
												setActiveColor(color);
												setOpen(false);
											}}
											className="h-9 w-9 rounded-lg border-2 transition-transform active:scale-105"
											style={{ backgroundColor: color, borderColor: color === activeColor ? 'var(--color-craft-500)' : 'var(--color-border)' }}
											aria-label={color}
										/>
									))}
								</div>
							</div>
						)}

						{/* Quick palette */}
						<div>
							<p className="mb-2 text-xs font-medium text-text-secondary">Quick Palette</p>
							<div className="grid grid-cols-8 gap-1.5">
								{QUICK_COLORS.map((color) => (
									<button
										key={color}
										type="button"
										onClick={() => {
											setActiveColor(color);
											setOpen(false);
										}}
										className="h-8 w-8 rounded-md border-2 transition-transform active:scale-105"
										style={{ backgroundColor: color, borderColor: color === activeColor ? 'var(--color-craft-500)' : 'var(--color-border)' }}
										aria-label={color}
									/>
								))}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Slide-up animation */}
			<style>{`
				@keyframes slideUp {
					from { transform: translateY(100%); }
					to { transform: translateY(0); }
				}
				.animate-slide-up {
					animation: slideUp 0.2s ease-out;
				}
			`}</style>
		</>
	);
}

const QUICK_COLORS: string[] = [
	'#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
	'#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
	'#ff0080', '#00ff80', '#0080ff', '#80ff00', '#800080',
	'#c0c0c0', '#808080', '#ffc0cb', '#deb887', '#d2691e',
	'#228b22', '#1e90ff', '#9370db', '#ff6347', '#ffd700',
];
