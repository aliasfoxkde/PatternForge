/**
 * FocusTrap - Utility component that traps keyboard focus within a container.
 *
 * When active, Tab/Shift+Tab cycles through focusable elements inside
 * the container instead of moving focus to elements outside.
 */

import { useRef, useEffect, useCallback } from 'react';

/** Selectors for elements that can receive focus. */
const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
].join(', ');

interface FocusTrapProps {
	children: React.ReactNode;
	/** Whether the trap is active. */
	active: boolean;
	/** Callback when focus would escape the container (for restore). */
	onEscape?: () => void;
}

export function FocusTrap({ children, active, onEscape }: FocusTrapProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const getFocusableElements = useCallback((): HTMLElement[] => {
		if (!containerRef.current) return [];
		return Array.from(
			containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
		).filter((el) => !el.hasAttribute('disabled') && el.tabIndex >= 0);
	}, []);

	useEffect(() => {
		if (!active) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onEscape?.();
				return;
			}

			if (e.key !== 'Tab') return;

			const focusable = getFocusableElements();
			if (focusable.length === 0) return;

			const first = focusable[0]!;
			const last = focusable[focusable.length - 1]!;

			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [active, getFocusableElements, onEscape]);

	// Auto-focus first element when trap activates
	useEffect(() => {
		if (!active) return;
		const focusable = getFocusableElements();
		if (focusable.length > 0) {
			// Small delay to ensure DOM is ready
			const timer = setTimeout(() => {
				focusable[0]!.focus();
			}, 50);
			return () => clearTimeout(timer);
		}
	}, [active, getFocusableElements]);

	return (
		<div ref={containerRef}>
			{children}
		</div>
	);
}
