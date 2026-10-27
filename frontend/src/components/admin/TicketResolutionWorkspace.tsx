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
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Send, RefreshCw, Lock, CheckCheck } from "lucide-react";

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
  const { user } = useAuth();
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

  const handleAssignToMe = async () => {
    if (!user) return;
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const newAdminId = ticket.assignedAdminId === user.id ? null : user.id;
      const res = await api.tickets.update(ticket.id, { assignedAdminId: newAdminId });
      if (res.success && res.data) {
        setTicket(res.data);
        onTicketUpdated(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update assignment");
    } finally {
      setIsUpdatingStatus(false);
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

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleAssignToMe}
            disabled={isUpdatingStatus}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              ticket.assignedAdminId === user?.id
                ? "bg-secondary text-secondary-foreground shadow-2xs font-semibold border border-secondary"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs"
            }`}
          >
            {ticket.assignedAdminId === user?.id
              ? "✓ Assigned to You"
              : ticket.assignedAdmin
              ? `Assigned: ${ticket.assignedAdmin.name}`
              : "Assign to Me"}
          </button>
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

          {/* WhatsApp-Style Chat Surface */}
          <div className="bg-neutral-100/70 dark:bg-[#0b141a]/80 border border-border rounded-xl p-4 min-h-[340px] max-h-[500px] overflow-y-auto space-y-2.5">
            <div className="flex justify-center my-1">
              <span className="text-[10px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-card shadow-xs text-muted-foreground border border-border/40 select-none">
                Conversation Thread
              </span>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No replies yet.
              </div>
            ) : (
              messages.map((msg) => {
                const isInternal = msg.isInternalNote;
                const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                if (isInternal) {
                  return (
                    <div
                      key={msg.id}
                      className="max-w-[90%] mx-auto my-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 font-semibold border-b border-amber-200 dark:border-amber-800/50 pb-1">
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          <span>Internal Note &bull; {msg.sender?.name || "Staff"}</span>
                        </span>
                        <span>{timeStr}</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  );
                }

                // In Admin view: Support/Admin messages are "Me" (Right side, green), Author is "Other" (Left side, white/card)
                const isSupport =
                  msg.sender?.role === "ADMIN" ||
                  msg.senderId === user?.id ||
                  msg.sender?.id === user?.id ||
                  msg.message.includes("BookLeaf Author Support") ||
                  msg.message.includes("Warmly,") ||
                  (ticket.aiDraftResponse && msg.message.trim() === ticket.aiDraftResponse.trim());

                const isMe = isSupport;

                return (
                  <div
                    key={msg.id}
                    className={`w-full flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {isMe ? (
                      /* WhatsApp Outgoing Bubble (Right side, soft green) */
                      <div className="max-w-[82%] sm:max-w-[70%] rounded-2xl rounded-tr-xs bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] px-3.5 py-2 shadow-xs text-xs sm:text-[13px] leading-relaxed relative">
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-neutral-500 dark:text-neutral-300 select-none">
                          <span>{timeStr}</span>
                          <CheckCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
                        </div>
                      </div>
                    ) : (
                      /* WhatsApp Incoming Bubble (Left side, white/card) */
                      <div className="max-w-[82%] sm:max-w-[70%] rounded-2xl rounded-tl-xs bg-card dark:bg-[#202c33] text-foreground dark:text-[#e9edef] border border-border/70 dark:border-neutral-700/60 px-3.5 py-2 shadow-xs text-xs sm:text-[13px] leading-relaxed relative">
                        <span className="block text-[11px] font-bold text-teal-700 dark:text-teal-400 mb-0.5">
                          {msg.sender?.name || ticket.author.name} (Author)
                        </span>
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className="flex items-center justify-end mt-1 text-[10px] text-muted-foreground select-none">
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* WhatsApp-Style Composer */}
          <form onSubmit={handleSubmitMessage} className="bg-card border border-border rounded-xl p-3 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-xs border-b border-border pb-2">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border border-border/60">
                <button
                  type="button"
                  onClick={() => setComposerMode("PUBLIC")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    composerMode === "PUBLIC"
                      ? "bg-secondary text-secondary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Reply to Author
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode("INTERNAL")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                    composerMode === "INTERNAL"
                      ? "bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100 shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Lock className="h-3 w-3" />
                  <span>Internal Note</span>
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={resolveOnSend}
                  onChange={(e) => setResolveOnSend(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Resolve on send</span>
              </label>
            </div>

            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                required
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder={
                  composerMode === "PUBLIC"
                    ? "Type reply to author (or click Insert into Composer from AI draft)..."
                    : "Type private internal note (never shown to author)..."
                }
                disabled={isSending}
                className="flex-1 text-xs sm:text-sm rounded-lg bg-card border border-border p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none max-h-36"
              />

              <button
                type="submit"
                disabled={isSending || !composerText.trim()}
                className={`h-9 px-3.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 transition-all flex-shrink-0 disabled:opacity-40 shadow-xs ${
                  composerMode === "PUBLIC"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-amber-600 hover:bg-amber-500"
                }`}
              >
                {isSending ? (
                  <span>Sending...</span>
                ) : composerMode === "PUBLIC" ? (
                  <>
                    <span>Send</span>
                    <Send className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <span>Save</span>
                    <Lock className="h-3 w-3" />
                  </>
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
                className="w-full py-2 px-3 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/85 shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                {draftCopied ? "✓ Inserted into Composer" : "Insert into Composer"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
