"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { createClient } from "@/app/lib/supabase/client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type SupabaseAuthContextValue = {
  session: Session | null;
  status: AuthStatus;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue>({
  session: null,
  status: "loading",
});

export const SupabaseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = useMemo(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return null;
    }

    return createClient();
  }, []);

  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    supabase ? "loading" : "unauthenticated",
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setStatus(newSession ? "authenticated" : "unauthenticated");
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo(() => ({ session, status }), [session, status]);

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);
