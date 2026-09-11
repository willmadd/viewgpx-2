import type { Metadata } from "next";

import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in or sign up to save, revisit and share your GPX routes.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginClient />;
}
