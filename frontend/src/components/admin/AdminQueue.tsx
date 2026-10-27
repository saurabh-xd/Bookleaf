"use client";

import React from "react";
import type { Ticket, TicketStatus } from "../../types/index";

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

  const getPriorityBadge = (priority: string) => {
    const colorStyles: Record<string, string> = {
      CRITICAL: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
      HIGH: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      MEDIUM: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
      LOW: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    };

    const style = colorStyles[priority] || colorStyles.LOW;

    return (
      <span
        className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs ${style}`}
      >
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: TicketStatus) => {
    if (status === "OPEN") {
      return (
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground shadow-2xs">
          OPEN
        </span>
      );
    }
    if (status === "IN_PROGRESS") {
      return (
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200">
          IN PROGRESS
        </span>
      );
    }
    if (status === "RESOLVED") {
      return (
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200">
          RESOLVED
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
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
            className="bg-card border border-border hover:border-secondary/70 rounded-xl p-4 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {ticket.ticketNumber}
                  </span>
                  {getPriorityBadge(ticket.priority)}
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
                <span className="text-xs font-medium px-3.5 py-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all inline-flex items-center gap-1 cursor-pointer">
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
