/**
 * ToolPalette - Vertical tool palette sidebar for the editor.
 */

import { useEditorStore } from '@/shared/stores/editor-store';
import type { ToolType } from '@/engine/tools/tools';
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
];

const VIEW_TOOLS: ToolItem[] = [
	{ type: 'pan', label: 'Pan', shortcut: 'H', icon: Move },
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

export function ToolPalette() {
	const activeTool = useEditorStore((s) => s.activeTool);
	const setActiveTool = useEditorStore((s) => s.setActiveTool);
	const mirrorHorizontal = useEditorStore((s) => s.mirrorHorizontal);
	const setMirrorHorizontal = useEditorStore((s) => s.setMirrorHorizontal);
	const mirrorVertical = useEditorStore((s) => s.mirrorVertical);
	const setMirrorVertical = useEditorStore((s) => s.setMirrorVertical);

	return (
		<aside className="flex w-12 flex-col items-center gap-1 border-r border-border bg-surface-secondary py-2">
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
}
