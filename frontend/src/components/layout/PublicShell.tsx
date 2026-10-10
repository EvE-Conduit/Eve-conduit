import { ArrowRight, LogIn } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";

import { BrandMark } from "@/components/layout/Brand";
import { buttonVariants } from "@/components/ui/button";
import { useBootstrap } from "@/lib/bootstrap";

/** Frame for plugin pages anyone may open (``publicRoutes``), signed in or not: the site's name and a way in. */
export function PublicShell() {
  const { user, site } = useBootstrap();
  const location = useLocation();
  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <BrandMark className="size-8 shrink-0" />
          <span className="truncate text-[15px] font-bold uppercase tracking-[0.16em]">{site.name}</span>
        </Link>
        {user ? (
          <Link to="/" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Open {site.name} <ArrowRight />
          </Link>
        ) : (
          <Link to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <LogIn /> Sign in
          </Link>
        )}
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
