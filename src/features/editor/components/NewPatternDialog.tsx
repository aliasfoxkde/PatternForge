/**
 * NewPatternDialog - Dialog for creating a new pattern.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { usePatternStore } from '@/shared/stores/pattern-store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import type { CraftType } from '@/engine/pattern/types';
import { CRAFT_TYPE_LABELS } from '@/engine/pattern/types';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export interface NewPatternDialogProps {
	open: boolean;
	onClose: () => void;
}

export function NewPatternDialog({ open, onClose }: NewPatternDialogProps) {
	const [name, setName] = useState('');
	const [craftType, setCraftType] = useState<CraftType>('cross-stitch');
	const [width, setWidth] = useState(30);
	const [height, setHeight] = useState(30);

	const nameInputRef = useRef<HTMLInputElement>(null);

	const createPattern = usePatternStore((s) => s.createPattern);
	const defaultCraftType = useSettingsStore((s) => s.defaultCraftType);
	const defaultWidth = useSettingsStore((s) => s.defaultGridWidth);
	const defaultHeight = useSettingsStore((s) => s.defaultGridHeight);
	const navigate = useNavigate();

	// Initialize defaults from settings
	useEffect(() => {
		if (open) {
			setCraftType(defaultCraftType as CraftType);
			setWidth(defaultWidth);
			setHeight(defaultHeight);
			setName('');
			// Focus name input after render
			setTimeout(() => nameInputRef.current?.focus(), 100);
		}
	}, [open, defaultCraftType, defaultWidth, defaultHeight]);

	const handleCreate = useCallback(() => {
		const trimmedName = name.trim();
		if (!trimmedName) return;

		createPattern(trimmedName, width, height, craftType);
		onClose();
		navigate('/editor');
	}, [name, width, height, craftType, createPattern, onClose, navigate]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter') {
				handleCreate();
			} else if (e.key === 'Escape') {
				onClose();
			}
		},
		[handleCreate, onClose],
	);

	if (!open) return null;

	const craftTypes = Object.entries(CRAFT_TYPE_LABELS) as [CraftType, string][];

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
				className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
				onKeyDown={handleKeyDown}
			>
				{/* Close button */}
				<button
					type="button"
					className="absolute right-3 top-3 rounded p-1 text-text-muted transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					onClick={onClose}
				>
					<X className="h-4 w-4" />
				</button>

				<h2 className="mb-4 text-lg font-semibold text-text-primary">
					New Pattern
				</h2>

				<div className="space-y-4">
					{/* Name */}
					<div>
						<label htmlFor="pattern-name" className="mb-1 block text-sm text-text-secondary">
							Name
						</label>
						<input
							ref={nameInputRef}
							id="pattern-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="My Pattern"
							className="w-full rounded-md border border-border bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
						/>
					</div>

					{/* Craft type */}
					<div>
						<label htmlFor="craft-type" className="mb-1 block text-sm text-text-secondary">
							Craft Type
						</label>
						<select
							id="craft-type"
							value={craftType}
							onChange={(e) => setCraftType(e.target.value as CraftType)}
							className="w-full rounded-md border border-border bg-surface-tertiary px-3 py-2 text-sm text-text-primary focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
						>
							{craftTypes.map(([value, label]) => (
								<option key={value} value={value}>
									{label}
								</option>
							))}
						</select>
					</div>

					{/* Dimensions */}
					<div className="flex gap-4">
						<div className="flex-1">
							<label htmlFor="pattern-width" className="mb-1 block text-sm text-text-secondary">
								Width
							</label>
							<input
								id="pattern-width"
								type="number"
								value={width}
								onChange={(e) => setWidth(Math.max(1, Math.min(2000, Number.parseInt(e.target.value) || 1)))}
								min={1}
								max={2000}
								className="w-full rounded-md border border-border bg-surface-tertiary px-3 py-2 text-sm text-text-primary focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
							/>
						</div>
						<div className="flex-1">
							<label htmlFor="pattern-height" className="mb-1 block text-sm text-text-secondary">
								Height
							</label>
							<input
								id="pattern-height"
								type="number"
								value={height}
								onChange={(e) => setHeight(Math.max(1, Math.min(2000, Number.parseInt(e.target.value) || 1)))}
								min={1}
								max={2000}
								className="w-full rounded-md border border-border bg-surface-tertiary px-3 py-2 text-sm text-text-primary focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
							/>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="mt-6 flex justify-end gap-2">
					<button
						type="button"
						className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						type="button"
						className="rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
						onClick={handleCreate}
						disabled={!name.trim()}
					>
						Create
					</button>
				</div>
			</div>
		</div>
	);
}
