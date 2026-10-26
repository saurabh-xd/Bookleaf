"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useSSE } from "../../lib/useSSE";
import { api } from "../../lib/api";
import type { Book, Ticket } from "../../types/index";
import { Navbar } from "../../components/common/Navbar";
import { AuthorTicketList } from "../../components/author/AuthorTicketList";
import { RaiseTicketModal } from "../../components/author/RaiseTicketModal";
import {
  LifeBuoy,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function MyTicketsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ticket Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Connect to SSE stream
  const { isConnected, lastEvent } = useSSE(token);

  // Redirect unauthenticated users to /login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [ticketsRes, booksRes] = await Promise.all([
        api.tickets.list(),
        api.books.list(),
      ]);

      if (ticketsRes.success && ticketsRes.data) {
        setTickets(ticketsRes.data);
      }
      if (booksRes.success && booksRes.data) {
        setBooks(booksRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load tickets:", err);
      setError(err?.message || "Failed to load support queries.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Reactive SSE listener: Refresh tickets on updates
  useEffect(() => {
    if (!lastEvent) return;
    const { event } = lastEvent;
    if (event === "TICKET_CREATED" || event === "TICKET_UPDATED" || event === "NEW_MESSAGE") {
      loadData(true);
    }
  }, [lastEvent, loadData]);

  const handleSelectTicket = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    setIsModalOpen(false);
    router.push(`/tickets/${newTicket.id}`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0b0f19]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
          <div className="h-36 rounded-3xl bg-slate-900/60 border border-slate-800/60 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800/60" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const activeTicketCount = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar sseConnected={isConnected} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-[#0f172a]/70 to-[#0b0f19] backdrop-blur-2xl shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Real-Time Support
                </span>
                <span className="text-xs text-slate-400">
                  {activeTicketCount} Active Inquiries
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                My Support Tickets & Inquiries
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                View all support queries you have submitted, track live resolution status (`Open`, `In Progress`, `Resolved`, `Closed`), and view responses from the BookLeaf operations desk in real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadData(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-slate-400 ${isRefreshing ? "animate-spin text-teal-400" : ""}`}
                />
                <span>{isRefreshing ? "Refreshing..." : "Refresh Queue"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <LifeBuoy className="h-4 w-4" />
                <span>Submit a Support Query</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="px-3 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tickets List Component */}
        <AuthorTicketList
          tickets={tickets}
          isLoading={isLoading}
          onSelectTicket={handleSelectTicket}
          onOpenCreateModal={() => setIsModalOpen(true)}
        />
      </main>

      {/* Submit Support Query Modal */}
      <RaiseTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={books}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
}
