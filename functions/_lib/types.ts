/**
 * Shared types for Cloudflare Pages Functions bindings.
 */

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  APP_NAME: string;
  APP_URL: string;
}

/** Shape of a shared_patterns row from D1. */
export interface SharedPatternRow {
  id: string;
  name: string;
  craft_type: string;
  data: string;
  thumbnail: string;
  description: string;
  is_public: number;
  author_id: string;
  author_name: string;
  likes: number;
  downloads: number;
  tags: string;
  created_at: number;
  updated_at: number;
  version: number;
}
