/**
 * IndexedDB storage service for PatternForge.
 *
 * Provides persistent local storage for patterns, settings, and version history.
 * Uses the `idb` library for a promise-based IndexedDB API.
 *
 * Database schema:
 *   - "patterns" store: pattern records keyed by id
 *   - "settings" store: key-value settings store
 *   - "versions" store: version history keyed by [patternId, version]
 */

import { type IDBPDatabase, openDB } from "idb";

/** A persisted pattern record in IndexedDB. */
export interface PatternRecord {
	id: string;
	name: string;
	craftType: string;
	/** Serialized pattern JSON (from serializePattern) */
	data: string;
	/** Base64 data URL for the pattern thumbnail */
	thumbnail: string;
	updatedAt: number;
	createdAt: number;
	version: number;
}

const DB_NAME = "patternforge";
const DB_VERSION = 1;

class StorageService {
	private dbPromise: Promise<IDBPDatabase>;

	constructor() {
		this.dbPromise = this.openDatabase();
	}

	// ---------------------------------------------------------------------------
	// Database initialization
	// ---------------------------------------------------------------------------

	private async openDatabase(): Promise<IDBPDatabase> {
		return openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				// Patterns store
				if (!db.objectStoreNames.contains("patterns")) {
					const patternStore = db.createObjectStore("patterns", {
						keyPath: "id",
					});
					patternStore.createIndex("updatedAt", "updatedAt");
					patternStore.createIndex("name", "name");
				}

				// Settings store (key-value)
				if (!db.objectStoreNames.contains("settings")) {
					db.createObjectStore("settings", { keyPath: "key" });
				}

				// Version history store
				if (!db.objectStoreNames.contains("versions")) {
					const versionStore = db.createObjectStore("versions", {
						keyPath: ["patternId", "version"],
					});
					versionStore.createIndex("patternId", "patternId");
				}
			},
		});
	}

	// ---------------------------------------------------------------------------
	// Patterns
	// ---------------------------------------------------------------------------

	/** Save or update a pattern record. */
	async savePattern(record: PatternRecord): Promise<void> {
		const db = await this.dbPromise;
		await db.put("patterns", record);
	}

	/** Load a single pattern by ID. */
	async loadPattern(id: string): Promise<PatternRecord | undefined> {
		const db = await this.dbPromise;
		return db.get("patterns", id);
	}

	/** Delete a pattern by ID. Also deletes its version history. */
	async deletePattern(id: string): Promise<void> {
		const db = await this.dbPromise;
		const tx = db.transaction(["patterns", "versions"], "readwrite");

		await tx.objectStore("patterns").delete(id);

		// Delete all versions for this pattern
		const versionIndex = tx.objectStore("versions").index("patternId");
		let cursor = await versionIndex.openCursor(id);
		while (cursor) {
			await cursor.delete();
			cursor = await cursor.continue();
		}

		await tx.done;
	}

	/** List all patterns, sorted by updatedAt descending. */
	async listPatterns(): Promise<PatternRecord[]> {
		const db = await this.dbPromise;
		const index = db.transaction("patterns").store.index("updatedAt");
		return index.getAll();
	}

	/** Search patterns by name (case-insensitive substring match). */
	async searchPatterns(query: string): Promise<PatternRecord[]> {
		const all = await this.listPatterns();
		const lowerQuery = query.toLowerCase();

		return all.filter((p) => p.name.toLowerCase().includes(lowerQuery));
	}

	// ---------------------------------------------------------------------------
	// Settings
	// ---------------------------------------------------------------------------

	/** Save a setting value. */
	async saveSetting(key: string, value: unknown): Promise<void> {
		const db = await this.dbPromise;
		await db.put("settings", { key, value });
	}

	/** Load a setting value. Returns undefined if not found. */
	async loadSetting<T = unknown>(key: string): Promise<T | undefined> {
		const db = await this.dbPromise;
		const record = await db.get("settings", key);
		return record?.value as T | undefined;
	}

	// ---------------------------------------------------------------------------
	// Version history
	// ---------------------------------------------------------------------------

	/** Save a version snapshot for a pattern. */
	async saveVersion(
		patternId: string,
		version: number,
		data: string,
	): Promise<void> {
		const db = await this.dbPromise;
		await db.put("versions", {
			patternId,
			version,
			data,
			timestamp: Date.now(),
		});
	}

	/** Load a specific version of a pattern. */
	async loadVersion(
		patternId: string,
		version: number,
	): Promise<string | undefined> {
		const db = await this.dbPromise;
		const record = await db.get("versions", [patternId, version]);
		return record?.data;
	}

	/** List all versions for a pattern (sorted by version descending). */
	async listVersions(
		patternId: string,
	): Promise<Array<{ version: number; timestamp: number }>> {
		const db = await this.dbPromise;
		const index = db.transaction("versions").store.index("patternId");
		const records = await index.getAll(patternId);

		return records
			.map((r) => ({ version: r.version, timestamp: r.timestamp }))
			.sort((a, b) => b.version - a.version);
	}

	/** Delete old versions, keeping only the most recent N. */
	async deleteOldVersions(patternId: string, keep: number): Promise<void> {
		const versions = await this.listVersions(patternId);

		if (versions.length <= keep) return;

		const toDelete = versions.slice(keep);
		const db = await this.dbPromise;
		const tx = db.transaction("versions", "readwrite");
		const store = tx.objectStore("versions");

		for (const v of toDelete) {
			await store.delete([patternId, v.version]);
		}

		await tx.done;
	}
}

/** Singleton storage service instance. */
export const storage = new StorageService();
