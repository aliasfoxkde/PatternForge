/**
 * GET /api/images/[key] — Serve an image from R2
 */

import { handleOptions } from "../../../_lib/cors";
import type { Env } from "../../../_lib/types";

export const onRequestOptions: PagesFunction<Env> = () => handleOptions();

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { IMAGES } = ctx.env;
  const key = ctx.params.key as string;

  const object = await IMAGES.get(key);

  if (!object) {
    return new Response("Not found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);

  return new Response(object.body, { headers });
};
