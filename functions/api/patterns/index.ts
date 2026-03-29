/**
 * GET /api/patterns — List public shared patterns
 * POST /api/patterns — Create a new shared pattern
 */

import { corsResponse, handleOptions } from "../../_lib/cors";
import type { Env } from "../../_lib/types";

export const onRequestOptions: PagesFunction<Env> = () => handleOptions();

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { DB } = ctx.env;
  const url = new URL(ctx.request.url);

  const craftType = url.searchParams.get("craftType");
  const search = url.searchParams.get("search");
  const limit = Math.min(Number.parseInt(url.searchParams.get("limit") || "50", 10), 100);
  const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10);

  let query = "SELECT id, name, craft_type, thumbnail, description, author_name, likes, downloads, tags, created_at, updated_at, version FROM shared_patterns WHERE is_public = 1";
  const params: unknown[] = [];

  if (craftType) {
    query += " AND craft_type = ?";
    params.push(craftType);
  }

  if (search) {
    query += " AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const results = await DB.prepare(query).bind(...params).all<Record<string, unknown>>();

  // Get total count for pagination
  let countQuery = "SELECT COUNT(*) as total FROM shared_patterns WHERE is_public = 1";
  const countParams: unknown[] = [];
  if (craftType) {
    countQuery += " AND craft_type = ?";
    countParams.push(craftType);
  }
  if (search) {
    countQuery += " AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)";
    const term = `%${search}%`;
    countParams.push(term, term, term);
  }
  const countResult = await DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();

  // Convert snake_case to camelCase
  const patterns = results.results.map((row) => ({
    id: row.id,
    name: row.name,
    craftType: row.craft_type,
    thumbnail: row.thumbnail,
    description: row.description,
    authorName: row.author_name,
    likes: row.likes,
    downloads: row.downloads,
    tags: row.tags ? (row.tags as string).split(",").filter(Boolean) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  }));

  return corsResponse({
    patterns,
    total: countResult?.total ?? 0,
    limit,
    offset,
  });
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { DB } = ctx.env;

  try {
    const body = await ctx.request.json<{
      id: string;
      name: string;
      craftType: string;
      data: string;
      thumbnail: string;
      description?: string;
      isPublic?: boolean;
      authorId?: string;
      authorName?: string;
      tags?: string[];
      version?: number;
    }>();

    if (!body.id || !body.name || !body.data) {
      return corsResponse({ error: "id, name, and data are required" }, 400);
    }

    const now = Date.now();
    await DB.prepare(
      `INSERT INTO shared_patterns (id, name, craft_type, data, thumbnail, description, is_public, author_id, author_name, likes, downloads, tags, created_at, updated_at, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`,
    )
      .bind(
        body.id,
        body.name,
        body.craftType || "cross-stitch",
        body.data,
        body.thumbnail || "",
        body.description || "",
        body.isPublic !== false ? 1 : 0,
        body.authorId || "",
        body.authorName || "Anonymous",
        body.tags?.join(",") || "",
        now,
        now,
        body.version || 1,
      )
      .run();

    return corsResponse({ id: body.id, createdAt: now }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create pattern";
    return corsResponse({ error: message }, 500);
  }
};
