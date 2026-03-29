/**
 * ConverterSettings - Settings panel for the image-to-pattern converter.
 *
 * Controls craft type, grid dimensions, color count, dithering, and confetti reduction.
 */

import type { CraftType } from "@/engine/pattern/types";
import { CRAFT_TYPE_LABELS } from "@/engine/pattern/types";
import {
	Lock,
	Maximize2,
	Palette,
	Settings2,
	Sparkles,
	Unlock,
	Waves,
} from "lucide-react";
import { useCallback, useId } from "react";

export interface ConverterSettingsState {
	craftType: CraftType;
	gridWidth: number;
	gridHeight: number;
	lockAspectRatio: boolean;
	maxColors: number;
	dithering: "none" | "floyd-steinberg" | "ordered" | "atkinson";
	confettiReduction: number;
}

export interface ConverterSettingsProps {
	settings: ConverterSettingsState;
	onSettingsChange: (settings: ConverterSettingsState) => void;
	disabled?: boolean;
}

const CRAFT_TYPES = Object.entries(CRAFT_TYPE_LABELS) as [CraftType, string][];

const DITHERING_OPTIONS = [
	{ value: "none" as const, label: "None" },
	{ value: "floyd-steinberg" as const, label: "Floyd-Steinberg" },
	{ value: "ordered" as const, label: "Ordered (Bayer)" },
	{ value: "atkinson" as const, label: "Atkinson" },
];

function SelectField({
	label,
	icon: Icon,
	value,
	options,
	onChange,
	disabled,
}: {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	value: string;
	options: { value: string; label: string }[];
	onChange: (value: string) => void;
	disabled?: boolean;
}) {
	const id = useId();
	return (
		<div>
			<label
				htmlFor={id}
				className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary"
			>
				<Icon className="h-3.5 w-3.5" />
				{label}
			</label>
			<select
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary transition-colors focus:border-craft-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}

function NumberField({
	label,
	icon: Icon,
	value,
	min,
	max,
	onChange,
	disabled,
}: {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	value: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
	disabled?: boolean;
}) {
	const id = useId();
	return (
		<div>
			<label
				htmlFor={id}
				className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary"
			>
				<Icon className="h-3.5 w-3.5" />
				{label}
			</label>
			<input
				id={id}
				type="number"
				value={value}
				min={min}
				max={max}
				onChange={(e) => {
					const parsed = Number.parseInt(e.target.value, 10);
					if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
						onChange(parsed);
					}
				}}
				disabled={disabled}
				className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary tabular-nums transition-colors focus:border-craft-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			/>
		</div>
	);
}

function SliderField({
	label,
	icon: Icon,
	value,
	min,
	max,
	onChange,
	disabled,
}: {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	value: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
	disabled?: boolean;
}) {
	const id = useId();
	return (
		<div>
			<label
				htmlFor={id}
				className="mb-1.5 flex items-center justify-between text-xs font-medium text-text-secondary"
			>
				<span className="flex items-center gap-1.5">
					<Icon className="h-3.5 w-3.5" />
					{label}
				</span>
				<span className="tabular-nums text-text-primary">{value}</span>
			</label>
			<input
				id={id}
				type="range"
				value={value}
				min={min}
				max={max}
				onChange={(e) => onChange(Number(e.target.value))}
				disabled={disabled}
				className="w-full accent-craft-600"
			/>
			<div className="mt-0.5 flex justify-between text-[10px] text-text-muted">
				<span>{min}</span>
				<span>{max}</span>
			</div>
		</div>
	);
}

export function ConverterSettings({
	settings,
	onSettingsChange,
	disabled = false,
}: ConverterSettingsProps) {
	const update = useCallback(
		(partial: Partial<ConverterSettingsState>) => {
			onSettingsChange({ ...settings, ...partial });
		},
		[settings, onSettingsChange],
	);

	const handleGridWidthChange = useCallback(
		(newWidth: number) => {
			const update_ = {
				gridWidth: newWidth,
			} as Partial<ConverterSettingsState>;
			if (settings.lockAspectRatio) {
				update_.gridHeight = newWidth;
			}
			update(update_);
		},
		[settings.lockAspectRatio, update],
	);

	const handleGridHeightChange = useCallback(
		(newHeight: number) => {
			const update_ = {
				gridHeight: newHeight,
			} as Partial<ConverterSettingsState>;
			if (settings.lockAspectRatio) {
				update_.gridWidth = newHeight;
			}
			update(update_);
		},
		[settings.lockAspectRatio, update],
	);

	return (
		<div className="flex flex-col gap-5">
			<div className="mb-1 flex items-center gap-2">
				<Settings2 className="h-4 w-4 text-text-muted" />
				<h2 className="text-sm font-semibold text-text-primary">
					Conversion Settings
				</h2>
			</div>

			<SelectField
				label="Craft Type"
				icon={Palette}
				value={settings.craftType}
				options={CRAFT_TYPES.map(([value, label]) => ({ value, label }))}
				onChange={(v) => update({ craftType: v as CraftType })}
				disabled={disabled}
			/>

			<div>
				<span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
					<Maximize2 className="h-3.5 w-3.5" />
					Pattern Size
				</span>
				<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
					<NumberField
						label=""
						icon={Maximize2}
						value={settings.gridWidth}
						min={10}
						max={500}
						onChange={handleGridWidthChange}
						disabled={disabled}
					/>
					<button
						type="button"
						onClick={() =>
							update({ lockAspectRatio: !settings.lockAspectRatio })
						}
						disabled={disabled}
						className="mt-5 flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-secondary transition-colors hover:bg-surface-tertiary disabled:opacity-50"
						title={
							settings.lockAspectRatio
								? "Unlock aspect ratio"
								: "Lock aspect ratio"
						}
					>
						{settings.lockAspectRatio ? (
							<Lock className="h-3.5 w-3.5" />
						) : (
							<Unlock className="h-3.5 w-3.5" />
						)}
					</button>
					<NumberField
						label=""
						icon={Maximize2}
						value={settings.gridHeight}
						min={10}
						max={500}
						onChange={handleGridHeightChange}
						disabled={disabled}
					/>
				</div>
				<div className="mt-1 flex justify-between text-[10px] text-text-muted">
					<span>Width</span>
					<span>Height</span>
				</div>
			</div>

			<SliderField
				label="Max Colors"
				icon={Palette}
				value={settings.maxColors}
				min={2}
				max={250}
				onChange={(v) => update({ maxColors: v })}
				disabled={disabled}
			/>

			<SelectField
				label="Dithering"
				icon={Waves}
				value={settings.dithering}
				options={DITHERING_OPTIONS}
				onChange={(v) =>
					update({ dithering: v as ConverterSettingsState["dithering"] })
				}
				disabled={disabled}
			/>

			<SliderField
				label="Confetti Reduction"
				icon={Sparkles}
				value={settings.confettiReduction}
				min={0}
				max={100}
				onChange={(v) => update({ confettiReduction: v })}
				disabled={disabled}
			/>
		</div>
	);
}
