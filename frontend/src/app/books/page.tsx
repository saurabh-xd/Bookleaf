"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useSSE } from "../../lib/useSSE";
import { api } from "../../lib/api";
import type { Book, BookSummary } from "../../types/index";
import { Navbar } from "../../components/common/Navbar";
import { RoyaltySummary } from "../../components/author/RoyaltySummary";
import { BookList } from "../../components/author/BookList";
import { RaiseTicketModal } from "../../components/author/RaiseTicketModal";
import { RefreshCw } from "lucide-react";

export default function MyBooksPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState<BookSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preselectedBook, setPreselectedBook] = useState<Book | null>(null);

  const { isConnected } = useSSE(token);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role === "ADMIN") {
        router.replace("/");
      }
    }
  }, [user, authLoading, router]);

  const loadBooksData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

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
      setError(err?.message || "Failed to load books.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadBooksData();
    }
  }, [user, loadBooksData]);

  const handleOpenQueryModal = (book?: Book | null) => {
    setPreselectedBook(book || null);
    setIsModalOpen(true);
  };

  const handleTicketCreated = (newTicket: any) => {
    setIsModalOpen(false);
    router.push(`/tickets/${newTicket.id}`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 animate-pulse">
          <div className="h-20 rounded-lg bg-muted border border-border mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">
                My Books
              </h1>
              {user.authorCode && (
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-secondary/60 text-secondary-foreground font-medium border border-secondary/60">
                  {user.authorCode}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sales, royalties, and distribution status
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadBooksData(true)}
              disabled={isRefreshing || isLoading}
              className="p-2 text-xs rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => handleOpenQueryModal()}
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
              onClick={() => loadBooksData()}
              className="font-medium underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Metric Cards */}
        <RoyaltySummary summary={summary} />

        {/* Book Catalog */}
        <div className="pt-2">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-card border border-border p-4 flex gap-4">
                  <div className="w-24 h-32 rounded-lg bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="grid grid-cols-4 gap-2 pt-4">
                      <div className="h-12 bg-muted rounded-xl" />
                      <div className="h-12 bg-muted rounded-xl" />
                      <div className="h-12 bg-muted rounded-xl" />
                      <div className="h-12 bg-muted rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <BookList books={books} onRaiseTicketForBook={(b) => handleOpenQueryModal(b)} />
          )}
        </div>
      </main>

      <RaiseTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={books}
        preselectedBook={preselectedBook}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
}
