"use client";

import React, { useState, useEffect } from "react";
import type { Book, Ticket } from "../../types/index";
import { api } from "../../lib/api";
import {
  X,
  LifeBuoy,
  BookOpen,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";

interface RaiseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  preselectedBook?: Book | null;
  onTicketCreated: (newTicket: Ticket) => void;
}

const QUICK_TOPICS = [
  {
    label: "Royalty Payout Status",
    subject: "Inquiry regarding pending royalty disbursement",
    hint: "Royalties are calculated at 80% net profit quarterly. Threshold is ₹1,000.",
  },
  {
    label: "Amazon / Flipkart Stock",
    subject: "Book shows unavailable or out of stock on online stores",
    hint: "Platform syncing takes 2-4 business days following warehouse replenishment.",
  },
  {
    label: "Print Quality Issue",
    subject: "Received author copies with cover printing/binding flaw",
    hint: "Print flaw claims are escalated to Critical priority (<4h SLA). Please attach photos.",
  },
  {
    label: "ISBN & Metadata",
    subject: "Request to update subtitle, blurb or book pricing",
    hint: "Metadata updates take 48-72 hours to reflect across distributor feeds.",
  },
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
  const [activeHint, setActiveHint] = useState<string | null>(null);

  // Sync preselected book when modal opens
  useEffect(() => {
    if (preselectedBook) {
      setSelectedBookId(preselectedBook.id);
    } else {
      setSelectedBookId("");
    }
  }, [preselectedBook, isOpen]);

  // Contextual policy tip detection based on user input
  useEffect(() => {
    const text = `${subject} ${description}`.toLowerCase();
    if (text.includes("royalt") || text.includes("payout") || text.includes("bank") || text.includes("earning")) {
      setActiveHint(
        "BookLeaf Policy: Royalties are 80% net profit, calculated quarterly and disbursed within 45 days if balance is >= ₹1,000."
      );
    } else if (text.includes("print") || text.includes("paper") || text.includes("cover") || text.includes("bind") || text.includes("defect") || text.includes("damage")) {
      setActiveHint(
        "Quality Priority: Print and binding defects are treated as Critical priority (<4 Hours SLA). Uploading photos expedites replacement."
      );
    } else if (text.includes("amazon") || text.includes("flipkart") || text.includes("stock") || text.includes("distribut")) {
      setActiveHint(
        "Distribution Policy: Inventory updates sync with national distributors within 2 to 4 business days."
      );
    } else if (text.includes("isbn") || text.includes("title") || text.includes("price") || text.includes("mrp")) {
      setActiveHint(
        "ISBN Metadata: Price and metadata revisions require distributor catalog reload (approx. 48-72 hours)."
      );
    } else {
      setActiveHint(null);
    }
  }, [subject, description]);

  if (!isOpen) return null;

  const handleQuickTopic = (topic: (typeof QUICK_TOPICS)[0]) => {
    setSubject(topic.subject);
    setActiveHint(topic.hint);
  };

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
      setError("Please provide a description of at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        bookId: selectedBookId ? selectedBookId : null,
        subject: subject.trim(),
        description: description.trim(),
        fileAttachmentName: attachmentName || undefined,
        fileAttachmentUrl: attachmentName ? "https://storage.bookleaf.internal/attachments/mock" : undefined,
      };

      const res = await api.tickets.create(payload);
      if (res.success && res.data) {
        onTicketCreated(res.data);
        onClose();
        // Reset form
        setSubject("");
        setDescription("");
        setAttachmentName("");
        setSelectedBookId("");
      }
    } catch (err: any) {
      console.error("Failed to create ticket:", err);
      setError(err?.message || "Failed to create support ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 text-teal-300">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-white tracking-tight">
              Raise Author Support Ticket
            </h3>
            <p className="text-xs text-slate-400">
              Analyzed and auto-triaged by BookLeaf AI with pgvector knowledge base retrieval.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Linked Book (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-teal-400" />
              <span>Related Book (Optional)</span>
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="">General Inquiry (No specific book)</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (ISBN: {b.isbn})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Topic Shortcuts */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 mb-2 block">
              Quick Topic Suggestions:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickTopic(topic)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Discrepancy in Q3 royalty disbursement"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Detailed Description <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">
                {description.length} characters (min 10)
              </span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Provide specific details, order IDs, screenshots, or royalty quarters to accelerate resolution..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full text-xs rounded-xl bg-slate-900 border border-slate-700 p-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Contextual Policy Tip Banner */}
          {activeHint && (
            <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 text-teal-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
              <Sparkles className="h-4 w-4 text-teal-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold text-teal-200 block mb-0.5">
                  Relevant Publishing Guideline:
                </span>
                <span className="text-teal-300/90">{activeHint}</span>
              </div>
            </div>
          )}

          {/* Mock File Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attachments (Optional: proof of damage, invoices, screenshots)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors">
                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                <span>Choose File</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </label>
              {attachmentName ? (
                <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px] truncate max-w-xs">{attachmentName}</span>
                  <button
                    type="button"
                    onClick={() => setAttachmentName("")}
                    className="text-slate-500 hover:text-rose-400 text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500">No file chosen (PNG, JPG, PDF up to 10MB)</span>
              )}
            </div>
          </div>

          {/* AI Notice & Submit Action */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>AI Triage will analyze urgency and prepare an instant draft</span>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-lg shadow-teal-900/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing & Submitting...</span>
                  </>
                ) : (
                  <>
                    <LifeBuoy className="h-4 w-4" />
                    <span>Submit Ticket</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
