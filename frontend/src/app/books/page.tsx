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
import {
  BookOpen,
  LifeBuoy,
  RefreshCw,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

export default function MyBooksPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState<BookSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ticket Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preselectedBook, setPreselectedBook] = useState<Book | null>(null);

  // Connect to SSE stream
  const { isConnected } = useSSE(token);

  // Redirect unauthenticated users to /login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
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
      console.error("Failed to load author books:", err);
      setError(err?.message || "Failed to load published books. Please try again.");
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
      <div className="min-h-screen flex flex-col bg-[#0b0f19]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
          <div className="h-36 rounded-3xl bg-slate-900/60 border border-slate-800/60 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800/60" />
            ))}
          </div>
        </main>
      </div>
    );
  }

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
                  <BookOpen className="h-3.5 w-3.5" />
                  Author Catalog
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {user.authorCode || "AUTH"}
                </span>
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                My Books & Commercial Metrics
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Track real-time multi-channel book sales, royalties earned under the 80/20 plan, ISBN metadata, and distributor status across Amazon India, Flipkart, and BookLeaf Store.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => loadBooksData(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 text-slate-400 ${isRefreshing ? "animate-spin text-teal-400" : ""}`}
                />
                <span>{isRefreshing ? "Syncing..." : "Sync Sales Data"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenQueryModal()}
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
              onClick={() => loadBooksData()}
              className="px-3 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Royalty Metric Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800/60" />
            ))}
          </div>
        ) : (
          <RoyaltySummary summary={summary} bankLinked={user.bankDetailsLinked ?? true} />
        )}

        {/* Book Catalog Section (My Books) */}
        <div className="pt-2">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800/60" />
              ))}
            </div>
          ) : (
            <BookList books={books} onRaiseTicketForBook={(b) => handleOpenQueryModal(b)} />
          )}
        </div>
      </main>

      {/* Submit Support Query Modal */}
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
