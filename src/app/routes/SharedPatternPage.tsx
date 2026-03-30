import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Download, Heart, Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { getSharedPattern } from "@/shared/api/cloud-api";
import type { SharedPatternFull } from "@/shared/api/cloud-api";
import { deserializePattern } from "@/engine/pattern/types";
import { storage } from "@/shared/storage/storage";

export function SharedPatternPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pattern, setPattern] = useState<SharedPatternFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchPattern = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const result = await getSharedPattern(id);
      setPattern(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pattern");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPattern();
  }, [fetchPattern]);

  const handleSaveLocally = useCallback(async () => {
    if (!pattern) return;

    try {
      deserializePattern(pattern.data); // validate data is valid
      await storage.savePattern({
        id: pattern.id,
        name: pattern.name,
        craftType: pattern.craftType,
        data: pattern.data,
        thumbnail: pattern.thumbnail,
        updatedAt: pattern.updatedAt,
        createdAt: pattern.createdAt,
        version: pattern.version,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save pattern");
    }
  }, [pattern]);

  const handleOpenInEditor = useCallback(async () => {
    if (!pattern) return;

    try {
      deserializePattern(pattern.data); // validate data is valid
      await storage.savePattern({
        id: pattern.id,
        name: pattern.name,
        craftType: pattern.craftType,
        data: pattern.data,
        thumbnail: pattern.thumbnail,
        updatedAt: pattern.updatedAt,
        createdAt: pattern.createdAt,
        version: pattern.version,
      });
      navigate(`/editor/${pattern.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open pattern");
    }
  }, [pattern, navigate]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface">
        <Loader2 className="h-8 w-8 animate-spin text-craft-600" />
      </div>
    );
  }

  if (error || !pattern) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-surface">
        <p className="text-sm text-red-500">{error || "Pattern not found"}</p>
        <Link
          to="/gallery"
          className="inline-flex items-center gap-1.5 rounded-md bg-craft-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-surface">
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/gallery"
            className="shrink-0 rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-text-primary">{pattern.name}</h1>
            <p className="text-xs text-text-muted">
              by {pattern.authorName} &middot; {pattern.craftType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 text-xs text-text-muted mr-3">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {pattern.likes}
            </span>
            <span className="inline-flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {pattern.downloads}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSaveLocally}
            disabled={saved}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-50"
          >
            {saved ? "Saved!" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleOpenInEditor}
            className="inline-flex items-center gap-1.5 rounded-lg bg-craft-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </button>
        </div>
      </header>

      {/* Pattern info */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {pattern.thumbnail && (
            <div className="mb-4 flex justify-center">
              <img
                src={pattern.thumbnail}
                alt={pattern.name}
                className="max-h-96 rounded-lg border border-border object-contain"
              />
            </div>
          )}

          {pattern.description && (
            <p className="mb-4 text-sm text-text-secondary">{pattern.description}</p>
          )}

          {pattern.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {pattern.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-medium text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-sm text-text-muted">
            <span>Version {pattern.version}</span>
            <span>Last updated {new Date(pattern.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
