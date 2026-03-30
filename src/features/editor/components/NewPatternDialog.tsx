/**
 * NewPatternDialog - Multi-step wizard for creating a new pattern.
 *
 * Steps:
 *   1. Choose Craft Type (visual grid)
 *   2. Set Dimensions (presets + custom)
 *   3. Name & Create
 *
 * Includes "Quick Create" shortcut on step 1.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { usePatternStore } from '@/shared/stores/pattern-store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import type { CraftType } from '@/engine/pattern/types';
import { CRAFT_TYPE_LABELS } from '@/engine/pattern/types';
import type { ColorPalette } from '@/engine/color/types';
import { DMC_COLORS } from '@/data/dmc-colors';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, X, Grid3X3, Ruler } from 'lucide-react';
import { FocusTrap } from '@/shared/ui';

export interface NewPatternDialogProps {
	open: boolean;
	onClose: () => void;
}

// ---- Craft type icons (emoji-based, no external deps) ----

const CRAFT_ICONS: Record<CraftType, string> = {
	'cross-stitch': '\u2702',
	'knitting-flat': '\u27F6',
	'knitting-round': '\u2B55',
	'crochet-standard': '\u273F',
	'crochet-c2c': '\u2747',
	'diamond-painting': '\u25C6',
	'fuse-beads': '\u2B23',
	'pixel-art': '\u25A0',
};

// ---- Dimension presets per craft type ----

const DIMENSION_PRESETS: { label: string; width: number; height: number }[] = [
	{ label: 'Small (20\u00D720)', width: 20, height: 20 },
	{ label: 'Medium (40\u00D740)', width: 40, height: 40 },
	{ label: 'Large (60\u00D760)', width: 60, height: 60 },
	{ label: 'XL (100\u00D7100)', width: 100, height: 100 },
	{ label: 'Wide (120\u00D760)', width: 120, height: 60 },
	{ label: 'Tall (60\u00D7120)', width: 60, height: 120 },
];

// ---- Fabric count presets (stitches per inch) ----

const FABRIC_COUNTS = [11, 14, 16, 18, 22, 28, 32] as const;

function formatRealSize(cells: number, fabricCount: number): string {
	const inches = cells / fabricCount;
	if (inches < 1) {
		return `${Math.round(inches * 16) / 16}"`;
	}
	return `${inches.toFixed(1)}"`;
}

// ---- Step components ----

type WizardStep = 'craft' | 'dimensions' | 'colors' | 'name';

const STEP_ORDER: WizardStep[] = ['craft', 'dimensions', 'colors', 'name'];
const STEP_LABELS: Record<WizardStep, string> = {
	craft: 'Craft Type',
	dimensions: 'Size',
	colors: 'Colors',
	name: 'Name',
};

function StepIndicator({ current, total }: { current: number; total: number }) {
	return (
		<div className="mb-6 flex items-center justify-center gap-1.5">
			{STEP_ORDER.map((step, i) => (
				<div key={step} className="flex items-center gap-1.5">
					<div
						className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
							i < current
								? 'bg-craft-600 text-white'
								: i === current
									? 'border-2 border-craft-600 text-craft-600'
									: 'border-2 border-border text-text-muted'
						}`}
					>
						{i < current ? <Check className="h-3 w-3" /> : i + 1}
					</div>
					<span
						className={`text-xs ${
							i === current ? 'font-medium text-text-primary' : 'text-text-muted'
						}`}
					>
						{STEP_LABELS[step]}
					</span>
					{i < total - 1 && <div className="mx-1 h-px w-4 bg-border" />}
				</div>
			))}
		</div>
	);
}

// ---- Main dialog ----

export function NewPatternDialog({ open, onClose }: NewPatternDialogProps) {
	const [step, setStep] = useState<WizardStep>('craft');
	const [craftType, setCraftType] = useState<CraftType>('cross-stitch');
	const [width, setWidth] = useState(40);
	const [height, setHeight] = useState(40);
	const [fabricCount, setFabricCount] = useState(14);
	const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
	const [colorSearch, setColorSearch] = useState('');
	const [name, setName] = useState('');

	const nameInputRef = useRef<HTMLInputElement>(null);
	const createPattern = usePatternStore((s) => s.createPattern);
	const defaultCraftType = useSettingsStore((s) => s.defaultCraftType);
	const defaultWidth = useSettingsStore((s) => s.defaultGridWidth);
	const defaultHeight = useSettingsStore((s) => s.defaultGridHeight);
	const navigate = useNavigate();

	// Real-world size calculation
	const realSize = useMemo(() => ({
		width: formatRealSize(width, fabricCount),
		height: formatRealSize(height, fabricCount),
	}), [width, height, fabricCount]);

	// Filtered DMC colors for search
	const filteredColors = useMemo(() => {
		if (!colorSearch.trim()) return DMC_COLORS;
		const q = colorSearch.toLowerCase();
		return DMC_COLORS.filter(
			(c) =>
				c.name.toLowerCase().includes(q) ||
				c.id.includes(q) ||
				c.hex.toLowerCase().includes(q),
		);
	}, [colorSearch]);

	const toggleColor = useCallback((hex: string) => {
		setSelectedColors((prev) => {
			const next = new Set(prev);
			if (next.has(hex)) next.delete(hex);
			else next.add(hex);
			return next;
		});
	}, []);

	// Reset state when dialog opens
	useEffect(() => {
		if (open) {
			setStep('craft');
			setCraftType(defaultCraftType as CraftType);
			setWidth(defaultWidth);
			setHeight(defaultHeight);
			setSelectedColors(new Set());
			setColorSearch('');
			setName('');
		}
	}, [open, defaultCraftType, defaultWidth, defaultHeight]);

	// Focus name input on last step
	useEffect(() => {
		if (open && step === 'name') {
			setTimeout(() => nameInputRef.current?.focus(), 100);
		}
	}, [open, step]);

	const stepIndex = STEP_ORDER.indexOf(step);

	const goNext = useCallback(() => {
		const next = STEP_ORDER[stepIndex + 1];
		if (next) setStep(next);
	}, [stepIndex]);

	const goBack = useCallback(() => {
		const prev = STEP_ORDER[stepIndex - 1];
		if (prev) setStep(prev);
	}, [stepIndex]);

	// Quick Create: skip to name step with defaults
	const handleQuickCreate = useCallback(() => {
		setStep('name');
	}, []);

	const handleCreate = useCallback(() => {
		const trimmedName = name.trim() || 'Untitled Pattern';
		const gauge = {
			stitches: fabricCount,
			rows: fabricCount,
			unit: 'in' as const,
		};
		const palette: ColorPalette | undefined =
			selectedColors.size > 0
				? {
						id: `palette-${Date.now()}`,
						name: 'Custom Palette',
						colors: Array.from(selectedColors).map((hex, i) => {
							const dmc = DMC_COLORS.find((c) => c.hex === hex);
							return {
								id: `color-${i}`,
								name: dmc ? dmc.name : `Color ${i + 1}`,
								hex,
								oklch: { mode: 'oklch' as const, l: 0, c: 0, h: 0 },
								brand: dmc ? 'DMC' : null,
								threadNumber: dmc ? dmc.id : null,
								symbol: null,
							};
						}),
					}
				: undefined;
		createPattern(trimmedName, width, height, craftType, gauge, palette);
		onClose();
		navigate('/editor');
	}, [name, width, height, craftType, fabricCount, selectedColors, createPattern, onClose, navigate]);

	if (!open) return null;

	const craftTypes = Object.entries(CRAFT_TYPE_LABELS) as [CraftType, string][];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40"
				onClick={onClose}
				onKeyDown={undefined}
				role="presentation"
			/>

			{/* Dialog */}
			<FocusTrap active={open} onEscape={onClose}>
			<div
				className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
				role="dialog"
				aria-modal="true"
				aria-labelledby="wizard-title"
			>
				{/* Close button */}
				<button
					type="button"
					className="absolute right-3 top-3 rounded p-1 text-text-muted transition-colors hover:bg-surface-tertiary hover:text-text-primary"
					onClick={onClose}
					aria-label="Close dialog"
				>
					<X className="h-4 w-4" />
				</button>

				<h2 id="wizard-title" className="mb-2 text-lg font-semibold text-text-primary">
					New Pattern
				</h2>

				<StepIndicator current={stepIndex} total={STEP_ORDER.length} />

				{/* Step 1: Choose Craft Type */}
				{step === 'craft' && (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
							{craftTypes.map(([value, label]) => (
								<button
									key={value}
									type="button"
									onClick={() => {
										setCraftType(value);
										goNext();
									}}
									className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
										craftType === value
											? 'border-craft-600 bg-craft-50 text-craft-700 dark:bg-craft-900/30 dark:text-craft-300'
											: 'border-border text-text-secondary hover:border-craft-400 hover:bg-surface-tertiary'
									}`}
								>
									<span className="text-2xl">{CRAFT_ICONS[value]}</span>
									<span className="text-center text-xs font-medium leading-tight">{label}</span>
								</button>
							))}
						</div>

						{/* Quick Create */}
						<button
							type="button"
							onClick={handleQuickCreate}
							className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-craft-400 hover:bg-surface-tertiary hover:text-craft-700"
						>
							<Sparkles className="h-4 w-4" />
							Quick Create with defaults
						</button>
					</div>
				)}

				{/* Step 2: Dimensions */}
				{step === 'dimensions' && (
					<div className="space-y-4">
						<p className="text-sm text-text-secondary">
							Choose a preset size or enter custom dimensions for{' '}
							<span className="font-medium text-text-primary">{CRAFT_TYPE_LABELS[craftType]}</span>.
						</p>

						{/* Presets */}
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{DIMENSION_PRESETS.map((preset) => (
								<button
									key={preset.label}
									type="button"
									onClick={() => {
										setWidth(preset.width);
										setHeight(preset.height);
									}}
									className={`rounded-lg border-2 px-3 py-2 text-center transition-all ${
										width === preset.width && height === preset.height
											? 'border-craft-600 bg-craft-50 text-craft-700 dark:bg-craft-900/30 dark:text-craft-300'
											: 'border-border text-text-secondary hover:border-craft-400 hover:bg-surface-tertiary'
									}`}
								>
									<span className="block text-sm font-medium">{preset.label}</span>
									<span className="block text-xs text-text-muted">
										{preset.width} &times; {preset.height} cells
									</span>
								</button>
							))}
						</div>

						{/* Custom dimensions */}
						<div className="rounded-lg border border-border bg-surface-tertiary/50 p-3">
							<label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text-primary">
								<Grid3X3 className="h-3.5 w-3.5" />
								Custom Size
							</label>
							<div className="flex items-center gap-3">
								<div className="flex-1">
									<label htmlFor="wiz-width" className="mb-1 block text-xs text-text-muted">
										Width
									</label>
									<input
										id="wiz-width"
										type="number"
										value={width}
										onChange={(e) => setWidth(Math.max(1, Math.min(2000, Number.parseInt(e.target.value) || 1)))}
										min={1}
										max={2000}
										className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
									/>
								</div>
								<span className="mt-4 text-text-muted">&times;</span>
								<div className="flex-1">
									<label htmlFor="wiz-height" className="mb-1 block text-xs text-text-muted">
										Height
									</label>
									<input
										id="wiz-height"
										type="number"
										value={height}
										onChange={(e) => setHeight(Math.max(1, Math.min(2000, Number.parseInt(e.target.value) || 1)))}
										min={1}
										max={2000}
										className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
									/>
								</div>
							</div>
						</div>

						{/* Fabric count / gauge */}
						<div className="rounded-lg border border-border bg-surface-tertiary/50 p-3">
							<label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text-primary">
								<Ruler className="h-3.5 w-3.5" />
								Fabric Count
							</label>
							<div className="flex flex-wrap gap-1.5">
								{FABRIC_COUNTS.map((count) => (
									<button
										key={count}
										type="button"
										onClick={() => setFabricCount(count)}
										className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
											fabricCount === count
												? 'border-craft-600 bg-craft-50 text-craft-700 dark:bg-craft-900/30 dark:text-craft-300'
												: 'border-border text-text-secondary hover:border-craft-400 hover:bg-surface'
										}`}
									>
										{count}ct
									</button>
								))}
							</div>
							<p className="mt-2 text-xs text-text-muted">
								Finished size: {realSize.width} &times; {realSize.height} ({fabricCount}ct Aida)
							</p>
						</div>
					</div>
				)}

				{/* Step 3: Colors (optional) */}
				{step === 'colors' && (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<p className="text-sm text-text-secondary">
								Select thread colors for your palette.
							</p>
							{selectedColors.size > 0 && (
								<span className="text-xs text-text-muted">
									{selectedColors.size} selected
								</span>
							)}
						</div>

						{/* Search */}
						<input
							type="text"
							value={colorSearch}
							onChange={(e) => setColorSearch(e.target.value)}
							placeholder="Search DMC colors..."
							className="w-full rounded-md border border-border bg-surface-tertiary px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
						/>

						{/* Selected colors strip */}
						{selectedColors.size > 0 && (
							<div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-tertiary/50 p-2">
								{Array.from(selectedColors).map((hex) => {
									const dmc = DMC_COLORS.find((c) => c.hex === hex);
									return (
										<button
											key={hex}
											type="button"
											onClick={() => toggleColor(hex)}
											className="group relative flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-xs"
											title={`${dmc?.name ?? hex} — click to remove`}
										>
											<span
												className="inline-block h-3.5 w-3.5 rounded-sm border border-black/10"
												style={{ backgroundColor: hex }}
											/>
											<span className="max-w-[60px] truncate text-text-secondary">{dmc?.id}</span>
										</button>
									);
								})}
							</div>
						)}

						{/* Color grid */}
						<div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-surface-tertiary/50 p-2">
							<div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
								{filteredColors.map((color) => {
									const isSelected = selectedColors.has(color.hex);
									return (
										<button
											key={color.id}
											type="button"
											onClick={() => toggleColor(color.hex)}
											className={`relative h-7 w-7 rounded-sm border-2 transition-all ${
												isSelected
													? 'border-craft-600 ring-1 ring-craft-300'
													: 'border-transparent hover:border-border'
											}`}
											style={{ backgroundColor: color.hex }}
											title={`${color.id}: ${color.name}`}
										>
											{isSelected && (
												<Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
											)}
										</button>
									);
								})}
							</div>
							{filteredColors.length === 0 && (
								<p className="py-4 text-center text-xs text-text-muted">No colors match your search.</p>
							)}
						</div>
					</div>
				)}

				{/* Step 4: Name & Create */}
				{step === 'name' && (
					<div className="space-y-4">
						<div className="rounded-lg border border-border bg-surface-tertiary/50 p-3">
							<p className="text-sm text-text-secondary">
								<strong>{CRAFT_TYPE_LABELS[craftType]}</strong> &mdash; {width} &times; {height} cells
							</p>
							<p className="text-xs text-text-muted">
								{realSize.width} &times; {realSize.height} ({fabricCount}ct Aida)
							</p>
						</div>

						<div>
							<label htmlFor="wiz-name" className="mb-1 block text-sm font-medium text-text-secondary">
								Pattern Name
							</label>
							<input
								ref={nameInputRef}
								id="wiz-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleCreate();
								}}
								placeholder="My Pattern"
								className="w-full rounded-md border border-border bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-craft-500 focus:outline-none focus:ring-1 focus:ring-craft-300"
							/>
							<p className="mt-1 text-xs text-text-muted">
								Leave blank for "Untitled Pattern"
							</p>
						</div>
					</div>
				)}

				{/* Navigation */}
				<div className="mt-6 flex items-center justify-between">
					{stepIndex > 0 ? (
						<button
							type="button"
							onClick={goBack}
							className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							Back
						</button>
					) : (
						<button
							type="button"
							onClick={onClose}
							className="rounded-md border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-tertiary"
						>
							Cancel
						</button>
					)}

					{step === 'name' ? (
						<button
							type="button"
							onClick={handleCreate}
							className="flex items-center gap-1.5 rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
						>
							<Check className="h-3.5 w-3.5" />
							Create
						</button>
					) : (
						<button
							type="button"
							onClick={goNext}
							className="flex items-center gap-1.5 rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
						>
							Next
							<ArrowRight className="h-3.5 w-3.5" />
						</button>
					)}
				</div>
			</div>
			</FocusTrap>
		</div>
	);
}
