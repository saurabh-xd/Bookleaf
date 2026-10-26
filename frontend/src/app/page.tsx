"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useSSE } from "../lib/useSSE";
import { Navbar } from "../components/common/Navbar";
import { AuthorDashboard } from "../components/author/AuthorDashboard";
import { AdminDashboard } from "../components/admin/AdminDashboard";

export default function Home() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const { isConnected, lastEvent } = useSSE(token);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-24 rounded-lg bg-muted border border-border" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-muted border border-border" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar sseConnected={isConnected} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {user.role === "AUTHOR" ? (
          <AuthorDashboard lastSSEEvent={lastEvent} />
        ) : (
          <AdminDashboard lastSSEEvent={lastEvent} />
        )}
      </main>
    </div>
  );
}
