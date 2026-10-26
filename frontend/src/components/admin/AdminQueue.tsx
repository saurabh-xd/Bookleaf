"use client";

import React from "react";
import type { Ticket, TicketStatus } from "../../types/index";
import { SLAIndicator } from "./SLAIndicator";

interface AdminQueueProps {
  tickets: Ticket[];
  isLoading: boolean;
  onSelectTicket: (ticket: Ticket) => void;
}

export const AdminQueue: React.FC<AdminQueueProps> = ({
  tickets,
  isLoading,
  onSelectTicket,
}) => {
  const formatCategory = (cat: string) => {
    return cat
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusBadge = (status: TicketStatus) => {
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-foreground border border-border">
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-md bg-muted/50 border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-xs text-muted-foreground">
        No tickets matching current filters.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {tickets.map((ticket) => {
        const messageCount = ticket.messages?.length ?? 1;

        return (
          <div
            key={ticket.id}
            onClick={() => onSelectTicket(ticket)}
            className="bg-card border border-border hover:border-foreground/30 rounded-lg p-4 transition-colors cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {ticket.ticketNumber}
                  </span>
                  <SLAIndicator
                    createdAt={ticket.createdAt}
                    priority={ticket.priority}
                    status={ticket.status}
                    compact
                  />
                  {getStatusBadge(ticket.status)}
                  <span className="text-xs text-muted-foreground">
                    {formatCategory(ticket.category)}
                  </span>
                </div>

                <h4 className="text-sm font-medium text-foreground line-clamp-1">
                  {ticket.subject}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {ticket.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                  <span>Author: {ticket.author.name}</span>
                  {ticket.book && (
                    <span>Book: {ticket.book.title}</span>
                  )}
                  {ticket.assignedAdmin && (
                    <span>Assigned: {ticket.assignedAdmin.name}</span>
                  )}
                  <span>{messageCount} {messageCount === 1 ? "msg" : "msgs"}</span>
                </div>
              </div>

              <div className="self-end sm:self-center">
                <span className="text-xs font-medium text-primary hover:underline">
                  Resolve &rarr;
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
