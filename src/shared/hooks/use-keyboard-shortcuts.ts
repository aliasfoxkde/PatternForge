/**
 * Keyboard shortcuts hook.
 *
 * Registers global keyboard event listeners and dispatches to the
 * provided shortcut map.  Handles Mac (Cmd) vs Windows/Linux (Ctrl)
 * modifier differences and ignores events when focus is inside
 * input/textarea/select elements.
 */

import { useCallback, useEffect } from "react";

interface ShortcutMap {
	[key: string]: () => void;
}

/** Elements where keyboard shortcuts should be suppressed. */
const INPUT_SELECTOR = "input, textarea, select, [contenteditable]";

/** Return the platform modifier key label ('meta' on Mac, 'ctrl' otherwise). */
function modKey(): "meta" | "ctrl" {
	return navigator.platform?.toLowerCase().includes("mac") ? "meta" : "ctrl";
}

/** Check whether the event target is an editable element. */
function isEditable(target: EventTarget | null): boolean {
	if (target instanceof HTMLElement) {
		return target.closest(INPUT_SELECTOR) !== null;
	}
	return false;
}

/**
 * Normalize a keyboard event to a shortcut key string.
 *
 * Examples:
 *   Ctrl+Z           -> "mod+z"
 *   Ctrl+Shift+Z     -> "mod+shift+z"
 *   B                -> "b"
 *   ?                -> "?"
 *   Ctrl+K           -> "mod+k"
 *   Ctrl+/           -> "mod+/"
 */
function eventToShortcut(e: KeyboardEvent, mod: "meta" | "ctrl"): string {
	const parts: string[] = [];

	const modPressed = mod === "meta" ? e.metaKey : e.ctrlKey;

	if (modPressed) parts.push("mod");
	if (e.shiftKey) parts.push("shift");
	if (e.altKey) parts.push("alt");

	// Use key for printable chars, code for special keys
	const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
	parts.push(key);

	return parts.join("+");
}

/**
 * Register global keyboard shortcuts.
 *
 * @param shortcuts - Map of shortcut key strings to handler functions.
 *                    Keys use the format "mod+z", "mod+shift+z", "b", "?", etc.
 *                    "mod" automatically resolves to Cmd on Mac, Ctrl elsewhere.
 * @param enabled   - Whether shortcuts are active (default: true).
 */
export function useKeyboardShortcuts(
	shortcuts: ShortcutMap,
	enabled = true,
): void {
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (!enabled) return;
			if (isEditable(e.target)) return;

			const mod = modKey();
			const shortcut = eventToShortcut(e, mod);

			const handler = shortcuts[shortcut];
			if (handler) {
				e.preventDefault();
				handler();
			}
		},
		[shortcuts, enabled],
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);
}
