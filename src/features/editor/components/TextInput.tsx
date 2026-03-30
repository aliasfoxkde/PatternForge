/**
 * TextInput - Floating text input for the text tool.
 *
 * Appears at the clicked cell position. Each character fills one cell.
 * Shift+Enter inserts a newline. Enter commits. Escape cancels. Blur commits.
 */

import { useEffect, useRef, useState, useCallback, type KeyboardEvent } from 'react';

export interface TextInputProps {
	/** Screen position (px) where the input should appear */
	x: number;
	y: number;
	/** Called when text is committed (Enter or blur). Lines is an array of strings, one per row. */
	onCommit: (lines: string[]) => void;
	/** Called when text is cancelled (Escape) */
	onCancel: () => void;
}

export function TextInput({ x, y, onCommit, onCancel }: TextInputProps) {
	const [text, setText] = useState('');
	const inputRef = useRef<HTMLTextAreaElement>(null);

	// Auto-focus on mount
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	// Commit on blur
	const handleBlur = useCallback(() => {
		const lines = text.split('\n');
		if (lines.some((l) => l.length > 0)) {
			onCommit(lines);
		} else {
			onCancel();
		}
	}, [text, onCommit, onCancel]);

	// Handle keyboard
	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				onCancel();
				return;
			}
			if (e.key === 'Enter' && !e.shiftKey) {
				// Enter without shift commits; Shift+Enter inserts a newline
				e.preventDefault();
				const lines = text.split('\n');
				if (lines.some((l) => l.length > 0)) {
					onCommit(lines);
				} else {
					onCancel();
				}
				return;
			}
		},
		[text, onCommit, onCancel],
	);

	return (
		<textarea
			ref={inputRef}
			value={text}
			onChange={(e) => setText(e.target.value)}
			onKeyDown={handleKeyDown}
			onBlur={handleBlur}
			rows={1}
			placeholder="Type text..."
			className="absolute z-50 min-w-[120px] resize-none rounded border border-craft-400 bg-surface px-1.5 py-0.5 font-mono text-sm text-text-primary shadow-lg outline-none focus:border-craft-600 dark:border-craft-500 dark:focus:border-craft-400"
			style={{ left: x, top: y }}
			aria-label="Text input for pattern"
		/>
	);
}
