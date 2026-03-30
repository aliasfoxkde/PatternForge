/**
 * Starter Pattern Library
 *
 * Built-in pattern templates users can browse and load.
 * Each template defines cell data as [row, col, color] tuples
 * that get populated into a new PatternGrid.
 */

export interface StarterPattern {
	/** Unique template ID */
	id: string;
	/** Display name */
	name: string;
	/** Short description */
	description: string;
	/** Grid dimensions */
	width: number;
	height: number;
	/** Craft type */
	craftType: string;
	/** Category tag */
	category: string;
	/** Cell data: [row, col, hexColor] */
	cells: Array<[number, number, string]>;
	/** Colors used in the pattern (hex) */
	palette: string[];
}

/**
 * Heart shape - classic cross-stitch motif
 */
const heart: StarterPattern = {
	id: "heart",
	name: "Heart",
	description: "Classic heart motif, perfect for gifts and cards",
	width: 10,
	height: 9,
	craftType: "cross-stitch",
	category: "Shapes",
	palette: ["#e60000", "#ff4040", "#ff6666"],
	cells: [
		// Row 0
		[0, 1, "#ff4040"], [0, 2, "#e60000"], [0, 3, "#e60000"], [0, 6, "#e60000"], [0, 7, "#e60000"], [0, 8, "#ff4040"],
		// Row 1
		[1, 0, "#ff4040"], [1, 1, "#e60000"], [1, 2, "#e60000"], [1, 3, "#e60000"], [1, 4, "#ff6666"], [1, 5, "#ff6666"], [1, 6, "#e60000"], [1, 7, "#e60000"], [1, 8, "#e60000"], [1, 9, "#ff4040"],
		// Row 2
		[2, 0, "#e60000"], [2, 1, "#e60000"], [2, 2, "#e60000"], [2, 3, "#e60000"], [2, 4, "#e60000"], [2, 5, "#e60000"], [2, 6, "#e60000"], [2, 7, "#e60000"], [2, 8, "#e60000"], [2, 9, "#e60000"],
		// Row 3
		[3, 0, "#e60000"], [3, 1, "#e60000"], [3, 2, "#e60000"], [3, 3, "#e60000"], [3, 4, "#e60000"], [3, 5, "#e60000"], [3, 6, "#e60000"], [3, 7, "#e60000"], [3, 8, "#e60000"], [3, 9, "#e60000"],
		// Row 4
		[4, 1, "#e60000"], [4, 2, "#e60000"], [4, 3, "#e60000"], [4, 4, "#e60000"], [4, 5, "#e60000"], [4, 6, "#e60000"], [4, 7, "#e60000"], [4, 8, "#e60000"],
		// Row 5
		[5, 2, "#e60000"], [5, 3, "#e60000"], [5, 4, "#e60000"], [5, 5, "#e60000"], [5, 6, "#e60000"], [5, 7, "#e60000"],
		// Row 6
		[6, 3, "#e60000"], [6, 4, "#e60000"], [6, 5, "#e60000"], [6, 6, "#e60000"],
		// Row 7
		[7, 4, "#e60000"], [7, 5, "#e60000"],
	],
};

/**
 * Five-pointed star
 */
const star: StarterPattern = {
	id: "star",
	name: "Star",
	description: "Five-pointed star, great for patriotic themes",
	width: 11,
	height: 11,
	craftType: "cross-stitch",
	category: "Shapes",
	palette: ["#ffd700", "#ffec8b"],
	cells: [
		// Top point
		[0, 5, "#ffd700"],
		[1, 5, "#ffd700"],
		// Upper arms
		[2, 4, "#ffd700"], [2, 5, "#ffec8b"], [2, 6, "#ffd700"],
		[3, 3, "#ffd700"], [3, 4, "#ffec8b"], [3, 5, "#ffec8b"], [3, 6, "#ffec8b"], [3, 7, "#ffd700"],
		// Middle
		[4, 0, "#ffd700"], [4, 1, "#ffd700"], [4, 2, "#ffd700"], [4, 3, "#ffec8b"], [4, 4, "#ffec8b"], [4, 5, "#ffec8b"], [4, 6, "#ffec8b"], [4, 7, "#ffec8b"], [4, 8, "#ffd700"], [4, 9, "#ffd700"], [4, 10, "#ffd700"],
		[5, 0, "#ffd700"], [5, 1, "#ffec8b"], [5, 2, "#ffec8b"], [5, 3, "#ffec8b"], [5, 4, "#ffec8b"], [5, 5, "#ffec8b"], [5, 6, "#ffec8b"], [5, 7, "#ffec8b"], [5, 8, "#ffec8b"], [5, 9, "#ffec8b"], [5, 10, "#ffd700"],
		[6, 1, "#ffd700"], [6, 2, "#ffec8b"], [6, 3, "#ffec8b"], [6, 4, "#ffec8b"], [6, 5, "#ffec8b"], [6, 6, "#ffec8b"], [6, 7, "#ffec8b"], [6, 8, "#ffec8b"], [6, 9, "#ffd700"],
		// Lower arms
		[7, 2, "#ffd700"], [7, 3, "#ffec8b"], [7, 5, "#ffec8b"], [7, 7, "#ffec8b"], [7, 8, "#ffd700"],
		[8, 3, "#ffd700"], [8, 4, "#ffec8b"], [8, 6, "#ffec8b"], [8, 7, "#ffd700"],
		// Bottom
		[9, 4, "#ffd700"], [9, 6, "#ffd700"],
		[10, 5, "#ffd700"],
	],
};

