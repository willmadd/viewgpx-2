"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FolderPlus, Loader2, Plus, X } from "lucide-react";

type CollectionSummary = {
  identifier: string;
  title: string | null;
  isPublic: boolean;
  routeCount: number;
};

type DraftCollectionMenuProps = {
  selectedIdentifiers: string[];
  onToggleIdentifier: (identifier: string) => void;
  pendingTitles: string[];
  onAddPendingTitle: (title: string) => void;
  onRemovePendingTitle: (title: string) => void;
};

const DraftCollectionMenu = ({
  selectedIdentifiers,
  onToggleIdentifier,
  pendingTitles,
  onAddPendingTitle,
  onRemovePendingTitle,
}: DraftCollectionMenuProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const selectedCount = selectedIdentifiers.length + pendingTitles.length;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const loadCollections = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/collections");
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Could not load your collections.");
        return;
      }

      setCollections(data.collections ?? []);
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleOpen = () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (nextIsOpen && !hasLoaded) {
      loadCollections();
    }
  };

  const handleCreatePending = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = newTitle.trim();

    if (!trimmed) {
      return;
    }

    onAddPendingTitle(trimmed);
    setNewTitle("");
    setIsCreating(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggleOpen}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white/80 px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-ink/5"
      >
        <FolderPlus size={16} aria-hidden="true" />
        {selectedCount > 0
          ? `${selectedCount} collection${selectedCount === 1 ? "" : "s"} selected`
          : "Add to collection"}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-80 overflow-y-auto rounded-xl border border-ink/10 bg-paper p-2 shadow-lg">
          <p className="px-2 pb-1 pt-1 text-xs text-ink/50">
            Selected collections will be updated once you save this route.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink/50">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Loading…
            </div>
          ) : (
            <>
              {collections.length === 0 && pendingTitles.length === 0 && (
                <p className="px-2 py-2 text-sm text-ink/50">
                  You don&apos;t have any collections yet.
                </p>
              )}

              <ul className="space-y-0.5">
                {collections.map((collection) => {
                  const isSelected = selectedIdentifiers.includes(
                    collection.identifier,
                  );

                  return (
                    <li key={collection.identifier}>
                      <button
                        type="button"
                        onClick={() => onToggleIdentifier(collection.identifier)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold text-ink transition hover:bg-ink/5"
                      >
                        <span className="truncate">
                          {collection.title || collection.identifier}
                        </span>

                        <span
                          className={
                            isSelected
                              ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine text-paper"
                              : "h-5 w-5 shrink-0 rounded-full border border-ink/20"
                          }
                        >
                          {isSelected && <Check size={12} aria-hidden="true" />}
                        </span>
                      </button>
                    </li>
                  );
                })}

                {pendingTitles.map((pendingTitle) => (
                  <li key={pendingTitle}>
                    <div className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-ink">
                      <span className="truncate">
                        {pendingTitle}{" "}
                        <span className="font-normal text-ink/40">(new)</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => onRemovePendingTitle(pendingTitle)}
                        aria-label={`Remove ${pendingTitle}`}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink/40 hover:text-terracotta"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-1 border-t border-ink/10 pt-1">
                {isCreating ? (
                  <form onSubmit={handleCreatePending} className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        required
                        maxLength={120}
                        value={newTitle}
                        onChange={(event) => setNewTitle(event.target.value)}
                        placeholder="Collection name"
                        className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-pine focus:ring-1 focus:ring-pine"
                      />

                      <button
                        type="submit"
                        disabled={!newTitle.trim()}
                        className="shrink-0 rounded-lg bg-pine px-3 py-1.5 text-xs font-bold text-paper transition hover:bg-pine/90 disabled:opacity-60"
                      >
                        Add
                      </button>
                    </div>

                    <p className="mt-1 text-xs text-ink/40">
                      New collections are public — anyone with the link can
                      view them.
                    </p>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-pine transition hover:bg-pine/5"
                  >
                    <Plus size={16} aria-hidden="true" />
                    New collection
                  </button>
                )}
              </div>

              {error && (
                <p className="px-2 pt-1 text-xs font-medium text-terracotta">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DraftCollectionMenu;
