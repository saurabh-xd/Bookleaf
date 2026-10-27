"use client";

import React, { useState } from "react";
import type { Ticket, TicketStatus, Priority } from "../../types/index";
import { Search } from "lucide-react";

interface AuthorTicketListProps {
  tickets: Ticket[];
  isLoading: boolean;
  onSelectTicket: (ticket: Ticket) => void;
  onOpenCreateModal: () => void;
}

export const AuthorTicketList: React.FC<AuthorTicketListProps> = ({
  tickets,
  isLoading,
  onSelectTicket,
  onOpenCreateModal,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>(" ");

  const formatCategory = (cat: string) => {
    return cat
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const getPriorityBadge = (priority: Priority) => {
    return (
      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border">
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: TicketStatus) => {
    const isPending = status === "OPEN" || status === "IN_PROGRESS";
    return (
      <span
        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-2xs ${
          isPending
            ? "bg-secondary text-secondary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {status}
      </span>
    );
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      t.ticketNumber.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      (t.book && t.book.title.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery.trim() ? searchQuery : ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48 sm:w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-4 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all self-start sm:self-auto cursor-pointer"
        >
          New Ticket
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-md bg-muted/50 border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-xs text-muted-foreground">
          No tickets found.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTickets.map((ticket) => {
            const messageCount = ticket.messages?.length ?? 1;

            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="bg-card border border-border hover:border-foreground/30 rounded-lg p-4 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {ticket.ticketNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCategory(ticket.category)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(ticket.status)}
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-medium text-foreground line-clamp-1">
                  {ticket.subject}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {ticket.description}
                </p>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-border text-[11px] text-muted-foreground">
                  <span>
                    {ticket.book ? ticket.book.title : "General inquiry"}
                  </span>
                  <span>
                    {messageCount} {messageCount === 1 ? "message" : "messages"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
