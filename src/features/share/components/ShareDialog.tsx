/**
 * ShareDialog — Share a pattern to the cloud.
 */

import { sharePattern } from "@/shared/api/cloud-api";
import { serializePattern } from "@/engine/pattern/types";
import type { Pattern } from "@/engine/pattern/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, Globe, Lock, Loader2, Share2 } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  pattern: Pattern;
}

export function ShareDialog({ open, onClose, pattern }: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(true);
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [tags, setTags] = useState("");
  const [sharing, setSharing] = useState(false);
  const [sharedUrl, setSharedUrl] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    setError("");

    try {
      const data = serializePattern(pattern);
      const result = await sharePattern({
        id: pattern.id,
        name: pattern.metadata.name,
        craftType: pattern.metadata.craftType,
        data,
        thumbnail: "",
        description,
        isPublic,
        authorName: authorName || "Anonymous",
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        version: pattern.metadata.version,
      });

      const url = `${window.location.origin}/shared/${result.id}`;
      setSharedUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share pattern");
    } finally {
      setSharing(false);
    }
  }, [pattern, isPublic, description, authorName, tags]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sharedUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-craft-600" />
          <h2 className="text-lg font-semibold text-text-primary">Share Pattern</h2>
        </div>

        {sharedUrl ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary">
              Pattern shared successfully!
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="flex-1 rounded border border-border bg-surface-secondary px-3 py-2 font-mono text-sm text-text-primary"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-md bg-craft-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <a
              href={sharedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Link
            </a>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="share-name" className="mb-1 block text-sm font-medium text-text-primary">
                Pattern Name
              </label>
              <input
                id="share-name"
                ref={inputRef}
                type="text"
                value={pattern.metadata.name}
                disabled
                className="w-full rounded border border-border bg-surface-secondary px-3 py-2 text-sm text-text-secondary"
              />
            </div>

            <div>
              <label htmlFor="share-author" className="mb-1 block text-sm font-medium text-text-primary">
                Your Name
              </label>
              <input
                id="share-author"
                ref={inputRef}
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Anonymous"
                className="w-full rounded border border-border bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>

            <div>
              <label htmlFor="share-desc" className="mb-1 block text-sm font-medium text-text-primary">
                Description
              </label>
              <textarea
                id="share-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your pattern..."
                rows={2}
                className="w-full resize-none rounded border border-border bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>

            <div>
              <label htmlFor="share-tags" className="mb-1 block text-sm font-medium text-text-primary">
                Tags (comma-separated)
              </label>
              <input
                id="share-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="knitting, sweater, fair-isle"
                className="w-full rounded border border-border bg-surface-tertiary px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-text-secondary" />
                ) : (
                  <Lock className="h-4 w-4 text-text-secondary" />
                )}
                <span className="text-sm text-text-primary">
                  {isPublic ? "Public — anyone can view" : "Private — only you can view"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative h-5 w-9 rounded-full transition-colors ${isPublic ? "bg-craft-600" : "bg-border"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${isPublic ? "translate-x-4" : ""}`}
                />
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className="inline-flex items-center gap-1.5 rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700 disabled:opacity-50"
              >
                {sharing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
