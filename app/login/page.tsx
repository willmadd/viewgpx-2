"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import AuthPanel from "../_components/AuthPanel";
import Header from "../_components/Header";

const LoginPage = () => {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/account");
    }
  }, [status, router]);

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-ink">Log in or sign up</h1>

          <p className="mt-1.5 text-sm text-ink/60">
            Save routes and access them from anywhere.
          </p>

          <div className="mt-6">
            <AuthPanel onAuthenticated={() => router.replace("/account")} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
