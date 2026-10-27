"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import type { Book, BookSummary, Ticket } from "../../types/index";
import { RoyaltySummary } from "./RoyaltySummary";
import { BookList } from "./BookList";
import { RaiseTicketModal } from "./RaiseTicketModal";
import { AuthorTicketList } from "./AuthorTicketList";
import { AuthorTicketDetail } from "./AuthorTicketDetail";
import { RefreshCw } from "lucide-react";

interface AuthorDashboardProps {
  lastSSEEvent?: any;
}

export const AuthorDashboard: React.FC<AuthorDashboardProps> = ({ lastSSEEvent }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState<BookSummary | null>(null);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [bookError, setBookError] = useState<string | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [preselectedBook, setPreselectedBook] = useState<Book | null>(null);

  const [activeTab, setActiveTab] = useState<"catalog" | "tickets">("catalog");

  const loadBooksData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingBooks(true);
    }
    setBookError(null);

    try {
      const response = await api.books.list();
      if (response.success && response.data) {
        setBooks(response.data);
        if (response.summary) {
          setSummary(response.summary);
        } else {
          const computedSummary: BookSummary = response.data.reduce(
            (acc, b) => ({
              totalBooks: acc.totalBooks + 1,
              totalCopiesSold: acc.totalCopiesSold + (b.totalCopiesSold || 0),
              totalRoyaltyEarned: acc.totalRoyaltyEarned + (b.totalRoyaltyEarned || 0),
              totalRoyaltyPaid: acc.totalRoyaltyPaid + (b.royaltyPaid || 0),
              totalRoyaltyPending: acc.totalRoyaltyPending + (b.royaltyPending || 0),
            }),
            {
              totalBooks: 0,
              totalCopiesSold: 0,
              totalRoyaltyEarned: 0,
              totalRoyaltyPaid: 0,
              totalRoyaltyPending: 0,
            }
          );
          setSummary(computedSummary);
        }
      }
    } catch (err: any) {
      setBookError(err?.message || "Failed to load royalty metrics.");
    } finally {
      setIsLoadingBooks(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const response = await api.tickets.list();
      if (response.success && response.data) {
        setTickets(response.data);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setIsLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    loadBooksData();
    loadTickets();
  }, [loadBooksData, loadTickets]);

  useEffect(() => {
    if (!lastSSEEvent) return;
    const { event, data } = lastSSEEvent;
    if (event === "TICKET_CREATED") {
      const ticketId = data?.id || data?.ticket?.id;
      setTickets((prev) => {
        if (ticketId && prev.some((t) => t.id === ticketId)) {
          return prev;
        }
        loadTickets();
        return prev;
      });
    } else if (event === "TICKET_UPDATED" || event === "NEW_MESSAGE") {
      loadTickets();
    }
  }, [lastSSEEvent, loadTickets]);

  const handleOpenTicketModal = (book?: Book | null) => {
    setPreselectedBook(book || null);
    setIsCreateModalOpen(true);
  };

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
    setActiveTab("tickets");
  };

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    setSelectedTicket(updatedTicket);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">
              {user?.name || "Author Portal"}
            </h1>
            {user?.authorCode && (
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-secondary/60 text-secondary-foreground font-medium border border-secondary/60">
                {user.authorCode}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user?.email} {user?.city ? `• ${user.city}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              loadBooksData(true);
              loadTickets();
            }}
            disabled={isRefreshing || isLoadingBooks}
            className="p-2 text-xs rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenTicketModal()}
            className="px-4 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all cursor-pointer"
          >
            New Ticket
          </button>
        </div>
      </div>

      {/* Error */}
      {bookError && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center justify-between">
          <span>{bookError}</span>
          <button
            type="button"
            onClick={() => loadBooksData()}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Royalty Metrics */}
      <RoyaltySummary summary={summary} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-card/80 p-1 rounded-full border border-border w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab("catalog");
            setSelectedTicket(null);
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeTab === "catalog"
              ? "bg-secondary text-secondary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          My Books ({books.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeTab === "tickets"
              ? "bg-secondary text-secondary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          My Tickets ({tickets.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "catalog" && (
        <BookList books={books} onRaiseTicketForBook={(b) => handleOpenTicketModal(b)} />
      )}

      {activeTab === "tickets" && (
        <>
          {selectedTicket ? (
            <AuthorTicketDetail
              ticket={selectedTicket}
              onBack={() => setSelectedTicket(null)}
              onTicketUpdated={handleTicketUpdated}
              lastSSEEvent={lastSSEEvent}
            />
          ) : (
            <AuthorTicketList
              tickets={tickets}
              isLoading={isLoadingTickets}
              onSelectTicket={(t) => router.push(`/tickets/${t.id}`)}
              onOpenCreateModal={() => handleOpenTicketModal()}
            />
          )}
        </>
      )}

      {/* Raise Ticket Modal */}
      <RaiseTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        books={books}
        preselectedBook={preselectedBook}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
};
