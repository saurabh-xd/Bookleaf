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
import { ArrowLeft, Send, RefreshCw } from "lucide-react";

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
      console.error("Failed to refresh ticket:", err);
    }
  };

  useEffect(() => {
    refreshTicket();
  }, [ticket.id]);

  useEffect(() => {
    if (!lastSSEEvent) return;
    const { event, data } = lastSSEEvent;
    if (
      (event === "NEW_MESSAGE" && data?.ticketId === ticket.id) ||
      (event === "TICKET_UPDATED" && data?.ticket?.id === ticket.id)
    ) {
      refreshTicket();
    }
  }, [lastSSEEvent, ticket.id]);

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
      setError(err?.message || "Failed to regenerate draft");
    } finally {
      setIsRegeneratingDraft(false);
    }
  };

  const handleInsertDraft = () => {
    if (ticket.aiDraftResponse) {
      setComposerMode("PUBLIC");
      setComposerText(ticket.aiDraftResponse);
      setDraftCopied(true);
      setTimeout(() => setDraftCopied(false), 2000);
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Queue</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-foreground">
            {ticket.ticketNumber}
          </span>
          <SLAIndicator
            createdAt={ticket.createdAt}
            priority={ticket.priority}
            status={ticket.status}
          />
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Control Strip */}
      <div className="bg-card border border-border rounded-lg p-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Status:</span>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
            disabled={isUpdatingStatus}
            className="bg-card text-foreground border border-border rounded px-2 py-1 focus:outline-none cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Priority:</span>
          <select
            value={ticket.priority}
            onChange={(e) => handlePriorityChange(e.target.value as Priority)}
            disabled={isUpdatingStatus}
            className="bg-card text-foreground border border-border rounded px-2 py-1 focus:outline-none cursor-pointer"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Category:</span>
          <select
            value={ticket.category}
            onChange={(e) => handleCategoryChange(e.target.value as TicketCategory)}
            disabled={isUpdatingStatus}
            className="bg-card text-foreground border border-border rounded px-2 py-1 focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Thread & Composer */}
        <div className="lg:col-span-8 space-y-4">
          {/* Inquiry summary */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                {ticket.subject}
              </h2>
              {ticket.book && (
                <span className="text-xs text-muted-foreground">
                  {ticket.book.title} ({ticket.book.isbn})
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
              <span>Author: {ticket.author.name} ({ticket.author.email})</span>
              {ticket.fileAttachmentName && (
                <span>&bull; Attachment: {ticket.fileAttachmentName}</span>
              )}
            </div>
          </div>

          {/* Conversation list */}
          <div className="bg-card border border-border rounded-lg p-4 min-h-[260px] max-h-[460px] overflow-y-auto space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No replies yet.
              </div>
            ) : (
              messages.map((msg) => {
                const isInternal = msg.isInternalNote;
                const isAuthor = msg.sender?.role === "AUTHOR";

                if (isInternal) {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-md p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400">
                        <span>Internal Note ({msg.sender?.name})</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAuthor ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1 px-1">
                      <span>{isAuthor ? msg.sender?.name || "Author" : "Support"}</span>
                      <span>&bull;</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed ${
                        isAuthor
                          ? "bg-muted text-foreground border border-border"
                          : "bg-primary text-primary-foreground"
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

          {/* Composer */}
          <form onSubmit={handleSubmitMessage} className="bg-card border border-border rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-border pb-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setComposerMode("PUBLIC")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    composerMode === "PUBLIC"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Reply to Author
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode("INTERNAL")}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    composerMode === "INTERNAL"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Internal Note
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={resolveOnSend}
                  onChange={(e) => setResolveOnSend(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Resolve on send</span>
              </label>
            </div>

            <textarea
              rows={3}
              required
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder={
                composerMode === "PUBLIC"
                  ? "Type reply to author..."
                  : "Type internal note..."
              }
              disabled={isSending}
              className="w-full text-xs rounded-md bg-card border border-border p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isSending || !composerText.trim()}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
              >
                {isSending ? (
                  <span>Sending...</span>
                ) : composerMode === "PUBLIC" ? (
                  <>
                    <span>Send Reply</span>
                    <Send className="h-3 w-3" />
                  </>
                ) : (
                  <span>Save Note</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (4 cols): AI Draft */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 sticky top-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">AI Draft</span>
              <button
                type="button"
                onClick={handleRegenerateDraft}
                disabled={isRegeneratingDraft}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${isRegeneratingDraft ? "animate-spin" : ""}`} />
                <span>Regenerate</span>
              </button>
            </div>

            <div className="bg-muted/50 rounded-md p-3 border border-border text-xs text-foreground leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap">
              {ticket.aiDraftResponse || (
                <span className="text-muted-foreground italic">Draft unavailable</span>
              )}
            </div>

            {ticket.aiDraftResponse && (
              <button
                type="button"
                onClick={handleInsertDraft}
                className="w-full py-1.5 px-3 rounded-md text-xs font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors"
              >
                {draftCopied ? "Inserted into Composer" : "Insert into Composer"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
