"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type AuthPanelProps = {
  compact?: boolean;
  onAuthenticated?: () => void;
};

type Mode = "login" | "signup";

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.5 4 24 4c-7.5 0-14 4.2-17.7 10.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.4 0 10.3-1.9 14-5.7l-6.5-5.5C29.4 34.6 26.8 35.5 24 35.5c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 39.6 16.4 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5C41.4 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-3.5z"
    />
  </svg>
);

const AuthPanel = ({ compact = false, onAuthenticated }: AuthPanelProps) => {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleGoogleSignIn = () => {
    signIn("google");
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Incorrect email or password.");
        return;
      }

      onAuthenticated?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Could not create your account.");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setNotice(
          "Account created. We've sent a verification link to your email — you can log in now.",
        );
        setMode("login");
        return;
      }

      setNotice("Account created! Check your email to verify your address.");
      onAuthenticated?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={compact ? "" : "mx-auto w-full max-w-sm"}>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:bg-ink/5"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-ink/10" />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          or
        </span>
        <div className="h-px flex-1 bg-ink/10" />
      </div>

      <div className="mb-3 flex gap-1 rounded-xl bg-ink/5 p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setNotice(null);
          }}
          className={`flex-1 rounded-lg py-1.5 transition ${
            mode === "login" ? "bg-white text-ink shadow-sm" : "text-ink/50"
          }`}
        >
          Log in
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
            setNotice(null);
          }}
          className={`flex-1 rounded-lg py-1.5 transition ${
            mode === "signup" ? "bg-white text-ink shadow-sm" : "text-ink/50"
          }`}
        >
          Sign up
        </button>
      </div>

      <form
        onSubmit={mode === "login" ? handleLogin : handleSignup}
        className="space-y-2.5"
      >
        {mode === "signup" && (
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            maxLength={120}
            className="w-full rounded-xl border border-ink/15 bg-white/80 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-pine focus:ring-2 focus:ring-pine/15"
          />
        )}

        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className="w-full rounded-xl border border-ink/15 bg-white/80 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-pine focus:ring-2 focus:ring-pine/15"
        />

        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"}
          className="w-full rounded-xl border border-ink/15 bg-white/80 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-pine focus:ring-2 focus:ring-pine/15"
        />

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        {notice && <p className="text-sm font-medium text-pine">{notice}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-terracotta px-4 py-2.5 text-sm font-bold text-paper shadow-sm transition hover:bg-terracotta/90 disabled:opacity-60"
        >
          {isSubmitting
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
};

export default AuthPanel;
