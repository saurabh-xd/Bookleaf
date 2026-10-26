"use client";

import React, { useState } from "react";
import type { Book } from "../../types/index";
import {
  BookOpen,
  Copy,
  Check,
  Calendar,
  Tag,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
  LifeBuoy,
  Search,
  Filter,
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

  const genres = ["ALL", ...Array.from(new Set(books.map((b) => b.genre).filter(Boolean)))];

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.bookCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "ALL" || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-teal-400" />
            <span>Published Titles & Distribution</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {books.length} {books.length === 1 ? "Book" : "Books"}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-channel sales figures, ISBN cataloging, and distributor links.
          </p>
        </div>

        {/* Search & Genre Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-48 sm:w-56"
            />
          </div>

          {genres.length > 2 && (
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
              <Filter className="h-3 w-3 text-slate-400 ml-1.5" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-transparent text-slate-300 text-xs py-0.5 pr-2 pl-1 focus:outline-none cursor-pointer"
              >
                {genres.map((g) => (
                  <option key={g} value={g} className="bg-slate-900 text-slate-200">
                    {g === "ALL" ? "All Genres" : g}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200">No books found</p>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? "Try refining your search terms." : "No books cataloged in this account yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredBooks.map((book) => {
            const isCopied = copiedIsbn === book.isbn;

            return (
              <div
                key={book.id}
                className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-teal-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Book code & status badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/60">
                      {book.bookCode}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                        book.status === "PUBLISHED"
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                          : book.status === "IN_REVIEW"
                          ? "bg-amber-950/60 text-amber-300 border-amber-800/60"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}
                    >
                      {book.status}
                    </span>
                  </div>

                  {/* Title & Cover Banner */}
                  <div className="flex gap-4 items-start mb-4">
                    {/* Stylized Book Cover Spine */}
                    <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-teal-600 via-slate-800 to-indigo-900 flex-shrink-0 shadow-lg border border-teal-500/20 p-2 flex flex-col justify-between relative overflow-hidden group-hover:scale-105 transition-transform">
                      <div className="w-full h-1 bg-teal-400/50 rounded-full" />
                      <p className="text-[9px] font-bold text-white line-clamp-3 leading-tight tracking-tight">
                        {book.title}
                      </p>
                      <span className="text-[7px] text-teal-300 font-mono">BookLeaf</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-base font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                        {book.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-300">
                          <Tag className="h-3 w-3 text-teal-400" />
                          {book.genre}
                        </span>

                        {book.publicationDate && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            {new Date(book.publicationDate).toLocaleDateString("en-IN", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      {/* ISBN Bar with Copy Action */}
                      <div className="mt-2.5 flex items-center gap-2 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/80 w-fit">
                        <span className="text-[10px] text-slate-400 font-medium">ISBN-13:</span>
                        <span className="text-[11px] font-mono text-slate-200 select-all">
                          {book.isbn}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(book.isbn)}
                          title="Copy ISBN"
                          className="text-slate-400 hover:text-teal-400 transition-colors p-0.5"
                        >
                          {isCopied ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Commercial Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 mb-4 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">List Price (MRP)</p>
                      <p className="font-bold text-slate-200 mt-0.5">{formatCurrency(book.mrp)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Author Royalty / Copy</p>
                      <p className="font-bold text-emerald-400 mt-0.5">
                        {formatCurrency(book.authorRoyaltyPerCopy)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Copies Sold</p>
                      <p className="font-bold text-teal-300 mt-0.5">
                        {book.totalCopiesSold.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Net Earned</p>
                      <p className="font-bold text-white mt-0.5">
                        {formatCurrency(book.totalRoyaltyEarned)}
                      </p>
                    </div>
                  </div>

                  {/* Available Channels */}
                  {book.availableOn && book.availableOn.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-slate-500" />
                        Distribution Availability:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {book.availableOn.map((channel) => (
                          <span
                            key={channel}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1"
                          >
                            <span>{channel}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-slate-500" />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Print Partner: <span className="text-slate-400">{book.printPartner || "Standard"}</span>
                  </div>

                  {onRaiseTicketForBook && (
                    <button
                      type="button"
                      onClick={() => onRaiseTicketForBook(book)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <LifeBuoy className="h-3.5 w-3.5 text-teal-400" />
                      <span>Submit Query for this Book</span>
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