/**
 * Simple flower with stem
 */
const flower: StarterPattern = {
	id: "flower",
	name: "Flower",
	description: "Simple daisy with a stem and leaves",
	width: 9,
	height: 13,
	craftType: "cross-stitch",
	category: "Nature",
	palette: ["#ff69b4", "#ffd700", "#228b22", "#006400"],
	cells: [
		// Flower head (center at 4,3)
		[0, 4, "#ff69b4"],
		[1, 3, "#ff69b4"], [1, 4, "#ffd700"], [1, 5, "#ff69b4"],
		[2, 3, "#ffd700"], [2, 4, "#ffd700"], [2, 5, "#ffd700"],
		[3, 2, "#ff69b4"], [3, 3, "#ffd700"], [3, 4, "#ffd700"], [3, 5, "#ffd700"], [3, 6, "#ff69b4"],
		[4, 3, "#ffd700"], [4, 4, "#ffd700"], [4, 5, "#ffd700"],
		[5, 3, "#ff69b4"], [5, 4, "#ffd700"], [5, 5, "#ff69b4"],
		// Stem
		[6, 4, "#228b22"],
		[7, 4, "#228b22"],
		[8, 4, "#228b22"],
		[9, 4, "#228b22"],
		[10, 4, "#228b22"],
		[11, 4, "#006400"],
		[12, 4, "#006400"],
		// Leaves
		[8, 3, "#228b22"],
		[9, 2, "#228b22"], [9, 3, "#228b22"],
		[10, 5, "#228b22"],
		[11, 5, "#006400"],
	],
};

/**
 * Smiley face
 */
const smiley: StarterPattern = {
	id: "smiley",
	name: "Smiley",
	description: "Classic smiley face emoji pattern",
	width: 11,
	height: 11,
	craftType: "pixel-art",
	category: "Fun",
	palette: ["#ffd700", "#000000"],
	cells: [
		// Face outline - top
		[0, 3, "#ffd700"], [0, 4, "#ffd700"], [0, 5, "#ffd700"], [0, 6, "#ffd700"], [0, 7, "#ffd700"],
		[1, 2, "#ffd700"], [1, 8, "#ffd700"],
		[2, 1, "#ffd700"], [2, 9, "#ffd700"],
		[3, 1, "#ffd700"], [3, 9, "#ffd700"],
		[4, 1, "#ffd700"], [3, 4, "#000000"], [4, 9, "#ffd700"],
		[5, 1, "#ffd700"], [5, 9, "#ffd700"],
		[6, 1, "#ffd700"], [6, 9, "#ffd700"],
		[7, 1, "#ffd700"], [7, 3, "#000000"], [7, 4, "#000000"], [7, 5, "#000000"], [7, 6, "#000000"], [7, 7, "#000000"], [7, 9, "#ffd700"],
		[8, 2, "#ffd700"], [8, 8, "#ffd700"],
		[9, 3, "#ffd700"], [9, 4, "#ffd700"], [9, 5, "#ffd700"], [9, 6, "#ffd700"], [9, 7, "#ffd700"],
	],
};

/**
 * Christmas tree
 */
