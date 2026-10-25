"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import type { Book, BookSummary } from "../../types/index";
import { RoyaltySummary } from "./RoyaltySummary";
import { BookList } from "./BookList";
import {
  BookOpen,
  LifeBuoy,
  RefreshCw,
  AlertCircle,
  Sparkles,
  MapPin,
  Mail,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  FileText,
  Clock,
  ArrowUpRight,
} from "lucide-react";

interface AuthorDashboardProps {
  onOpenTicketModal?: (preselectedBook?: Book | null) => void;
}

export const AuthorDashboard: React.FC<AuthorDashboardProps> = ({ onOpenTicketModal }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [summary, setSummary] = useState<BookSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"catalog" | "policies">("catalog");

  const loadAuthorData = useCallback(async (isRefresh = false) => {
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
          // Fallback computation
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
      console.error("Failed to load author catalog & metrics:", err);
      setError(err?.message || "Failed to load royalty metrics. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAuthorData();
  }, [loadAuthorData]);

  const handleRaiseTicket = (book?: Book) => {
    if (onOpenTicketModal) {
      onOpenTicketModal(book || null);
    } else {
      // Dispatch custom event or alert placeholder until Step 11 modal is wired
      alert(
        book
          ? `Opening ticket creation for book "${book.title}" (ISBN: ${book.isbn})`
          : "Opening ticket creation modal..."
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Author Profile Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-[#0f172a]/70 to-[#0b0f19] backdrop-blur-2xl shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-lg flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-teal-300 font-heading font-extrabold text-xl">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                  : "PS"}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {user?.name || "Author Portal"}
                </h1>
                {user?.authorCode && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold">
                    {user.authorCode}
                  </span>
                )}
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 font-medium inline-flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  Verified Author
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  {user?.email || "priya.sharma@email.com"}
                </span>
                {user?.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    {user.city}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Direct Bank Linked
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadAuthorData(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all disabled:opacity-50"
              title="Refresh sales and metrics"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-400 ${isRefreshing ? "animate-spin text-teal-400" : ""}`}
              />
              <span>{isRefreshing ? "Updating..." : "Sync Sales"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRaiseTicket()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LifeBuoy className="h-4 w-4" />
              <span>Raise Support Ticket</span>
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
            onClick={() => loadAuthorData()}
            className="px-3 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Royalty Summary Component */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800/60" />
          ))}
        </div>
      ) : (
        <RoyaltySummary summary={summary} bankLinked={user?.bankDetailsLinked ?? true} />
      )}

      {/* Tabs Switcher: Catalog vs Quick Policies */}
      <div className="border-b border-slate-800 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("catalog")}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "catalog"
              ? "border-teal-400 text-teal-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>My Books & Distribution Catalog</span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-800 text-slate-300">
            {books.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("policies")}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "policies"
              ? "border-teal-400 text-teal-300"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>Royalty & Publishing Policies FAQ</span>
        </button>
      </div>

      {/* Tab 1: Book Catalog */}
      {activeTab === "catalog" && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800/60" />
              ))}
            </div>
          ) : (
            <BookList books={books} onRaiseTicketForBook={handleRaiseTicket} />
          )}
        </>
      )}

      {/* Tab 2: Publishing & Royalty Policies Reference */}
      {activeTab === "policies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <FileText className="h-4 w-4" />
              </div>
              <h4 className="font-heading text-sm font-bold text-white">
                Quarterly Payout Schedule
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Royalties are calculated at 80% of net profits (List price minus printing and channel commission). Disbursements occur within 45 days after the close of each calendar quarter.
            </p>
            <div className="text-[11px] space-y-1.5 text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
              <div className="flex justify-between">
                <span>Q1 (Jan - Mar):</span>
                <span className="text-slate-200">Disbursed by May 15</span>
              </div>
              <div className="flex justify-between">
                <span>Q2 (Apr - Jun):</span>
                <span className="text-slate-200">Disbursed by Aug 15</span>
              </div>
              <div className="flex justify-between">
                <span>Q3 (Jul - Sep):</span>
                <span className="text-slate-200">Disbursed by Nov 15</span>
              </div>
              <div className="flex justify-between">
                <span>Q4 (Oct - Dec):</span>
                <span className="text-slate-200">Disbursed by Feb 15</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <h4 className="font-heading text-sm font-bold text-white">
                Support Resolution SLAs
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Every inquiry submitted through the author portal is analyzed by our AI triage engine and prioritized based on operational urgency:
            </p>
            <div className="text-[11px] space-y-1.5 text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
              <div className="flex justify-between">
                <span className="text-rose-300">Critical (Print flaws, legal, urgent ISBN):</span>
                <span className="text-slate-200 font-semibold">&lt; 4 Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-300">High (Overdue royalties &gt; ₹5,000):</span>
                <span className="text-slate-200 font-semibold">&lt; 12 Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-teal-300">Medium (Distribution & platform sync):</span>
                <span className="text-slate-200 font-semibold">&lt; 24 Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Low (General queries & metadata updates):</span>
                <span className="text-slate-200 font-semibold">&lt; 48 Hours</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
