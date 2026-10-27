"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

interface NavbarProps {
  sseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ sseConnected = false }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthor = user?.role === "AUTHOR";
  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-2xs">
              B
            </div>
            <span className="font-semibold text-base text-foreground tracking-tight">
              BookLeaf
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium shadow-2xs">
              Portal
            </span>
          </Link>

          {/* Navigation for Authors */}
          {user && isAuthor && (
            <nav className="hidden sm:flex items-center gap-1.5 text-xs">
              <Link
                href="/"
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  pathname === "/"
                    ? "bg-secondary text-secondary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                Overview
              </Link>
              <Link
                href="/books"
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  pathname.startsWith("/books")
                    ? "bg-secondary text-secondary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                My Books
              </Link>
              <Link
                href="/tickets"
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  pathname.startsWith("/tickets")
                    ? "bg-secondary text-secondary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                My Tickets
              </Link>
            </nav>
          )}

          {/* Badge for Admin */}
          {user && isAdmin && (
            <span className="hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium shadow-2xs">
              Operations Desk
            </span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* SSE Status */}
              <div
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                title={sseConnected ? "Real-time sync active" : "Connecting..."}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    sseConnected ? "bg-emerald-600" : "bg-neutral-400"
                  }`}
                />
                <span className="hidden md:inline font-mono text-[11px]">
                  {sseConnected ? "Live" : "Connecting"}
                </span>
              </div>

              {/* User info & Sign out */}
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <span className="text-xs text-foreground font-medium hidden sm:inline px-2 py-0.5 rounded-full bg-muted border border-border">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
