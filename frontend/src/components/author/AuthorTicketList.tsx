"use client";

import React, { useState } from "react";
import type { Ticket, TicketStatus, Priority, TicketCategory } from "../../types/index";
import {
  LifeBuoy,
  Search,
  Filter,
  MessageSquare,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState<string>("");

  const formatCategory = (cat: string) => {
    return cat
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60">
            <Flame className="h-3 w-3 text-rose-400" />
            <span>Critical (&lt;4h SLA)</span>
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span>High (&lt;12h SLA)</span>
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-950/60 text-teal-300 border border-teal-800/60">
            <Clock className="h-3 w-3 text-teal-400" />
            <span>Medium (&lt;24h)</span>
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <span>Low (&lt;48h)</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            Open
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/60">
            In Progress
          </span>
        );
      case "RESOLVED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
            Resolved
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Closed
          </span>
        );
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.book && t.book.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Filters & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets by # or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 w-52 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="h-3 w-3 text-slate-400 ml-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 text-xs py-0.5 pr-2 pl-1 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">
                All Statuses
              </option>
              <option value="OPEN" className="bg-slate-900 text-slate-200">
                Open
              </option>
              <option value="IN_PROGRESS" className="bg-slate-900 text-slate-200">
                In Progress
              </option>
              <option value="RESOLVED" className="bg-slate-900 text-slate-200">
                Resolved
              </option>
              <option value="CLOSED" className="bg-slate-900 text-slate-200">
                Closed
              </option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 shadow-md transition-all self-start sm:self-auto"
        >
          <LifeBuoy className="h-3.5 w-3.5" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Ticket List View */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800/60" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200">No support tickets found</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {searchQuery || statusFilter !== "ALL"
              ? "Try clearing your filters to see more results."
              : "Have questions about royalty payout, ISBNs, or printing? Submit a ticket anytime."}
          </p>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 transition-colors"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            <span>Submit a Ticket</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const messageCount = ticket.messages?.length ?? 1;

            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 hover:border-teal-500/40 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-400 px-2 py-0.5 rounded-md bg-teal-950/40 border border-teal-800/40">
                      {ticket.ticketNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {formatCategory(ticket.category)}
                    </span>
                    {getPriorityBadge(ticket.priority)}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {getStatusBadge(ticket.status)}
                    <span className="text-[11px] text-slate-500">
                      {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Subject & Description preview */}
                <h4 className="font-heading text-sm sm:text-base font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1 mb-1">
                  {ticket.subject}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {ticket.description}
                </p>

                {/* Footer bar */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-3">
                    {ticket.book && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <BookOpen className="h-3 w-3 text-slate-500" />
                        <span className="truncate max-w-[200px]">{ticket.book.title}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <MessageSquare className="h-3 w-3 text-teal-400" />
                      <span>{messageCount} {messageCount === 1 ? "Message" : "Messages"}</span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-medium text-teal-400 group-hover:translate-x-1 transition-transform">
                    <span>View Conversation</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
