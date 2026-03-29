/**
 * GET /api/patterns/[id] — Get a shared pattern by ID
 * PUT /api/patterns/[id] — Update a shared pattern
 * DELETE /api/patterns/[id] — Delete a shared pattern
 */

import { corsResponse, handleOptions } from "../../../_lib/cors";
import type { Env, SharedPatternRow } from "../../../_lib/types";

export const onRequestOptions: PagesFunction<Env> = () => handleOptions();

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { DB } = ctx.env;
  const id = ctx.params.id as string;

  const row = await DB.prepare(
    "SELECT * FROM shared_patterns WHERE id = ?",
  )
    .bind(id)
    .first<SharedPatternRow>();

  if (!row) {
    return corsResponse({ error: "Pattern not found" }, 404);
  }

  // Increment downloads
  await DB.prepare("UPDATE shared_patterns SET downloads = downloads + 1 WHERE id = ?")
    .bind(id)
    .run();

  const pattern = {
    id: row.id,
    name: row.name,
    craftType: row.craft_type,
    data: row.data,
    thumbnail: row.thumbnail,
    description: row.description,
    isPublic: row.is_public === 1,
    authorId: row.author_id,
    authorName: row.author_name,
    likes: row.likes,
    downloads: row.downloads + 1,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  };

  return corsResponse(pattern);
};

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  const { DB } = ctx.env;
  const id = ctx.params.id as string;

  try {
    const body = await ctx.request.json<{
      name?: string;
      data?: string;
      thumbnail?: string;
      description?: string;
      isPublic?: boolean;
      authorName?: string;
      tags?: string[];
      version?: number;
    }>();

    const existing = await DB.prepare("SELECT id FROM shared_patterns WHERE id = ?")
      .bind(id)
      .first<{ id: string }>();

    if (!existing) {
      return corsResponse({ error: "Pattern not found" }, 404);
    }

    const updates: string[] = [];
    const params: unknown[] = [];

    if (body.name !== undefined) { updates.push("name = ?"); params.push(body.name); }
    if (body.data !== undefined) { updates.push("data = ?"); params.push(body.data); }
    if (body.thumbnail !== undefined) { updates.push("thumbnail = ?"); params.push(body.thumbnail); }
    if (body.description !== undefined) { updates.push("description = ?"); params.push(body.description); }
    if (body.isPublic !== undefined) { updates.push("is_public = ?"); params.push(body.isPublic ? 1 : 0); }
    if (body.authorName !== undefined) { updates.push("author_name = ?"); params.push(body.authorName); }
    if (body.tags !== undefined) { updates.push("tags = ?"); params.push(body.tags.join(",")); }
    if (body.version !== undefined) { updates.push("version = ?"); params.push(body.version); }

    if (updates.length === 0) {
      return corsResponse({ error: "No fields to update" }, 400);
    }

    updates.push("updated_at = ?");
    params.push(Date.now());

    params.push(id);

    await DB.prepare(`UPDATE shared_patterns SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run();

    return corsResponse({ id, updated: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update pattern";
    return corsResponse({ error: message }, 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async (ctx) => {
  const { DB } = ctx.env;
  const id = ctx.params.id as string;

  await DB.prepare("DELETE FROM shared_patterns WHERE id = ?")
    .bind(id)
    .run();

  return corsResponse({ deleted: true });
};
