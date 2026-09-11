"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import Header from "../_components/Header";
import { createClient } from "@/app/lib/supabase/client";

const ForgotPasswordClient = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );

      if (resetError) {
        setError("Something went wrong. Please try again.");
        return;
      }

      setSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-ink">Reset your password</h1>

          <p className="mt-1.5 text-sm text-ink/60">
            Enter your account email and we&apos;ll send you a link to reset
            your password.
          </p>

          {sent ? (
            <p className="mt-6 text-sm font-medium text-pine">
              Check your email for a link to reset your password.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full rounded-xl border border-ink/15 bg-white/80 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-pine focus:ring-2 focus:ring-pine/15"
              />

              {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-terracotta px-4 py-2.5 text-sm font-bold text-paper shadow-sm transition hover:bg-terracotta/90 disabled:opacity-60"
              >
                {isSubmitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-semibold text-pine underline-offset-4 hover:underline"
          >
            &larr; Back to log in
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordClient;
