"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSSE } from "../lib/useSSE";
import { Navbar } from "../components/common/Navbar";
import {
  BookOpen,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Radio,
  Clock,
} from "lucide-react";

export default function Home() {
  const { user, token, isLoading } = useAuth();
  const [liveEventsCount, setLiveEventsCount] = useState<number>(0);

  // Connect to live SSE stream
  const { isConnected, lastEvent } = useSSE(token, (event) => {
    setLiveEventsCount((prev) => prev + 1);
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar sseConnected={isConnected} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Foundation Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-[#0f172a]/70 to-[#0b0f19] backdrop-blur-2xl shadow-2xl mb-10">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Step 9 Foundation Active</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight mb-4">
              BookLeaf Author Support & Communication Portal
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              Full-stack portal powered by Neon PostgreSQL vector search (`pgvector`), Vercel AI SDK auto-triage, and real-time Server-Sent Events.
            </p>

            {/* Active Session Status Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800/80 text-emerald-400">
                  {user?.role === "AUTHOR" ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Active Session</p>
                  <p className="font-semibold text-white">{user?.name || "Loading..."}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                <div className="p-2 rounded-xl bg-slate-800/80 text-amber-400">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">SSE Stream Status</p>
                  <p className="font-semibold text-white">
                    {isConnected ? "Connected (Live)" : "Connecting..."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                <div className="p-2 rounded-xl bg-slate-800/80 text-teal-400">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Events Dispatched</p>
                  <p className="font-semibold text-white">{liveEventsCount} live events</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps Roadmap Cards */}
        <div className="mb-8">
          <h2 className="font-heading text-xl font-bold text-white mb-4">
            Next Implementation Milestones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Step 10 (Up Next)
                </span>
                <span className="text-slate-500 text-xs">Author Portal</span>
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-2">
                Royalty Summary & Book Catalog Grid
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Displays real-time royalty cards (Copies Sold, Total Earned, Paid, Pending Balance) and author book catalog cards with live platform sync status.
              </p>
              <div className="flex items-center text-xs font-medium text-emerald-400 group-hover:translate-x-1 transition-transform">
                <span>View Author Plan</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Step 12
                </span>
                <span className="text-slate-500 text-xs">Admin Portal</span>
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-2">
                Urgency Triage Queue & SLA Countdown
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Operational triage board with SLA countdown timers, urgency-first sorting (Critical/High), real-time incoming alerts, and AI draft editor.
              </p>
              <div className="flex items-center text-xs font-medium text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>View Admin Plan</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
