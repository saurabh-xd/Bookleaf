"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Ticket, TicketMessage } from "../../types/index";
import { api } from "../../lib/api";
import {
  ArrowLeft,
  LifeBuoy,
  Send,
  BookOpen,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Paperclip,
  User,
  Sparkles,
  Flame,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface AuthorTicketDetailProps {
  ticket: Ticket;
  onBack: () => void;
  onTicketUpdated: (updatedTicket: Ticket) => void;
  lastSSEEvent?: any;
}

export const AuthorTicketDetail: React.FC<AuthorTicketDetailProps> = ({
  ticket: initialTicket,
  onBack,
  onTicketUpdated,
  lastSSEEvent,
}) => {
  const [ticket, setTicket] = useState<Ticket>(initialTicket);
  const [messages, setMessages] = useState<TicketMessage[]>(initialTicket.messages || []);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync latest ticket details from API
  const refreshTicket = async () => {
    try {
      const res = await api.tickets.getById(ticket.id);
      if (res.success && res.data) {
        setTicket(res.data);
        if (res.data.messages) {
          // Authors only see public messages (backend already excludes internal notes)
          setMessages(res.data.messages);
        }
        onTicketUpdated(res.data);
      }
    } catch (err) {
      console.error("Failed to refresh ticket detail:", err);
    }
  };

  // SSE Reactive Listener: If a new message or update arrived for this ticket
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setSendError(null);

    try {
      const res = await api.tickets.addMessage(ticket.id, {
        message: newMessage.trim(),
      });

      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setNewMessage("");
        scrollToBottom();
      }
    } catch (err: any) {
      console.error("Failed to post message:", err);
      setSendError(err?.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getPriorityLabel = () => {
    switch (ticket.priority) {
      case "CRITICAL":
        return { label: "Critical Priority (<4h SLA)", color: "text-rose-400 bg-rose-950/40 border-rose-800/60" };
      case "HIGH":
        return { label: "High Priority (<12h SLA)", color: "text-amber-400 bg-amber-950/40 border-amber-800/60" };
      case "MEDIUM":
        return { label: "Medium Priority (<24h SLA)", color: "text-teal-400 bg-teal-950/40 border-teal-800/60" };
      case "LOW":
      default:
        return { label: "Standard Priority (<48h SLA)", color: "text-slate-300 bg-slate-800/60 border-slate-700" };
    }
  };

  const priorityStyle = getPriorityLabel();

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Ticket Queue</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-teal-400 px-2.5 py-1 rounded-lg bg-teal-950/50 border border-teal-800/40">
            {ticket.ticketNumber}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold ${priorityStyle.color}`}>
            {priorityStyle.label}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
            Status: {ticket.status}
          </span>
        </div>
      </div>

      {/* Ticket Header & Context Card */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {ticket.category.replace(/_/g, " ")}
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

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-900">
          {ticket.description}
        </p>

        {ticket.fileAttachmentName && (
          <div className="flex items-center gap-2 text-xs text-teal-300 bg-teal-950/30 px-3 py-2 rounded-xl border border-teal-800/40 w-fit">
            <Paperclip className="h-3.5 w-3.5 text-teal-400" />
            <span className="font-mono text-[11px]">{ticket.fileAttachmentName}</span>
          </div>
        )}
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        <h3 className="font-heading text-sm font-bold text-slate-300 flex items-center gap-2">
          <span>Conversation History</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {messages.length}
          </span>
        </h3>

        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <LifeBuoy className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">Ticket submitted</p>
              <p className="mt-1">
                Our support team is reviewing your inquiry. Responses will appear here in real-time.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.sender?.role === "ADMIN";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                    {isAdmin ? (
                      <>
                        <span className="font-semibold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          BookLeaf Operations Support
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
                        <span className="font-semibold text-slate-300">You (Author)</span>
                      </>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isAdmin
                        ? "bg-slate-900 border border-slate-700 text-slate-200 rounded-tl-sm"
                        : "bg-teal-600 text-white rounded-tr-sm"
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

      {/* Reply Composer */}
      {ticket.status === "CLOSED" ? (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Lock className="h-4 w-4 text-slate-500" />
          <span>This ticket has been closed. Please create a new support ticket if you require further assistance.</span>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="space-y-3">
          {sendError && (
            <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60">
              {sendError}
            </p>
          )}

          <div className="relative">
            <textarea
              rows={3}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your response to support..."
              disabled={isSending}
              className="w-full text-xs sm:text-sm rounded-2xl bg-slate-900 border border-slate-700 p-4 pr-24 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
            />

            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="absolute right-3 bottom-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-500 hover:bg-teal-400 disabled:opacity-40 transition-all shadow-md shadow-teal-900/40"
            >
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Real-time delivery: The operations desk receives your message immediately over the event channel.
          </p>
        </form>
      )}
    </div>
  );
};
