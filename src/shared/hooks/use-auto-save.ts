/**
 * Auto-save hook.
 *
 * Watches the pattern store for changes and debounces saves to IndexedDB.
 * Respects the user's autoSave and autoSaveInterval settings.
 */

import { storage } from "@/shared/storage/storage";
import { usePatternStore } from "@/shared/stores/pattern-store";
import { useSettingsStore } from "@/shared/stores/settings-store";
import { useEffect, useRef } from "react";

export function useAutoSave(): void {
	const pattern = usePatternStore((s) => s.pattern);
	const isDirty = usePatternStore((s) => s.isDirty);
	const markSaved = usePatternStore((s) => s.markSaved);

	const autoSave = useSettingsStore((s) => s.autoSave);
	const autoSaveInterval = useSettingsStore((s) => s.autoSaveInterval);

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		// Clear any pending timer on cleanup or setting change
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}

		if (!autoSave || !pattern || !isDirty) return;

		const delayMs = autoSaveInterval * 1000;

		timerRef.current = setTimeout(async () => {
			if (!pattern) return;

			try {
				const { serializePattern } = await import("@/engine/pattern/types");
				const data = serializePattern(pattern);

				await storage.savePattern({
					id: pattern.id,
					name: pattern.metadata.name,
					craftType: pattern.metadata.craftType,
					data,
					thumbnail: "",
					updatedAt: Date.now(),
					createdAt: pattern.metadata.createdAt,
					version: pattern.metadata.version,
				});

				markSaved();
			} catch (error) {
				console.error("[AutoSave] Failed to save pattern:", error);
			}
		}, delayMs);

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, [pattern, isDirty, autoSave, autoSaveInterval, markSaved]);
}
