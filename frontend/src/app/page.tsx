"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSSE } from "../lib/useSSE";
import { Navbar } from "../components/common/Navbar";
import { AuthorDashboard } from "../components/author/AuthorDashboard";
import { AdminDashboard } from "../components/admin/AdminDashboard";

export default function Home() {
  const { user, token, isLoading } = useAuth();
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
          /* Admin Operations Triage Portal (Step 12-13) */
          <AdminDashboard lastSSEEvent={lastEvent} />
        )}
      </main>
    </div>
  );
}
