"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  User,
  AlertCircle,
  Loader2,
  Sparkles,
  KeyRound,
} from "lucide-react";

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
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Invalid email or password. Please try again.");
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-xl shadow-emerald-500/20 mb-2">
            <div className="h-full w-full rounded-2xl bg-slate-950 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            BookLeaf Publishing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Author Support & Operations Communication Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          <h2 className="font-heading text-lg font-bold text-white mb-1">
            Sign In to Your Account
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter your credentials to access your published titles, royalties, and support queries.
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="author@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Demo Credentials Section */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>Quick-Fill Demo Credentials (1-Click Login):</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillCredentials("priya.sharma@email.com", "Author@123")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors">
                      Priya Sharma (Author)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      AUTH001 • 2 published titles • ₹19.9k royalties
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("rohit.kapoor@email.com", "Author@123")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-teal-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors">
                      Rohit Kapoor (Author)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      AUTH002 • 2 poetry titles • Isolated catalog
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("admin@bookleaf.com", "Admin@123")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                      Operations Admin Desk
                    </p>
                    <p className="text-[11px] text-slate-400">
                      admin@bookleaf.com • Urgency queue & SLA timers
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
