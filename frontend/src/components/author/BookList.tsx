"use client";

import React, { useState } from "react";
import type { Book } from "../../types/index";
import { Search, Copy, Check } from "lucide-react";

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
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">
            Published Books
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
            {books.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-44 sm:w-56"
            />
          </div>

          {genres.length > 2 && (
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-card border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
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
        <div className="bg-card border border-border rounded-lg p-8 text-center text-xs text-muted-foreground">
          No books found.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredBooks.map((book) => {
            const isCopied = copiedIsbn === book.isbn;

            return (
              <div
                key={book.id}
                className="bg-card border border-border rounded-lg p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                        {book.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {book.genre} &bull; {book.bookCode}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground shadow-2xs">
                      {book.status}
                    </span>
                  </div>

                  {/* ISBN Bar */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <span>ISBN:</span>
                    <span className="font-mono text-foreground select-all">{book.isbn}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(book.isbn)}
                      title="Copy ISBN"
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                    {book.publicationDate && (
                      <span className="ml-auto text-[11px]">
                        Pub: {new Date(book.publicationDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>

                  {/* Stats Table / Grid */}
                  <div className="grid grid-cols-4 gap-2 py-3 my-3 border-y border-border text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">MRP</span>
                      <span className="font-medium text-foreground">{formatCurrency(book.mrp)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Royalty/Copy</span>
                      <span className="font-medium text-foreground">{formatCurrency(book.authorRoyaltyPerCopy)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Sold</span>
                      <span className="font-medium text-foreground">{book.totalCopiesSold.toLocaleString("en-IN")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Total Earned</span>
                      <span className="font-medium text-foreground">{formatCurrency(book.totalRoyaltyEarned)}</span>
                    </div>
                  </div>

                  {/* Channels */}
                  {book.availableOn && book.availableOn.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
                      <span>Channels:</span>
                      {book.availableOn.map((channel) => (
                        <span
                          key={channel}
                          className="px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground text-[10px] font-medium"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Print: {book.printPartner || "Standard"}
                  </span>
                  {onRaiseTicketForBook && (
                    <button
                      type="button"
                      onClick={() => onRaiseTicketForBook(book)}
                      className="px-3.5 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all cursor-pointer"
                    >
                      Query for Book
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
