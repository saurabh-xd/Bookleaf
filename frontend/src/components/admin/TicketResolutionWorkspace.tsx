"use client";

import React, { useState, useEffect, useRef } from "react";
import type {
  Ticket,
  TicketMessage,
  TicketStatus,
  Priority,
  TicketCategory,
} from "../../types/index";
import { api } from "../../lib/api";
import { SLAIndicator } from "./SLAIndicator";
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Send,
  Lock,
  MessageSquare,
  BookOpen,
  User,
  ShieldCheck,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Copy,
  Check,
  ChevronDown,
  Layers,
  Info,
} from "lucide-react";

interface TicketResolutionWorkspaceProps {
  ticket: Ticket;
  onBack: () => void;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  lastSSEEvent?: any;
}

const CATEGORIES: TicketCategory[] = [
  "ROYALTY_PAYMENTS",
  "PRINTING_QUALITY",
  "DISTRIBUTION_AVAILABILITY",
  "ISBN_METADATA",
  "PRODUCTION_UPDATES",
  "GENERAL_INQUIRY",
];

const PRIORITIES: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const TicketResolutionWorkspace: React.FC<TicketResolutionWorkspaceProps> = ({
  ticket: initialTicket,
  onBack,
  onTicketUpdated,
  lastSSEEvent,
}) => {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [messages, setMessages] = useState<TicketMessage[]>(initialTicket.messages || []);
  const [composerMode, setComposerMode] = useState<"PUBLIC" | "INTERNAL">("PUBLIC");
  const [composerText, setComposerText] = useState<string>("");
  const [resolveOnSend, setResolveOnSend] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isRegeneratingDraft, setIsRegeneratingDraft] = useState<boolean>(false);
  const [draftCopied, setDraftCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Refresh ticket details from API
  const refreshTicket = async () => {
    try {
      const res = await api.tickets.getById(ticket.id);
      if (res.success && res.data) {
        setTicket(res.data);
        if (res.data.messages) {
          setMessages(res.data.messages);
        }
        onTicketUpdated(res.data);
      }
    } catch (err) {
      console.error("Failed to refresh ticket in workspace:", err);
    }
  };

  useEffect(() => {
    refreshTicket();
  }, [ticket.id]);

  // Reactive SSE listener
  useEffect(() => {
    if (!lastSSEEvent) return;

    const { type, data } = lastSSEEvent;
    if (
      (type === "NEW_MESSAGE" && data?.ticketId === ticket.id) ||
      (type === "TICKET_UPDATED" && data?.ticket?.id === ticket.id)
    ) {
      refreshTicket();
    }
  }, [lastSSEEvent, ticket.id]);

  // Handle status change
  const handleStatusChange = async (newStatus: TicketStatus) => {
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const res = await api.tickets.update(ticket.id, { status: newStatus });
      if (res.success && res.data) {
        setTicket(res.data);
        onTicketUpdated(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle priority override
  const handlePriorityChange = async (newPriority: Priority) => {
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const res = await api.tickets.update(ticket.id, { priority: newPriority });
      if (res.success && res.data) {
        setTicket(res.data);
        onTicketUpdated(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update priority");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle category override
  const handleCategoryChange = async (newCategory: TicketCategory) => {
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const res = await api.tickets.update(ticket.id, { category: newCategory });
      if (res.success && res.data) {
        setTicket(res.data);
        onTicketUpdated(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update category");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle regenerate AI draft
  const handleRegenerateDraft = async () => {
    setIsRegeneratingDraft(true);
    setError(null);
    try {
      const res = await api.tickets.regenerateDraft(ticket.id);
      if (res.success && res.data) {
        setTicket((prev) => ({
          ...prev,
          aiDraftResponse: res.data.aiDraftResponse,
        }));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to regenerate AI draft");
    } finally {
      setIsRegeneratingDraft(false);
    }
  };

  // Copy or Insert AI draft into composer
  const handleInsertDraft = () => {
    if (ticket.aiDraftResponse) {
      setComposerMode("PUBLIC");
      setComposerText(ticket.aiDraftResponse);
      setDraftCopied(true);
      setTimeout(() => setDraftCopied(null as any), 2000);
    }
  };

  // Send public reply or save internal note
  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    const isInternal = composerMode === "INTERNAL";

    try {
      const res = await api.tickets.addMessage(ticket.id, {
        message: composerText.trim(),
        isInternalNote: isInternal,
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setComposerText("");

        // Optional quick resolve
        if (resolveOnSend && ticket.status !== "RESOLVED") {
          await handleStatusChange("RESOLVED");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to post message");
    } finally {
      setIsSending(false);
    }
  };

  const confidencePercent = ticket.aiConfidenceScore
    ? Math.round(ticket.aiConfidenceScore * 100)
    : 92;

  return (
    <div className="space-y-6">
      {/* Top Bar: Back Button, Ticket ID & Live SLA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Triage Queue</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-amber-400 px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-800/40">
            {ticket.ticketNumber}
          </span>

          <SLAIndicator
            createdAt={ticket.createdAt}
            priority={ticket.priority}
            status={ticket.status}
          />
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs text-rose-400 hover:text-rose-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Triage Overrides & Status Control Panel */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Status:</span>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              disabled={isUpdatingStatus}
              className={`rounded-xl px-3 py-1.5 font-bold border focus:outline-none cursor-pointer ${
                ticket.status === "OPEN"
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                  : ticket.status === "IN_PROGRESS"
                  ? "bg-blue-950/60 text-blue-300 border-blue-800"
                  : ticket.status === "RESOLVED"
                  ? "bg-indigo-950/60 text-indigo-300 border-indigo-800"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-slate-200">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Override Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Priority:</span>
            <select
              value={ticket.priority}
              onChange={(e) => handlePriorityChange(e.target.value as Priority)}
              disabled={isUpdatingStatus}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} {p === "CRITICAL" ? "(<4h)" : p === "HIGH" ? "(<12h)" : ""}
                </option>
              ))}
            </select>
            {ticket.isPriorityOverridden && (
              <span className="text-[10px] text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/40">
                Overridden
              </span>
            )}
          </div>

          {/* Category Override Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Category:</span>
            <select
              value={ticket.category}
              onChange={(e) => handleCategoryChange(e.target.value as TicketCategory)}
              disabled={isUpdatingStatus}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {ticket.isCategoryOverridden && (
              <span className="text-[10px] text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/40">
                Overridden
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Resolution Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Author Inquiry & Unified Conversation History (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Author Ticket Initial Details Card */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Initial Inquiry
                </span>
                <h2 className="font-heading text-lg sm:text-xl font-bold text-white mt-0.5">
                  {ticket.subject}
                </h2>
              </div>

              {ticket.book && (
                <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 self-start">
                  <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                  <span className="font-medium">{ticket.book.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({ticket.book.isbn})</span>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-900 whitespace-pre-wrap">
              {ticket.description}
            </p>

            {/* Author Meta Details */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-400 border-t border-slate-800/60">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-300 font-semibold">{ticket.author.name}</span>
                {ticket.author.authorCode && (
                  <span className="text-[11px] font-mono text-teal-400">
                    ({ticket.author.authorCode})
                  </span>
                )}
                <span>•</span>
                <span>{ticket.author.email}</span>
              </div>

              {ticket.fileAttachmentName && (
                <div className="flex items-center gap-1.5 text-teal-300 bg-teal-950/30 px-2.5 py-1 rounded-lg border border-teal-800/40">
                  <Paperclip className="h-3 w-3 text-teal-400" />
                  <span className="font-mono text-[11px]">{ticket.fileAttachmentName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Unified Chat & Internal Notes Timeline */}
          <div className="space-y-4">
            <h3 className="font-heading text-sm font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-400" />
                <span>Thread History & Internal Notes</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {messages.length} Total Messages
              </span>
            </h3>

            <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 min-h-[300px] max-h-[520px] overflow-y-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Clock className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-400">No replies yet</p>
                  <p className="mt-1">
                    Review the AI Draft on the right and insert it into the composer below to begin resolution.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isInternal = msg.isInternalNote;
                  const isAuthor = msg.sender?.role === "AUTHOR";

                  if (isInternal) {
                    // Internal Note Card (Amber)
                    return (
                      <div
                        key={msg.id}
                        className="rounded-2xl p-4 bg-gradient-to-r from-amber-950/60 to-amber-900/30 border border-amber-500/40 shadow-md space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-amber-300 border-b border-amber-800/40 pb-2">
                          <span className="font-bold flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                            Internal Operations Note (Hidden from Author)
                          </span>
                          <span className="text-[11px] text-amber-400/80">
                            By {msg.sender?.name} •{" "}
                            {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-100 whitespace-pre-wrap leading-relaxed">
                          {msg.message}
                        </p>
                      </div>
                    );
                  }

                  // Public Message (Author or Admin)
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAuthor ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                        {isAuthor ? (
                          <>
                            <span className="font-semibold text-teal-300">
                              {msg.sender?.name || "Author"}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Operations Support ({msg.sender?.name})
                            </span>
                          </>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                          isAuthor
                            ? "bg-slate-900 border border-slate-700 text-slate-200 rounded-tl-sm"
                            : "bg-emerald-700 text-white rounded-tr-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Dual-Mode Response Composer */}
          <form
            onSubmit={handleSubmitMessage}
            className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-4"
          >
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setComposerMode("PUBLIC")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    composerMode === "PUBLIC"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  <Send className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Public Reply to Author</span>
                </button>

                <button
                  type="button"
                  onClick={() => setComposerMode("INTERNAL")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    composerMode === "INTERNAL"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Private Internal Note</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={resolveOnSend}
                    onChange={(e) => setResolveOnSend(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Mark as Resolved on Send</span>
                </label>
              </div>
            </div>

            {/* Composer Input */}
            <div className="relative">
              <textarea
                rows={4}
                required
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder={
                  composerMode === "PUBLIC"
                    ? "Type your official response to the author (or click 'Insert into Composer' from the AI draft on the right)..."
                    : "Add private notes, ledger invoice refs, or internal coordination instructions (never shown to author)..."
                }
                disabled={isSending}
                className={`w-full text-xs sm:text-sm rounded-2xl p-4 border focus:outline-none transition-colors resize-none ${
                  composerMode === "PUBLIC"
                    ? "bg-slate-900 border-slate-700 text-slate-200 focus:border-emerald-500"
                    : "bg-amber-950/20 border-amber-800/80 text-amber-100 placeholder-amber-500/50 focus:border-amber-500"
                }`}
              />
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {composerMode === "PUBLIC"
                  ? "Author will immediately receive this message over Server-Sent Events"
                  : "Internal notes are stored with role authorization and audit history"}
              </span>

              <button
                type="submit"
                disabled={isSending || !composerText.trim()}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md disabled:opacity-40 ${
                  composerMode === "PUBLIC"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30"
                    : "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30"
                }`}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : composerMode === "PUBLIC" ? (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Public Reply</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Save Internal Note</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: AI Assistant Panel & Knowledge Base Draft (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-4 sticky top-6">
            {/* AI Assistant Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">
                    AI Resolution Assistant
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Vercel AI SDK + pgvector RAG
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                {confidencePercent}% Confidence
              </span>
            </div>

            {/* AI Classification Info */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Classified Category:</span>
                <span className="text-slate-200 font-medium">
                  {ticket.category.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Calculated Urgency:</span>
                <span className="text-amber-400 font-bold">{ticket.priority}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Target Resolution SLA:</span>
                <span className="text-slate-200">
                  {ticket.priority === "CRITICAL"
                    ? "< 4 Hours"
                    : ticket.priority === "HIGH"
                    ? "< 12 Hours"
                    : ticket.priority === "MEDIUM"
                    ? "< 24 Hours"
                    : "< 48 Hours"}
                </span>
              </div>
            </div>

            {/* AI Draft Response Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Recommended Response:</span>
                <button
                  type="button"
                  onClick={handleRegenerateDraft}
                  disabled={isRegeneratingDraft}
                  className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 disabled:opacity-50"
                  title="Re-query knowledge base and regenerate"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isRegeneratingDraft ? "animate-spin text-teal-400" : ""}`}
                  />
                  <span>{isRegeneratingDraft ? "Generating..." : "Regenerate"}</span>
                </button>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                {ticket.aiDraftResponse || (
                  <span className="text-slate-500 italic">
                    AI draft is generating or not yet available for this inquiry.
                  </span>
                )}
              </div>
            </div>

            {/* Action to load into composer */}
            {ticket.aiDraftResponse && (
              <button
                type="button"
                onClick={handleInsertDraft}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {draftCopied ? (
                  <>
                    <Check className="h-4 w-4 text-slate-950" />
                    <span>Inserted into Composer!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-950" />
                    <span>Insert into Composer</span>
                  </>
                )}
              </button>
            )}

            {/* Publishing Guidelines Reference Tip */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300 flex items-center gap-1">
                <Info className="h-3 w-3 text-teal-400" />
                Knowledge Base Guidance:
              </p>
              <p>
                Draft is grounded on BookLeaf&apos;s author contract clauses, 80/20 royalty plan, printing flaw policies, and distributor feed schedules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
