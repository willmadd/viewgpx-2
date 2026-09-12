"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "./SupabaseProvider";
import { createClient } from "@/app/lib/supabase/client";

const navigation = [
  {
    label: "Search routes",
    href: "/search",
  },
  {
    label: "What is a GPX File?",
    href: "/what-is-a-gpx-file",
  },
  {
    label: "Share a GPX File",
    href: "/share-a-gpx-file",
  },
  {
    label: "About us",
    href: "/about",
  },
];

type HeaderProps = {
  variant?: "overlay" | "solid";
  actions?: React.ReactNode;
};

const Header = ({ variant = "overlay", actions }: HeaderProps) => {
  const { status } = useSupabaseAuth();
  const router = useRouter();
  const isSolid = variant === "solid";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={
        isSolid
          ? "relative z-1001 w-full border-b border-ink/10 bg-paper"
          : "absolute inset-x-0 top-0 z-50 w-full"
      }
    >
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="View GPX homepage"
          className="flex shrink-0 items-center gap-3"
        >
          <img src="/logo.png" alt="" className="h-11 w-auto object-contain" />

          <span className="text-2xl font-extrabold tracking-tight text-ink  sm:text-3xl">
            <img
              src="/images/logo.webp"
              alt=""
              className="h-6 w-auto object-contain sm:h-12"
            />
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <nav aria-label="Main navigation">
            <ul className="hidden items-center gap-6 md:flex">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      isSolid
                        ? "text-sm font-semibold text-ink underline-offset-4 decoration-terracotta transition hover:text-pine hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine"
                        : "text-sm font-semibold text-ink underline-offset-4 decoration-terracotta drop-shadow-sm transition hover:text-paper hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {actions}

          {status === "authenticated" ? (
            <div className="flex items-center gap-3">
              <Link
                href="/account"
                className="text-sm font-semibold text-ink underline-offset-4 decoration-terracotta drop-shadow-sm transition hover:text-paper hover:underline"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border border-ink/15 bg-paper/90 px-4 py-2 text-sm font-bold text-ink transition hover:bg-paper"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-ink/15 bg-paper/90 px-4 py-2 text-sm font-bold text-ink transition hover:bg-paper"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
