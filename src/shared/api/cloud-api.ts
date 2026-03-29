/**
 * Cloud API client for PatternForge shared patterns.
 *
 * Communicates with Cloudflare Pages Functions endpoints.
 */

export interface SharedPatternSummary {
  id: string;
  name: string;
  craftType: string;
  thumbnail: string;
  description: string;
  authorName: string;
  likes: number;
  downloads: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface SharedPatternFull extends SharedPatternSummary {
  data: string;
  isPublic: boolean;
  authorId: string;
}

export interface SharePatternRequest {
  id: string;
  name: string;
  craftType: string;
  data: string;
  thumbnail: string;
  description?: string;
  isPublic?: boolean;
  authorName?: string;
  tags?: string[];
  version?: number;
}

interface PaginatedResponse<T> {
  patterns: T[];
  total: number;
  limit: number;
  offset: number;
}

function getBaseUrl(): string {
  // In production, same origin. In dev, proxy via vite.
  return "/api";
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** List public shared patterns with optional filters. */
export async function listSharedPatterns(params?: {
  craftType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<SharedPatternSummary>> {
  const searchParams = new URLSearchParams();
  if (params?.craftType) searchParams.set("craftType", params.craftType);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));

  const qs = searchParams.toString();
  return apiRequest<PaginatedResponse<SharedPatternSummary>>(`/patterns${qs ? `?${qs}` : ""}`);
}

/** Get a shared pattern by ID (includes full data). */
export async function getSharedPattern(id: string): Promise<SharedPatternFull> {
  return apiRequest<SharedPatternFull>(`/patterns/${id}`);
}

/** Share a pattern to the cloud. */
export async function sharePattern(request: SharePatternRequest): Promise<{ id: string; createdAt: number }> {
  return apiRequest("/patterns", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/** Update a shared pattern. */
export async function updateSharedPattern(
  id: string,
  updates: Partial<Omit<SharePatternRequest, "id">>,
): Promise<{ id: string; updated: boolean }> {
  return apiRequest(`/patterns/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/** Delete a shared pattern. */
export async function deleteSharedPattern(id: string): Promise<{ deleted: boolean }> {
  return apiRequest(`/patterns/${id}`, { method: "DELETE" });
}

/** Upload an image to R2 storage. */
export async function uploadImage(file: File): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${getBaseUrl()}/images/upload`, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error || `Upload failed ${res.status}`);
  }

  return res.json() as Promise<{ key: string; url: string }>;
}
