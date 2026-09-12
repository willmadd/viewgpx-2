"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FolderPlus, Loader2, Plus } from "lucide-react";

type CollectionSummary = {
  identifier: string;
  title: string | null;
  isPublic: boolean;
  routeCount: number;
  hasRoute?: boolean;
};

const AddToCollectionMenu = ({ routeIdentifier }: { routeIdentifier: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [pendingIdentifier, setPendingIdentifier] = useState<string | null>(
    null,
  );

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

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
      const response = await fetch(
        `/api/collections?routeIdentifier=${encodeURIComponent(routeIdentifier)}`,
      );
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

  const handleToggleCollection = async (collection: CollectionSummary) => {
    setError(null);
    setPendingIdentifier(collection.identifier);

    const nextHasRoute = !collection.hasRoute;

    try {
      const response = await fetch(
        nextHasRoute
          ? `/api/collections/${collection.identifier}/routes`
          : `/api/collections/${collection.identifier}/routes/${routeIdentifier}`,
        {
          method: nextHasRoute ? "POST" : "DELETE",
          headers: nextHasRoute
            ? { "Content-Type": "application/json" }
            : undefined,
          body: nextHasRoute ? JSON.stringify({ routeIdentifier }) : undefined,
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Could not update this collection.");
        return;
      }

      setCollections((current) =>
        current.map((item) =>
          item.identifier === collection.identifier
            ? {
                ...item,
                hasRoute: nextHasRoute,
                routeCount: item.routeCount + (nextHasRoute ? 1 : -1),
              }
            : item,
        ),
      );
    } finally {
      setPendingIdentifier(null);
    }
  };

  const handleCreateCollection = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newTitle.trim()) {
      return;
    }

    setError(null);
    setIsSubmittingNew(true);

    try {
      const createResponse = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), isPublic: true }),
      });

      const createData = await createResponse.json().catch(() => ({}));

      if (!createResponse.ok) {
        setError(createData.error || "Could not create a new collection.");
        return;
      }

      const identifier = createData.identifier as string;

      const addResponse = await fetch(
        `/api/collections/${identifier}/routes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ routeIdentifier }),
        },
      );

      if (!addResponse.ok) {
        const addData = await addResponse.json().catch(() => ({}));
        setError(addData.error || "Could not add this route.");
        return;
      }

      setCollections((current) => [
        {
          identifier,
          title: newTitle.trim(),
          isPublic: true,
          routeCount: 1,
          hasRoute: true,
        },
        ...current,
      ]);
      setNewTitle("");
      setIsCreating(false);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggleOpen}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white/80 px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-ink/5"
      >
        <FolderPlus size={16} aria-hidden="true" />
        Add to collection
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-80 overflow-y-auto rounded-xl border border-ink/10 bg-paper p-2 shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-ink/50">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Loading…
            </div>
          ) : (
            <>
              {collections.length === 0 && !isCreating && (
                <p className="px-2 py-2 text-sm text-ink/50">
                  You don&apos;t have any collections yet.
                </p>
              )}

              <ul className="space-y-0.5">
                {collections.map((collection) => (
                  <li key={collection.identifier}>
                    <button
                      type="button"
                      onClick={() => handleToggleCollection(collection)}
                      disabled={pendingIdentifier === collection.identifier}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold text-ink transition hover:bg-ink/5 disabled:opacity-60"
                    >
                      <span className="truncate">
                        {collection.title || collection.identifier}
                      </span>

                      <span
                        className={
                          collection.hasRoute
                            ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine text-paper"
                            : "h-5 w-5 shrink-0 rounded-full border border-ink/20"
                        }
                      >
                        {collection.hasRoute && (
                          <Check size={12} aria-hidden="true" />
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-1 border-t border-ink/10 pt-1">
                {isCreating ? (
                  <form
                    onSubmit={handleCreateCollection}
                    className="px-2 py-1.5"
                  >
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
                        disabled={isSubmittingNew || !newTitle.trim()}
                        className="shrink-0 rounded-lg bg-pine px-3 py-1.5 text-xs font-bold text-paper transition hover:bg-pine/90 disabled:opacity-60"
                      >
                        {isSubmittingNew ? "Adding…" : "Create"}
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

export default AddToCollectionMenu;
