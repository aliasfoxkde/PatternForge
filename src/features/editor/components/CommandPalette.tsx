/**
 * CommandPalette - Ctrl+K command overlay.
 *
 * Provides quick access to editor actions via search.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface CommandItem {
	id: string;
	label: string;
	shortcut?: string;
	icon?: React.ComponentType<{ className?: string }>;
	action: () => void;
}

export interface CommandPaletteProps {
	open: boolean;
	onClose: () => void;
	commands: CommandItem[];
}

export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	// Filter commands by query
	const filtered = commands.filter((cmd) =>
		cmd.label.toLowerCase().includes(query.toLowerCase()),
	);

	// Reset state when opened
	useEffect(() => {
		if (open) {
			setQuery('');
			setSelectedIndex(0);
			setTimeout(() => inputRef.current?.focus(), 50);
		}
	}, [open]);

	// Keyboard navigation
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedIndex((i) => Math.max(i - 1, 0));
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const item = filtered[selectedIndex];
				if (item) {
					item.action();
					onClose();
				}
			} else if (e.key === 'Escape') {
				onClose();
			}
		},
		[filtered, selectedIndex, onClose],
	);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/40" onClick={onClose} onKeyDown={undefined} />

			{/* Palette */}
			<div
				className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
				onKeyDown={handleKeyDown}
			>
				{/* Search input */}
				<div className="flex items-center gap-2 border-b border-border px-4 py-3">
					<Search className="h-4 w-4 text-text-muted" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setSelectedIndex(0);
						}}
						placeholder="Type a command..."
						className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted focus:outline-none"
					/>
					<kbd className="rounded border border-border bg-surface-tertiary px-1.5 py-0.5 text-[10px] text-text-muted">
						ESC
					</kbd>
				</div>

				{/* Results */}
				{filtered.length > 0 ? (
					<ul className="max-h-64 overflow-y-auto py-1">
						{filtered.map((cmd, idx) => (
							<li key={cmd.id}>
								<button
									type="button"
									className={cn(
										'flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors',
										idx === selectedIndex
											? 'bg-craft-100 text-craft-900'
											: 'text-text-primary hover:bg-surface-tertiary',
									)}
									onClick={() => {
										cmd.action();
										onClose();
									}}
									onMouseEnter={() => setSelectedIndex(idx)}
								>
									{cmd.icon && <cmd.icon className="h-4 w-4" />}
									<span className="flex-1 text-left">{cmd.label}</span>
									{cmd.shortcut && (
										<kbd className="rounded border border-border bg-surface-tertiary px-1.5 py-0.5 text-[10px] text-text-muted">
											{cmd.shortcut}
										</kbd>
									)}
								</button>
							</li>
						))}
					</ul>
				) : (
					<div className="px-4 py-8 text-center text-sm text-text-muted">
						No commands found
					</div>
				)}
			</div>
		</div>
	);
}
