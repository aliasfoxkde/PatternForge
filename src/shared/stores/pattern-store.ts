/**
 * Pattern store - manages the current pattern state.
 *
 * Uses Zustand v5 with the curried `create<State>()()` syntax.
 */

import {
	type CraftType,
	type Pattern,
	type PatternMetadata,
	type PatternPalette,
	createEmptyPattern,
	generateId,
} from "@/engine/pattern/types";
import type { PatternGrid } from "@/engine/grid/grid";
import { create } from "zustand";

interface PatternState {
	/** Current pattern being edited, or null */
	pattern: Pattern | null;

	/** Whether the pattern has unsaved changes */
	isDirty: boolean;

	// -- Actions --

	/** Create a new empty pattern */
	createPattern: (
		name: string,
		width: number,
		height: number,
		craftType: CraftType,
	) => void;

	/** Load an existing pattern (e.g. from storage) */
	loadPattern: (pattern: Pattern) => void;

	/** Update pattern metadata fields */
	updatePatternMetadata: (metadata: Partial<PatternMetadata>) => void;

	/** Mutate the grid via an updater callback */
	updateGrid: (updater: (grid: PatternGrid) => void) => void;

	/** Replace the entire color palette */
	setPalette: (palette: PatternPalette) => void;

	/** Resize the grid, preserving existing cells that fit */
	resizeGrid: (width: number, height: number) => void;

	/** Clear all cells from the grid */
	clearGrid: () => void;

	/** Mark the pattern as saved (clear dirty flag) */
	markSaved: () => void;

	/** Close the current pattern */
	closePattern: () => void;
}

export const usePatternStore = create<PatternState>()((set, get) => ({
	pattern: null,
	isDirty: false,

	createPattern(name, width, height, craftType) {
		const pattern = createEmptyPattern(
			generateId(),
			name,
			width,
			height,
			craftType,
		);
		set({ pattern, isDirty: false });
	},

	loadPattern(pattern) {
		set({ pattern, isDirty: false });
	},

	updatePatternMetadata(metadata) {
		const { pattern } = get();
		if (!pattern) return;

		set({
			pattern: {
				...pattern,
				metadata: { ...pattern.metadata, ...metadata, updatedAt: Date.now() },
			},
			isDirty: true,
		});
	},

	updateGrid(updater) {
		const { pattern } = get();
		if (!pattern) return;

		updater(pattern.grid);
		set({
			pattern: {
				...pattern,
				metadata: { ...pattern.metadata, updatedAt: Date.now() },
			},
			isDirty: true,
		});
	},

	setPalette(palette) {
		const { pattern } = get();
		if (!pattern) return;

		set({
			pattern: { ...pattern, palette },
			isDirty: true,
		});
	},

	resizeGrid(width, height) {
		const { pattern } = get();
		if (!pattern) return;

		pattern.grid.resize(width, height);
		set({
			pattern: {
				...pattern,
				metadata: { ...pattern.metadata, updatedAt: Date.now() },
			},
			isDirty: true,
		});
	},

	clearGrid() {
		const { pattern } = get();
		if (!pattern) return;

		pattern.grid.clearAll();
		set({
			pattern: {
				...pattern,
				metadata: { ...pattern.metadata, updatedAt: Date.now() },
			},
			isDirty: true,
		});
	},

	markSaved() {
		set({ isDirty: false });
	},

	closePattern() {
		set({ pattern: null, isDirty: false });
	},
}));
