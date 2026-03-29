-- PatternForge D1 Schema - Migration 0001
-- Shared patterns table for cloud storage

CREATE TABLE IF NOT EXISTS shared_patterns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  craft_type TEXT NOT NULL DEFAULT 'cross-stitch',
  data TEXT NOT NULL,
  thumbnail TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  is_public INTEGER NOT NULL DEFAULT 1,
  author_id TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  likes INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_shared_patterns_updated ON shared_patterns(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_patterns_craft ON shared_patterns(craft_type);
CREATE INDEX IF NOT EXISTS idx_shared_patterns_public ON shared_patterns(is_public, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_patterns_author ON shared_patterns(author_id);
