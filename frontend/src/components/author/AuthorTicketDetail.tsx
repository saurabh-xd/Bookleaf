"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Ticket, TicketMessage } from "../../types/index";
import { api } from "../../lib/api";
import { ArrowLeft, Send } from "lucide-react";

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
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-foreground">
            {ticket.ticketNumber}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            {ticket.priority}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-foreground border border-border">
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
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

        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
          {ticket.description}
        </p>

        {ticket.fileAttachmentName && (
          <div className="text-[11px] font-mono text-muted-foreground pt-1">
            Attachment: {ticket.fileAttachmentName}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="bg-card border border-border rounded-lg p-4 min-h-[260px] max-h-[460px] overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            No messages yet.
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender?.role === "ADMIN";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1 px-1">
                  <span>{isAdmin ? "Support" : "You"}</span>
                  <span>&bull;</span>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <div
                  className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed ${
                    isAdmin
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

      {/* Reply input */}
      {ticket.status === "CLOSED" ? (
        <div className="p-3 rounded-md bg-muted text-center text-xs text-muted-foreground border border-border">
          This ticket is closed.
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="space-y-2">
          {sendError && (
            <p className="text-xs text-destructive">{sendError}</p>
          )}

          <div className="flex gap-2">
            <textarea
              rows={2}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your response..."
              disabled={isSending}
              className="flex-1 text-xs rounded-md bg-card border border-border p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="px-4 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 self-end py-2 flex items-center gap-1"
            >
              <span>Send</span>
              <Send className="h-3 w-3" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
