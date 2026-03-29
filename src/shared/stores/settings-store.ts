/**
 * Settings store - persists user preferences to localStorage via Zustand persist middleware.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
	// -- Theme --

	theme: "light" | "dark" | "system";
	setTheme: (theme: "light" | "dark" | "system") => void;

	// -- Default craft type --

	defaultCraftType: string;
	setDefaultCraftType: (craftType: string) => void;

	// -- Grid preferences --

	defaultGridWidth: number;
	setDefaultGridWidth: (width: number) => void;
	defaultGridHeight: number;
	setDefaultGridHeight: (height: number) => void;
	showGridLines: boolean;
	setShowGridLines: (show: boolean) => void;
	showCoordinates: boolean;
	setShowCoordinates: (show: boolean) => void;
	majorGridInterval: number;
	setMajorGridInterval: (interval: number) => void;

	// -- Editor preferences --

	autoSave: boolean;
	setAutoSave: (autoSave: boolean) => void;
	autoSaveInterval: number;
	setAutoSaveInterval: (interval: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
	persist(
		(set) => ({
			// Theme
			theme: "system",
			setTheme: (theme) => set({ theme }),

			// Default craft type
			defaultCraftType: "cross-stitch",
			setDefaultCraftType: (craftType) => set({ defaultCraftType: craftType }),

			// Grid preferences
			defaultGridWidth: 30,
			setDefaultGridWidth: (width) =>
				set({ defaultGridWidth: Math.max(1, Math.min(2000, width)) }),
			defaultGridHeight: 30,
			setDefaultGridHeight: (height) =>
				set({ defaultGridHeight: Math.max(1, Math.min(2000, height)) }),
			showGridLines: true,
			setShowGridLines: (show) => set({ showGridLines: show }),
			showCoordinates: true,
			setShowCoordinates: (show) => set({ showCoordinates: show }),
			majorGridInterval: 10,
			setMajorGridInterval: (interval) =>
				set({ majorGridInterval: Math.max(2, Math.min(100, interval)) }),

			// Editor preferences
			autoSave: true,
			setAutoSave: (autoSave) => set({ autoSave }),
			autoSaveInterval: 5,
			setAutoSaveInterval: (interval) =>
				set({ autoSaveInterval: Math.max(1, Math.min(300, interval)) }),
		}),
		{
			name: "patternforge-settings",
		},
	),
);
