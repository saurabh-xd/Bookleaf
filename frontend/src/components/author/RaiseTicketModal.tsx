"use client";

import React, { useState, useEffect } from "react";
import type { Book, Ticket } from "../../types/index";
import { api } from "../../lib/api";
import { X, Loader2 } from "lucide-react";

interface RaiseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  preselectedBook?: Book | null;
  onTicketCreated: (newTicket: Ticket) => void;
}

const QUICK_TOPICS = [
  "Royalty Payout Status",
  "Amazon / Flipkart Stock",
  "Print Quality Issue",
  "ISBN & Metadata",
];

export const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({
  isOpen,
  onClose,
  books,
  preselectedBook = null,
  onTicketCreated,
}) => {
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedBook) {
      setSelectedBookId(preselectedBook.id);
    } else {
      setSelectedBookId("");
    }
  }, [preselectedBook, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 5) {
      setError("Subject must be at least 5 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        bookId: selectedBookId || null,
        subject: subject.trim(),
        description: description.trim(),
        fileAttachmentName: attachmentName || undefined,
        fileAttachmentUrl: attachmentName ? "https://storage.bookleaf.internal/attachments/mock" : undefined,
      };

      const res = await api.tickets.create(payload);
      if (res.success && res.data) {
        onTicketCreated(res.data);
        onClose();
        setSubject("");
        setDescription("");
        setAttachmentName("");
        setSelectedBookId("");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="bg-card w-full max-w-lg rounded-lg border border-border p-6 shadow-lg relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">
            New Ticket
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-2.5 rounded bg-destructive/10 text-destructive text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Related Book */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Related Book (Optional)
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-md bg-card border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="">General / Account Level</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (ISBN: {b.isbn})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Topics */}
          <div>
            <span className="text-[11px] text-muted-foreground mb-1.5 block font-medium">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSubject(topic)}
                  className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Royalty payout inquiry"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-md bg-card border border-border px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide details regarding your inquiry..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-md bg-card border border-border p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Attachment (Optional)
            </label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-2.5 py-1.5 rounded-md text-xs border border-border bg-muted hover:bg-muted/80 text-foreground">
                <span>Choose File</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </label>
              {attachmentName ? (
                <span className="text-xs font-mono text-muted-foreground truncate max-w-xs">
                  {attachmentName}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No file selected</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Ticket</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
