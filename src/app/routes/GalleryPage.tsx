import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Eye, Heart, Plus, Search, X, FolderOpen, Grid3X3 } from "lucide-react";
import { listSharedPatterns } from "@/shared/api/cloud-api";
import type { SharedPatternSummary } from "@/shared/api/cloud-api";
import { storage } from "@/shared/storage/storage";
import type { PatternRecord } from "@/shared/storage/storage";

type Tab = "local" | "community";

export function GalleryPage() {
  const [tab, setTab] = useState<Tab>("local");
  const [localPatterns, setLocalPatterns] = useState<PatternRecord[]>([]);
  const [communityPatterns, setCommunityPatterns] = useState<SharedPatternSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const loadLocal = useCallback(async () => {
    try {
      const patterns = await storage.listPatterns();
      setLocalPatterns(patterns);
    } catch {
      // IndexedDB not available
    }
  }, []);

  const loadCommunity = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const result = await listSharedPatterns({ search: query, limit: 50 });
      setCommunityPatterns(result.patterns);
      setTotal(result.total);
    } catch {
      // API unavailable — show empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocal();
  }, [loadLocal]);

  useEffect(() => {
    if (tab === "community") loadCommunity();
  }, [tab, loadCommunity]);

  const handleSearch = useCallback(() => {
    loadCommunity(searchQuery || undefined);
  }, [searchQuery, loadCommunity]);

  const handleDeleteLocal = useCallback(
    async (id: string) => {
      await storage.deletePattern(id);
      setLocalPatterns((prev) => prev.filter((p) => p.id !== id));
    },
    [],
  );

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-lg font-bold text-text-primary sm:text-xl">My Patterns</h1>
        <Link
          to="/editor"
          className="inline-flex items-center gap-2 rounded-lg bg-craft-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Pattern</span>
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setTab("local")}
          className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
            tab === "local"
              ? "border-craft-600 text-craft-600"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Local Patterns
        </button>
        <button
          type="button"
          onClick={() => setTab("community")}
          className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
            tab === "community"
              ? "border-craft-600 text-craft-600"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Community
        </button>
      </div>

      {/* Community search */}
      {tab === "community" && (
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search community patterns..."
              className="w-full rounded-md border border-border bg-surface-tertiary py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-craft-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-md bg-craft-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-craft-700"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); loadCommunity(); }}
              className="rounded-md p-2 text-text-secondary hover:bg-surface-tertiary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {tab === "local" ? (
          localPatterns.length === 0 ? (
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
                <FolderOpen className="h-10 w-10" />
              </div>
              <div>
                <h2 className="mb-2 text-lg font-semibold text-text-primary">
                  No patterns yet
                </h2>
                <p className="max-w-sm text-sm text-text-secondary">
                  Create your first pattern to get started. You can draw from scratch, import an image, or start from a template.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/editor"
                  className="inline-flex items-center gap-2 rounded-lg bg-craft-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-craft-700"
                >
                  <Plus className="h-4 w-4" />
                  New Pattern
                </Link>
                <Link
                  to="/image-converter"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-secondary"
                >
                  Import Image
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {localPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
                >
                  <div className="flex aspect-square items-center justify-center bg-surface-secondary">
                    {pattern.thumbnail ? (
                      <img
                        src={pattern.thumbnail}
                        alt={pattern.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Grid3X3 className="h-12 w-12 text-text-muted" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{pattern.name}</p>
                      <p className="text-xs text-text-muted">{pattern.craftType}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => navigate(`/editor/${pattern.id}`)}
                        className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary"
                        title="Edit"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocal(pattern.id)}
                        className="rounded p-1.5 text-text-secondary transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : loading ? (
          <div className="flex items-center justify-center py-12 text-text-muted">
            Loading community patterns...
          </div>
        ) : communityPatterns.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center py-12">
            <FolderOpen className="h-12 w-12 text-text-muted" />
            <p className="text-sm text-text-secondary">
              {searchQuery ? "No patterns match your search." : "No community patterns yet. Be the first to share!"}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-text-muted">{total} patterns found</p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {communityPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/shared/${pattern.id}`)}
                    className="flex aspect-square items-center justify-center bg-surface-secondary"
                  >
                    {pattern.thumbnail ? (
                      <img
                        src={pattern.thumbnail}
                        alt={pattern.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Grid3X3 className="h-12 w-12 text-text-muted" />
                    )}
                  </button>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-text-primary">{pattern.name}</p>
                    <p className="text-xs text-text-muted">by {pattern.authorName}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {pattern.likes}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {pattern.downloads}
                      </span>
                      <span>{pattern.craftType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
