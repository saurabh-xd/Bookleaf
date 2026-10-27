"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Ticket, TicketMessage } from "../../types/index";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, Send, CheckCheck } from "lucide-react";

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
  const { user } = useAuth();
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
      console.error("Failed to refresh ticket detail:", err);
    }
  };

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
      setSendError(err?.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-2.5 py-1 rounded-full hover:bg-muted/60 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Tickets</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-foreground">
            {ticket.ticketNumber}
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-mono">
            {ticket.priority}
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold shadow-2xs">
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Ticket Context Header */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {ticket.subject}
          </h2>
          {ticket.book && (
            <span className="text-xs text-muted-foreground font-medium">
              {ticket.book.title}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {ticket.description}
        </p>

        {ticket.fileAttachmentName && (
          <div className="text-[11px] font-mono text-muted-foreground pt-1">
            Attachment: {ticket.fileAttachmentName}
          </div>
        )}
      </div>

      {/* WhatsApp-Style Chat Wallpaper Surface */}
      <div className="bg-neutral-100/70 dark:bg-[#0b141a]/80 border border-border rounded-xl p-4 min-h-[340px] max-h-[520px] overflow-y-auto space-y-2.5">
        <div className="flex justify-center my-1">
          <span className="text-[10px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-card shadow-xs text-muted-foreground border border-border/40 select-none">
            Support Conversation
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            No messages yet.
          </div>
        ) : (
          messages.map((msg) => {
            // In Author view: Author messages are "Me" (Right side, green), Support is "Other" (Left side, white/card)
            const isSupport =
              msg.sender?.role === "ADMIN" ||
              msg.message.includes("BookLeaf Author Support") ||
              msg.message.includes("Warmly,") ||
              (ticket.aiDraftResponse && msg.message.trim() === ticket.aiDraftResponse.trim());

            const isMe = !isSupport;

            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`w-full flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                {isMe ? (
                  /* WhatsApp Outgoing Bubble (Right side, soft green, tail top-right) */
                  <div className="max-w-[82%] sm:max-w-[70%] rounded-2xl rounded-tr-xs bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] px-3.5 py-2 shadow-xs text-xs sm:text-[13px] leading-relaxed relative">
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-neutral-500 dark:text-neutral-300 select-none">
                      <span>{timeStr}</span>
                      <CheckCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-300" />
                    </div>
                  </div>
                ) : (
                  /* WhatsApp Incoming Bubble (Left side, white/card, tail top-left) */
                  <div className="max-w-[82%] sm:max-w-[70%] rounded-2xl rounded-tl-xs bg-card dark:bg-[#202c33] text-foreground dark:text-[#e9edef] border border-border/70 dark:border-neutral-700/60 px-3.5 py-2 shadow-xs text-xs sm:text-[13px] leading-relaxed relative">
                    <span className="block text-[11px] font-bold text-teal-700 dark:text-teal-400 mb-0.5">
                      {msg.sender?.name || "BookLeaf Operations Support"}
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

      {/* WhatsApp-Style Bottom Composer */}
      {ticket.status === "CLOSED" ? (
        <div className="p-3 rounded-md bg-muted text-center text-xs text-muted-foreground border border-border">
          This ticket has been closed. Please create a new ticket if you need further help.
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="space-y-2">
          {sendError && (
            <p className="text-xs text-destructive">{sendError}</p>
          )}

          <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1.5 shadow-xs focus-within:ring-1 focus-within:ring-ring">
            <textarea
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message (Press Enter to send)..."
              disabled={isSending}
              className="flex-1 text-xs sm:text-sm px-3 py-1.5 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus:outline-none resize-none max-h-32"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-xs"
              title="Send Message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
