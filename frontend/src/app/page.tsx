"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSSE } from "../lib/useSSE";
import { Navbar } from "../components/common/Navbar";
import { AuthorDashboard } from "../components/author/AuthorDashboard";
import {
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Inbox,
  Users,
  Activity,
} from "lucide-react";

export default function Home() {
  const { user, token, isLoading, switchDemoUser } = useAuth();
  const [liveEventsCount, setLiveEventsCount] = useState<number>(0);

  // Connect to live SSE stream
  const { isConnected, lastEvent } = useSSE(token, () => {
    setLiveEventsCount((prev) => prev + 1);
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar sseConnected={isConnected} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-44 rounded-3xl bg-slate-900/60 border border-slate-800/60" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800/60" />
              ))}
            </div>
          </div>
        ) : user?.role === "AUTHOR" ? (
          /* Author Portal View (Step 10-11) */
          <AuthorDashboard lastSSEEvent={lastEvent} />
        ) : (
          /* Admin Portal Welcome / Triage Teaser (Step 12-13) */
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-[#0f172a]/70 to-[#0b0f19] backdrop-blur-2xl shadow-xl">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Operations Admin Portal</span>
                </div>

                <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
                  Author Support Operations Workspace
                </h1>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                  Logged in as <strong className="text-white">{user?.name}</strong> ({user?.email}). 
                  Manage incoming author tickets, review AI classification, inspect pgvector retrieved policies, and reply with AI drafts or internal notes.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => switchDemoUser("AUTHOR")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                  >
                    <Users className="h-4 w-4 text-teal-400" />
                    <span>Switch to Author View (Priya Sharma)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Admin Milestones Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Step 12
                  </span>
                  <span className="text-xs text-slate-500">Urgency Triage</span>
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-amber-400" />
                  Urgency Queue & SLA Timers
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Filtered ticket queue sorted by urgency (Critical &lt;4h, High &lt;12h, Medium &lt;24h, Low &lt;48h) with real-time SSE ticket alerts.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Step 13
                  </span>
                  <span className="text-xs text-slate-500">Resolution Console</span>
                </div>
                <h3 className="font-heading text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  AI Draft Editor & Internal Notes
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  One-click draft insertion, RAG policy citation preview, admin overrides for category/priority, and private amber internal notes.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
