"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import RouteThumbnail from "@/app/_components/RouteThumbnail";

type RouteSummary = {
  identifier: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
};

type CollectionEditorProps = {
  collection: {
    identifier: string;
    title: string;
    description: string;
    isPublic: boolean;
  };
  addedRoutes: RouteSummary[];
  availableRoutes: RouteSummary[];
};

const CollectionEditor = ({
  collection,
  addedRoutes,
  availableRoutes,
}: CollectionEditorProps) => {
  const router = useRouter();

  const [title, setTitle] = useState(collection.title);
  const [description, setDescription] = useState(collection.description);
  const [identifier, setIdentifier] = useState(collection.identifier);
  const [isPublic, setIsPublic] = useState(collection.isPublic);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [routeActionError, setRouteActionError] = useState<string | null>(
    null,
  );
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const handleSaveDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError(null);
    setSaved(false);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/collections/${collection.identifier}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, identifier, isPublic }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSaveError(data.error || "Could not save changes.");
        return;
      }

      setSaved(true);

      if (data.identifier !== collection.identifier) {
        router.replace(`/account/collections/${data.identifier}`);
      }

      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (
      !window.confirm(
        "Delete this collection? This can't be undone. Your saved routes will not be deleted.",
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/collections/${collection.identifier}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        window.alert(data.error || "Could not delete this collection.");
        return;
      }

      router.push("/account");
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddRoute = async (routeIdentifier: string) => {
    setRouteActionError(null);
    setPendingRoute(routeIdentifier);

    try {
      const response = await fetch(
        `/api/collections/${collection.identifier}/routes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ routeIdentifier }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setRouteActionError(data.error || "Could not add this route.");
        return;
      }

      router.refresh();
    } finally {
      setPendingRoute(null);
    }
  };

  const handleRemoveRoute = async (routeIdentifier: string) => {
    setRouteActionError(null);
    setPendingRoute(routeIdentifier);

    try {
      const response = await fetch(
        `/api/collections/${collection.identifier}/routes/${routeIdentifier}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setRouteActionError(data.error || "Could not remove this route.");
        return;
      }

      router.refresh();
    } finally {
      setPendingRoute(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Edit collection</h1>

        <Link
          href={`/collections/${collection.identifier}`}
          className="text-sm font-semibold text-pine underline-offset-4 hover:underline"
        >
          View collection
        </Link>
      </div>

      <form
        onSubmit={handleSaveDetails}
        className="space-y-5 rounded-2xl border border-ink/10 bg-white/70 p-5 sm:p-6"
      >
        <div>
          <label htmlFor="title" className="text-sm font-semibold text-ink">
            Title
          </label>
          <input
            id="title"
            type="text"
            required
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none focus:border-pine focus:ring-1 focus:ring-pine"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="text-sm font-semibold text-ink"
          >
            Description{" "}
            <span className="font-normal text-ink/40">(optional)</span>
          </label>
          <textarea
            id="description"
            maxLength={500}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none focus:border-pine focus:ring-1 focus:ring-pine"
          />
        </div>

        <div>
          <label
            htmlFor="identifier"
            className="text-sm font-semibold text-ink"
          >
            URL identifier
          </label>
          <div className="mt-1.5 flex items-center overflow-hidden rounded-xl border border-ink/15 bg-paper focus-within:border-pine focus-within:ring-1 focus-within:ring-pine">
            <span className="whitespace-nowrap pl-3.5 text-sm text-ink/40">
              /collections/
            </span>
            <input
              id="identifier"
              type="text"
              required
              minLength={3}
              maxLength={80}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full bg-transparent py-2.5 pr-3.5 text-sm text-ink outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
            className="h-4 w-4 rounded border-ink/30 text-pine focus:ring-pine"
          />
          <label htmlFor="isPublic" className="text-sm text-ink">
            Make this collection public
            <span className="block text-xs text-ink/50">
              Anyone with the link can view a public collection. Private
              collections are only visible to you.
            </span>
          </label>
        </div>

        {saveError && (
          <p className="text-sm font-medium text-terracotta">{saveError}</p>
        )}
        {saved && !saveError && (
          <p className="text-sm font-medium text-pine">Saved.</p>
        )}

        <div className="flex items-center justify-between gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-pine px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-pine/90 disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>

          <button
            type="button"
            onClick={handleDeleteCollection}
            disabled={isDeleting}
            className="text-sm font-semibold text-terracotta underline-offset-4 hover:underline disabled:opacity-60"
          >
            {isDeleting ? "Deleting…" : "Delete collection"}
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-bold text-ink">
          Routes in this collection
        </h2>

        {routeActionError && (
          <p className="mt-2 text-sm font-medium text-terracotta">
            {routeActionError}
          </p>
        )}

        {addedRoutes.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">
            No routes in this collection yet. Add one from your saved routes
            below.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {addedRoutes.map((route) => (
              <li
                key={route.identifier}
                className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white/70 px-4 py-3"
              >
                <RouteThumbnail
                  src={route.thumbnailUrl}
                  alt={route.title || route.identifier}
                />

                <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                  {route.title || route.identifier}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveRoute(route.identifier)}
                  disabled={pendingRoute === route.identifier}
                  className="shrink-0 text-sm font-semibold text-terracotta underline-offset-4 hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-ink">Your other routes</h2>

        {availableRoutes.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">
            {addedRoutes.length === 0
              ? "You haven't saved any routes yet."
              : "All of your saved routes are already in this collection."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {availableRoutes.map((route) => (
              <li
                key={route.identifier}
                className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white/70 px-4 py-3"
              >
                <RouteThumbnail
                  src={route.thumbnailUrl}
                  alt={route.title || route.identifier}
                />

                <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                  {route.title || route.identifier}
                </span>

                <button
                  type="button"
                  onClick={() => handleAddRoute(route.identifier)}
                  disabled={pendingRoute === route.identifier}
                  className="shrink-0 text-sm font-semibold text-pine underline-offset-4 hover:underline disabled:opacity-60"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CollectionEditor;