const tree: StarterPattern = {
	id: "tree",
	name: "Christmas Tree",
	description: "Festive tree with a trunk and star topper",
	width: 9,
	height: 12,
	craftType: "cross-stitch",
	category: "Holidays",
	palette: ["#006400", "#228b22", "#8b4513", "#ffd700"],
	cells: [
		// Star
		[0, 4, "#ffd700"],
		// Tree layers
		[1, 3, "#228b22"], [1, 4, "#006400"], [1, 5, "#228b22"],
		[2, 2, "#228b22"], [2, 3, "#006400"], [2, 4, "#006400"], [2, 5, "#006400"], [2, 6, "#228b22"],
		[3, 2, "#228b22"], [3, 3, "#006400"], [3, 4, "#006400"], [3, 5, "#006400"], [3, 6, "#228b22"],
		[4, 1, "#228b22"], [4, 2, "#006400"], [4, 3, "#006400"], [4, 4, "#006400"], [4, 5, "#006400"], [4, 6, "#006400"], [4, 7, "#228b22"],
		[5, 1, "#228b22"], [5, 2, "#006400"], [5, 3, "#006400"], [5, 4, "#006400"], [5, 5, "#006400"], [5, 6, "#006400"], [5, 7, "#228b22"],
		[6, 0, "#228b22"], [6, 1, "#006400"], [6, 2, "#006400"], [6, 3, "#006400"], [6, 4, "#006400"], [6, 5, "#006400"], [6, 6, "#006400"], [6, 7, "#006400"], [6, 8, "#228b22"],
		[7, 0, "#228b22"], [7, 1, "#006400"], [7, 2, "#006400"], [7, 3, "#006400"], [7, 4, "#006400"], [7, 5, "#006400"], [7, 6, "#006400"], [7, 7, "#006400"], [7, 8, "#228b22"],
		// Trunk
		[8, 3, "#8b4513"], [8, 4, "#8b4513"], [8, 5, "#8b4513"],
		[9, 3, "#8b4513"], [9, 4, "#8b4513"], [9, 5, "#8b4513"],
	],
};

/**
 * Checkerboard pattern
 */
const checkerboard: StarterPattern = {
	id: "checkerboard",
	name: "Checkerboard",
	description: "Classic alternating color grid pattern",
	width: 10,
	height: 10,
	craftType: "cross-stitch",
	category: "Geometric",
	palette: ["#000000", "#ffffff"],
	cells: (() => {
		const cells: Array<[number, number, string]> = [];
		for (let r = 0; r < 10; r++) {
			for (let c = 0; c < 10; c++) {
				if ((r + c) % 2 === 0) {
					cells.push([r, c, "#000000"]);
				}
			}
		}
		return cells;
	})(),
};

/**
 * Diamond/rhombus pattern
 */
const diamond: StarterPattern = {
	id: "diamond",
	name: "Diamond",
	description: "Geometric diamond shape with gradient colors",
	width: 11,
	height: 11,
	craftType: "pixel-art",
	category: "Geometric",
	palette: ["#4169e1", "#6495ed", "#87ceeb"],
	cells: (() => {
		const cells: Array<[number, number, string]> = [];
		const center = 5;
		for (let r = 0; r < 11; r++) {
			for (let c = 0; c < 11; c++) {
				const dist = Math.abs(r - center) + Math.abs(c - center);
				if (dist <= 5) {
					const color = dist <= 2 ? "#4169e1" : dist <= 4 ? "#6495ed" : "#87ceeb";
					cells.push([r, c, color]);
				}
			}
		}
		return cells;
	})(),
};

/**
 * Rainbow stripes
 */
const rainbow: StarterPattern = {
	id: "rainbow",
	name: "Rainbow",
	description: "Horizontal rainbow stripes",
	width: 20,
	height: 7,
	craftType: "fuse-beads",
	category: "Fun",
	palette: ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#8b00ff"],
	cells: (() => {
		const colors = ["#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#0000ff", "#4b0082", "#8b00ff"];
		const cells: Array<[number, number, string]> = [];
		for (let r = 0; r < 7; r++) {
			for (let c = 0; c < 20; c++) {
				cells.push([r, c, colors[r]!]);
			}
		}
		return cells;
	})(),
};

/** All starter patterns */
export const STARTER_PATTERNS: StarterPattern[] = [
	heart,
	star,
	flower,
	smiley,
	tree,
	checkerboard,
	diamond,
	rainbow,
];

/** Unique categories */
export const STARTER_CATEGORIES = [...new Set(STARTER_PATTERNS.map((p) => p.category))];
