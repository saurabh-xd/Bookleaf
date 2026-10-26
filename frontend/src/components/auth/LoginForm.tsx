"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setIsSubmitting(true);
    try {
      await login(demoEmail, demoPass);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        {/* Brand */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-foreground">
            BookLeaf Portal
          </h1>
          <p className="text-xs text-muted-foreground">
            Sign in to access author dashboard & support
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-xs">
          {error && (
            <div className="mb-4 p-2.5 rounded bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="author@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick presets */}
          <div className="mt-5 pt-4 border-t border-border">
            <span className="text-[11px] text-muted-foreground block mb-2 font-medium">
              Demo Logins (1-Click):
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fillCredentials("priya.sharma@email.com", "Author@123")}
                disabled={isSubmitting}
                className="w-full p-2 rounded-md border border-border hover:bg-muted text-left text-xs flex justify-between items-center transition-colors"
              >
                <div>
                  <span className="font-medium text-foreground block">Priya Sharma</span>
                  <span className="text-[10px] text-muted-foreground">Author (AUTH001)</span>
                </div>
                <span className="text-[11px] text-muted-foreground">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("rohit.kapoor@email.com", "Author@123")}
                disabled={isSubmitting}
                className="w-full p-2 rounded-md border border-border hover:bg-muted text-left text-xs flex justify-between items-center transition-colors"
              >
                <div>
                  <span className="font-medium text-foreground block">Rohit Kapoor</span>
                  <span className="text-[10px] text-muted-foreground">Author (AUTH002)</span>
                </div>
                <span className="text-[11px] text-muted-foreground">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("admin@bookleaf.com", "Admin@123")}
                disabled={isSubmitting}
                className="w-full p-2 rounded-md border border-border hover:bg-muted text-left text-xs flex justify-between items-center transition-colors"
              >
                <div>
                  <span className="font-medium text-foreground block">Operations Admin</span>
                  <span className="text-[10px] text-muted-foreground">Admin</span>
                </div>
                <span className="text-[11px] text-muted-foreground">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
