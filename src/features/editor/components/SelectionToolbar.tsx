/**
 * SelectionToolbar - Floating toolbar that appears above the selection rectangle.
 *
 * Provides copy, cut, delete, and fill actions for the selected area.
 */

import { Copy, Scissors, Trash2, PaintBucket } from "lucide-react";

interface SelectionToolbarProps {
	/** Callback for copy action */
	onCopy: () => void;
	/** Callback for cut action */
	onCut: () => void;
	/** Callback for delete action */
	onDelete: () => void;
	/** Callback for fill action */
	onFill: () => void;
}

export function SelectionToolbar({ onCopy, onCut, onDelete, onFill }: SelectionToolbarProps) {
	const actions = [
		{ icon: Copy, label: "Copy", action: onCopy },
		{ icon: Scissors, label: "Cut", action: onCut },
		{ icon: Trash2, label: "Delete", action: onDelete },
		{ icon: PaintBucket, label: "Fill", action: onFill },
	];

	return (
		<div className="absolute z-50 flex items-center gap-0.5 rounded-lg border border-border bg-surface px-0.5 py-0.5 shadow-md">
			{actions.map(({ icon: Icon, label, action }) => (
				<button
					key={label}
					type="button"
					title={label}
					className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-craft-100 hover:text-craft-700"
					onClick={action}
				>
					<Icon className="h-3.5 w-3.5" />
				</button>
			))}
		</div>
	);
}
