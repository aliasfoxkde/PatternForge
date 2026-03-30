/**
 * ToolPalette - Vertical tool palette sidebar for the editor.
 */

import { memo } from 'react';
import { useEditorStore } from '@/shared/stores/editor-store';
import type { ToolType } from '@/engine/tools/tools';
import type { StitchType } from '@/engine/grid/grid';
import {
	Pencil,
	Paintbrush,
	Eraser,
	PaintBucket,
	Minus,
	Square,
	Circle,
	Pipette,
	MousePointer2,
	Move,
	FlipHorizontal,
	FlipVertical,
	Type,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ToolItem {
	type: ToolType;
	label: string;
	shortcut: string;
	icon: React.ComponentType<{ className?: string }>;
}

const DRAW_TOOLS: ToolItem[] = [
	{ type: 'pencil', label: 'Pencil', shortcut: 'P', icon: Pencil },
	{ type: 'brush', label: 'Brush', shortcut: 'B', icon: Paintbrush },
	{ type: 'eraser', label: 'Eraser', shortcut: 'E', icon: Eraser },
	{ type: 'fill', label: 'Fill', shortcut: 'G', icon: PaintBucket },
];

const SHAPE_TOOLS: ToolItem[] = [
	{ type: 'line', label: 'Line', shortcut: 'L', icon: Minus },
	{ type: 'rectangle', label: 'Rectangle', shortcut: 'R', icon: Square },
	{ type: 'ellipse', label: 'Ellipse', shortcut: 'O', icon: Circle },
];

const SELECT_TOOLS: ToolItem[] = [
	{ type: 'color-picker', label: 'Color Picker', shortcut: 'I', icon: Pipette },
	{ type: 'selection', label: 'Selection', shortcut: 'S', icon: MousePointer2 },
	{ type: 'text', label: 'Text', shortcut: 'T', icon: Type },
];

const VIEW_TOOLS: ToolItem[] = [
	{ type: 'pan', label: 'Pan', shortcut: 'H', icon: Move },
];

const STITCH_TYPES: { type: StitchType; label: string; short: string }[] = [
	{ type: 'full', label: 'Full Stitch', short: '■' },
	{ type: 'half', label: 'Half Stitch', short: '◁' },
	{ type: 'quarter', label: 'Quarter Stitch', short: '◀' },
	{ type: 'backstitch', label: 'Backstitch', short: '╲' },
	{ type: 'french-knot', label: 'French Knot', short: '●' },
	{ type: 'purl', label: 'Purl', short: '─' },
	{ type: 'knit', label: 'Knit', short: '∨' },
	{ type: 'yarn-over', label: 'Yarn Over', short: '○' },
	{ type: 'increase', label: 'Increase', short: '╱' },
	{ type: 'decrease', label: 'Decrease', short: '╲' },
];

function ToolDivider() {
	return <div className="mx-1 my-1 h-px w-8 bg-border" />;
}

function ToolButton({
	tool,
	isActive,
	onSelect,
}: {
	tool: ToolItem;
	isActive: boolean;
	onSelect: (type: ToolType) => void;
}) {
	const Icon = tool.icon;

	return (
		<button
			type="button"
			aria-label={`${tool.label} (${tool.shortcut})`}
			title={`${tool.label} (${tool.shortcut})`}
			className={cn(
				'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
				isActive
					? 'bg-craft-200 text-craft-800'
					: 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
			)}
			onClick={() => onSelect(tool.type)}
		>
			<Icon className="h-4 w-4" />
		</button>
	);
}

export const ToolPalette = memo(function ToolPalette() {
	const activeTool = useEditorStore((s) => s.activeTool);
	const setActiveTool = useEditorStore((s) => s.setActiveTool);
	const mirrorHorizontal = useEditorStore((s) => s.mirrorHorizontal);
	const setMirrorHorizontal = useEditorStore((s) => s.setMirrorHorizontal);
	const mirrorVertical = useEditorStore((s) => s.mirrorVertical);
	const setMirrorVertical = useEditorStore((s) => s.setMirrorVertical);
	const activeStitchType = useEditorStore((s) => s.activeStitchType);
	const setActiveStitchType = useEditorStore((s) => s.setActiveStitchType);

	const isDrawTool = ['pencil', 'brush', 'fill', 'line', 'rectangle', 'ellipse'].includes(activeTool);

	return (
		<aside className="flex w-12 flex-col items-center gap-1 border-r border-border bg-surface-secondary py-2" role="toolbar" aria-label="Drawing tools">
			{DRAW_TOOLS.map((tool) => (
				<ToolButton
					key={tool.type}
					tool={tool}
					isActive={activeTool === tool.type}
					onSelect={setActiveTool}
				/>
			))}

			<ToolDivider />

			{SHAPE_TOOLS.map((tool) => (
				<ToolButton
					key={tool.type}
					tool={tool}
					isActive={activeTool === tool.type}
					onSelect={setActiveTool}
				/>
			))}

			<ToolDivider />

			{SELECT_TOOLS.map((tool) => (
				<ToolButton
					key={tool.type}
					tool={tool}
					isActive={activeTool === tool.type}
					onSelect={setActiveTool}
				/>
			))}

			<ToolDivider />

			{VIEW_TOOLS.map((tool) => (
				<ToolButton
					key={tool.type}
					tool={tool}
					isActive={activeTool === tool.type}
					onSelect={setActiveTool}
				/>
			))}

			{/* Stitch type selector — only visible when a drawing/shape tool is active */}
			{isDrawTool && (
				<>
					<ToolDivider />
					<div className="flex flex-col items-center gap-0.5">
						{STITCH_TYPES.map((stitch) => (
							<button
								key={stitch.type}
								type="button"
								title={stitch.label}
								className={cn(
									'flex h-7 w-9 items-center justify-center rounded text-xs font-mono transition-colors',
									activeStitchType === stitch.type
										? 'bg-craft-200 text-craft-800'
										: 'text-text-muted hover:bg-surface-tertiary hover:text-text-primary',
								)}
								onClick={() => setActiveStitchType(stitch.type)}
							>
								{stitch.short}
							</button>
						))}
					</div>
				 </>
			)}

			{/* Spacer pushes mirror buttons to bottom */}
			<div className="flex-1" />

			{/* Mirror toggles */}
			<ToolDivider />
			<button
				type="button"
				title="Mirror Horizontal"
				className={cn(
					'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
					mirrorHorizontal
						? 'bg-craft-200 text-craft-800'
						: 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
				)}
				onClick={() => setMirrorHorizontal(!mirrorHorizontal)}
			>
				<FlipHorizontal className="h-4 w-4" />
			</button>
			<button
				type="button"
				title="Mirror Vertical"
				className={cn(
					'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
					mirrorVertical
						? 'bg-craft-200 text-craft-800'
						: 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary',
				)}
				onClick={() => setMirrorVertical(!mirrorVertical)}
			>
				<FlipVertical className="h-4 w-4" />
			</button>
		</aside>
	);
});
