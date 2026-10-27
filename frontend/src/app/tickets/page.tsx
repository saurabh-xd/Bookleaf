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
import { RefreshCw } from "lucide-react";

export default function MyTicketsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { isConnected, lastEvent } = useSSE(token);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role === "ADMIN") {
        router.replace("/");
      }
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
      setError(err?.message || "Failed to load tickets.");
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

  const refreshTicketsOnly = useCallback(async () => {
    try {
      const res = await api.tickets.list();
      if (res.success && res.data) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error("Failed to refresh tickets:", err);
    }
  }, []);

  useEffect(() => {
    if (!lastEvent) return;
    const { event, data } = lastEvent;
    if (event === "TICKET_CREATED") {
      const ticketId = data?.id || data?.ticket?.id;
      setTickets((prev) => {
        if (ticketId && prev.some((t) => t.id === ticketId)) {
          return prev;
        }
        refreshTicketsOnly();
        return prev;
      });
    } else if (event === "TICKET_UPDATED" || event === "NEW_MESSAGE") {
      refreshTicketsOnly();
    }
  }, [lastEvent, refreshTicketsOnly]);

  const handleSelectTicket = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    setIsModalOpen(false);
    setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
    router.push(`/tickets/${newTicket.id}`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 animate-pulse">
          <div className="h-20 rounded-lg bg-muted border border-border mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted border border-border" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar sseConnected={isConnected} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              My Tickets
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Support queries and thread history
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing || isLoading}
              className="p-2 text-xs rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all cursor-pointer"
            >
              New Ticket
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadData()}
              className="font-medium underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* List */}
        <AuthorTicketList
          tickets={tickets}
          isLoading={isLoading}
          onSelectTicket={handleSelectTicket}
          onOpenCreateModal={() => setIsModalOpen(true)}
        />
      </main>

      <RaiseTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={books}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
}
