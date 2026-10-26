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
            <span className="font-semibold text-base text-foreground tracking-tight">
              BookLeaf
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
              Portal
            </span>
          </Link>

          {/* Navigation for Authors */}
          {user && isAuthor && (
            <nav className="hidden sm:flex items-center gap-1 text-xs">
              <Link
                href="/"
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  pathname === "/"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Overview
              </Link>
              <Link
                href="/books"
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  pathname.startsWith("/books")
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Books
              </Link>
              <Link
                href="/tickets"
                className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                  pathname.startsWith("/tickets")
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Tickets
              </Link>
            </nav>
          )}

          {/* Badge for Admin */}
          {user && isAdmin && (
            <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
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
                <span className="text-xs text-foreground font-medium hidden sm:inline">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Sign In</span>
          )}
        </div>
      </div>
    </header>
  );
};
