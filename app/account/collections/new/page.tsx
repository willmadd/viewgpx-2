import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/app/lib/supabase/server";
import Header from "@/app/_components/Header";
import NewCollectionForm from "./NewCollectionForm";

export const metadata: Metadata = {
  title: "New collection",
  description: "Create a new collection to group your saved GPX routes.",
  robots: { index: false, follow: false },
};

export default async function NewCollectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-ink">New collection</h1>
        <p className="mt-1 text-sm text-ink/60">
          Give your collection a title and URL, then add routes to it once
          it&apos;s created.
        </p>

        <NewCollectionForm className="mt-6" />
      </div>
    </main>
  );
}
