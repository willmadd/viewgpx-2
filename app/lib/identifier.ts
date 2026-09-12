import "server-only";

import crypto from "node:crypto";

import { prisma } from "@/app/lib/prisma";

const HASH_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const DIACRITICS_PATTERN = /[̀-ͯ]/g;

export const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

const randomHash = (length = 4): string => {
  const bytes = crypto.randomBytes(length);
  let hash = "";

  for (let index = 0; index < length; index += 1) {
    hash += HASH_ALPHABET[bytes[index] % HASH_ALPHABET.length];
  }

  return hash;
};

export const generateRouteIdentifier = async (
  title: string | null | undefined,
): Promise<string> => {
  const base = slugify(title || "") || "route";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const identifier = `${base}-${randomHash()}`;

    const existing = await prisma.routes.findUnique({
      where: { identifier },
      select: { id: true },
    });

    if (!existing) {
      return identifier;
    }
  }

  throw new Error("Could not generate a unique route identifier");
};

export const generateCollectionIdentifier = async (
  title: string | null | undefined,
): Promise<string> => {
  const base = slugify(title || "") || "collection";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const identifier = `${base}-${randomHash()}`;

    const existing = await prisma.pages.findUnique({
      where: { identifier },
      select: { id: true },
    });

    if (!existing) {
      return identifier;
    }
  }

  throw new Error("Could not generate a unique collection identifier");
};
