"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const previewSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const NewCollectionForm = ({ className }: { className?: string }) => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [identifierEdited, setIdentifierEdited] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (value: string) => {
    setTitle(value);

    if (!identifierEdited) {
      setIdentifier(previewSlug(value));
    }
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifierEdited(true);
    setIdentifier(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, identifier, isPublic }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Could not create this collection.");
        return;
      }

      router.push(`/account/collections/${data.identifier}`);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-5 rounded-2xl border border-ink/10 bg-white/70 p-5 sm:p-6 ${className ?? ""}`}
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
          onChange={(event) => handleTitleChange(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none focus:border-pine focus:ring-1 focus:ring-pine"
          placeholder="My Alpine adventures"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="text-sm font-semibold text-ink"
        >
          Description <span className="font-normal text-ink/40">(optional)</span>
        </label>
        <textarea
          id="description"
          maxLength={500}
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-sm text-ink outline-none focus:border-pine focus:ring-1 focus:ring-pine"
          placeholder="A few of my favourite routes"
        />
      </div>

      <div>
        <label htmlFor="identifier" className="text-sm font-semibold text-ink">
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
            onChange={(event) => handleIdentifierChange(event.target.value)}
            className="w-full bg-transparent py-2.5 pr-3.5 text-sm text-ink outline-none"
            placeholder="my-alpine-adventures"
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

      {error && <p className="text-sm font-medium text-terracotta">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-xl bg-pine px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-pine/90 disabled:opacity-60"
      >
        {isSaving ? "Creating…" : "Create collection"}
      </button>
    </form>
  );
};

export default NewCollectionForm;
