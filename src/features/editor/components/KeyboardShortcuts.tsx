/**
 * KeyboardShortcuts - Modal overlay showing all keyboard shortcuts.
 *
 * Groups shortcuts into sections: General, Tools, View, Editing.
 * Click backdrop or press Escape to close.
 */

import { useCallback, useEffect, useRef } from 'react';

export interface KeyboardShortcutsProps {
	open: boolean;
	onClose: () => void;
}

interface ShortcutEntry {
	keys: string[];
	description: string;
}

interface ShortcutSection {
	title: string;
	entries: ShortcutEntry[];
}

const SECTIONS: ShortcutSection[] = [
	{
		title: 'General',
		entries: [
			{ keys: ['Ctrl', 'S'], description: 'Save' },
			{ keys: ['Ctrl', 'Z'], description: 'Undo' },
			{ keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
			{ keys: ['Ctrl', 'K'], description: 'Command Palette' },
			{ keys: ['?'], description: 'Show Shortcuts' },
		],
	},
	{
		title: 'Tools',
		entries: [
			{ keys: ['P'], description: 'Pencil' },
			{ keys: ['B'], description: 'Brush' },
			{ keys: ['E'], description: 'Eraser' },
			{ keys: ['G'], description: 'Fill' },
			{ keys: ['L'], description: 'Line' },
			{ keys: ['R'], description: 'Rectangle' },
			{ keys: ['O'], description: 'Ellipse' },
			{ keys: ['I'], description: 'Color Picker' },
			{ keys: ['S'], description: 'Selection' },
			{ keys: ['H'], description: 'Pan' },
		],
	},
	{
		title: 'View',
		entries: [
			{ keys: ['+'], description: 'Zoom In' },
			{ keys: ['-'], description: 'Zoom Out' },
			{ keys: ['Ctrl', '0'], description: 'Fit to View' },
		],
	},
];

function KeyBadge({ text }: { text: string }) {
	return (
		<kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border border-border bg-surface-tertiary px-1.5 font-mono text-[11px] font-medium text-text-secondary shadow-sm">
			{text}
		</kbd>
	);
}

export function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
	const dialogRef = useRef<HTMLDivElement>(null);

	// Close on Escape
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		},
		[onClose],
	);

	useEffect(() => {
		if (!open) return;

		document.addEventListener('keydown', handleKeyDown);
		// Prevent background scrolling
		document.body.style.overflow = 'hidden';

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.body.style.overflow = '';
		};
	}, [open, handleKeyDown]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
				onKeyDown={undefined}
			/>

			{/* Dialog */}
			<div
				ref={dialogRef}
				className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
			>
				<h2 className="mb-4 text-lg font-semibold text-text-primary">
					Keyboard Shortcuts
				</h2>

				<div className="grid gap-6 sm:grid-cols-2">
					{SECTIONS.map((section) => (
						<div key={section.title}>
							<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
								{section.title}
							</h3>
							<ul className="space-y-1.5">
								{section.entries.map((entry) => (
									<li key={entry.description} className="flex items-center justify-between gap-4">
										<span className="text-sm text-text-secondary">
											{entry.description}
										</span>
										<span className="flex items-center gap-0.5">
											{entry.keys.map((key) => (
												<KeyBadge key={key} text={key} />
											))}
										</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="mt-5 flex justify-end">
					<button
						type="button"
						className="rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
						onClick={onClose}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
