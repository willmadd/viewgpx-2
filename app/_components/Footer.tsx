import Link from "next/link";

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search routes" },
  { href: "/sitemap", label: "Sitemap" },
];

const accountLinks = [
  { href: "/login", label: "Log in / sign up" },
  { href: "/account", label: "My routes" },
];

const Footer = () => {
  return (
    <footer className="bg-pine text-paper">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt=""
                className="h-10 w-auto object-contain"
              />

              <span className="text-xl font-extrabold tracking-tight">
                View GPX
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-paper/70">
              View, save and share your GPX adventures — free, and no
              account required to get started.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-sage">
              Explore
            </h2>

            <ul className="mt-4 space-y-2 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-paper/80 underline-offset-4 transition hover:text-paper hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-sage">
              Account
            </h2>

            <ul className="mt-4 space-y-2 text-sm">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-paper/80 underline-offset-4 transition hover:text-paper hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-paper/15 pt-6 text-xs text-paper/50">
          &copy; {new Date().getFullYear()} View GPX. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
