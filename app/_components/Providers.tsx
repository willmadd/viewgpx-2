"use client";

import { SupabaseProvider } from "./SupabaseProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <SupabaseProvider>{children}</SupabaseProvider>;
};

export default Providers;
