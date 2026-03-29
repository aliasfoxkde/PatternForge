/**
 * POST /api/images/upload — Upload an image to R2
 *
 * Accepts multipart form data with an "image" field.
 * Returns the object key for the uploaded image.
 */

import { corsResponse, handleOptions } from "../../../_lib/cors";
import type { Env } from "../../../_lib/types";

export const onRequestOptions: PagesFunction<Env> = () => handleOptions();

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { IMAGES } = ctx.env;

  try {
    const formData = await ctx.request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return corsResponse({ error: "No 'image' field in form data" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return corsResponse({ error: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}` }, 400);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return corsResponse({ error: "File too large. Maximum size is 5MB" }, 400);
    }

    // Generate key: images/{timestamp}-{random}.{ext}
    const ext = file.name.split(".").pop() || "png";
    const key = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    await IMAGES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    return corsResponse({ key, url: `/api/images/${key}` }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    return corsResponse({ error: message }, 500);
  }
};
