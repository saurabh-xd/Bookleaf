"use client";

import React, { useState, useMemo } from "react";
import type { Book } from "../../types/index";
import {
  Search,
  Copy,
  Check,
  BookOpen,
  TrendingUp,
  Calendar,
  Printer,
  MessageSquarePlus,
  Clock,
  Layers,
  X,
  Coins,
} from "lucide-react";

interface BookListProps {
  books: Book[];
  onRaiseTicketForBook?: (book: Book) => void;
}

export const BookList: React.FC<BookListProps> = ({ books, onRaiseTicketForBook }) => {
  const [copiedIsbn, setCopiedIsbn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("ALL");

  const copyToClipboard = (isbn: string) => {
    navigator.clipboard.writeText(isbn);
    setCopiedIsbn(isbn);
    setTimeout(() => setCopiedIsbn(null), 2000);
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const genres = useMemo(() => {
    return ["ALL", ...Array.from(new Set(books.map((b) => b.genre).filter(Boolean)))];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        book.title.toLowerCase().includes(q) ||
        (book.isbn && book.isbn.toLowerCase().includes(q)) ||
        (book.bookCode && book.bookCode.toLowerCase().includes(q)) ||
        (book.genre && book.genre.toLowerCase().includes(q));
      const matchesGenre = selectedGenre === "ALL" || book.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [books, searchQuery, selectedGenre]);

  const getBookCoverTheme = (genre: string) => {
    const g = (genre || "").toLowerCase();
    if (g.includes("poetry")) {
      return {
        bg: "from-[#54382e] via-[#6d483b] to-[#3d271f]",
        ribbon: "bg-amber-300",
        badge: "bg-amber-900/30 text-amber-200 border-amber-500/30",
      };
    }
    if (g.includes("fiction") || g.includes("novel") || g.includes("mystery")) {
      return {
        bg: "from-[#253342] via-[#33465b] to-[#1a2430]",
        ribbon: "bg-sky-300",
        badge: "bg-sky-900/30 text-sky-200 border-sky-500/30",
      };
    }
    if (g.includes("business") || g.includes("self") || g.includes("finance")) {
      return {
        bg: "from-[#1d382c] via-[#2a4e3e] to-[#14261e]",
        ribbon: "bg-emerald-300",
        badge: "bg-emerald-900/30 text-emerald-200 border-emerald-500/30",
      };
    }
    // Default rich espresso literary tone
    return {
      bg: "from-[#4c352b] via-[#63483b] to-[#39261e]",
      ribbon: "bg-[#ffdfb5]",
      badge: "bg-[#ffdfb5]/20 text-[#ffdfb5] border-[#ffdfb5]/30",
    };
  };

  const getStatusConfig = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s.includes("PUBLISH") || s.includes("LIVE")) {
      return {
        dot: "bg-emerald-500",
        pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
        label: status || "Published",
      };
    }
    if (s.includes("DISTRIBUT")) {
      return {
        dot: "bg-sky-500",
        pill: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
        label: status || "Distributed",
      };
    }
    if (s.includes("PRINT")) {
      return {
        dot: "bg-amber-500",
        pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        label: status || "In Print",
      };
    }
    return {
      dot: "bg-neutral-400",
      pill: "bg-muted text-muted-foreground border-border",
      label: status || "Active",
    };
  };

  const getChannelBadgeClass = (channel: string) => {
    const c = channel.toLowerCase();
    if (c.includes("amazon")) {
      return "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25";
    }
    if (c.includes("flipkart")) {
      return "bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/25";
    }
    if (c.includes("kindle")) {
      return "bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/25";
    }
    return "bg-secondary/40 text-secondary-foreground border-secondary/60";
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-secondary/50 text-secondary-foreground flex items-center justify-center font-bold">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Published Titles
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                {books.length}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Catalog status, sales royalties, and distribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search title, ISBN, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs rounded-full bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-44 sm:w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {genres.length > 2 && (
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-card border border-border text-foreground text-xs rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g === "ALL" ? "All Genres" : g}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">No books found</h4>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search query or genre filter.
            </p>
          </div>
          {(searchQuery || selectedGenre !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("ALL");
              }}
              className="px-3.5 py-1 text-xs font-medium rounded-full border border-border hover:bg-muted text-foreground cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredBooks.map((book) => {
            const isCopied = copiedIsbn === book.isbn;
            const coverTheme = getBookCoverTheme(book.genre);
            const statusConfig = getStatusConfig(book.status);

            return (
              <div
                key={book.id}
                className="group bg-card border border-border hover:border-foreground/20 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  {/* Top Row: Mini Book Jacket + Main Details */}
                  <div className="flex gap-3.5">
                    {/* Simulated Miniature Book Cover / Spine */}
                    <div
                      className={`w-20 sm:w-24 h-28 sm:h-32 rounded-lg bg-gradient-to-br ${coverTheme.bg} flex-shrink-0 flex flex-col justify-between p-2.5 text-white relative shadow-sm border-l-2 border-white/20 select-none overflow-hidden group-hover:shadow-md transition-shadow`}
                    >
                      {/* Spine Crease overlay */}
                      <div className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
                      {/* Bookmark ribbon tab */}
                      <div
                        className={`absolute top-0 right-2 w-2 h-4 ${coverTheme.ribbon} rounded-b-xs shadow-xs`}
                      />

                      <div className="relative z-10">
                        <BookOpen className="h-3.5 w-3.5 opacity-80" />
                      </div>

                      <div className="relative z-10 space-y-0.5">
                        <span className="block text-[9px] font-mono tracking-wider opacity-75 uppercase">
                          {book.bookCode}
                        </span>
                        <p className="text-[10px] sm:text-[11px] font-serif font-bold leading-tight line-clamp-2 text-white/95">
                          {book.title}
                        </p>
                      </div>

                      <div className="relative z-10 pt-0.5 border-t border-white/15">
                        <span className="block text-[8px] font-medium tracking-wide uppercase opacity-75 truncate">
                          {book.genre || "BookLeaf"}
                        </span>
                      </div>
                    </div>

                    {/* Book Metadata & Header */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm sm:text-base font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {book.title}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs flex-shrink-0 ${statusConfig.pill}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                            />
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="font-medium text-foreground/80">
                            {book.genre}
                          </span>
                          <span>&bull;</span>
                          <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-muted">
                            {book.bookCode}
                          </span>
                        </div>

                        {/* ISBN & Publication Bar */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 flex-wrap">
                          <div className="inline-flex items-center gap-1 bg-muted/60 border border-border/80 px-2 py-0.5 rounded-md font-mono text-[11px] text-foreground">
                            <span>ISBN:</span>
                            <span className="select-all font-semibold">{book.isbn}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(book.isbn)}
                              title={isCopied ? "Copied!" : "Copy ISBN"}
                              className="text-muted-foreground hover:text-foreground p-0.5 ml-0.5 cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>

                          {book.publicationDate && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(book.publicationDate).toLocaleDateString("en-IN", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Channels Pills */}
                      {book.availableOn && book.availableOn.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-2">
                          {book.availableOn.map((channel) => (
                            <span
                              key={channel}
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-medium shadow-2xs ${getChannelBadgeClass(
                                channel
                              )}`}
                            >
                              {channel}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial & Performance Stats Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-border">
                    {/* Copies Sold */}
                    <div className="bg-muted/40 dark:bg-muted/20 border border-border/70 rounded-xl p-2.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          Sold
                        </span>
                        <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-base font-bold text-foreground mt-1">
                        {book.totalCopiesSold.toLocaleString("en-IN")}
                      </p>
                      <span className="text-[10px] text-muted-foreground">Copies</span>
                    </div>

                    {/* Total Royalty */}
                    <div className="bg-muted/40 dark:bg-muted/20 border border-border/70 rounded-xl p-2.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          Earned
                        </span>
                        <Coins className="h-3 w-3 text-primary" />
                      </div>
                      <p className="text-base font-bold text-foreground mt-1">
                        {formatCurrency(book.totalRoyaltyEarned)}
                      </p>
                      <span className="text-[10px] text-muted-foreground">Net Royalty</span>
                    </div>

                    {/* Pending Payout */}
                    <div className="bg-secondary/30 dark:bg-secondary/15 border border-secondary/60 rounded-xl p-2.5">
                      <div className="flex items-center justify-between text-secondary-foreground">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Pending
                        </span>
                        <Clock className="h-3 w-3 text-secondary-foreground" />
                      </div>
                      <p className="text-base font-bold text-secondary-foreground mt-1">
                        {formatCurrency(book.royaltyPending)}
                      </p>
                      <span className="text-[10px] font-medium text-secondary-foreground/80">
                        Next Cycle
                      </span>
                    </div>

                    {/* Pricing / Royalty Unit */}
                    <div className="bg-muted/40 dark:bg-muted/20 border border-border/70 rounded-xl p-2.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          Unit Net
                        </span>
                        <Layers className="h-3 w-3" />
                      </div>
                      <p className="text-base font-bold text-foreground mt-1">
                        {formatCurrency(book.authorRoyaltyPerCopy)}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        MRP {formatCurrency(book.mrp)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 mt-3 border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Printer className="h-3 w-3 text-muted-foreground/80" />
                    <span>Print: {book.printPartner || "Standard"}</span>
                    {book.lastRoyaltyPayoutDate && (
                      <span className="hidden sm:inline">
                        &bull; Payout:{" "}
                        {new Date(book.lastRoyaltyPayoutDate).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  {onRaiseTicketForBook && (
                    <button
                      type="button"
                      onClick={() => onRaiseTicketForBook(book)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all cursor-pointer group-hover:scale-[1.02]"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      <span>Query for Book</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
